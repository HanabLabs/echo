import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/auth/twitter/disconnect
 * X連携を解除
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

        const adminClient = createAdminClient()

        // Twitterトークンをクリア
        const { error: updateError } = await adminClient
            .from('user_profiles')
            .update({
                twitter_access_token: null,
                twitter_refresh_token: null,
                twitter_user_id: null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('X連携解除エラー:', updateError)
            return NextResponse.json(
                { error: '連携解除に失敗しました' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'X連携を解除しました',
        })

    } catch (error) {
        console.error('X連携解除API エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}
