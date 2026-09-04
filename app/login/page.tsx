'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Loader2, Mail, Lock, Terminal, ShieldCheck, Cpu, ArrowRight } from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { login } from './actions'

export default function LoginPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null)

    const formRef = useRef<HTMLFormElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const prefersReduced = useReducedMotion()

    // ── 3D Interactive Console Tilt (Desktop Only) ──
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const springConfig = { stiffness: 120, damping: 20 }
    const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig)
    const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), springConfig)

    useEffect(() => {
        if (prefersReduced) return
        const isFinePointer = window.matchMedia('(pointer: fine)').matches
        if (!isFinePointer) return

        const handleMouseMove = (e: MouseEvent) => {
            const { innerWidth, innerHeight } = window
            mouseX.set(e.clientX / innerWidth - 0.5)
            mouseY.set(e.clientY / innerHeight - 0.5)
        }

        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [prefersReduced, mouseX, mouseY])

    // Dynamic telemetry calculations based on form readiness
    const hasEmail = email.trim().length > 0
    const hasPassword = password.length > 0
    const isReady = hasEmail && hasPassword

    return (
        <div
            ref={containerRef}
            className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 pt-20 sm:pt-24 pb-16 relative overflow-hidden select-none"
        >
            {/* ── BACKGROUND LAYER: Oversized Typographic Watermark & Blueprint Traces ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                {/* Oversized bleeding brand glyphs */}
                <div className="absolute -top-12 -left-12 text-[14vw] font-black tracking-tighter text-white/[0.018] leading-none select-none">
                    MENTRON
                </div>
                <div className="absolute -bottom-16 -right-8 text-[16vw] font-mono font-black text-cyan-400/[0.015] leading-none select-none">
                    &gt;_
                </div>

                {/* Animated PCB Circuit Trace SVG */}
                <svg
                    className="absolute inset-0 w-full h-full stroke-white/10 hidden md:block"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <defs>
                        <linearGradient id="traceGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#7000df" stopOpacity="0.4" />
                            <stop offset="50%" stopColor="#00c6ff" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#7000df" stopOpacity="0.1" />
                        </linearGradient>
                    </defs>

                    {/* Left Bus Trace */}
                    <motion.path
                        d="M 50 180 H 220 L 320 280 H 460"
                        fill="none"
                        stroke="url(#traceGrad)"
                        strokeWidth="1.5"
                        strokeDasharray="6 4"
                        initial={{ pathLength: prefersReduced ? 1 : 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.8, ease: 'easeOut' }}
                    />
                    <circle cx="50" cy="180" r="3" fill="#00c6ff" />
                    <circle cx="460" cy="280" r="4" fill="#7000df" />

                    {/* Right Bus Trace */}
                    <motion.path
                        d="M 95% 240 H 82% L 72% 340 H 58%"
                        fill="none"
                        stroke="url(#traceGrad)"
                        strokeWidth="1.5"
                        strokeDasharray="8 6"
                        initial={{ pathLength: prefersReduced ? 1 : 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 2.2, delay: 0.2, ease: 'easeOut' }}
                    />
                    <circle cx="82%" cy="240" r="3" fill="#00c6ff" />
                </svg>
            </div>

            {/* ── FOREGROUND: Floating Engineering Console ── */}
            <motion.div
                style={prefersReduced ? undefined : { rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 }}
                className="w-full max-w-xl relative z-10"
            >
                {/* Cyber Corner Accents (Outer Chassis) */}
                <div className="absolute -top-2.5 -left-2.5 w-6 h-6 border-t-2 border-l-2 border-cyan-400/60 rounded-tl-lg pointer-events-none" />
                <div className="absolute -top-2.5 -right-2.5 w-6 h-6 border-t-2 border-r-2 border-purple-500/60 rounded-tr-lg pointer-events-none" />
                <div className="absolute -bottom-2.5 -left-2.5 w-6 h-6 border-b-2 border-l-2 border-purple-500/60 rounded-bl-lg pointer-events-none" />
                <div className="absolute -bottom-2.5 -right-2.5 w-6 h-6 border-b-2 border-r-2 border-cyan-400/60 rounded-br-lg pointer-events-none" />

                {/* Main Console Chassis */}
                <div className="bg-[#0a0a12]/90 backdrop-blur-3xl rounded-3xl border border-white/10 shadow-[0_20px_70px_rgba(0,0,0,0.85)] overflow-hidden">
                    {/* ── Console Header Bar (IDE / Terminal Chrome) ── */}
                    <div className="px-5 sm:px-6 py-3.5 bg-white/[0.03] border-b border-white/5 flex items-center justify-between text-xs">
                        {/* Traffic light glowing status beads */}
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.4)] inline-block" />
                            <span className="w-3 h-3 rounded-full bg-amber-400/80 shadow-[0_0_8px_rgba(251,191,36,0.4)] inline-block" />
                            <span className="w-3 h-3 rounded-full bg-emerald-400/80 shadow-[0_0_8px_rgba(52,211,153,0.4)] inline-block" />
                            <span className="ml-2.5 text-[11px] font-mono text-gray-400 hidden sm:inline">
                                auth::session_gateway.ts
                            </span>
                        </div>

                        {/* Telemetry connection status */}
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full transition-colors duration-300 ${isReady ? 'bg-cyan-400 shadow-[0_0_8px_#00c6ff]' : 'bg-purple-500 animate-pulse'}`} />
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">
                                {isReady ? 'CIRCUIT ARMED' : 'ISTE_SECURE // TLS 1.3'}
                            </span>
                        </div>
                    </div>

                    {/* ── Console Content Body ── */}
                    <div className="p-6 sm:p-8 md:p-10 space-y-6">
                        {/* Eyebrow & Title */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-cyan-400 text-[10px] font-mono font-black uppercase tracking-[0.25em]">
                                <Terminal size={13} className="text-cyan-400" />
                                <span>TERMINAL PROTOCOL v3.2</span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
                                <span>Authentication</span>
                                <span className="text-xs px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono font-bold tracking-normal self-center">
                                    CORE
                                </span>
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-400 font-medium">
                                Sign in to connect with the ISTE SCTCE developer ecosystem.
                            </p>
                        </div>

                        {/* Telemetry Power Rail / Circuit Status Nodes */}
                        <div className="grid grid-cols-2 gap-2 p-2 rounded-2xl bg-white/[0.02] border border-white/5 font-mono text-[10px]">
                            <div className={`p-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${hasEmail ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300' : 'bg-white/[0.02] text-gray-500 border border-transparent'}`}>
                                <Cpu size={12} className={hasEmail ? 'text-cyan-400' : 'text-gray-600'} />
                                <span className="truncate">IDENT: {hasEmail ? 'VERIFIED' : 'PENDING'}</span>
                            </div>
                            <div className={`p-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${hasPassword ? 'bg-purple-500/10 border border-purple-500/30 text-purple-300' : 'bg-white/[0.02] text-gray-500 border border-transparent'}`}>
                                <ShieldCheck size={12} className={hasPassword ? 'text-purple-400' : 'text-gray-600'} />
                                <span className="truncate">SECRET: {hasPassword ? 'ARMED' : 'REQUIRED'}</span>
                            </div>
                        </div>

                        {/* Error Alert Display */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-bold leading-relaxed flex items-center gap-2.5"
                            >
                                <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 shadow-[0_0_8px_#f87171]" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Form Body */}
                        <form
                            ref={formRef}
                            action={login}
                            onSubmit={() => setIsPending(true)}
                            className="space-y-5"
                        >
                            {/* Email Field with Floating Reactive Monospace Label */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                    <label
                                        htmlFor="email-input"
                                        className={`font-bold transition-colors ${focusedField === 'email' || hasEmail ? 'text-cyan-400' : 'text-gray-400'}`}
                                    >
                                        &gt; user.identity
                                    </label>
                                    <span className="text-[10px] text-gray-600">REQUIRED</span>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none">
                                        <Mail size={16} />
                                    </div>
                                    <input
                                        id="email-input"
                                        name="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onFocus={() => setFocusedField('email')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="user@sctce.ac.in"
                                        required
                                        disabled={isPending}
                                        className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 text-white text-sm font-medium placeholder:text-gray-600 focus:outline-none focus:border-cyan-400/80 focus:ring-4 focus:ring-cyan-400/15 focus:bg-white/[0.06] transition-all duration-200 disabled:opacity-60"
                                    />
                                </div>
                            </div>

                            {/* Password Field with Monospace Label & Toggle */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                    <label
                                        htmlFor="password-input"
                                        className={`font-bold transition-colors ${focusedField === 'password' || hasPassword ? 'text-purple-400' : 'text-gray-400'}`}
                                    >
                                        &gt; user.secret_key
                                    </label>
                                    <Link
                                        href="/forgot-password"
                                        className="text-[11px] text-gray-400 hover:text-cyan-400 transition-colors"
                                    >
                                        Forgot?
                                    </Link>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none">
                                        <Lock size={16} />
                                    </div>
                                    <input
                                        id="password-input"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setFocusedField('password')}
                                        onBlur={() => setFocusedField(null)}
                                        placeholder="••••••••••••"
                                        required
                                        disabled={isPending}
                                        className="w-full h-12 bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-12 text-white text-sm font-medium placeholder:text-gray-600 focus:outline-none focus:border-purple-500/80 focus:ring-4 focus:ring-purple-500/15 focus:bg-white/[0.06] transition-all duration-200 disabled:opacity-60"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        disabled={isPending}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 disabled:opacity-40"
                                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* High-Impact Executable CTA Button */}
                            <button
                                type="submit"
                                disabled={isPending}
                                className="group relative w-full h-13 mt-4 rounded-2xl overflow-hidden font-black text-xs sm:text-sm uppercase tracking-[0.2em] text-white shadow-[0_0_35px_rgba(112,0,223,0.35)] hover:shadow-[0_0_45px_rgba(0,198,255,0.4)] active:scale-[0.98] transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                            >
                                {/* Gradient Background */}
                                <div
                                    className="absolute inset-0 bg-gradient-to-r from-[#7000df] via-[#8c22ff] to-[#00c6ff] group-hover:opacity-95 transition-opacity"
                                />

                                {/* Light Sweep Hover Shimmer */}
                                <div
                                    className="absolute inset-0 opacity-0 group-hover:opacity-30 bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"
                                />

                                {/* Content */}
                                <span className="relative z-10 flex items-center gap-2">
                                    {isPending ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>INITIALIZING SESSION…</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>INITIALIZE SESSION</span>
                                            <ArrowRight
                                                size={16}
                                                className="group-hover:translate-x-1 transition-transform duration-200"
                                            />
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>

                        {/* Sign-up Invitation */}
                        <div className="pt-2 text-center text-xs font-medium text-gray-400">
                            Not in the tribe?{' '}
                            <Link
                                href="/signup"
                                className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4 decoration-cyan-400/40 hover:decoration-cyan-400 transition-colors ml-1 font-mono"
                            >
                                REQUEST ACCESS / JOIN →
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
