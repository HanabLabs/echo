import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { callOpenAIWithJSON } from '@/lib/openai/client'
import { loadAndFillPrompt } from '@/lib/prompts/loader'

interface GeneratedTweet {
    type: 'reflective' | 'positive' | 'honest'
    text: string
}

interface TweetsResponse {
    tweets: GeneratedTweet[]
}

/**
 * POST /api/tweets/generate
 * ツイートを生成
 * 
 * 権限: User
 * DB権限: User (tweets_generated)
 * AI: tweets-generate.txt プロンプト
 * 条件: 思考ログ累計5件以上
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // ユーザ認証確認
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: '認証が必要です' },
                { status: 401 }
            )
        }

        // 思考ログ数を確認
        const { count } = await supabase
            .from('thought_logs')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        if (!count || count < 5) {
            return NextResponse.json(
                { error: `ツイート生成には思考ログが5件以上必要です（現在${count || 0}件）` },
                { status: 400 }
            )
        }

        // 1. コア人格を取得
        const { data: corePersona } = await supabase
            .from('persona_core')
            .select('*')
            .eq('user_id', user.id)
            .single()

        // 2. 長期人格を取得
        const { data: longTermPersona } = await supabase
            .from('persona_long_term')
            .select('*')
            .eq('user_id', user.id)
            .single()

        // 3. 短期人格を取得
        const { data: shortTermPersona } = await supabase
            .from('persona_short_term')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (!shortTermPersona) {
            return NextResponse.json(
                { error: '短期人格がまだ生成されていません。もう少し思考ログを入力してください。' },
                { status: 400 }
            )
        }

        // 4. 最新の外部フィードバックを取得
        const { data: recentFeedback } = await supabase
            .from('external_feedback')
            .select('observation, caution, suggestion')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3)

        // プロンプトを構築
        const prompt = loadAndFillPrompt('tweets-generate.txt', {
            core_persona: JSON.stringify(corePersona || {}, null, 2),
            long_term_persona: longTermPersona
                ? JSON.stringify(longTermPersona, null, 2)
                : '（まだ形成されていません）',
            short_term_persona: JSON.stringify(shortTermPersona, null, 2),
            recent_feedback_summary: recentFeedback && recentFeedback.length > 0
                ? JSON.stringify(recentFeedback, null, 2)
                : '（まだフィードバックはありません）',
        })

        // AIでツイートを生成
        const result = await callOpenAIWithJSON<TweetsResponse>(prompt)

        if (!result.tweets || !Array.isArray(result.tweets) || result.tweets.length === 0) {
            return NextResponse.json(
                { error: 'ツイートの生成に失敗しました' },
                { status: 500 }
            )
        }

        // 人格スナップショットを作成
        const personaSnapshot = {
            core: corePersona,
            long_term: longTermPersona,
            short_term: shortTermPersona,
            generated_at: new Date().toISOString(),
        }

        // 生成されたツイートをDBに保存
        const tweetsToInsert = result.tweets.map(tweet => ({
            user_id: user.id,
            type: tweet.type,
            content: tweet.text,
            persona_snapshot: personaSnapshot,
        }))

        const { data: savedTweets, error: insertError } = await supabase
            .from('tweets_generated')
            .insert(tweetsToInsert)
            .select('id, type, content')

        if (insertError) {
            console.error('ツイート保存エラー:', insertError)
            return NextResponse.json(
                { error: 'ツイートの保存に失敗しました' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            tweets: savedTweets,
        })

    } catch (error) {
        console.error('ツイート生成API エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}
