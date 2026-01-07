import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const VALID_ICONS = ['cat', 'dog', 'rabbit', 'bird', 'bear']
const VALID_THEMES = ['soft', 'dark', 'light', 'midnight', 'sunset']
const VALID_TONES = ['friendly', 'casual', 'formal', 'playful', 'sincere']

/**
 * PATCH /api/settings
 * ユーザ設定を更新
 * 
 * 権限: User
 * DB権限: User (user_profiles), Service (persona_core)
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
        const { partner_name, partner_icon, theme, tone, use_emoji } = body

        // バリデーション
        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        }

        if (partner_name !== undefined) {
            if (typeof partner_name !== 'string' || partner_name.trim().length === 0) {
                return NextResponse.json(
                    { error: '相棒の名前を入力してください' },
                    { status: 400 }
                )
            }
            if (partner_name.length > 20) {
                return NextResponse.json(
                    { error: '相棒の名前は20文字以内で入力してください' },
                    { status: 400 }
                )
            }
            updates.partner_name = partner_name.trim()
        }

        if (partner_icon !== undefined) {
            if (!VALID_ICONS.includes(partner_icon)) {
                return NextResponse.json(
                    { error: '無効なアイコンです' },
                    { status: 400 }
                )
            }
            updates.partner_icon = partner_icon
        }

        if (theme !== undefined) {
            if (!VALID_THEMES.includes(theme)) {
                return NextResponse.json(
                    { error: '無効なテーマです' },
                    { status: 400 }
                )
            }
            updates.theme = theme
        }

        // 設定を更新
        const { data: updatedProfile, error: updateError } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single()

        if (updateError) {
            console.error('設定更新エラー:', updateError)
            return NextResponse.json(
                { error: '設定の更新に失敗しました' },
                { status: 500 }
            )
        }

        // ツイートルール (tone, use_emoji) を persona_core に保存
        if (tone !== undefined || use_emoji !== undefined) {
            const adminClient = createAdminClient()

            // 現在のtweet_rulesを取得
            const { data: personaCore } = await adminClient
                .from('persona_core')
                .select('tweet_rules')
                .eq('user_id', user.id)
                .single()

            const currentRules = (personaCore?.tweet_rules as Record<string, unknown>) || {}

            // 更新
            const newRules = {
                ...currentRules,
                ...(tone !== undefined && VALID_TONES.includes(tone) ? { tone } : {}),
                ...(use_emoji !== undefined ? { use_emoji: Boolean(use_emoji) } : {}),
            }

            await adminClient
                .from('persona_core')
                .update({
                    tweet_rules: newRules,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', user.id)
        }

        return NextResponse.json({
            success: true,
            profile: updatedProfile,
        })

    } catch (error) {
        console.error('設定API エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/settings
 * 現在のユーザ設定を取得
 * 
 * 権限: User
 * DB権限: User (user_profiles)
 */
export async function GET() {
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

        const { data: profile, error: fetchError } = await supabase
            .from('user_profiles')
            .select('partner_name, partner_icon, theme, twitter_user_id')
            .eq('id', user.id)
            .single()

        if (fetchError || !profile) {
            return NextResponse.json(
                { error: '設定が見つかりません' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            profile,
        })

    } catch (error) {
        console.error('設定取得API エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}
