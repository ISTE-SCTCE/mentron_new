'use client'

import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'

export function ThemeSwitcher() {
    const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' || 'system'
        setTheme(savedTheme)
        applyTheme(savedTheme)

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => {
            if (localStorage.getItem('theme') === 'system' || !localStorage.getItem('theme')) {
                applyTheme('system')
            }
        }
        mediaQuery.addEventListener('change', handleChange)
        return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])

    const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
        let actualTheme = newTheme
        if (newTheme === 'system') {
            actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }

        document.documentElement.setAttribute('data-theme', actualTheme)

        if (actualTheme === 'light') {
            document.documentElement.classList.add('light-mode')
        } else {
            document.documentElement.classList.remove('light-mode')
        }
    }

    const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
        setTheme(newTheme)
        localStorage.setItem('theme', newTheme)
        applyTheme(newTheme)
    }

    if (!mounted) return (
        <div className="glass flex items-center p-1 rounded-full gap-1 border border-white/10 bg-white/5 opacity-50">
            <div className="w-8 h-8"></div>
            <div className="w-8 h-8"></div>
            <div className="w-8 h-8"></div>
        </div>
    )

    return (
        <div className="glass flex items-center p-1 rounded-full gap-1 border border-white/10 bg-white/5 shadow-lg">
            <button
                onClick={() => handleThemeChange('dark')}
                className={`p-2 rounded-full transition-all flex items-center justify-center ${theme === 'dark' ? 'bg-[#1e293b] text-blue-400 shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                title="Dark Mode"
            >
                <Moon size={16} fill={theme === 'dark' ? 'currentColor' : 'none'} />
            </button>
            <button
                onClick={() => handleThemeChange('system')}
                className={`p-2 rounded-full transition-all flex items-center justify-center ${theme === 'system' ? 'bg-[#1e293b] text-blue-400 shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                title="System Theme"
            >
                <Monitor size={16} />
            </button>
            <button
                onClick={() => handleThemeChange('light')}
                className={`p-2 rounded-full transition-all flex items-center justify-center ${theme === 'light' ? 'bg-[#1e293b] text-yellow-400 shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                title="Light Mode"
            >
                <Sun size={16} fill={theme === 'light' ? 'currentColor' : 'none'} />
            </button>
        </div>
    )
}
