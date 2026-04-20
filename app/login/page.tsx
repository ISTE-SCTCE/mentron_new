'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const [showPassword, setShowPassword] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [localError, setLocalError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLocalError(null)

        const formData = new FormData(e.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        startTransition(async () => {
            try {
                const { createClient } = await import('@/app/lib/supabase/client')
                const supabase = createClient()

                const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

                if (authError || !data.session) {
                    setLocalError(authError?.message || 'Login failed')
                    return
                }

                // Call update-session API to record this as the active session
                await fetch('/api/auth/update-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: data.session.id })
                })

                // Set a client-side marker for session tracking
                document.cookie = `mentron_sid=${data.session.id}; path=/; max-age=2592000; SameSite=Lax`

                // Successful login — redirect to dashboard
                window.location.href = '/dashboard'
            } catch {
                setLocalError('An unexpected error occurred. Please try again.')
            }
        })
    }

    const displayError = localError || error

    return (
        <div className="flex justify-center p-4 pt-16">
            <div className="w-full max-w-md space-y-10 glass p-10 rounded-[3rem] shadow-2xl relative z-10">
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Secure Access</p>
                    <h1 className="text-5xl font-black tracking-tighter text-white">Welcome</h1>
                </div>

                {displayError && (
                    <div className="p-4 text-xs font-bold text-red-400 glass border-red-500/20 rounded-2xl text-center bg-red-500/5">
                        {displayError}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <input
                            name="email"
                            type="email"
                            placeholder="Email address"
                            required
                            disabled={isPending}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium disabled:opacity-60"
                        />
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                required
                                disabled={isPending}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium pr-14 disabled:opacity-60"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isPending}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors disabled:opacity-40"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full mt-4 bg-white text-black hover:bg-gray-200 font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all text-lg uppercase tracking-widest disabled:opacity-80 disabled:scale-100 flex items-center justify-center gap-3"
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={22} className="animate-spin shrink-0" />
                                <span>Logging in…</span>
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                <p className="text-center text-sm font-bold text-gray-500">
                    New to the club?{' '}
                    <Link href="/signup" className="text-blue-500 hover:text-white transition-colors">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    )
}
