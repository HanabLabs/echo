'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { Cat, Dog, Rabbit, Bird, PawPrint, Save, Loader2, Link, Unlink, ArrowLeft, Check, SmilePlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface UserProfile {
    id: string
    partner_name: string
    partner_icon: string
    theme: string
    twitter_user_id: string | null
}

const ICONS = [
    { id: 'cat', label: 'ねこ', icon: Cat },
    { id: 'dog', label: 'いぬ', icon: Dog },
    { id: 'rabbit', label: 'うさぎ', icon: Rabbit },
    { id: 'bird', label: 'とり', icon: Bird },
    { id: 'bear', label: 'くま', icon: PawPrint },
]

const TONES = [
    { id: 'friendly', label: 'フレンドリー' },
    { id: 'casual', label: 'カジュアル' },
    { id: 'formal', label: 'フォーマル' },
    { id: 'playful', label: 'おちゃめ' },
    { id: 'sincere', label: '誠実' },
]

const THEMES = [
    { id: 'soft', label: 'Soft', color: '#8b7355', bg: '#f8f5f0', textColor: '#5a4a3a' },
    { id: 'dark', label: 'Dark', color: '#e94560', bg: '#1a1a2e', textColor: '#eaeaea' },
    { id: 'light', label: 'Light', color: '#4a90d9', bg: '#ffffff', textColor: '#2d2d2d' },
    { id: 'midnight', label: 'Midnight', color: '#58a6ff', bg: '#0d1117', textColor: '#eaeaea' },
    { id: 'sunset', label: 'Sunset', color: '#ff7e5f', bg: '#2d1b4e', textColor: '#eaeaea' },
]

