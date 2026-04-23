'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Loader2, CheckCircle2, ShieldAlert, Lock } from 'lucide-react'
import { createClient } from '@/app/lib/supabase/client'
import toast, { Toaster } from 'react-hot-toast'

// ── Password rule helpers ──────────────────────────────────────────────
const rules = [
    { label: 'At least 8 characters',    test: (p: string) => p.length >= 8 },
    { label: 'One uppercase letter',      test: (p: string) => /[A-Z]/.test(p) },
    { label: 'One lowercase letter',      test: (p: string) => /[a-z]/.test(p) },
    { label: 'One number',                test: (p: string) => /[0-9]/.test(p) },
]

function StrengthBar({ password }: { password: string }) {
    const passed = rules.filter((r) => r.test(password)).length
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e']
    const color = password ? colors[Math.min(passed - 1, 3)] : 'rgba(255,255,255,0.1)'

    return (
        <div className="space-y-2">
            <div className="flex gap-1">
                {[0, 1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all duration-300"
                        style={{ background: password && i < passed ? color : 'rgba(255,255,255,0.08)' }}
                    />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {rules.map((r) => {
                    const ok = r.test(password)
                    return (
                        <p
                            key={r.label}
                            className="text-[11px] font-medium flex items-center gap-1.5 transition-colors duration-200"
                            style={{ color: ok ? '#22c55e' : 'rgba(156,163,175,0.6)' }}
                        >
                            <span
                                className="w-3 h-3 rounded-full border flex-shrink-0 transition-all duration-200"
                                style={{
                                    background: ok ? '#22c55e' : 'transparent',
                                    borderColor: ok ? '#22c55e' : 'rgba(156,163,175,0.3)',
                                }}
                            />
                            {r.label}
                        </p>
                    )
                })}
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    const router = useRouter()
    const [sessionReady, setSessionReady] = useState<'loading' | 'valid' | 'invalid'>('loading')
    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [success, setSuccess] = useState(false)
    const passwordRef = useRef<HTMLInputElement>(null)

    // ── Detect Supabase recovery session ─────────────────────────────
    useEffect(() => {
        const supabase = createClient()

        // Supabase fires PASSWORD_RECOVERY event when URL contains recovery token
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setSessionReady('valid')
                setTimeout(() => passwordRef.current?.focus(), 100)
            } else if (event === 'SIGNED_IN' && session) {
                // Already signed in — still allow reset
                setSessionReady('valid')
                setTimeout(() => passwordRef.current?.focus(), 100)
            }
        })

        // Fallback: check for existing session (token already exchanged)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setSessionReady('valid')
                setTimeout(() => passwordRef.current?.focus(), 100)
            } else {
                // Give auth state change a moment to fire first
                setTimeout(() => {
                    setSessionReady((prev) => {
                        if (prev === 'loading') return 'invalid'
                        return prev
                    })
                }, 2500)
            }
        }

        checkSession()

        return () => subscription.unsubscribe()
    }, [])

    // ── Validation ────────────────────────────────────────────────────
    const allRulesPassed = rules.every((r) => r.test(password))
    const passwordsMatch = password === confirm
    const canSubmit = allRulesPassed && passwordsMatch && password.length > 0

    // ── Submit handler ────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!canSubmit) return

        setIsPending(true)
        try {
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({ password })

            if (error) {
                toast.error(error.message || 'Failed to update password. Please try again.')
            } else {
                setSuccess(true)
                // Sign out so they log in fresh with the new password
                await supabase.auth.signOut()
                setTimeout(() => router.push('/login'), 2500)
            }
        } catch {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setIsPending(false)
        }
    }

    // ── Render: Loading ───────────────────────────────────────────────
    if (sessionReady === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={36} className="animate-spin text-blue-500" />
                    <p className="text-gray-400 text-sm font-medium">Verifying reset link…</p>
                </div>
            </div>
        )
    }

    // ── Render: Invalid / Expired token ──────────────────────────────
    if (sessionReady === 'invalid') {
        return (
            <div className="flex justify-center p-4 pt-16 min-h-screen">
                <div
                    className="w-full max-w-md self-start mt-8 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 text-center"
                    style={{
                        background: 'rgba(239, 68, 68, 0.06)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        backdropFilter: 'blur(20px)',
                        animation: 'fadeUp 0.4s ease both',
                    }}
                >
                    <ShieldAlert size={52} className="text-red-400" />
                    <div className="space-y-2">
                        <h1 className="text-3xl font-black text-white tracking-tight">Link Expired</h1>
                        <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
                            This password reset link is invalid or has expired. Reset links are valid for 60 minutes.
                        </p>
                    </div>
                    <Link
                        href="/forgot-password"
                        className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-black bg-white hover:bg-gray-200 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)]"
                    >
                        Request New Link
                    </Link>
                    <Link
                        href="/login"
                        className="text-sm text-gray-500 hover:text-white transition-colors font-semibold"
                    >
                        Return to Login
                    </Link>
                </div>
            </div>
        )
    }

    // ── Render: Success ───────────────────────────────────────────────
    if (success) {
        return (
            <div className="flex justify-center items-center min-h-screen p-4">
                <div
                    className="w-full max-w-md p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 text-center"
                    style={{
                        background: 'rgba(34, 197, 94, 0.06)',
                        border: '1px solid rgba(34, 197, 94, 0.25)',
                        backdropFilter: 'blur(20px)',
                        animation: 'fadeUp 0.4s ease both',
                    }}
                >
                    <div style={{ animation: 'successPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s both' }}>
                        <CheckCircle2 size={64} className="text-green-400" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-white tracking-tight">All Done!</h2>
                        <p className="text-green-400 font-bold">Password updated successfully</p>
                        <p className="text-sm text-gray-400 mt-2">Redirecting you to login…</p>
                    </div>
                    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(34,197,94,0.15)' }}>
                        <div
                            className="h-full rounded-full"
                            style={{
                                background: '#22c55e',
                                animation: 'progressBar 2.5s linear both',
                            }}
                        />
                    </div>
                </div>
                <style jsx>{`
                    @keyframes progressBar {
                        from { width: 0%; }
                        to   { width: 100%; }
                    }
                    @keyframes successPop {
                        from { transform: scale(0.4); opacity: 0; }
                        to   { transform: scale(1);   opacity: 1; }
                    }
                `}</style>
            </div>
        )
    }

    // ── Render: Reset Form ────────────────────────────────────────────
    return (
        <div className="flex justify-center p-4 pt-16 min-h-screen">
            <Toaster
                position="top-center"
                toastOptions={{
                    style: {
                        background: '#0a0a0f',
                        color: '#fff',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '16px',
                        fontSize: '13px',
                        fontWeight: '600',
                    },
                }}
            />

            <div className="w-full max-w-md space-y-8 glass p-10 rounded-[3rem] shadow-2xl relative z-10 self-start mt-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex justify-center mb-3">
                        <div
                            className="w-14 h-14 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(112,0,223,0.15)', border: '1px solid rgba(112,0,223,0.3)' }}
                        >
                            <Lock size={24} className="text-purple-400" />
                        </div>
                    </div>
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">
                        Secure Reset
                    </p>
                    <h1 className="text-4xl font-black tracking-tighter text-white">New Password</h1>
                    <p className="text-sm text-gray-400 font-medium pt-1">
                        Choose a strong password for your account
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* New Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                ref={passwordRef}
                                id="new-password"
                                name="new-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter new password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isPending}
                                autoComplete="new-password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium pr-14 disabled:opacity-60"
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

                    {/* Strength indicator */}
                    {password && <StrengthBar password={password} />}

                    {/* Confirm Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Repeat your password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                required
                                disabled={isPending}
                                autoComplete="new-password"
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium pr-14 disabled:opacity-60"
                                style={{
                                    borderColor:
                                        confirm && !passwordsMatch
                                            ? 'rgba(239,68,68,0.5)'
                                            : confirm && passwordsMatch
                                            ? 'rgba(34,197,94,0.5)'
                                            : undefined,
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(!showConfirm)}
                                disabled={isPending}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors disabled:opacity-40"
                            >
                                {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                        {confirm && !passwordsMatch && (
                            <p className="text-xs text-red-400 font-semibold pl-1 pt-1">
                                Passwords don&apos;t match
                            </p>
                        )}
                        {confirm && passwordsMatch && (
                            <p className="text-xs text-green-400 font-semibold pl-1 pt-1 flex items-center gap-1">
                                <CheckCircle2 size={12} /> Passwords match
                            </p>
                        )}
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={isPending || !canSubmit}
                        className="w-full mt-2 bg-white text-black hover:bg-gray-200 font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-widest disabled:opacity-60 disabled:scale-100 flex items-center justify-center gap-3"
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={20} className="animate-spin shrink-0" />
                                <span>Updating…</span>
                            </>
                        ) : (
                            'Update Password'
                        )}
                    </button>
                </form>

                <p className="text-center text-sm text-gray-500 font-medium">
                    Remember your password?{' '}
                    <Link href="/login" className="text-blue-500 hover:text-white transition-colors font-bold">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    )
}
