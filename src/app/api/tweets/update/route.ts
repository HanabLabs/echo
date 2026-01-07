import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * PATCH /api/tweets/update
 * 生成されたツイートを編集
 * 
 * 権限: User
 * DB権限: User (tweets_generated)
 */
export async function PATCH(request: NextRequest) {
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
        const { tweetId, content } = body

        if (!tweetId || !content || typeof content !== 'string') {
            return NextResponse.json(
                { error: 'ツイートIDと内容が必要です' },
                { status: 400 }
            )
        }

        if (content.trim().length === 0) {
            return NextResponse.json(
                { error: 'ツイート内容を入力してください' },
                { status: 400 }
            )
        }

        if (content.length > 140) {
            return NextResponse.json(
                { error: 'ツイートは140文字以内で入力してください' },
                { status: 400 }
            )
        }

        // ツイートを更新（RLSで自分のツイートのみ更新可能）
        const { data: updatedTweet, error: updateError } = await supabase
            .from('tweets_generated')
            .update({ content: content.trim() })
            .eq('id', tweetId)
            .eq('user_id', user.id)
            .select('id, type, content')
            .single()

        if (updateError) {
            console.error('ツイート更新エラー:', updateError)
            return NextResponse.json(
                { error: 'ツイートの更新に失敗しました' },
                { status: 500 }
            )
        }

        if (!updatedTweet) {
            return NextResponse.json(
                { error: 'ツイートが見つかりません' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            tweet: updatedTweet,
        })

    } catch (error) {
        console.error('ツイート更新API エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}
