import Link from 'next/link'
export default function PlatformHome() {
    return <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center gap-8 px-6 py-16">
        <div><p className="mb-3 text-sm font-semibold tracking-widest text-cyan-300">ISTE SCTCE</p>
            <h1 className="text-4xl font-bold sm:text-6xl">One community.<br/>Two ways to connect.</h1>
            <p className="mt-5 max-w-xl text-lg text-gray-300">Your membership, events and certificates in Mlynq. Notes, projects and learning in Mentron. One account for both.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
            <Link href="/mlynq" className="rounded-3xl bg-[#ebf3fc] p-8 text-[#111] transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-cyan-300">
                <span className="text-3xl">✦</span><h2 className="mt-5 text-3xl font-bold">Mlynq</h2>
                <p className="mt-3 text-[#3a5c7a]">ISTE membership, attendance, events and certificates.</p><p className="mt-8 font-semibold">Explore Mlynq →</p>
            </Link>
            <Link href="/mentron" className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-8 transition-transform hover:-translate-y-1 focus-visible:outline focus-visible:outline-cyan-300">
                <span className="text-3xl text-purple-300">◈</span><h2 className="mt-5 text-3xl font-bold">Mentron</h2>
                <p className="mt-3 text-gray-300">Study materials, projects, marketplace and academic tools.</p><p className="mt-8 font-semibold text-cyan-300">Explore Mentron →</p>
            </Link>
        </div><Link className="text-gray-300 underline" href="/login">Sign in to your shared account</Link>
    </main>
}
