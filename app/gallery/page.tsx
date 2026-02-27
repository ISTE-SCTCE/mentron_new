import Link from 'next/link'
import { logout } from '@/app/login/actions'

const GALLERY_IMAGES = [
    { url: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=800", title: "Tech Talk 2024", tag: "Workshop" },
    { url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=800", title: "Hackathon SCTCE", tag: "Competition" },
    { url: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=800", title: "Ideation Lab", tag: "Innovation" },
    { url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800", title: "Team Building", tag: "Execom" },
    { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&q=80&w=800", title: "Annual Meet", tag: "Networking" },
    { url: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=800", title: "Workshop Series", tag: "Academic" },
]

export default function GalleryPage() {
    return (
        <div className="min-h-screen p-8 pt-32 text-[#ededed]">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-16">
                    <div className="flex items-center gap-8">
                        <Link href="/dashboard" className="text-gray-500 hover:text-white transition-all text-sm font-bold uppercase tracking-widest">
                            ← Dashboard
                        </Link>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black tracking-[0.3em] text-blue-500 uppercase">Flashbacks</p>
                            <h1 className="text-5xl font-black tracking-tighter text-white">Event Gallery</h1>
                        </div>
                    </div>
                    <form action={logout}>
                        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase transition-all border border-red-500/20">
                            Logout
                        </button>
                    </form>
                </header>

                <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
                    {GALLERY_IMAGES.map((img, index) => (
                        <div
                            key={index}
                            className="glass glass-hover rounded-[2.5rem] overflow-hidden group break-inside-avoid relative"
                        >
                            <img src={img.url} alt={img.title} className="w-full h-auto grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 p-8 flex flex-col justify-end">
                                <span className="text-blue-400 text-[10px] font-black tracking-widest uppercase mb-1">{img.tag}</span>
                                <h3 className="text-white text-2xl font-black tracking-tight">{img.title}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-24 py-32 text-center glass rounded-[4rem] border-dashed">
                    <p className="text-gray-500 text-lg font-bold tracking-widest uppercase">Capturing Moments of Innovation</p>
                    <p className="text-xs text-gray-600 font-black mt-2 uppercase tracking-[0.3em]">Join our next event to be part of the story</p>
                </div>
            </div>
        </div>
    )
}
