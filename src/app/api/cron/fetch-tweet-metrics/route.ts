import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTweetMetrics, refreshAccessToken, TwitterAuthError } from '@/lib/twitter/client'

/**
 * POST /api/cron/fetch-tweet-metrics
 * 投稿されたツイートのメトリクス（インプレッション、いいね等）を取得
 * 
 * 権限: Cron
 * DB権限: Service
 * 触るテーブル: tweet_metrics (update), user_profiles (select)
 * 外部: X API
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

        // 24時間以上経過していて、まだフィードバック解析されていないツイートを取得
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const { data: tweetsToFetch, error: fetchError } = await adminClient
            .from('tweets_posted')
            .select(`
                id,
                tweet_id,
                user_id,
                content,
                posted_at
            `)
            .lt('posted_at', twentyFourHoursAgo)
            .limit(50)

        if (fetchError) {
            console.error('ツイート取得エラー:', fetchError)
            return NextResponse.json(
                { error: 'ツイートの取得に失敗しました' },
                { status: 500 }
            )
        }

        if (!tweetsToFetch || tweetsToFetch.length === 0) {
            return NextResponse.json({
                success: true,
                message: '更新対象のツイートがありません',
                updatedCount: 0,
            })
        }

        // フィードバック解析済みのツイートを除外
        const { data: analyzedTweets } = await adminClient
            .from('external_feedback')
            .select('tweet_id')

        const analyzedTweetIds = new Set(
            analyzedTweets?.map(t => t.tweet_id) || []
        )

        const pendingTweets = tweetsToFetch.filter(
            t => !analyzedTweetIds.has(t.id)
        )

        if (pendingTweets.length === 0) {
            return NextResponse.json({
                success: true,
                message: '更新対象のツイートがありません',
                updatedCount: 0,
            })
        }

        // ユーザごとにグループ化
        const tweetsByUser = new Map<string, typeof pendingTweets>()
        for (const tweet of pendingTweets) {
            if (!tweetsByUser.has(tweet.user_id)) {
                tweetsByUser.set(tweet.user_id, [])
            }
            tweetsByUser.get(tweet.user_id)!.push(tweet)
        }

        let updatedCount = 0
        const errors: string[] = []

        for (const [userId, tweets] of tweetsByUser) {
            // ユーザのTwitterトークンを取得
            const { data: profile } = await adminClient
                .from('user_profiles')
                .select('twitter_access_token, twitter_refresh_token')
                .eq('id', userId)
                .single()

            if (!profile?.twitter_access_token || !profile?.twitter_refresh_token) {
                console.log(`User ${userId}: Twitterトークンなし`)
                continue
            }

            let accessToken = profile.twitter_access_token
            let refreshToken = profile.twitter_refresh_token
            let tokenRefreshed = false

            for (const tweet of tweets) {
                try {
                    const metrics = await getTweetMetrics(tweet.tweet_id, {
                        accessToken,
                        refreshToken,
                    })

                    if (metrics?.public_metrics) {
                        const pm = metrics.public_metrics

                        // tweet_metricsを更新
                        await adminClient
                            .from('tweet_metrics')
                            .upsert({
                                tweet_id: tweet.id,
                                impressions: pm.impression_count || 0,
                                likes: pm.like_count || 0,
                                replies: pm.reply_count || 0,
                                reposts: pm.retweet_count + (pm.quote_count || 0),
                                fetched_at: new Date().toISOString(),
                            }, {
                                onConflict: 'tweet_id',
                            })

                        updatedCount++
                    }
                } catch (error) {
                    // トークンリフレッシュを試みる
                    if (error instanceof TwitterAuthError && !tokenRefreshed) {
                        try {
                            const newTokens = await refreshAccessToken(refreshToken)
                            accessToken = newTokens.access_token
                            refreshToken = newTokens.refresh_token

                            // 新しいトークンを保存
                            await adminClient
                                .from('user_profiles')
                                .update({
                                    twitter_access_token: newTokens.access_token,
                                    twitter_refresh_token: newTokens.refresh_token,
                                    updated_at: new Date().toISOString(),
                                })
                                .eq('id', userId)

                            tokenRefreshed = true

                            // リトライ
                            const metrics = await getTweetMetrics(tweet.tweet_id, {
                                accessToken,
                                refreshToken,
                            })

                            if (metrics?.public_metrics) {
                                const pm = metrics.public_metrics

                                await adminClient
                                    .from('tweet_metrics')
                                    .upsert({
                                        tweet_id: tweet.id,
                                        impressions: pm.impression_count || 0,
                                        likes: pm.like_count || 0,
                                        replies: pm.reply_count || 0,
                                        reposts: pm.retweet_count + (pm.quote_count || 0),
                                        fetched_at: new Date().toISOString(),
                                    }, {
                                        onConflict: 'tweet_id',
                                    })

                                updatedCount++
                            }
                        } catch (refreshError) {
                            console.error(`User ${userId}: トークンリフレッシュ失敗`, refreshError)
                            errors.push(`User ${userId}: トークンリフレッシュ失敗`)
                            break
                        }
                    } else {
                        console.error(`Tweet ${tweet.id}: メトリクス取得失敗`, error)
                        errors.push(`Tweet ${tweet.id}: メトリクス取得失敗`)
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `${updatedCount}件のツイートメトリクスを更新しました`,
            updatedCount,
            errors: errors.length > 0 ? errors : undefined,
        })

    } catch (error) {
        console.error('メトリクス取得API エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}
