import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { exchangeCodeForToken, getMe } from '@/lib/twitter/client'
import { cookies } from 'next/headers'

/**
 * GET /api/auth/callback/twitter
 * X OAuth 2.0 コールバック処理
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        // エラーパラメータがある場合
        if (error) {
            console.error('Twitter認証エラー:', error)
            return NextResponse.redirect(
                new URL('/settings?error=twitter_auth_denied', process.env.NEXT_PUBLIC_APP_URL!)
            )
        }

        if (!code || !state) {
            return NextResponse.redirect(
                new URL('/settings?error=twitter_auth_failed', process.env.NEXT_PUBLIC_APP_URL!)
            )
        }

        // Cookieからstate, code_verifierを取得
        const cookieStore = await cookies()
        const savedState = cookieStore.get('twitter_oauth_state')?.value
        const codeVerifier = cookieStore.get('twitter_code_verifier')?.value

        // stateを検証（CSRF対策）
        if (!savedState || savedState !== state) {
            console.error('State mismatch')
            return NextResponse.redirect(
                new URL('/settings?error=twitter_auth_failed', process.env.NEXT_PUBLIC_APP_URL!)
            )
        }

        if (!codeVerifier) {
            console.error('Code verifier not found')
            return NextResponse.redirect(
                new URL('/settings?error=twitter_auth_failed', process.env.NEXT_PUBLIC_APP_URL!)
            )
        }

        // アクセストークンを取得
        const tokens = await exchangeCodeForToken(code, codeVerifier)

        // Twitterユーザ情報を取得
        const twitterUser = await getMe(tokens.access_token)

        // Supabaseユーザを取得
        const supabase = await createClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.redirect(
                new URL('/login', process.env.NEXT_PUBLIC_APP_URL!)
            )
        }

        // トークン情報をDBに保存
        const adminClient = createAdminClient()
        const { error: updateError } = await adminClient
            .from('user_profiles')
            .update({
                twitter_access_token: tokens.access_token,
                twitter_refresh_token: tokens.refresh_token,
                twitter_user_id: twitterUser.id,
                updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

        if (updateError) {
            console.error('トークン保存エラー:', updateError)
            return NextResponse.redirect(
                new URL('/settings?error=twitter_save_failed', process.env.NEXT_PUBLIC_APP_URL!)
            )
        }

        // Cookieをクリア
        cookieStore.delete('twitter_oauth_state')
        cookieStore.delete('twitter_code_verifier')

        // 設定画面に成功メッセージと共にリダイレクト
        return NextResponse.redirect(
            new URL('/settings?success=twitter_connected', process.env.NEXT_PUBLIC_APP_URL!)
        )

    } catch (error) {
        console.error('Twitter認証コールバックエラー:', error)
        return NextResponse.redirect(
            new URL('/settings?error=twitter_auth_failed', process.env.NEXT_PUBLIC_APP_URL!)
        )
    }
}
