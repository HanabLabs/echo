'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'
import { Mail, Loader2, CheckCircle } from 'lucide-react'

function VerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [resendSuccess, setResendSuccess] = useState(false)

    // Supabaseの認証コールバックをチェック
    useEffect(() => {
        const supabase = createClient()

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                // セッションがあればオンボーディングへ
                router.push('/onboarding')
            }
        }

        checkSession()

        // 認証状態の変化を監視
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                router.push('/onboarding')
            }
        })

        return () => subscription.unsubscribe()
    }, [router])

    const handleResendEmail = async () => {
        if (!email) {
            setError('メールアドレスが見つかりません')
            return
        }

        setResendLoading(true)
        setError(null)
        setResendSuccess(false)

        try {
            const supabase = createClient()
            const { error: resendError } = await supabase.auth.resend({
                type: 'signup',
                email,
            })

            if (resendError) {
                setError(resendError.message)
                return
            }

            setResendSuccess(true)
        } catch (err) {
            console.error('Resend error:', err)
            setError('メールの再送信中にエラーが発生しました')
        } finally {
            setResendLoading(false)
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
                    </div>

                    <div className="card text-center">
                        <div
                            className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
                            style={{ backgroundColor: 'var(--accent-light)', opacity: 0.2 }}
                        >
                            <Mail className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                        </div>

                        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                            メールを確認してください
                        </h2>

                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            {email ? (
                                <>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{email}</span>
                                    <br />
                                    に認証メールを送信しました。
                                    <br />
                                    メール内のリンクをクリックして認証を完了してください。
                                </>
                            ) : (
                                <>
                                    登録したメールアドレスに認証メールを送信しました。
                                    <br />
                                    メール内のリンクをクリックして認証を完了してください。
                                </>
                            )}
                        </p>

                        {resendSuccess && (
                            <div
                                className="flex items-center justify-center gap-2 text-sm p-3 rounded-lg mb-4"
                                style={{ backgroundColor: 'var(--success)', color: 'white' }}
                            >
                                <CheckCircle className="w-4 h-4" />
                                認証メールを再送信しました
                            </div>
                        )}

                        {error && (
                            <div
                                className="text-sm p-3 rounded-lg mb-4"
                                style={{ backgroundColor: 'var(--error)', color: 'white' }}
                            >
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={handleResendEmail}
                                disabled={resendLoading || !email}
                                className="btn btn-secondary w-full"
                            >
                                {resendLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        送信中...
                                    </>
                                ) : (
                                    'メールを再送信'
                                )}
                            </button>

                            <Link href="/login" className="btn btn-primary w-full">
                                ログインページへ
                            </Link>
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

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    )
}
