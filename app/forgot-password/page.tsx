'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/app/lib/supabase/client'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [isPending, setIsPending] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsPending(true)

        try {
            const supabase = createClient()
            // We always call resetPasswordForEmail — never reveal whether email exists
            await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://mentron.istesctce.in'}/reset-password`,
            })
            // Always show generic success regardless of outcome (security)
            setSubmitted(true)
        } catch {
            // Still show success — never expose email existence
            setSubmitted(true)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <div className="flex justify-center p-4 pt-16 min-h-screen">
            <div className="w-full max-w-md space-y-8 glass p-10 rounded-[3rem] shadow-2xl relative z-10 self-start mt-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">
                        Account Recovery
                    </p>
                    <h1 className="text-4xl font-black tracking-tighter text-white">
                        {submitted ? 'Check Your Email' : 'Reset Password'}
                    </h1>
                    <p className="text-sm text-gray-400 font-medium pt-1">
                        {submitted
                            ? "We've sent instructions to your inbox"
                            : 'Enter your email to receive a reset link'}
                    </p>
                </div>

                {/* Success State */}
                {submitted ? (
                    <div className="space-y-6">
                        {/* Animated success card */}
                        <div
                            className="flex flex-col items-center gap-4 p-8 rounded-2xl text-center"
                            style={{
                                background: 'rgba(34, 197, 94, 0.06)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                animation: 'fadeUp 0.4s ease both',
                            }}
                        >
                            <div
                                style={{ animation: 'successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.1s both' }}
                            >
                                <CheckCircle2 size={52} className="text-green-400" />
                            </div>
                            <div className="space-y-2">
                                <p className="font-black text-white text-lg">Link Sent!</p>
                                <p className="text-sm text-gray-400 leading-relaxed">
                                    If an account exists for{' '}
                                    <span className="text-blue-400 font-semibold">{email}</span>
                                    , a password reset link has been sent.
                                </p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Check your spam folder if you don&apos;t see it within a few minutes.
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-gray-300 hover:text-white transition-all"
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                            }}
                        >
                            <ArrowLeft size={16} />
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    /* Form State */
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div
                                className="p-4 text-xs font-bold text-red-400 rounded-2xl text-center"
                                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
                            >
                                {error}
                            </div>
                        )}

                        {/* Email Input */}
                        <div className="relative">
                            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
                                <Mail size={18} />
                            </div>
                            <input
                                ref={inputRef}
                                id="forgot-email"
                                name="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={isPending}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium disabled:opacity-60"
                            />
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isPending || !email.trim()}
                            className="w-full bg-white text-black hover:bg-gray-200 font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm uppercase tracking-widest disabled:opacity-70 disabled:scale-100 flex items-center justify-center gap-3"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 size={20} className="animate-spin shrink-0" />
                                    <span>Sending…</span>
                                </>
                            ) : (
                                'Send Reset Link'
                            )}
                        </button>

                        {/* Back to Login */}
                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl font-bold text-gray-400 hover:text-white transition-all text-sm"
                            style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.07)',
                            }}
                        >
                            <ArrowLeft size={14} />
                            Back to Login
                        </Link>
                    </form>
                )}
            </div>

            <style jsx>{`
                @keyframes successPop {
                    from { transform: scale(0.5); opacity: 0; }
                    to   { transform: scale(1);   opacity: 1; }
                }
            `}</style>
        </div>
    )
}
