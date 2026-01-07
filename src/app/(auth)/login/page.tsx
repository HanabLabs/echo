'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()
            const { error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (authError) {
                setError(authError.message)
                return
            }

            router.push('/')
            router.refresh()
        } catch (err) {
            console.error('Login error:', err)
            setError('ログイン中にエラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex flex-col">
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                            ECHO
                        </h1>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                            人格が成長するAIとのX運用アプリ
                        </p>
                    </div>

                    <div className="card">
                        <h2 className="text-xl font-semibold mb-6 text-center" style={{ color: 'var(--text-primary)' }}>
                            ログイン
                        </h2>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    メールアドレス
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input"
                                    placeholder="example@email.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
                                    パスワード
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="input pr-12"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2"
                                        style={{ color: 'var(--text-muted)' }}
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
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
                                disabled={loading}
                                className="btn btn-primary w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        ログイン中...
                                    </>
                                ) : (
                                    'ログイン'
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                アカウントをお持ちでない方は{' '}
                                <Link href="/signup" className="font-medium" style={{ color: 'var(--accent)' }}>
                                    新規登録
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-4 px-6 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <span>© 2026 ECHO</span>
                    <Link href="/terms" style={{ color: 'var(--text-muted)' }} className="hover:underline">
                        利用規約
                    </Link>
                    <Link href="/privacy" style={{ color: 'var(--text-muted)' }} className="hover:underline">
                        プライバシーポリシー
                    </Link>
                    <Link href="/contact" style={{ color: 'var(--text-muted)' }} className="hover:underline">
                        お問い合わせ
                    </Link>
                </div>
            </footer>
        </div>
    )
}
