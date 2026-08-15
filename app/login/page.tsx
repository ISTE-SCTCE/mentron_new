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
        <div className="flex justify-center p-4 pt-16">
            <div className="w-full max-w-md space-y-10 glass p-10 rounded-[3rem] shadow-2xl relative z-10">
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Secure Access</p>
                    <h1 className="text-5xl font-black tracking-tighter text-white">Welcome</h1>
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
                    className="space-y-6"
                >
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

                        {/* Forgot Password link */}
                        <div className="flex justify-end">
                            <Link
                                href="/forgot-password"
                                className="text-xs font-semibold text-gray-500 hover:text-blue-400 transition-colors duration-200 relative group"
                            >
                                Forgot Password?
                                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-blue-400 transition-all duration-300 group-hover:w-full" />
                            </Link>
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
