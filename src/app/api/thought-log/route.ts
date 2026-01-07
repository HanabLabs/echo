import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { callOpenAIWithJSON } from '@/lib/openai/client'
import { loadAndFillPrompt } from '@/lib/prompts/loader'

interface ThoughtLogFeatures {
    emotions: string[]
    values: string[]
    beliefs: string[]
    topics: string[]
}

// 思考ログ受信時の返信パターン
const THOUGHT_LOG_RESPONSES = [
    'ありがとう。あなたの思いを受け取りました。',
    'あなたの心の声、しっかり届きました。',
    'その考え、大切に受け止めました。',
    '今のあなたの気持ち、感じ取りました。',
    'あなたの思いに触れることができて嬉しいです。',
]

function getRandomResponse(): string {
    return THOUGHT_LOG_RESPONSES[Math.floor(Math.random() * THOUGHT_LOG_RESPONSES.length)]
}

/**
 * POST /api/thought-log
 * 思考ログを保存し、AI解析を実行
 * 
 * 権限: User
 * DB権限: User (thought_logs), Service (thought_log_features, 人格更新)
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
        const { content } = body

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
            return NextResponse.json(
                { error: '思考ログの内容が必要です' },
                { status: 400 }
            )
        }

        // 1. 思考ログを保存 (User権限)
        const { data: thoughtLog, error: insertError } = await supabase
            .from('thought_logs')
            .insert({
                user_id: user.id,
                content: content.trim(),
            })
            .select()
            .single()

        if (insertError) {
            console.error('思考ログ保存エラー:', insertError)
            return NextResponse.json(
                { error: '思考ログの保存に失敗しました' },
                { status: 500 }
            )
        }

        // 2. AI解析を実行 (Service権限)
        const adminClient = createAdminClient()

        try {
            const prompt = loadAndFillPrompt('thought-log.txt', {
                thought_log: content.trim(),
            })

            const features = await callOpenAIWithJSON<ThoughtLogFeatures>(prompt)

            // 解析結果を保存
            const { error: featuresError } = await adminClient
                .from('thought_log_features')
                .insert({
                    thought_log_id: thoughtLog.id,
                    user_id: user.id,
                    emotions: features.emotions || [],
                    values: features.values || [],
                    beliefs: features.beliefs || [],
                    topics: features.topics || [],
                })

            if (featuresError) {
                console.error('思考ログ解析結果保存エラー:', featuresError)
            }
        } catch (aiError) {
            console.error('AI解析エラー:', aiError)
            // AI解析が失敗しても思考ログは保存されているので続行
        }

        // 3. ユーザプロファイルのカウントを更新
        const { data: profile, error: profileError } = await adminClient
            .from('user_profiles')
            .select('thought_log_count_short, thought_log_count_long, partner_name')
            .eq('id', user.id)
            .single()

        if (profileError || !profile) {
            console.error('プロファイル取得エラー:', profileError)
            return NextResponse.json({
                success: true,
                message: getRandomResponse(),
                thoughtLogId: thoughtLog.id,
            })
        }

        const newCountShort = (profile.thought_log_count_short || 0) + 1
        const newCountLong = (profile.thought_log_count_long || 0) + 1

        // 4. 短期人格更新（5件蓄積時）
        let shortTermUpdated = false
        if (newCountShort >= 5) {
            try {
                await triggerShortTermUpdate(user.id, adminClient)
                shortTermUpdated = true
                // カウントリセット
                await adminClient
                    .from('user_profiles')
                    .update({
                        thought_log_count_short: 0,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', user.id)
            } catch (err) {
                console.error('短期人格更新エラー:', err)
            }
        } else {
            await adminClient
                .from('user_profiles')
                .update({
                    thought_log_count_short: newCountShort,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)
        }

        // 5. 長期人格更新（30件蓄積時）
        let longTermUpdated = false
        if (newCountLong >= 30) {
            try {
                await triggerLongTermUpdate(user.id, adminClient)
                longTermUpdated = true
                // カウントリセット
                await adminClient
                    .from('user_profiles')
                    .update({
                        thought_log_count_long: 0,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', user.id)
            } catch (err) {
                console.error('長期人格更新エラー:', err)
            }
        } else {
            await adminClient
                .from('user_profiles')
                .update({
                    thought_log_count_long: newCountLong,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)
        }

        // レスポンスメッセージを生成
        let message = getRandomResponse()
        if (shortTermUpdated) {
            message += '\n\n最近のあなたの心の動きを感じ取りました。'
        }
        if (longTermUpdated) {
            message += '\n\nあなたの中で育まれてきた価値観を感じ取りました。'
        }

        return NextResponse.json({
            success: true,
            message,
            thoughtLogId: thoughtLog.id,
            shortTermUpdated,
            longTermUpdated,
        })

    } catch (error) {
        console.error('思考ログAPI エラー:', error)
        return NextResponse.json(
            { error: 'サーバーエラーが発生しました' },
            { status: 500 }
        )
    }
}

/**
 * 短期人格の更新をトリガー
 */
