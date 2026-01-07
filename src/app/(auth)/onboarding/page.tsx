'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { Cat, Dog, Rabbit, Bird, Loader2, Sparkles } from 'lucide-react'

const PARTNER_ICONS = [
    { id: 'cat', icon: Cat, label: '猫' },
    { id: 'dog', icon: Dog, label: '犬' },
    { id: 'rabbit', icon: Rabbit, label: 'うさぎ' },
    { id: 'bird', icon: Bird, label: '鳥' },
    { id: 'bear', icon: Sparkles, label: 'くま' }, // Bear icon not available, using Sparkles as placeholder
]

export default function OnboardingPage() {
    const router = useRouter()
    const [partnerName, setPartnerName] = useState('')
    const [selectedIcon, setSelectedIcon] = useState('cat')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createClient()

        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)

            // 既にプロファイルがあればトップページへ
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('id')
                .eq('id', user.id)
                .single()

            if (profile) {
                router.push('/')
            }
        }

        checkUser()
    }, [router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!partnerName.trim()) {
            setError('相棒の名前を入力してください')
            return
        }

        if (!userId) {
            setError('認証情報が見つかりません。再度ログインしてください。')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()

            // ユーザプロファイルを作成
            const { error: profileError } = await supabase
                .from('user_profiles')
                .insert({
                    id: userId,
                    partner_name: partnerName.trim(),
                    partner_icon: selectedIcon,
                    theme: 'soft',
                })

            if (profileError) {
                console.error('Profile creation error:', profileError)
                setError('プロファイルの作成中にエラーが発生しました')
                return
            }

            // 初期コア人格を作成
            const { error: coreError } = await supabase
                .from('persona_core')
                .insert({
                    user_id: userId,
                    prohibited: [
                        '他者を攻撃する表現',
                        '差別的な発言',
                        '虚偽の情報',
                    ],
                    tweet_rules: {
                        max_length: 140,
                        tone: 'friendly',
                        use_emoji: true,
                    },
                    priority: {
                        authenticity: 'high',
                        engagement: 'medium',
                        consistency: 'high',
                    },
                })

            if (coreError) {
                console.error('Core persona creation error:', coreError)
                // プロファイルが作成されていれば続行
            }

            router.push('/')
            router.refresh()
        } catch (err) {
            console.error('Onboarding error:', err)
            setError('登録中にエラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        ようこそ ECHO へ
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        あなたの相棒を設定しましょう
                    </p>
                </div>

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium mb-4" style={{ color: 'var(--text-secondary)' }}>
                                相棒のアイコンを選択
                            </label>
                            <div className="grid grid-cols-5 gap-3">
                                {PARTNER_ICONS.map((item) => {
                                    const IconComponent = item.icon
                                    const isSelected = selectedIcon === item.id
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedIcon(item.id)}
                                            className="flex flex-col items-center gap-1 p-3 rounded-xl transition-all"
                                            style={{
                                                backgroundColor: isSelected ? 'var(--accent)' : 'var(--bg-tertiary)',
                                                color: isSelected ? 'white' : 'var(--text-primary)',
                                                border: isSelected ? '2px solid var(--accent)' : '2px solid transparent',
                                            }}
                                        >
                                            <IconComponent className="w-6 h-6" />
                                            <span className="text-xs">{item.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                相棒の名前
                            </label>
                            <input
                                type="text"
                                value={partnerName}
                                onChange={(e) => setPartnerName(e.target.value)}
                                className="input"
                                placeholder="例: エコー"
                                required
                                maxLength={20}
                            />
                            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                20文字以内で入力してください
                            </p>
                        </div>

                        {error && (
                            <div
                                className="text-sm p-3 rounded-lg"
                                style={{ backgroundColor: 'var(--error)', color: 'white' }}
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !partnerName.trim()}
                            className="btn btn-primary w-full"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    設定中...
                                </>
                            ) : (
                                '相棒と一緒にはじめる'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
