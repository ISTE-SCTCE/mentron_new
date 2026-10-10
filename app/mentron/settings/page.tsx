import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'
import { ProfileCard } from '@/app/components/ProfileCard'
import { getDepartmentFromRollNumber } from '@/app/lib/utils/departmentMapper'

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

    // Dashboard Data logic for ProfileCard
    const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Member'
    const displayRole = profile?.role || user?.user_metadata?.role || 'member'
    const displayRoll = profile?.roll_number || user?.user_metadata?.roll_number || 'N/A'
    const displayYear = profile?.year || user?.user_metadata?.year || 'N/A'
    
    const identifiedDept = getDepartmentFromRollNumber(displayRoll)
    const displayDept = identifiedDept !== 'Other'
        ? identifiedDept
        : (profile?.department || user?.user_metadata?.department || 'Not Assigned')

    return (
        <div className="flex flex-col min-h-screen text-[#ededed] pt-20 md:pt-32 w-full max-w-[1700px] mx-auto px-4 md:px-8">
            <div className="max-w-4xl w-full mx-auto space-y-12 flex-1">

                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">Settings</h1>
                    <div className="h-[2px] w-24 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full mx-auto" />
                </div>

                {/* Centralized Profile Card */}
                <div className="flex justify-center">
                    <ProfileCard 
                        displayName={displayName}
                        displayRole={displayRole}
                        displayDept={displayDept}
                        displayRoll={displayRoll}
                        displayYear={displayYear}
                        className="w-full max-w-md shadow-2xl shadow-cyan-500/5"
                    />
                </div>

                {/* Client component for interactive sections */}
                <SettingsClient profile={profile} userEmail={user.email || ''} />

            </div>
        </div>
    )
}
