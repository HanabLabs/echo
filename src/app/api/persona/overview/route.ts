import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/persona/overview
 * 現在のユーザの人格概要（コア・長期・短期・進化ログ）を取得
 * 
 * 権限: User
 * DB権限: User (persona_core, persona_long_term, persona_short_term, persona_evolution_logs)
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

        // コア人格を取得
        const { data: corePersona } = await supabase
            .from('persona_core')
            .select('prohibited, tweet_rules, priority, updated_at')
            .eq('user_id', user.id)
            .single()

        // 長期人格を取得
        const { data: longTermPersona } = await supabase
            .from('persona_long_term')
            .select('values, beliefs, writing_style, taboos, last_evaluated_at, updated_at')
            .eq('user_id', user.id)
            .single()

        // 短期人格を取得
        const { data: shortTermPersona } = await supabase
            .from('persona_short_term')
            .select('dominant_emotions, mental_state, current_focus, volatility, created_at')
            .eq('user_id', user.id)
            .single()

        // 最新の進化ログを取得（最大10件）
        const { data: evolutionLogs } = await supabase
            .from('persona_evolution_logs')
            .select('event_type, details, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)

        // 最新の外部フィードバックを取得（最大5件）
        const { data: recentFeedback } = await supabase
            .from('external_feedback')
            .select('observation, caution, suggestion, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(5)

        return NextResponse.json({
            success: true,
            persona: {
                core: corePersona || null,
                longTerm: longTermPersona || null,
                shortTerm: shortTermPersona || null,
            },
            evolutionLogs: evolutionLogs || [],
            recentFeedback: recentFeedback || [],
        })

    } catch (error) {
        console.error('人格概要API エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}
