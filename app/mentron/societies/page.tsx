import { SocietyCard } from './SocietyCard'

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
                <header className="flex flex-col items-center text-center mb-10 sm:mb-16 md:mb-20">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black tracking-[0.4em] text-cyan-400 uppercase">Communities</p>
                        <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tighter text-white">Sub-Societies</h1>
                        <p className="text-gray-400 text-xs sm:text-sm font-medium max-w-md">Specialized student interest groups driving technical innovation.</p>
                    </div>
                </header>

                <div className="flex flex-col items-center gap-8">
                    {SOCIETIES.map((soc, index) => (
                        <SocietyCard key={index} soc={soc} index={index} />
                    ))}
                </div>
            </div>
        </div>
    )
}
