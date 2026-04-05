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
        <div className="flex justify-center p-4 pt-16 pb-12">
            <div className="w-full max-w-lg space-y-10 glass p-10 rounded-[3rem] shadow-2xl relative z-10">
                <div className="text-center space-y-2">
                    <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Step into Innovation</p>
                    <h1 className="text-5xl font-black tracking-tighter text-white">Join Mentron</h1>
                </div>

                {error && (
                    <div className="p-4 text-xs font-bold text-red-400 glass border-red-500/20 rounded-2xl text-center bg-red-500/5">
                        {error}
                    </div>
                )}

                <form action={signup} className="space-y-6">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                name="full_name"
                                type="text"
                                placeholder="Full Name"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                            />
                            <input
                                name="roll_number"
                                type="text"
                                placeholder="Roll Number"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium uppercase"
                            />
                        </div>

                        <input
                            name="email"
                            type="email"
                            placeholder="Email address"
                            required
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        />
                        <div className="relative">
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create Password"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium pr-14"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <select
                                name="year"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none cursor-pointer backdrop-blur-md"
                            >
                                <option value="" disabled selected className="bg-[#0a0a0a] text-gray-500">Year</option>
                                <option value="1" className="bg-[#0a0a0a] text-white">1st Year</option>
                                <option value="2" className="bg-[#0a0a0a] text-white">2nd Year</option>
                                <option value="3" className="bg-[#0a0a0a] text-white">3rd Year</option>
                                <option value="4" className="bg-[#0a0a0a] text-white">4th Year</option>
                            </select>
                            <select
                                name="department"
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none cursor-pointer backdrop-blur-md"
                            >
                                <option value="" disabled selected className="bg-[#0a0a0a] text-gray-500">Department</option>
                                <option value="CSE" className="bg-[#0a0a0a] text-white">CSE</option>
                                <option value="ECE" className="bg-[#0a0a0a] text-white">ECE</option>
                                <option value="ME" className="bg-[#0a0a0a] text-white">Mechanical</option>
                                <option value="MEA" className="bg-[#0a0a0a] text-white">Automobile</option>
                                <option value="BT" className="bg-[#0a0a0a] text-white">Biotechnology</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-4 bg-white text-black hover:bg-gray-200 font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all text-lg uppercase tracking-widest"
                    >
                        Create Account
                    </button>
                </form>

                <p className="text-center text-sm font-bold text-gray-500">
                    Already part of the tribe?{' '}
                    <Link href="/login" className="text-blue-500 hover:text-white transition-colors">
                        Login Now
                    </Link>
                </p>
            </div>
        </div>
    )
}
