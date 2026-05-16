'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, CalendarDays, FolderKanban, PlayCircle, Trophy } from 'lucide-react'
import { Footer } from './components/Footer'

const learningTiles = [
  { label: 'Notes', href: '/notes', icon: BookOpen, color: 'bg-[#efe8ff] text-[#5d22d7]' },
  { label: 'Events', href: '/events', icon: CalendarDays, color: 'bg-[#e9fbf3] text-[#059669]' },
  { label: 'Projects', href: '/projects', icon: FolderKanban, color: 'bg-[#fff4df] text-[#d97706]' },
  { label: 'Rankings', href: '/leaderboard', icon: Trophy, color: 'bg-[#fff0f4] text-[#e11d48]' },
]

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f6f2ff] text-[#241653]">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5d22d7] text-xl font-black text-white shadow-[0_14px_30px_rgba(93,34,215,0.26)]">M</div>
          <div>
            <p className="text-lg font-black">Mentron</p>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8a80aa]">Learning app</p>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/login" className="rounded-2xl px-4 py-2 text-sm font-black text-[#5d22d7]">
            Login
          </Link>
          <Link href="/signup" className="rounded-2xl bg-[#5d22d7] px-5 py-3 text-sm font-black text-white shadow-[0_14px_30px_rgba(93,34,215,0.24)]">
            Join
          </Link>
        </div>
      </nav>

      <main className="mx-auto grid min-h-[calc(100vh-88px)] w-full max-w-7xl grid-cols-1 items-center gap-8 px-5 pb-12 pt-5 md:grid-cols-[1.08fr_0.92fr] md:px-8">
        <section>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#ff8a24] shadow-[0_12px_30px_rgba(58,31,122,0.1)]">
            <PlayCircle size={15} />
            Learn, build, compete
          </div>
          <h1 className="max-w-2xl text-5xl font-black leading-[0.98] tracking-tight md:text-7xl">
            Your study space, redesigned like a learning app.
          </h1>
          <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-[#746b92]">
            Mentron now brings notes, events, projects, marketplace, and rankings into a mobile-first academic flow inspired by the BYJU'S redesign.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5d22d7] px-6 py-4 text-sm font-black text-white shadow-[0_18px_34px_rgba(93,34,215,0.25)] transition hover:-translate-y-0.5">
              Get started
              <ArrowRight size={17} />
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-4 text-sm font-black text-[#5d22d7] shadow-[0_14px_28px_rgba(58,31,122,0.1)]">
              Continue learning
            </Link>
          </div>
        </section>

        <section className="relative">
          <div className="absolute -left-6 top-10 h-28 w-28 rounded-full bg-[#10b981]/20 blur-2xl" />
          <div className="absolute -right-8 bottom-10 h-36 w-36 rounded-full bg-[#ff9f1c]/24 blur-2xl" />
          <div className="relative rounded-[36px] bg-white p-5 shadow-[0_30px_80px_rgba(58,31,122,0.18)]">
            <div className="rounded-[28px] bg-[#5d22d7] p-5 text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/62">Today</p>
              <h2 className="mt-2 text-3xl font-black">Data Structures</h2>
              <p className="mt-2 text-sm font-semibold text-white/72">Continue your notes, complete one practice task, and check the event calendar.</p>
              <div className="mt-5 h-2 rounded-full bg-white/20">
                <div className="h-full w-[68%] rounded-full bg-[#ffb11f]" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {learningTiles.map((tile) => {
                const Icon = tile.icon
                return (
                  <Link key={tile.href} href={tile.href} className="rounded-3xl border border-[#5d22d7]/10 bg-[#fbf9ff] p-4 transition hover:-translate-y-0.5 hover:bg-white">
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${tile.color}`}>
                      <Icon size={20} />
                    </div>
                    <p className="text-lg font-black">{tile.label}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