async function triggerShortTermUpdate(userId: string, adminClient: ReturnType<typeof createAdminClient>) {
    // 直近の思考ログ特徴を取得
    const { data: features } = await adminClient
        .from('thought_log_features')
        .select('emotions, values, beliefs, topics, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

    if (!features || features.length === 0) {
        console.log('短期人格更新: 特徴データなし')
        return
    }

    // 要約を作成
    const summary = features.map(f => ({
        emotions: f.emotions,
        values: f.values,
        beliefs: f.beliefs,
        topics: f.topics,
    }))

    const prompt = loadAndFillPrompt('short-term.txt', {
        recent_thought_logs_summary: JSON.stringify(summary, null, 2),
    })

    interface ShortTermPersona {
        dominant_emotions: string[]
        mental_state: string
        current_focus: string
        volatility: number
    }

    const result = await callOpenAIWithJSON<ShortTermPersona>(prompt)

    // 既存の短期人格を履歴に移動
    const { data: existingPersona } = await adminClient
        .from('persona_short_term')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (existingPersona) {
        await adminClient
            .from('persona_short_term_history')
            .insert({
                user_id: userId,
                snapshot: existingPersona,
            })

        // 既存を更新
        await adminClient
            .from('persona_short_term')
            .update({
                dominant_emotions: result.dominant_emotions || [],
                mental_state: result.mental_state || '',
                current_focus: result.current_focus || '',
                volatility: result.volatility || 0,
                created_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
    } else {
        // 新規作成
        await adminClient
            .from('persona_short_term')
            .insert({
                user_id: userId,
                dominant_emotions: result.dominant_emotions || [],
                mental_state: result.mental_state || '',
                current_focus: result.current_focus || '',
                volatility: result.volatility || 0,
            })
    }

    console.log(`短期人格更新完了: user=${userId}`)
}

/**
 * 長期人格の更新をトリガー
 */
async function triggerLongTermUpdate(userId: string, adminClient: ReturnType<typeof createAdminClient>) {
    // 直近の思考ログ特徴を取得
    const { data: features } = await adminClient
        .from('thought_log_features')
        .select('values, beliefs, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)

    if (!features || features.length === 0) {
        console.log('長期人格更新: 特徴データなし')
        return
    }

    // 現在の長期人格を取得
    const { data: currentLongTerm } = await adminClient
        .from('persona_long_term')
        .select('*')
        .eq('user_id', userId)
        .single()

    // Step 1: 候補抽出
    const prompt1 = loadAndFillPrompt('long-term-1.txt', {
        long_term_thought_summary: JSON.stringify(features, null, 2),
        current_long_term_persona: JSON.stringify(currentLongTerm || {}, null, 2),
    })

    interface LongTerm1Result {
        new_values: string[]
        new_beliefs: string[]
    }

    const step1Result = await callOpenAIWithJSON<LongTerm1Result>(prompt1)

    if (
        (!step1Result.new_values || step1Result.new_values.length === 0) &&
        (!step1Result.new_beliefs || step1Result.new_beliefs.length === 0)
    ) {
        console.log('長期人格更新: 新しい候補なし')
        return
    }

    // Step 2: 定着判定
    const prompt2 = loadAndFillPrompt('long-term-2.txt', {
        candidates: JSON.stringify(step1Result, null, 2),
    })

    interface LongTerm2Result {
        accepted: boolean
        final_value: string
        reason: string
    }

    const step2Result = await callOpenAIWithJSON<LongTerm2Result>(prompt2)

    if (!step2Result.accepted) {
        console.log('長期人格更新: 定着せず', step2Result.reason)
        return
    }

    // 長期人格を更新
    if (currentLongTerm) {
        const updatedValues = [...(currentLongTerm.values as string[] || []), step2Result.final_value]
        await adminClient
            .from('persona_long_term')
            .update({
                values: updatedValues,
                last_evaluated_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
    } else {
        await adminClient
            .from('persona_long_term')
            .insert({
                user_id: userId,
                values: [step2Result.final_value],
                beliefs: [],
                writing_style: {},
                taboos: [],
                last_evaluated_at: new Date().toISOString(),
            })
    }

    // 進化ログを記録
    await adminClient
        .from('persona_evolution_logs')
        .insert({
            user_id: userId,
            event_type: 'long_term_update',
            details: {
                new_value: step2Result.final_value,
                reason: step2Result.reason,
            },
        })

    console.log(`長期人格更新完了: user=${userId}, value=${step2Result.final_value}`)
}
