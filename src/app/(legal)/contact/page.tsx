import Link from 'next/link'
import { ArrowLeft, Mail, Twitter } from 'lucide-react'

export const metadata = {
    title: 'お問い合わせ | ECHO',
    description: 'ECHO - 人格が成長するAIとのX運用アプリへのお問い合わせ',
}

export default function ContactPage() {
    return (
        <article>
            <div className="mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm hover:underline mb-4"
                    style={{ color: 'var(--accent)' }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    トップに戻る
                </Link>
                <h1
                    className="text-2xl font-bold"
                    style={{ color: 'var(--text-primary)' }}
                >
                    お問い合わせ
                </h1>
            </div>

            <div className="space-y-6" style={{ color: 'var(--text-secondary)' }}>
                <p className="leading-relaxed">
                    ECHOに関するご質問、ご要望、不具合報告などは、以下の連絡先までお気軽にお問い合わせください。
                </p>

                <div
                    className="p-6 rounded-xl"
                    style={{
                        backgroundColor: 'var(--bg-primary)',
                        border: '1px solid var(--border)',
                    }}
                >
                    <h2
                        className="text-lg font-semibold mb-4"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        連絡先
                    </h2>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: 'var(--accent)' }}
                            >
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p
                                    className="text-sm font-medium"
                                    style={{ color: 'var(--text-primary)' }}
                                >
                                    メールでのお問い合わせ
                                </p>
                                <a
                                    href="mailto:habab@hanablabs.info"
                                    className="text-sm hover:underline"
                                    style={{ color: 'var(--accent)' }}
                                >
                                    habab@hanablabs.info
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h2
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        お問い合わせの際に
                    </h2>
                    <p className="leading-relaxed">
                        より迅速な対応のため、以下の情報をお知らせいただけると助かります：
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>ご利用のデバイス・ブラウザ</li>
                        <li>発生している問題の詳細</li>
                        <li>問題が発生した日時</li>
                        <li>スクリーンショット（可能であれば）</li>
                    </ul>
                </div>

                <div className="space-y-3">
                    <h2
                        className="text-lg font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        回答について
                    </h2>
                    <p className="leading-relaxed">
                        お問い合わせいただいた内容については、通常2〜3営業日以内にご回答いたします。
                        内容によってはお時間をいただく場合がございますので、あらかじめご了承ください。
                    </p>
                </div>

                <div
                    className="p-4 rounded-xl text-sm"
                    style={{
                        backgroundColor: 'rgba(var(--accent-rgb), 0.1)',
                        color: 'var(--text-secondary)',
                    }}
                >
                    <p>
                        <strong style={{ color: 'var(--text-primary)' }}>ご注意:</strong>
                        {' '}個人情報の取り扱いについては、
                        <Link href="/privacy" className="underline" style={{ color: 'var(--accent)' }}>
                            プライバシーポリシー
                        </Link>
                        をご確認ください。
                    </p>
                </div>
            </div>
        </article>
    )
}
