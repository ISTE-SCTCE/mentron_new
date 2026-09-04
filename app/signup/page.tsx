'use client'

import { signup } from './actions'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="min-h-[90vh] flex items-center justify-center p-4 pt-20 pb-12">
            <div className="w-full max-w-lg space-y-8 sm:space-y-10 glass p-6 sm:p-10 rounded-3xl sm:rounded-[3rem] shadow-2xl relative z-10 border-white/10">
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black tracking-[0.3em] text-cyan-400 uppercase">Step into Innovation</p>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tighter text-white">Join Mentron</h1>
                    <p className="text-gray-400 text-xs sm:text-sm font-medium">Create your verified student profile</p>
                </div>

                {error && (
                    <div className="p-4 text-xs font-bold text-red-400 glass border-red-500/20 rounded-2xl text-center bg-red-500/5">
                        {error}
                    </div>
                )}

                <form action={signup} className="space-y-5 sm:space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input
                                name="full_name"
                                type="text"
                                placeholder="Full Name"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base"
                            />
                            <input
                                name="roll_number"
                                type="text"
                                placeholder="Roll Number"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium uppercase text-sm sm:text-base"
                            />
                        </div>

                        <input
                            name="email"
                            type="email"
                            placeholder="Email address"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base"
                        />
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create Password"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium pr-14 text-sm sm:text-base"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <select
                                name="year"
                                required
                                defaultValue=""
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium cursor-pointer text-sm sm:text-base"
                            >
                                <option value="" disabled className="bg-[#0a0a0f] text-gray-500">Select Year</option>
                                <option value="1" className="bg-[#0a0a0f] text-white">1st Year</option>
                                <option value="2" className="bg-[#0a0a0f] text-white">2nd Year</option>
                                <option value="3" className="bg-[#0a0a0f] text-white">3rd Year</option>
                                <option value="4" className="bg-[#0a0a0f] text-white">4th Year</option>
                            </select>
                            <select
                                name="department"
                                required
                                defaultValue=""
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium cursor-pointer text-sm sm:text-base"
                            >
                                <option value="" disabled className="bg-[#0a0a0f] text-gray-500">Select Department</option>
                                <option value="CSE" className="bg-[#0a0a0f] text-white">CSE</option>
                                <option value="ECE" className="bg-[#0a0a0f] text-white">ECE</option>
                                <option value="ME" className="bg-[#0a0a0f] text-white">Mechanical</option>
                                <option value="MEA" className="bg-[#0a0a0f] text-white">Automobile</option>
                                <option value="BT" className="bg-[#0a0a0f] text-white">Biotechnology</option>
                            </select>
                        </div>

                        <input
                            name="iste_id"
                            type="text"
                            placeholder="ISTE ID (Optional - for notes access)"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all font-medium text-sm sm:text-base"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-2 sm:mt-4 bg-white text-black hover:bg-gray-200 font-black py-4 sm:py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all text-sm sm:text-base uppercase tracking-widest"
                    >
                        Create Account
                    </button>
                </form>

                <div className="pt-2 text-center text-xs sm:text-sm font-medium text-gray-400">
                    Already part of the tribe?{' '}
                    <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-bold underline underline-offset-4 decoration-purple-500/40 transition-colors ml-1">
                        Login Now
                    </Link>
                </div>
            </div>
        </div>
    )
}
