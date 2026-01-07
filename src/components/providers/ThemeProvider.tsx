'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'soft' | 'dark' | 'light' | 'midnight' | 'sunset'

interface ThemeContextType {
    theme: Theme
    setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_KEY = 'echo-theme'

export function ThemeProvider({
    children,
    initialTheme = 'soft'
}: {
    children: ReactNode
    initialTheme?: Theme
}) {
    const [theme, setTheme] = useState<Theme>(initialTheme)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem(THEME_KEY) as Theme | null
        if (savedTheme && ['soft', 'dark', 'light', 'midnight', 'sunset'].includes(savedTheme)) {
            setTheme(savedTheme)
        }
    }, [])

    useEffect(() => {
        if (mounted) {
            document.documentElement.setAttribute('data-theme', theme)
            localStorage.setItem(THEME_KEY, theme)
        }
    }, [theme, mounted])

    // SSR時のちらつき防止
    if (!mounted) {
        return (
            <div style={{ visibility: 'hidden' }}>
                {children}
            </div>
        )
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}

export const THEMES: { value: Theme; label: string; description: string }[] = [
    { value: 'soft', label: 'Soft', description: '温かみのあるナチュラルなテーマ' },
    { value: 'dark', label: 'Dark', description: 'モダンでシックなダークテーマ' },
    { value: 'light', label: 'Light', description: 'クリーンで明るいテーマ' },
    { value: 'midnight', label: 'Midnight', description: '深い夜空のようなテーマ' },
    { value: 'sunset', label: 'Sunset', description: '夕焼けの温かみのあるテーマ' },
]
