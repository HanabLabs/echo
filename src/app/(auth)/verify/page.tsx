'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'
import { Mail, Loader2, CheckCircle } from 'lucide-react'

function VerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const email = searchParams.get('email') || ''
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [resendLoading, setResendLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [resendSuccess, setResendSuccess] = useState(false)

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email || !otp) {
            setError('メールアドレスとコードを入力してください')
            return
        }

        if (otp.length !== 6) {
            setError('6桁のコードを入力してください')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const supabase = createClient()
            const { error: verifyError } = await supabase.auth.verifyOtp({
                email,
                token: otp,
                type: 'signup',
            })

            if (verifyError) {
                setError('認証コードが無効です。もう一度お試しください。')
                return
            }

            // 認証成功 → オンボーディングへ
            router.push('/onboarding')
        } catch (err) {
            console.error('Verify error:', err)
            setError('認証中にエラーが発生しました')
        } finally {
            setLoading(false)
        }
    }

    const handleResendOtp = async () => {
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
                            認証コードを入力
                        </h2>

                        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                            {email ? (
                                <>
                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{email}</span>
                                    <br />
                                    に送信された6桁のコードを入力してください。
                                </>
                            ) : (
                                <>
                                    登録したメールアドレスに6桁のコードを送信しました。
                                </>
                            )}
                        </p>

                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                className="input text-center text-2xl tracking-widest"
                                placeholder="000000"
                                maxLength={6}
                                disabled={loading}
                                autoFocus
                            />

                            {resendSuccess && (
                                <div
                                    className="flex items-center justify-center gap-2 text-sm p-3 rounded-lg"
                                    style={{ backgroundColor: 'var(--success)', color: 'white' }}
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    認証コードを再送信しました
                                </div>
                            )}

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
                                disabled={loading || otp.length !== 6}
                                className="btn btn-primary w-full"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        認証中...
                                    </>
                                ) : (
                                    '認証する'
                                )}
                            </button>
                        </form>

                        <div className="mt-4 space-y-3">
                            <button
                                onClick={handleResendOtp}
                                disabled={resendLoading || !email}
                                className="btn btn-secondary w-full"
                            >
                                {resendLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        送信中...
                                    </>
                                ) : (
                                    'コードを再送信'
                                )}
                            </button>

                            <Link href="/login" className="btn btn-secondary w-full">
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
