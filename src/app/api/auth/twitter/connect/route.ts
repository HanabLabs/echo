import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAuthUrl } from '@/lib/twitter/client'
import { cookies } from 'next/headers'
import crypto from 'crypto'

/**
 * GET /api/auth/twitter/connect
 * X OAuth 2.0 PKCE 認証フローを開始
 */
export async function GET() {
    try {
        const supabase = await createClient()

        // ユーザ認証確認
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.redirect(new URL('/login', process.env.NEXT_PUBLIC_APP_URL))
        }

        // PKCE用のcode_verifierとcode_challengeを生成
        const codeVerifier = crypto.randomBytes(32).toString('base64url')
        const codeChallenge = crypto
            .createHash('sha256')
            .update(codeVerifier)
            .digest('base64url')

        // stateを生成（CSRF対策）
        const state = crypto.randomBytes(16).toString('hex')

        // Cookieに保存（10分間有効）
        const cookieStore = await cookies()
        cookieStore.set('twitter_code_verifier', codeVerifier, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 600, // 10分
        })
        cookieStore.set('twitter_oauth_state', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 600,
        })

        // 認証URLを生成
        const authUrl = generateAuthUrl(state, codeChallenge)

        return NextResponse.redirect(authUrl)

    } catch (error) {
        console.error('Twitter連携開始エラー:', error)
        return NextResponse.redirect(
            new URL('/settings?error=twitter_connect_failed', process.env.NEXT_PUBLIC_APP_URL)
        )
    }
}
