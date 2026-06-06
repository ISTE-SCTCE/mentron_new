import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { NotificationBell } from '@/app/components/NotificationBell'
import { ThemeSwitcher } from '@/app/components/ThemeSwitcher'
import { ContributionsView } from './ContributionsView'

export default async function ContributionsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch approved project applications with project and profile info
    const { data: contributions, error } = await supabase
        .from('project_applications')
        .select(`
            id,
            created_at,
            status,
            projects (
                id,
                title,
                description,
                category,
                role,
                duration,
                created_at,
                profiles (
                    full_name
                )
            )
        `)
        .eq('profile_id', user.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Fetch contributions error:', error)
    }

    return (
        <div className="min-h-screen p-4 md:p-8 pt-20 md:pt-32 text-[#ededed]">
            <div className="max-w-[1800px] mx-auto">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Link 
                                href="/projects" 
                                className="text-[10px] font-black tracking-widest text-blue-500 uppercase hover:text-white transition-colors"
                            >
                                ← Projects
                            </Link>
                            <span className="text-[10px] text-gray-700">/</span>
                            <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">Contributions</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white">My Contributions</h1>
                        <p className="text-gray-500 text-sm font-medium mt-2">
                            Track your project milestones and collaboration achievements.
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeSwitcher />
                        <NotificationBell userId={user.id} />
                    </div>
                </header>

                <ContributionsView contributions={(contributions ?? []) as any} />
            </div>
        </div>
    )
}
