'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/browser'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { Settings, LogOut, Loader2 } from 'lucide-react'

interface UserProfile {
    partner_name: string
    partner_icon: string
    theme: string
}

function MainLayoutContent({ children }: { children: ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const supabase = createClient()

        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data: profileData } = await supabase
                .from('user_profiles')
                .select('partner_name, partner_icon, theme')
                .eq('id', user.id)
                .single()

            if (!profileData) {
                router.push('/onboarding')
                return
            }

            setProfile(profileData)
            setLoading(false)
        }

        fetchProfile()
    }, [router, pathname])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    if (loading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-primary)' }}
            >
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
        )
    }

    return (
        <ThemeProvider initialTheme={profile?.theme as 'soft' | 'dark' | 'light' | 'midnight' | 'sunset' || 'soft'}>
            <div
                className="min-h-screen flex flex-col"
                style={{ backgroundColor: 'var(--bg-primary)' }}
            >
                {/* Header */}
                <header
                    className="sticky top-0 z-50 px-4 py-3 flex items-center justify-between"
                    style={{
                        backgroundColor: 'var(--bg-secondary)',
                        borderBottom: '1px solid var(--border)',
                    }}
                >
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            ECHO
                        </span>
                        {profile && (
                            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                with {profile.partner_name}
                            </span>
                        )}
                    </Link>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/settings"
                            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <Settings className="w-5 h-5" />
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-tertiary)]"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex flex-col">
                    {children}
                </main>
            </div>
        </ThemeProvider>
    )
}

export default function MainLayout({ children }: { children: ReactNode }) {
    return <MainLayoutContent>{children}</MainLayoutContent>
}
