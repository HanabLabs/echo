import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/tweets/discard
 * 生成されたツイートを破棄（削除）
 * 
 * 権限: User（呼び出し）、Service（DB削除）
 * DB権限: tweets_generated (delete)
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // ユーザー認証確認
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: '認証が必要です' },
                { status: 401 }
            )
        }

        const adminClient = createAdminClient()

        // tweets_postedの参照を解除（念のため）
        await adminClient
            .from('tweets_posted')
            .update({ generated_id: null })
            .eq('user_id', user.id)
            .not('generated_id', 'is', null)

        // tweets_generatedから全て削除
        const { error: deleteError } = await adminClient
            .from('tweets_generated')
            .delete()
            .eq('user_id', user.id)

        if (deleteError) {
            console.error('ツイート破棄エラー:', deleteError)
            return NextResponse.json(
                { error: 'ツイートの破棄に失敗しました' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'ツイートを破棄しました',
        })

    } catch (error) {
        console.error('ツイート破棄API エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}
