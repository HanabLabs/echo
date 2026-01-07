import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { postTweet, refreshAccessToken, TwitterAuthError, TwitterAPIError } from '@/lib/twitter/client'

/**
 * POST /api/tweets/post
 * ツイートをX(Twitter)に投稿し、DBに記録
 * 
 * 権限: User (呼び出し), Service (DB更新)
 * DB権限: tweets_posted (insert), tweet_metrics (insert), tweets_generated (delete)
 * 外部: X API
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

        const body = await request.json()
        const { generatedTweetId } = body

        if (!generatedTweetId) {
            return NextResponse.json(
                { error: 'ツイートIDが必要です' },
                { status: 400 }
            )
        }

        // 生成されたツイートを取得
        const { data: generatedTweet, error: fetchError } = await supabase
            .from('tweets_generated')
            .select('id, content, type, persona_snapshot')
            .eq('id', generatedTweetId)
            .eq('user_id', user.id)
            .single()

        if (fetchError || !generatedTweet) {
            console.error('ツイート取得エラー:', fetchError)
            return NextResponse.json(
                { error: 'ツイートが見つかりません' },
                { status: 404 }
            )
        }

        // ユーザプロファイルからTwitterトークンを取得
        const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('twitter_access_token, twitter_refresh_token, twitter_user_id')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            console.error('プロファイル取得エラー:', profileError)
            return NextResponse.json(
                { error: 'ユーザプロファイルが見つかりません' },
                { status: 404 }
            )
        }

        if (!profile.twitter_access_token || !profile.twitter_refresh_token) {
            return NextResponse.json(
                { error: 'X(Twitter)連携が必要です。設定画面から連携してください。' },
                { status: 400 }
            )
        }

        const adminClient = createAdminClient()
        let accessToken = profile.twitter_access_token
        let refreshToken = profile.twitter_refresh_token

        // ツイート投稿を実行
        try {
            const result = await postTweet(generatedTweet.content, {
                accessToken,
                refreshToken,
            })

            // tweets_postedに記録
            const { data: postedTweet, error: insertError } = await adminClient
                .from('tweets_posted')
                .insert({
                    user_id: user.id,
                    tweet_id: result.tweetId,
                    content: generatedTweet.content,
                    generated_id: generatedTweet.id,
                })
                .select('id')
                .single()

            if (insertError) {
                console.error('投稿記録エラー:', insertError)
                // 投稿は成功したので続行
            }

            // tweet_metricsに初期レコードを登録
            if (postedTweet) {
                await adminClient
                    .from('tweet_metrics')
                    .insert({
                        tweet_id: postedTweet.id,
                        impressions: 0,
                        likes: 0,
                        replies: 0,
                        reposts: 0,
                    })
            }

            // 投稿完了したらtweets_generatedから全ての生成済みツイートを削除
            // まずtweets_postedの参照を解除
            await adminClient
                .from('tweets_posted')
                .update({ generated_id: null })
                .eq('user_id', user.id)
                .not('generated_id', 'is', null)

            // その後tweets_generatedを削除
            await adminClient
                .from('tweets_generated')
                .delete()
                .eq('user_id', user.id)

            return NextResponse.json({
                success: true,
                message: '投稿が完了しました！',
                tweetId: result.tweetId,
            })

        } catch (error) {
            // アクセストークンが無効な場合、リフレッシュを試みる
            if (error instanceof TwitterAuthError) {
                try {
                    const newTokens = await refreshAccessToken(refreshToken)

                    // 新しいトークンを保存
                    await adminClient
                        .from('user_profiles')
                        .update({
                            twitter_access_token: newTokens.access_token,
                            twitter_refresh_token: newTokens.refresh_token,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', user.id)

                    // 再度ツイート投稿を試みる
                    const result = await postTweet(generatedTweet.content, {
                        accessToken: newTokens.access_token,
                        refreshToken: newTokens.refresh_token,
                    })

                    // tweets_postedに記録
                    const { data: postedTweet } = await adminClient
                        .from('tweets_posted')
                        .insert({
                            user_id: user.id,
                            tweet_id: result.tweetId,
                            content: generatedTweet.content,
                            generated_id: generatedTweet.id,
                        })
                        .select('id')
                        .single()

                    // tweet_metricsに初期レコードを登録
                    if (postedTweet) {
                        await adminClient
                            .from('tweet_metrics')
                            .insert({
                                tweet_id: postedTweet.id,
                                impressions: 0,
                                likes: 0,
                                replies: 0,
                                reposts: 0,
                            })
                    }

                    // 投稿完了したらtweets_generatedから全ての生成済みツイートを削除
                    // まずtweets_postedの参照を解除
                    await adminClient
                        .from('tweets_posted')
                        .update({ generated_id: null })
                        .eq('user_id', user.id)
                        .not('generated_id', 'is', null)

                    // その後tweets_generatedを削除
                    await adminClient
                        .from('tweets_generated')
                        .delete()
                        .eq('user_id', user.id)

                    return NextResponse.json({
                        success: true,
                        message: '投稿が完了しました！',
                        tweetId: result.tweetId,
                    })

                } catch (refreshError) {
                    console.error('トークンリフレッシュエラー:', refreshError)
                    return NextResponse.json(
                        { error: 'X認証が無効です。設定画面から再度X連携を行ってください。' },
                        { status: 401 }
                    )
                }
            }

            if (error instanceof TwitterAPIError) {
                return NextResponse.json(
                    { error: error.message },
                    { status: error.statusCode }
                )
            }

            throw error
        }

    } catch (error) {
        console.error('ツイート投稿API エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}
