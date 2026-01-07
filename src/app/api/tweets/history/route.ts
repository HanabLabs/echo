import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/tweets/history
 * ユーザの投稿済みツイート履歴を取得
 * 
 * 権限: User
 * DB権限: User (tweets_posted, external_feedback, tweet_metrics)
 */
export async function GET(request: NextRequest) {
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

        // クエリパラメータを取得
        const searchParams = request.nextUrl.searchParams
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
        const offset = parseInt(searchParams.get('offset') || '0')

        // 投稿済みツイートを取得
        const { data: tweets, error: fetchError, count } = await supabase
            .from('tweets_posted')
            .select(`
                id,
                tweet_id,
                content,
                posted_at
            `, { count: 'exact' })
            .eq('user_id', user.id)
            .order('posted_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (fetchError) {
            console.error('ツイート履歴取得エラー:', fetchError)
            return NextResponse.json(
                { error: 'ツイート履歴の取得に失敗しました' },
                { status: 500 }
            )
        }

        if (!tweets || tweets.length === 0) {
            return NextResponse.json({
                success: true,
                tweets: [],
                total: 0,
                hasMore: false,
            })
        }

        // 各ツイートのメトリクスとフィードバックを取得
        const tweetIds = tweets.map(t => t.id)

        const { data: metrics } = await supabase
            .from('tweet_metrics')
            .select('tweet_id, impressions, likes, replies, reposts, fetched_at')
            .in('tweet_id', tweetIds)

        const { data: feedback } = await supabase
            .from('external_feedback')
            .select('tweet_id, observation, caution, suggestion, created_at')
            .in('tweet_id', tweetIds)

        // メトリクスとフィードバックをマッピング
        const metricsMap = new Map(
            metrics?.map(m => [m.tweet_id, m]) || []
        )
        const feedbackMap = new Map(
            feedback?.map(f => [f.tweet_id, f]) || []
        )

        // 結合
        const enrichedTweets = tweets.map(tweet => ({
            ...tweet,
            metrics: metricsMap.get(tweet.id) || null,
            feedback: feedbackMap.get(tweet.id) || null,
        }))

        return NextResponse.json({
            success: true,
            tweets: enrichedTweets,
            total: count || 0,
            hasMore: (count || 0) > offset + limit,
        })

    } catch (error) {
        console.error('ツイート履歴API エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}
