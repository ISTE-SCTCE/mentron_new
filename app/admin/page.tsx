import { createClient } from '@/app/lib/supabase/server'
import { logout } from '@/app/login/actions'
import Link from 'next/link'

export default async function AdminPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

    return (
        <div className="min-h-screen pt-20 md:pt-32 pb-20 px-8 max-w-[1800px] mx-auto text-[#ededed]">
            <div className="max-w-[1800px] mx-auto">
                <header className="flex justify-between items-center mb-12">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="text-gray-400 hover:text-white transition-all">
                            ← Back
                        </Link>
                        <h1 className="text-4xl font-bold tracking-tight text-purple-500">Admin Panel</h1>
                    </div>
                    <form action={logout}>
                        <button className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-lg transition-all">
                            Logout
                        </button>
                    </form>
                </header>

                <section className="bg-[#171717] p-8 rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/5">
                    <h2 className="text-2xl font-semibold mb-6">Executive Overview</h2>
                    <p className="text-gray-400 mb-8">
                        Welcome, {profile?.full_name}. This area is restricted to Executive and Core members.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Members</p>
                            <p className="text-2xl font-mono text-purple-400">--</p>
                        </div>
                        <div className="p-4 bg-[#0a0a0a] rounded-xl border border-white/5">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Pending Requests</p>
                            <p className="text-2xl font-mono text-purple-400">--</p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    )
}
