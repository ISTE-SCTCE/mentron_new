'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { login } from './actions'

export default function LoginPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const [showPassword, setShowPassword] = useState(false)
    const [isPending, setIsPending] = useState(false)
    const formRef = useRef<HTMLFormElement>(null)

    return (
        <div className="min-h-[85vh] flex items-center justify-center p-4 pt-20 pb-12">
            <div className="w-full max-w-md space-y-8 sm:space-y-10 glass p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] shadow-2xl relative z-10 border-white/10">
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase">Secure Access</p>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-white">Welcome</h1>
                    <p className="text-gray-400 text-xs sm:text-sm font-medium">Sign in to your Mentron account</p>
                </div>

                {error && (
                    <div className="p-4 text-xs font-bold text-red-400 glass border-red-500/20 rounded-2xl text-center bg-red-500/5">
                        {error}
                    </div>
                )}

                <form
                    ref={formRef}
                    action={login}
                    onSubmit={() => setIsPending(true)}
                    className="space-y-5 sm:space-y-6"
                >
                    <div className="space-y-4">
                        <div>
                            <input
                                name="email"
                                type="email"
                                placeholder="Email address"
                                required
                                disabled={isPending}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base disabled:opacity-60"
                            />
                        </div>
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                required
                                disabled={isPending}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base pr-14 disabled:opacity-60"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                disabled={isPending}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-40 p-1"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        {/* Forgot Password link */}
                        <div className="flex justify-end pt-1">
                            <Link
                                href="/forgot-password"
                                className="text-xs font-semibold text-gray-400 hover:text-cyan-400 transition-colors duration-200 relative group"
                            >
                                Forgot Password?
                                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-cyan-400 transition-all duration-300 group-hover:w-full" />
                            </Link>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full mt-2 sm:mt-4 bg-white text-black hover:bg-gray-200 font-black py-4 sm:py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm sm:text-base uppercase tracking-widest disabled:opacity-80 disabled:scale-100 flex items-center justify-center gap-3"
                    >
                        {isPending ? (
                            <>
                                <Loader2 size={20} className="animate-spin shrink-0" />
                                <span>Logging in…</span>
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </form>

                <div className="pt-2 text-center text-xs sm:text-sm font-medium text-gray-400">
                    Not in the tribe?{' '}
                    <Link href="/signup" className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4 decoration-purple-500/40 transition-colors ml-1">
                        Join the tribe
                    </Link>
                </div>
            </div>
        </div>
    )
}
