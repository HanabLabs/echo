'use client'

import Link from 'next/link'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer
            className="py-4 px-6 text-center"
            style={{
                backgroundColor: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border)',
            }}
        >
            <div className="max-w-4xl mx-auto">
                <nav className="flex flex-wrap justify-center gap-4 mb-3">
                    <Link
                        href="/terms"
                        className="text-sm hover:underline transition-opacity hover:opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        利用規約
                    </Link>
                    <Link
                        href="/privacy"
                        className="text-sm hover:underline transition-opacity hover:opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        プライバシーポリシー
                    </Link>
                    <Link
                        href="/contact"
                        className="text-sm hover:underline transition-opacity hover:opacity-80"
                        style={{ color: 'var(--text-muted)' }}
                    >
                        お問い合わせ
                    </Link>
                </nav>
                <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                >
                    &copy; {currentYear} ECHO. All rights reserved.
                </p>
            </div>
        </footer>
    )
}
