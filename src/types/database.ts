export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            thought_logs: {
                Row: {
                    id: string
                    user_id: string
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    content?: string
                    created_at?: string
                }
                Relationships: []
            }
            thought_log_features: {
                Row: {
                    id: string
                    thought_log_id: string
                    user_id: string
                    emotions: Json
                    values: Json
                    beliefs: Json
                    topics: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    thought_log_id: string
                    user_id: string
                    emotions?: Json
                    values?: Json
                    beliefs?: Json
                    topics?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    thought_log_id?: string
                    user_id?: string
                    emotions?: Json
                    values?: Json
                    beliefs?: Json
                    topics?: Json
                    created_at?: string
                }
                Relationships: []
            }
            persona_core: {
                Row: {
                    user_id: string
                    prohibited: Json
                    tweet_rules: Json
                    priority: Json
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    prohibited?: Json
                    tweet_rules?: Json
                    priority?: Json
                    updated_at?: string
                }
                Update: {
                    user_id?: string
                    prohibited?: Json
                    tweet_rules?: Json
                    priority?: Json
                    updated_at?: string
                }
                Relationships: []
            }
            persona_long_term: {
                Row: {
                    user_id: string
                    values: Json
                    beliefs: Json
                    writing_style: Json
                    taboos: Json
                    last_evaluated_at: string | null
                    updated_at: string
                }
                Insert: {
                    user_id: string
                    values?: Json
                    beliefs?: Json
                    writing_style?: Json
                    taboos?: Json
                    last_evaluated_at?: string | null
                    updated_at?: string
                }
                Update: {
                    user_id?: string
                    values?: Json
                    beliefs?: Json
                    writing_style?: Json
                    taboos?: Json
                    last_evaluated_at?: string | null
                    updated_at?: string
                }
                Relationships: []
            }
            persona_short_term: {
                Row: {
                    user_id: string
                    dominant_emotions: Json
                    mental_state: string
                    current_focus: string
                    volatility: number
                    created_at: string
                }
                Insert: {
                    user_id: string
                    dominant_emotions?: Json
                    mental_state: string
                    current_focus: string
                    volatility: number
                    created_at?: string
                }
                Update: {
                    user_id?: string
                    dominant_emotions?: Json
                    mental_state?: string
                    current_focus?: string
                    volatility?: number
                    created_at?: string
                }
                Relationships: []
            }
            persona_short_term_history: {
                Row: {
                    id: string
                    user_id: string
                    snapshot: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    snapshot: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    snapshot?: Json
                    created_at?: string
                }
                Relationships: []
            }
            persona_evolution_logs: {
                Row: {
                    id: string
                    user_id: string
                    event_type: string
                    details: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    event_type: string
                    details?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    event_type?: string
                    details?: Json
                    created_at?: string
                }
                Relationships: []
            }
            tweets_generated: {
                Row: {
                    id: string
                    user_id: string
                    type: 'reflective' | 'positive' | 'honest'
                    content: string
                    persona_snapshot: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: 'reflective' | 'positive' | 'honest'
                    content: string
                    persona_snapshot: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    type?: 'reflective' | 'positive' | 'honest'
                    content?: string
                    persona_snapshot?: Json
                    created_at?: string
                }
                Relationships: []
            }
            tweets_posted: {
                Row: {
                    id: string
                    user_id: string
                    tweet_id: string
                    content: string
                    generated_id: string | null
                    posted_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    tweet_id: string
                    content: string
                    generated_id?: string | null
                    posted_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    tweet_id?: string
                    content?: string
                    generated_id?: string | null
                    posted_at?: string
                }
                Relationships: []
            }
            tweet_metrics: {
                Row: {
                    id: string
                    tweet_id: string
                    impressions: number
                    likes: number
                    replies: number
                    reposts: number
                    fetched_at: string
                }
                Insert: {
                    id?: string
                    tweet_id: string
                    impressions?: number
                    likes?: number
                    replies?: number
                    reposts?: number
                    fetched_at?: string
                }
                Update: {
                    id?: string
                    tweet_id?: string
                    impressions?: number
                    likes?: number
                    replies?: number
                    reposts?: number
                    fetched_at?: string
                }
                Relationships: []
            }
            external_feedback: {
                Row: {
                    id: string
                    tweet_id: string
                    user_id: string | null
                    observation: string
                    caution: string | null
                    suggestion: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tweet_id: string
                    user_id?: string | null
                    observation: string
                    caution?: string | null
                    suggestion?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tweet_id?: string
                    user_id?: string | null
                    observation?: string
                    caution?: string | null
                    suggestion?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            user_profiles: {
                Row: {
                    id: string
                    partner_name: string
                    partner_icon: string
                    theme: string
                    twitter_access_token: string | null
                    twitter_refresh_token: string | null
                    twitter_user_id: string | null
                    thought_log_count_short: number
                    thought_log_count_long: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    partner_name: string
                    partner_icon?: string
                    theme?: string
                    twitter_access_token?: string | null
                    twitter_refresh_token?: string | null
                    twitter_user_id?: string | null
                    thought_log_count_short?: number
                    thought_log_count_long?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    partner_name?: string
                    partner_icon?: string
                    theme?: string
                    twitter_access_token?: string | null
                    twitter_refresh_token?: string | null
                    twitter_user_id?: string | null
                    thought_log_count_short?: number
                    thought_log_count_long?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
