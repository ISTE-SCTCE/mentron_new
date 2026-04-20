'use client'

import Link from 'next/link'
import { Instagram, Linkedin, Mail } from 'lucide-react'

export function Footer() {
    return (
        <footer className="relative z-20 pt-16 pb-8 px-8 md:px-16 w-full">
            <div className="max-w-7xl mx-auto">
                {/* Subtle top divider */}
                <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-16" />

                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                    {/* Left Section - Logo & Description */}
                    <div className="md:col-span-5 space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center bg-white text-black font-black text-xs">
                                ISTE
                            </div>
                            <span className="text-xl font-black text-white tracking-widest uppercase">ISTE SCTCE</span>
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                            The leading student chapter dedicated to fostering technical excellence and professional growth.
                        </p>

                        {/* Social Icons */}
                        <div className="flex items-center gap-4 pt-2">
                            <a href="https://www.instagram.com/istesctsc" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 hover:scale-110 transition-all">
                                <Instagram size={18} />
                            </a>
                            <a href="https://www.linkedin.com/in/istesctsc-4b84b639a/" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 hover:scale-110 transition-all">
                                <Linkedin size={18} />
                            </a>
                            <a href="mailto:istesctce@gmail.com" className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/10 hover:scale-110 transition-all">
                                <Mail size={18} />
                            </a>
                        </div>
                    </div>

                    <div className="hidden md:block md:col-span-2"></div>

                    {/* Right Section - Links */}
                        {/* Column 1 */}
                        <div className="space-y-6">
                            <h3 className="text-base font-black text-white tracking-wide">Menu</h3>
                            <ul className="space-y-4">
                                <li><a href="https://istesctce.in/" className="text-gray-500 hover:text-white text-sm font-medium transition-colors">Home</a></li>
                                <li><a href="https://istesctce.in/events" className="text-gray-500 hover:text-white text-sm font-medium transition-colors">Events</a></li>
                                <li><a href="https://istesctce.in/team" className="text-gray-500 hover:text-white text-sm font-medium transition-colors">Execom</a></li>
                            </ul>
                        </div>

                        {/* Column 2 */}
                        <div className="space-y-6">
                            <h3 className="text-base font-black text-white tracking-wide">More</h3>
                            <ul className="space-y-4">
                                <li><Link href="/dashboard" className="text-gray-500 hover:text-white text-sm font-medium transition-colors">Mentron Forums</Link></li>
                                <li><a href="mailto:istesctce@gmail.com" className="text-gray-500 hover:text-white text-sm font-medium transition-colors">Contact</a></li>
                                <li><a href="https://istesctce.in/membership" className="text-gray-500 hover:text-white text-sm font-medium transition-colors">Join ISTE</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-600">
                    <p>© 2025 ISTE SCTCE. All rights reserved.</p>
                    <p>Designed & Developed with <span className="text-purple-500 text-sm">💜</span> by ISTE Tech Team</p>
                </div>
            </div>
        </footer>
    )
}
