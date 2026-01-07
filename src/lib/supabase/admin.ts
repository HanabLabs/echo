import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Service Role用Supabaseクライアント
 * 重要: このクライアントはRLSをバイパスするため、人格更新などService権限が必要な操作のみに使用すること
 * User権限で書き換えてはいけないテーブル（persona_long_term, persona_short_term等）の更新に使用
 */
export function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing Supabase environment variables for admin client')
    }

    return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}
