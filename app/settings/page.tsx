import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Pass profile info to the client component
    return (
        <div className="flex flex-col min-h-screen text-[#ededed] pt-32 w-full max-w-[1700px] mx-auto px-4 md:px-8">
            <div className="max-w-4xl w-full mx-auto space-y-8 flex-1">

                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl font-black tracking-tighter mb-2">Settings</h1>
                    <div className="h-[2px] w-20 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full" />
                </div>

                {/* Client component for interactive sections */}
                <SettingsClient profile={profile} userEmail={user.email || ''} />

            </div>
        </div>
    )
}
