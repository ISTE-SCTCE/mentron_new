'use client'

import { uploadNote } from './actions'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/login/actions'

export default function NotesUploadPage() {
    const searchParams = useSearchParams()
    const error = searchParams.get('error')

    return (
        <div className="min-h-screen p-8 text-[#ededed]">
            <div className="max-w-2xl mx-auto">
                <header className="flex justify-between items-center mb-16">
                    <div className="flex items-center gap-8">
                        <Link href="/notes" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest">
                            ← Back to Library
                        </Link>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Contribution</p>
                            <h1 className="text-5xl font-black tracking-tighter text-white">Upload Notes</h1>
                        </div>
                    </div>
                    <form action={logout}>
                        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all border border-red-500/20">
                            Logout
                        </button>
                    </form>
                </header>

                <div className="glass p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <span className="text-8xl">📚</span>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 text-xs font-bold text-red-400 glass border-red-500/20 rounded-2xl text-center bg-red-500/5">
                            {error}
                        </div>
                    )}

                    <form action={uploadNote} className="space-y-8">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase px-2">Item Title</label>
                                <input
                                    name="title"
                                    type="text"
                                    placeholder="e.g., Quantum Physics - Unit 2"
                                    required
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase px-2">Description</label>
                                <textarea
                                    name="description"
                                    placeholder="Brief summary of what these notes cover..."
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase px-2">Department</label>
                                    <select
                                        name="department"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                                        defaultValue=""
                                    >
                                        <option value="" disabled className="text-gray-900 bg-white">Select Department</option>
                                        <option value="CSE" className="bg-[#111] text-white">Computer Science</option>
                                        <option value="ECE" className="bg-[#111] text-white">Electronics and Communication Engineering</option>
                                        <option value="ME" className="bg-[#111] text-white">Mechanical Engineering</option>
                                        <option value="MEA" className="bg-[#111] text-white">Automobile Engineering</option>
                                        <option value="BT" className="bg-[#111] text-white">Bio Technology</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase px-2">Year</label>
                                    <select
                                        name="year"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium appearance-none"
                                        defaultValue=""
                                    >
                                        <option value="" disabled className="text-gray-900 bg-white">Select Year</option>
                                        <option value="1" className="text-gray-900 bg-white">1st Year</option>
                                        <option value="2" className="text-gray-900 bg-white">2nd Year</option>
                                        <option value="3" className="text-gray-900 bg-white">3rd Year</option>
                                        <option value="4" className="text-gray-900 bg-white">4th Year</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black tracking-widest text-gray-500 uppercase px-2">Note File (PDF/Docs)</label>
                                <div className="relative">
                                    <input
                                        name="file"
                                        type="file"
                                        required
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-blue-500 file:text-white file:uppercase file:tracking-widest"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full mt-4 bg-white text-black hover:bg-gray-200 font-black py-5 rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-[0.98] transition-all text-lg uppercase tracking-widest"
                        >
                            Publish Notes
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
