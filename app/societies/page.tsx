import Link from 'next/link'
import { logout } from '@/app/login/actions'

const SOCIETIES = [
    {
        name: "SWaS",
        full: "Software as a Service",
        desc: "The premier coding and software development community. Focusing on modern stacks, open source, and building products.",
        logo: "https://istesctce.in/images/Logos/Swas-logo.png",
        color: "blue",
        href: "https://istesctce.in/forum-swas.html"
    },
]

export default function SocietiesPage() {
    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed]">
            <div className="max-w-[1800px] mx-auto">
                <header className="flex flex-col items-center text-center mb-16 md:mb-24">
                    <Link href="/dashboard" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest mb-6 block">
                        ← Dashboard
                    </Link>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black tracking-[0.4em] text-blue-500 uppercase">Communities</p>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white">Sub-Societies</h1>
                    </div>
                </header>

                <div className="flex flex-col items-center">
                    {SOCIETIES.map((soc, index) => (
                        <div key={index} className="w-full max-w-3xl">
                            <a
                                href={soc.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="glass glass-hover p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] flex flex-col items-center text-center group relative overflow-hidden transition-all hover:scale-[1.01]"
                            >
                                {/* Background glow */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 blur-[120px] rounded-full group-hover:bg-blue-500/20 transition-all duration-1000" />
                                
                                <div className="relative z-10 w-full mb-10 md:mb-16 transform group-hover:scale-105 transition-transform duration-700">
                                    <img 
                                        src={soc.logo} 
                                        alt={soc.name}
                                        className="h-24 md:h-32 mx-auto object-contain drop-shadow-[0_0_30px_rgba(59,130,246,0.3)] filter brightness-110"
                                    />
                                    <p className="text-blue-500 text-[10px] md:text-xs font-black uppercase tracking-[0.4em] mt-8 text-glow">
                                        {soc.full}
                                    </p>
                                </div>

                                <p className="relative z-10 text-gray-400 font-medium leading-relaxed text-sm md:text-lg mb-12 max-w-xl mx-auto">
                                    {soc.desc}
                                </p>

                                <div className="relative z-10 flex flex-col md:flex-row gap-4 items-center w-full justify-center">
                                    <span className="glass glass-hover px-10 py-4 rounded-2xl text-xs font-black tracking-[0.2em] text-white uppercase group-hover:bg-white group-hover:text-black transition-all border-white/10">
                                        Join SWaS Community →
                                    </span>
                                </div>
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
