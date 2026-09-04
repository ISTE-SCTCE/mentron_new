'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { Eye, EyeOff, Loader2, Mail, Lock, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { login } from './actions'

export default function LoginPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const [showPassword, setShowPassword] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)
    const prefersReduced = useReducedMotion()

    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-24 pb-16 relative">
            {/* Split Screen Container */}
            <motion.div
                initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="w-full max-w-5xl rounded-[2.5rem] border border-white/10 bg-[#07070d]/80 backdrop-blur-2xl shadow-2xl shadow-black/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 relative z-10"
            >
                {/* ── LEFT BRAND PANEL (~58% width on desktop, hidden on mobile) ── */}
                <div className="lg:col-span-7 hidden lg:flex flex-col justify-between p-10 xl:p-14 relative overflow-hidden bg-gradient-to-br from-[#0e0a1f] via-[#06060c] to-[#040814] border-r border-white/5">
                    {/* Ambient dynamic glow orbs */}
                    <div className="absolute -top-16 -left-16 w-80 h-80 rounded-full bg-[#7000df]/25 blur-[100px] pointer-events-none" />
                    <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-[#00c6ff]/20 blur-[100px] pointer-events-none" />
                    <div
                        className="absolute inset-0 opacity-[0.04] pointer-events-none"
                        style={{
                            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                            backgroundSize: '32px 32px',
                        }}
                    />

                    {/* Top eyebrow badge */}
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00c6ff]" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-300">
                                ISTE SCTCE Chapter
                            </span>
                        </div>
                    </div>

                    {/* Center statement */}
                    <div className="relative z-10 my-auto py-8 space-y-5">
                        <div className="space-y-2">
                            <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
                                Engineering The Future
                            </p>
                            <h2 className="text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.05]">
                                Connect.{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-blue-400">
                                    Learn.
                                </span>{' '}
                                <br />
                                Innovate.
                            </h2>
                        </div>

                        <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-md">
                            The elite community for tech enthusiasts, developers, and pioneers.
                            Access exclusive resources, collaborative projects, and peer marketplace.
                        </p>

                        {/* Feature Badges */}
                        <div className="pt-3 flex flex-wrap gap-2.5">
                            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                                <Sparkles size={12} className="text-purple-400" />
                                <span>Verified Notes</span>
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                                <Sparkles size={12} className="text-cyan-400" />
                                <span>Peer Marketplace</span>
                            </div>
                            <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[11px] font-bold text-gray-300 flex items-center gap-1.5">
                                <Sparkles size={12} className="text-indigo-400" />
                                <span>Collaborative Hub</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom wordmark */}
                    <div className="relative z-10 pt-4 flex items-center justify-between border-t border-white/5">
                        <span className="text-xl font-black tracking-tighter text-white/90">
                            MENTRON
                        </span>
                        <span className="text-[11px] font-semibold text-gray-500">
                            Student Innovation Platform
                        </span>
                    </div>
                </div>

                {/* ── RIGHT AUTH PANEL (~42% width on desktop, full on mobile) ── */}
                <div className="lg:col-span-5 w-full flex flex-col justify-center p-6 sm:p-10 xl:p-12 relative z-10">
                    <div className="w-full space-y-6">
                        {/* Header with paired badge */}
                        <div className="space-y-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-[0.25em]">
                                <ShieldCheck size={13} className="text-cyan-400" />
                                <span>Secure Access</span>
                            </div>

                            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                                Welcome back
                            </h1>
                            <p className="text-gray-400 text-xs sm:text-sm font-medium">
                                Sign in to your Mentron account
                            </p>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-3.5 text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 rounded-2xl text-center leading-relaxed"
                            >
                                {error}
                            </motion.div>
                        )}

                        {/* Form */}
                        <form
                            ref={formRef}
                            action={login}
                            onSubmit={() => setIsPending(true)}
                            className="space-y-4"
                        >
                            {/* Email field with icon */}
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">
                                    Email address
                                </label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none">
                                        <Mail size={17} />
                                    </div>
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="name@sctce.ac.in"
                                        required
                                        disabled={isPending}
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-11 pr-4 py-3.5 text-white placeholder:text-gray-600 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-purple-500/80 focus:bg-white/[0.07] focus:ring-4 focus:ring-purple-500/20 disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            {/* Password field with icon + toggle */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-400">
                                        Password
                                    </label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs font-semibold text-gray-400 hover:text-cyan-400 transition-colors duration-200"
                                    >
                                        Forgot Password?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none">
                                        <Lock size={17} />
                                    </div>
                                    <input
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        required
                                        disabled={isPending}
                                        className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-11 pr-12 py-3.5 text-white placeholder:text-gray-600 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-purple-500/80 focus:bg-white/[0.07] focus:ring-4 focus:ring-purple-500/20 disabled:opacity-60"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isPending}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-40 p-1"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                    </button>
                                </div>
                            </div>

                            {/* Submit CTA */}
                            <button
                                type="submit"
                                disabled={isPending}
                                className="w-full mt-2 bg-gradient-to-r from-purple-600 via-[#7000df] to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-black py-3.5 sm:py-4 rounded-2xl shadow-[0_0_30px_rgba(112,0,223,0.35)] hover:shadow-[0_0_40px_rgba(0,198,255,0.35)] hover:scale-[1.01] active:scale-[0.98] transition-all text-xs sm:text-sm uppercase tracking-widest disabled:opacity-75 disabled:scale-100 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin shrink-0" />
                                        <span>Logging in…</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Login</span>
                                        <ArrowRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        {/* Sign up link */}
                        <div className="pt-2 text-center text-xs sm:text-sm font-medium text-gray-400">
                            Not in the tribe?{' '}
                            <Link
                                href="/signup"
                                className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4 decoration-purple-500/50 hover:decoration-cyan-400 transition-colors ml-1"
                            >
                                Join the tribe →
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