export default function SettingsPage() {
    const router = useRouter()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    // 編集中の値
    const [partnerName, setPartnerName] = useState('')
    const [selectedIcon, setSelectedIcon] = useState('cat')
    const [selectedTheme, setSelectedTheme] = useState('soft')
    const [selectedTone, setSelectedTone] = useState('friendly')
    const [useEmoji, setUseEmoji] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profileData) {
                setProfile(profileData)
                setPartnerName(profileData.partner_name)
                setSelectedIcon(profileData.partner_icon)
                setSelectedTheme(profileData.theme)
            }

            // persona_coreからtweet_rulesを取得
            const { data: personaCore } = await supabase
                .from('persona_core')
                .select('tweet_rules')
                .eq('user_id', user.id)
                .single()

            if (personaCore?.tweet_rules) {
                const rules = personaCore.tweet_rules as { tone?: string; use_emoji?: boolean }
                if (rules.tone) setSelectedTone(rules.tone)
                if (rules.use_emoji !== undefined) setUseEmoji(rules.use_emoji)
            }

            setLoading(false)
        }

        fetchProfile()
    }, [router])

    const handleSave = async () => {
        if (!profile || !partnerName.trim()) return

        setSaving(true)
        try {
            const response = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    partner_name: partnerName.trim(),
                    partner_icon: selectedIcon,
                    theme: selectedTheme,
                    tone: selectedTone,
                    use_emoji: useEmoji,
                }),
            })

            if (!response.ok) {
                throw new Error('設定の保存に失敗しました')
            }

            // テーマを即座に反映
            document.documentElement.setAttribute('data-theme', selectedTheme)

            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (error) {
            console.error('Save error:', error)
            alert('設定の保存に失敗しました')
        } finally {
            setSaving(false)
        }
    }

    const handleTwitterConnect = () => {
        // X連携を開始（OAuth 2.0 PKCE）
        window.location.href = '/api/auth/twitter/connect'
    }

    const handleTwitterDisconnect = async () => {
        if (!confirm('X連携を解除しますか？')) return

        try {
            const response = await fetch('/api/auth/twitter/disconnect', {
                method: 'POST',
            })

            if (!response.ok) {
                throw new Error('連携解除に失敗しました')
            }

            setProfile(prev => prev ? { ...prev, twitter_user_id: null } : null)
        } catch (error) {
            console.error('Disconnect error:', error)
            alert('連携解除に失敗しました')
        }
    }

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
        )
    }

    return (
        <div className="flex-1 max-w-xl mx-auto w-full p-4">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <button
                    onClick={() => router.push('/')}
                    className="p-2 rounded-lg hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                    <ArrowLeft className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                </button>
                <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                    設定
                </h1>
            </div>

            <div className="space-y-6">
                {/* 相棒の名前 */}
                <div className="card">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                        相棒の名前
                    </label>
                    <input
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        className="input"
                        placeholder="相棒の名前を入力"
                        maxLength={20}
                    />
                </div>

                {/* 相棒のアイコン */}
                <div className="card">
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                        相棒のアイコン
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                        {ICONS.map(({ id, label, icon: IconComponent }) => (
                            <button
                                key={id}
                                onClick={() => setSelectedIcon(id)}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                                style={{
                                    backgroundColor: selectedIcon === id ? 'var(--accent)' : 'var(--bg-primary)',
                                    border: `2px solid ${selectedIcon === id ? 'var(--accent)' : 'var(--border)'}`,
                                }}
                            >
                                <IconComponent
                                    className="w-6 h-6"
                                    style={{ color: selectedIcon === id ? 'white' : 'var(--text-primary)' }}
                                />
                                <span
                                    className="text-xs"
                                    style={{ color: selectedIcon === id ? 'white' : 'var(--text-secondary)' }}
                                >
                                    {label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* テーマカラー */}
                <div className="card">
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                        テーマカラー
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                        {THEMES.map(({ id, label, color, bg, textColor }) => (
                            <button
                                key={id}
                                onClick={() => setSelectedTheme(id)}
                                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                                style={{
                                    backgroundColor: bg,
                                    border: `2px solid ${selectedTheme === id ? color : 'var(--border)'}`,
                                    boxShadow: selectedTheme === id ? `0 0 0 2px ${color}` : 'none',
                                }}
                            >
                                <div
                                    className="w-6 h-6 rounded-full"
                                    style={{ backgroundColor: color }}
                                />
                                <span
                                    className="text-xs font-medium"
                                    style={{ color: textColor }}
                                >
                                    {label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* ツイートルール */}
                <div className="card">
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                        ツイートスタイル
                    </label>

                    {/* トーン選択 */}
                    <div className="mb-4">
                        <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
                            口調
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                            {TONES.map(({ id, label }) => (
                                <button
                                    key={id}
                                    onClick={() => setSelectedTone(id)}
                                    className="px-3 py-2 rounded-lg text-sm transition-all"
                                    style={{
                                        backgroundColor: selectedTone === id ? 'var(--accent)' : 'var(--bg-primary)',
                                        color: selectedTone === id ? 'white' : 'var(--text-primary)',
                                        border: `1px solid ${selectedTone === id ? 'var(--accent)' : 'var(--border)'}`,
                                    }}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 絵文字使用 */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <SmilePlus className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                            <span style={{ color: 'var(--text-primary)' }}>絵文字を使用</span>
                        </div>
                        <button
                            onClick={() => setUseEmoji(!useEmoji)}
                            className="w-12 h-6 rounded-full transition-all relative"
                            style={{
                                backgroundColor: useEmoji ? 'var(--accent)' : 'var(--bg-tertiary)',
                            }}
                        >
                            <div
                                className="w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all"
                                style={{
                                    left: useEmoji ? 'calc(100% - 22px)' : '2px',
                                }}
                            />
                        </button>
                    </div>
                </div>


                {/* X連携 */}
                <div className="card">
                    <label className="block text-sm font-medium mb-3" style={{ color: 'var(--text-secondary)' }}>
                        X（Twitter）連携
                    </label>
                    {profile?.twitter_user_id ? (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center"
                                    style={{ backgroundColor: 'var(--success)' }}
                                >
                                    <Check className="w-4 h-4 text-white" />
                                </div>
                                <span style={{ color: 'var(--text-primary)' }}>連携済み</span>
                            </div>
                            <button
                                onClick={handleTwitterDisconnect}
                                className="btn btn-secondary text-sm"
                            >
                                <Unlink className="w-4 h-4" />
                                連携解除
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleTwitterConnect}
                            className="btn btn-primary w-full"
                        >
                            <Link className="w-4 h-4" />
                            X（Twitter）と連携
                        </button>
                    )}
                </div>

                {/* 保存ボタン */}
                <button
                    onClick={handleSave}
                    disabled={saving || !partnerName.trim()}
                    className="btn btn-primary w-full"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : saved ? (
                        <>
                            <Check className="w-5 h-5" />
                            保存しました
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            設定を保存
                        </>
                    )}
                </button>
            </div>
        </div>
    )
}
