import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callOpenAIWithJSON } from '@/lib/openai/client'
import { loadAndFillPrompt } from '@/lib/prompts/loader'

interface FeedbackResult {
    observation: string
    caution: string
    suggestion: string
}

/**
 * POST /api/cron/analyze-feedback
 * 投稿から24時間経過後、メトリクスを基に外部フィードバックを生成
 * 
 * 権限: Cron
 * DB権限: Service
 * 触るテーブル: external_feedback (insert), tweets_posted (select), tweet_metrics (select)
 * AI: feedback.txt プロンプト
 */
export async function POST(request: NextRequest) {
    try {
        // Cron secretで認証
        const cronSecret = request.headers.get('x-cron-secret')
        if (cronSecret !== process.env.CRON_SECRET) {
            console.error('Cron認証失敗: 不正なシークレット')
            return NextResponse.json(
                { error: '認証に失敗しました' },
                { status: 401 }
            )
        }

        const adminClient = createAdminClient()

        // 24時間以上経過した投稿で、フィードバック未生成のものを取得
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const { data: tweetsToAnalyze, error: fetchError } = await adminClient
            .from('tweets_posted')
            .select(`
                id,
                user_id,
                content,
                posted_at,
                tweet_id
            `)
            .lt('posted_at', twentyFourHoursAgo)
            .limit(20)

        if (fetchError) {
            console.error('ツイート取得エラー:', fetchError)
            return NextResponse.json(
                { error: 'ツイートの取得に失敗しました' },
                { status: 500 }
            )
        }

        if (!tweetsToAnalyze || tweetsToAnalyze.length === 0) {
            return NextResponse.json({
                success: true,
                message: '解析対象のツイートがありません',
                analyzedCount: 0,
            })
        }

        // 既にフィードバック解析済みのツイートを除外
        const { data: existingFeedback } = await adminClient
            .from('external_feedback')
            .select('tweet_id')

        const analyzedTweetIds = new Set(
            existingFeedback?.map(f => f.tweet_id) || []
        )

        const pendingTweets = tweetsToAnalyze.filter(
            t => !analyzedTweetIds.has(t.id)
        )

        if (pendingTweets.length === 0) {
            return NextResponse.json({
                success: true,
                message: '解析対象のツイートがありません',
                analyzedCount: 0,
            })
        }

        let analyzedCount = 0
        const errors: string[] = []

        for (const tweet of pendingTweets) {
            try {
                // メトリクスを取得
                const { data: metrics } = await adminClient
                    .from('tweet_metrics')
                    .select('impressions, likes, replies, reposts')
                    .eq('tweet_id', tweet.id)
                    .single()

                // メトリクスがなくてもデフォルト値で解析を続行
                const impressions = metrics?.impressions ?? 0
                const likes = metrics?.likes ?? 0
                const replies = metrics?.replies ?? 0
                const reposts = metrics?.reposts ?? 0

                // AIでフィードバックを生成
                const prompt = loadAndFillPrompt('feedback.txt', {
                    tweet_text: tweet.content,
                    impressions: impressions.toString(),
                    likes: likes.toString(),
                    replies: replies.toString(),
                    reposts: reposts.toString(),
                })

                const result = await callOpenAIWithJSON<FeedbackResult>(prompt)

                // 外部フィードバックをDBに保存
                const { error: insertError } = await adminClient
                    .from('external_feedback')
                    .insert({
                        tweet_id: tweet.id,
                        user_id: tweet.user_id,
                        observation: result.observation || '',
                        caution: result.caution || null,
                        suggestion: result.suggestion || null,
                    })

                if (insertError) {
                    console.error(`Tweet ${tweet.id}: フィードバック保存エラー`, insertError)
                    errors.push(`Tweet ${tweet.id}: フィードバック保存エラー`)
                    continue
                }

                // 進化ログを記録
                await adminClient
                    .from('persona_evolution_logs')
                    .insert({
                        user_id: tweet.user_id,
                        event_type: 'external_feedback',
                        details: {
                            tweet_id: tweet.id,
                            observation: result.observation,
                            caution: result.caution,
                            suggestion: result.suggestion,
                            metrics: { impressions, likes, replies, reposts },
                        },
                    })

                analyzedCount++
                console.log(`Tweet ${tweet.id}: フィードバック生成完了`)

            } catch (error) {
                console.error(`Tweet ${tweet.id}: フィードバック生成エラー`, error)
                errors.push(`Tweet ${tweet.id}: フィードバック生成エラー`)
            }
        }

        return NextResponse.json({
            success: true,
            message: `${analyzedCount}件のフィードバックを生成しました`,
            analyzedCount,
            errors: errors.length > 0 ? errors : undefined,
        })

    } catch (error) {
        console.error('フィードバック解析API エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}
