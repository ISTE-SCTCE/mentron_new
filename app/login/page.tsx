'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, Sparkles, Users, Award, Compass } from 'lucide-react'
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
    const [isHoveringSubmit, setIsHoveringSubmit] = useState(false)

    const formRef = useRef<HTMLFormElement>(null)
    const prefersReduced = useReducedMotion()

    // ── Interactive Kinetic Tilt & Spring Physics ──
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Jittery spring responsiveness (preserves tactile kinetic responsiveness)
    const springConfig = { stiffness: 140, damping: 18, mass: 0.9 }
    const tiltX = useSpring(useTransform(mouseY, [-0.5, 0.5], [7, -7]), springConfig)
    const tiltY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-9, 9]), springConfig)

    // Secondary backplate offset parallax (depth layering)
    const backplateX = useSpring(useTransform(mouseX, [-0.5, 0.5], [14, -14]), springConfig)
    const backplateY = useSpring(useTransform(mouseY, [-0.5, 0.5], [14, -14]), springConfig)

    // Floating badges parallax
    const badgeX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-18, 18]), springConfig)
    const badgeY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-18, 18]), springConfig)

    useEffect(() => {
        const isFinePointer = window.matchMedia('(pointer: fine)').matches
        if (!isFinePointer) return

        const handleMouseMove = (e: MouseEvent) => {
            const { innerWidth, innerHeight } = window
            mouseX.set(e.clientX / innerWidth - 0.5)
            mouseY.set(e.clientY / innerHeight - 0.5)
        }

        window.addEventListener('mousemove', handleMouseMove, { passive: true })
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [mouseX, mouseY])

    // Progress calculation for live reactive progress bar
    const hasEmail = email.trim().length > 0
    const hasPassword = password.length > 0
    const progressPercentage = (hasEmail ? 50 : 0) + (hasPassword ? 50 : 0)

    const isEmailFloating = focusedField === 'email' || hasEmail
    const isPasswordFloating = focusedField === 'password' || hasPassword

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-12 pt-24 pb-16 relative overflow-hidden">
            {/* ── BACKGROUND LAYER: Oversized Typographic Watermark & Geometric Aura ── */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
                {/* Massive bleeding brand typography in Space Grotesk */}
                <div
                    className="absolute -top-10 -left-10 text-[18vw] font-black tracking-tighter text-white/[0.018] leading-none whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)' }}
                >
                    MENTRON
                </div>
                <div
                    className="absolute -bottom-14 -right-10 text-[15vw] font-black tracking-tighter text-cyan-400/[0.02] leading-none whitespace-nowrap"
                    style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)' }}
                >
                    INNOVATE
                </div>

                {/* Slow ambient rotating geometric orbital rings */}
                <motion.div
                    animate={prefersReduced ? undefined : { rotate: 360 }}
                    transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}
                    className="absolute -top-[20%] -right-[15%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full border border-purple-500/[0.08] pointer-events-none hidden lg:block"
                >
                    <div className="absolute top-1/4 -left-2 w-4 h-4 rounded-full bg-cyan-400/20 blur-[2px]" />
                    <div className="absolute bottom-1/3 -right-2 w-5 h-5 rounded-full bg-purple-500/20 blur-[2px]" />
                </motion.div>

                <motion.div
                    animate={prefersReduced ? undefined : { rotate: -360 }}
                    transition={{ duration: 160, repeat: Infinity, ease: 'linear' }}
                    className="absolute -bottom-[25%] -left-[10%] w-[50vw] h-[50vw] max-w-[700px] max-h-[700px] rounded-full border border-cyan-400/[0.06] border-dashed pointer-events-none hidden lg:block"
                />
            </div>

            {/* ── MAIN ASYMMETRIC / BROKEN-GRID CONTAINER ── */}
            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
                {/* ── LEFT SECTION: Student Engineering Community Showcase (Desktop) ── */}
                <div className="lg:col-span-6 xl:col-span-7 hidden lg:flex flex-col space-y-8 relative">
                    {/* Chapter Eyebrow Tag */}
                    <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-xl self-start">
                        <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_10px_#00c6ff]" />
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-200">
                            ISTE SCTCE Student Chapter
                        </span>
                    </div>

                    {/* Bold Headline & Community Mission */}
                    <div className="space-y-4">
                        <h2
                            className="text-4xl xl:text-6xl font-black text-white tracking-tight leading-[1.08]"
                            style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)' }}
                        >
                            Where Student{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-white">
                                Engineers
                            </span>{' '}
                            Converge.
                        </h2>
                        <p className="text-base text-gray-400 font-normal leading-relaxed max-w-lg">
                            Empowering innovators, makers, and pioneers across every college discipline. Access curated academic resources, collaborate on live projects, and connect with peer leaders.
                        </p>
                    </div>

                    {/* Floating Glass Badges at Offset Parallax Depths */}
                    <motion.div
                        style={{ x: badgeX, y: badgeY }}
                        className="grid grid-cols-2 gap-3.5 max-w-md pt-2"
                    >
                        <div className="glass p-4 rounded-2xl border-white/10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300 shrink-0">
                                <Users size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white leading-tight">500+ Members</p>
                                <p className="text-[11px] text-gray-400 font-medium">All Branches</p>
                            </div>
                        </div>

                        <div className="glass p-4 rounded-2xl border-white/10 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                                <Compass size={18} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-white leading-tight">Initiatives</p>
                                <p className="text-[11px] text-gray-400 font-medium">Workshops & Events</p>
                            </div>
                        </div>

                        <div className="glass p-4 rounded-2xl border-white/10 flex items-center gap-3 col-span-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/30 to-cyan-400/30 border border-white/15 flex items-center justify-center text-white shrink-0">
                                <Award size={18} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-white leading-tight">Cross-Disciplinary Innovation</p>
                                <p className="text-[11px] text-gray-400 font-medium">Mechanical · Civil · ECE · CSE · Biotechnology</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* ── RIGHT SECTION: Layered Floating Glass Form ── */}
                <div className="lg:col-span-6 xl:col-span-5 w-full relative flex justify-center">
                    {/* Layer 1: Frosted Background Accent Plate (Offset depth) */}
                    <motion.div
                        style={{ x: backplateX, y: backplateY }}
                        className="absolute inset-2 -right-3 -bottom-3 rounded-[2.5rem] bg-gradient-to-br from-purple-600/20 via-cyan-400/10 to-transparent border border-white/5 blur-[2px] pointer-events-none hidden sm:block"
                    />

                    {/* Layer 2: Main Floating Form Surface (Kinetic 3D Tilt) */}
                    <motion.div
                        style={{
                            rotateX: tiltX,
                            rotateY: tiltY,
                            transformPerspective: 1200,
                        }}
                        className="w-full max-w-md relative z-10 glass-card !p-6 sm:!p-8 md:!p-10 rounded-3xl sm:rounded-[2.5rem] border border-white/15 shadow-[0_25px_60px_rgba(0,0,0,0.85)]"
                    >
                        {/* Subtle ambient internal glow spot */}
                        <div className="absolute top-0 right-0 w-44 h-44 rounded-full bg-cyan-400/10 blur-3xl pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-44 h-44 rounded-full bg-purple-500/15 blur-3xl pointer-events-none" />

                        <div className="relative z-10 space-y-6">
                            {/* Header */}
                            <div className="space-y-1.5">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10 text-cyan-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    <Sparkles size={11} className="text-cyan-400" />
                                    <span>Member Portal</span>
                                </div>
                                <h1
                                    className="text-2xl sm:text-3xl font-black tracking-tight text-white"
                                    style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)' }}
                                >
                                    Welcome Back
                                </h1>
                                <p className="text-xs sm:text-sm text-gray-400 font-medium">
                                    Sign in to your Mentron community account
                                </p>
                            </div>

                            {/* ── Live Completion Progress Meter ── */}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                                    <span>Form Readiness</span>
                                    <span className={progressPercentage === 100 ? 'text-cyan-300' : 'text-gray-500'}>
                                        {progressPercentage}%
                                    </span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/5">
                                    <motion.div
                                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 shadow-[0_0_10px_rgba(0,198,255,0.5)]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${progressPercentage}%` }}
                                        transition={{ duration: 0.35, ease: 'easeOut' }}
                                    />
                                </div>
                            </div>

                            {/* Error Alert Display */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.96 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs font-semibold leading-relaxed text-center"
                                >
                                    {error}
                                </motion.div>
                            )}

                            {/* ── Form with Animated Floating Labels ── */}
                            <form
                                ref={formRef}
                                action={login}
                                onSubmit={() => setIsPending(true)}
                                className="space-y-4"
                            >
                                {/* Floating Label Input 1: Email */}
                                <div className="relative pt-3 group">
                                    <div className="relative rounded-2xl bg-white/[0.04] border border-white/10 transition-all duration-200 focus-within:border-cyan-400/80 focus-within:bg-white/[0.07] focus-within:ring-4 focus-within:ring-cyan-400/15">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyan-400 transition-colors pointer-events-none">
                                            <Mail size={17} />
                                        </div>

                                        {/* Floating Label */}
                                        <label
                                            htmlFor="login-email"
                                            className={`absolute left-11 transition-all duration-200 pointer-events-none select-none font-semibold ${
                                                isEmailFloating
                                                    ? 'top-2 text-[10px] text-cyan-400 tracking-wider uppercase'
                                                    : 'top-1/2 -translate-y-1/2 text-xs sm:text-sm text-gray-500'
                                            }`}
                                        >
                                            Email Address
                                        </label>

                                        <input
                                            id="login-email"
                                            name="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onFocus={() => setFocusedField('email')}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                            disabled={isPending}
                                            className="w-full h-13 sm:h-14 pl-11 pr-4 pt-3.5 bg-transparent text-white text-xs sm:text-sm font-medium focus:outline-none disabled:opacity-60"
                                        />
                                    </div>
                                </div>

                                {/* Floating Label Input 2: Password */}
                                <div className="relative pt-1 group">
                                    <div className="relative rounded-2xl bg-white/[0.04] border border-white/10 transition-all duration-200 focus-within:border-purple-500/80 focus-within:bg-white/[0.07] focus-within:ring-4 focus-within:ring-purple-500/15">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none">
                                            <Lock size={17} />
                                        </div>

                                        {/* Floating Label */}
                                        <label
                                            htmlFor="login-password"
                                            className={`absolute left-11 transition-all duration-200 pointer-events-none select-none font-semibold ${
                                                isPasswordFloating
                                                    ? 'top-2 text-[10px] text-purple-400 tracking-wider uppercase'
                                                    : 'top-1/2 -translate-y-1/2 text-xs sm:text-sm text-gray-500'
                                            }`}
                                        >
                                            Password
                                        </label>

                                        <input
                                            id="login-password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            onFocus={() => setFocusedField('password')}
                                            onBlur={() => setFocusedField(null)}
                                            required
                                            disabled={isPending}
                                            className="w-full h-13 sm:h-14 pl-11 pr-12 pt-3.5 bg-transparent text-white text-xs sm:text-sm font-medium focus:outline-none disabled:opacity-60"
                                        />

                                        {/* Password visibility toggle */}
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            disabled={isPending}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 disabled:opacity-40"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>

                                    {/* Forgot Password Link */}
                                    <div className="flex justify-end pt-1.5">
                                        <Link
                                            href="/forgot-password"
                                            className="text-xs font-semibold text-gray-400 hover:text-cyan-400 transition-colors"
                                        >
                                            Forgot Password?
                                        </Link>
                                    </div>
                                </div>

                                {/* ── Submit Button with Animated Sweep & Arrow Launch ── */}
                                <button
                                    type="submit"
                                    disabled={isPending}
                                    onMouseEnter={() => setIsHoveringSubmit(true)}
                                    onMouseLeave={() => setIsHoveringSubmit(false)}
                                    className="group relative w-full h-13 sm:h-14 mt-3 rounded-2xl overflow-hidden font-black text-xs sm:text-sm uppercase tracking-[0.18em] text-white shadow-[0_0_30px_rgba(112,0,223,0.35)] hover:shadow-[0_0_40px_rgba(0,198,255,0.4)] active:scale-[0.98] transition-all duration-300 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center"
                                    style={{ fontFamily: 'var(--font-display, "Space Grotesk", sans-serif)' }}
                                >
                                    {/* Gradient base */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-[#7000df] to-cyan-500 group-hover:opacity-95 transition-opacity" />

                                    {/* Progress-fill sweep on hover */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
                                        initial={{ x: '-100%' }}
                                        animate={{ x: isHoveringSubmit ? '100%' : '-100%' }}
                                        transition={{ duration: 0.8, ease: 'easeInOut' }}
                                    />

                                    {/* Button label & arrow */}
                                    <span className="relative z-10 flex items-center gap-2">
                                        {isPending ? (
                                            <>
                                                <Loader2 size={18} className="animate-spin" />
                                                <span>Authenticating…</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Sign In to Mentron</span>
                                                <motion.span
                                                    animate={isHoveringSubmit ? { x: 4 } : { x: 0 }}
                                                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                                                >
                                                    <ArrowRight size={17} />
                                                </motion.span>
                                            </>
                                        )}
                                    </span>
                                </button>
                            </form>

                            {/* Sign-up Invitation */}
                            <div className="pt-1 text-center text-xs sm:text-sm font-medium text-gray-400">
                                Not part of the community yet?{' '}
                                <Link
                                    href="/signup"
                                    className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4 decoration-purple-500/40 hover:decoration-cyan-400 transition-colors ml-1"
                                >
                                    Join the tribe →
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
