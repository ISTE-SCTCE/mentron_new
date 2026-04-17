import Link from 'next/link'
import { logout } from '@/app/login/actions'

const SOCIETIES = [
    {
        name: "SWaS",
        full: "Software as a Service",
        desc: "The premier coding and software development community. Focusing on modern stacks, open source, and building products.",
        icon: "💻",
        color: "blue"
    },
    {
        name: "MECH",
        full: "Mechanical Society",
        desc: "Exploring the world of robotics, automotive engineering, and thermal sciences. Hands-on projects and design workshops.",
        icon: "⚙️",
        color: "purple"
    },
    {
        name: "BIOTECH",
        full: "Life Sciences Forum",
        desc: "Bridging biology and technology. Investigating bioinformatics, genetics, and pharmaceutical innovations.",
        icon: "🧬",
        color: "emerald"
    },
]

export default function SocietiesPage() {
    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-16">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest">
                            ← Dashboard
                        </Link>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Communities</p>
                            <h1 className="text-5xl font-black tracking-tighter text-white">Sub-Societies</h1>
                        </div>
                    </div>
                    <form action={logout}>
                        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all border border-red-500/20">
                            Logout
                        </button>
                    </form>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {SOCIETIES.map((soc, index) => (
                        <div
                            key={index}
                            className="glass glass-hover p-10 rounded-[3.5rem] flex flex-col group relative overflow-hidden"
                        >
                            <div className={`absolute top-0 right-0 p-8 opacity-10 blur-xl group-hover:blur-none transition-all duration-700`}>
                                <span className="text-9xl">{soc.icon}</span>
                            </div>

                            <div className="text-5xl mb-8 group-hover:scale-110 transition-transform duration-500">{soc.icon}</div>

                            <h2 className="text-4xl font-black text-white mb-2 leading-none group-hover:text-glow transition-all">
                                {soc.name}
                            </h2>
                            <p className={`text-${soc.color}-500 text-[10px] font-black uppercase tracking-[0.3em] mb-6`}>
                                {soc.full}
                            </p>

                            <p className="text-gray-400 font-medium leading-relaxed mb-10 line-clamp-4">
                                {soc.desc}
                            </p>

                            <button className="mt-auto glass glass-hover px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] text-white uppercase group-hover:bg-white group-hover:text-black transition-all">
                                View Community →
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
