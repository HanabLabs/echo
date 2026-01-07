import Footer from '@/components/layout/Footer'

export default function LegalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ backgroundColor: 'var(--bg-primary)' }}
        >
            <main className="flex-1 py-8 px-4">
                <div
                    className="max-w-3xl mx-auto p-6 rounded-2xl"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                    }}
                >
                    {children}
                </div>
            </main>
            <Footer />
        </div>
    )
}
