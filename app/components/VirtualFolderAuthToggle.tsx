'use client'

import { useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'
import { toast } from 'react-hot-toast'

interface Props {
    subjectName: string
    department: string
    year: string
    semester: string
    initialRequiresAuth: boolean
}

export function VirtualFolderAuthToggle({
    subjectName,
    department,
    year,
    semester,
    initialRequiresAuth
}: Props) {
    const [requiresAuth, setRequiresAuth] = useState(initialRequiresAuth)
    const [isUpdating, setIsUpdating] = useState(false)
    const supabase = createClient()

    const toggleAuth = async () => {
        setIsUpdating(true)
        const newValue = !requiresAuth
        try {
            // Check if settings row exists
            const { data: existing } = await supabase
                .from('note_folders')
                .select('id')
                .eq('subject', subjectName)
                .eq('department', department)
                .eq('year', year)
                .eq('semester', semester)
                .eq('name', 'Virtual Settings')
                .maybeSingle()

            if (existing) {
                const { error } = await supabase
                    .from('note_folders')
                    .update({ requires_auth: newValue })
                    .eq('id', existing.id)
                if (error) throw error
            } else {
                const { data: { user } } = await supabase.auth.getUser()
                const { error } = await supabase
                    .from('note_folders')
                    .insert({
                        name: 'Virtual Settings',
                        subject: subjectName,
                        department,
                        year,
                        semester,
                        created_by: user?.id,
                        requires_auth: newValue
                    })
                if (error) throw error
            }
            
            setRequiresAuth(newValue)
            toast.success(`Authorization requirement ${newValue ? 'enabled' : 'disabled'}`)
        } catch (error: any) {
            toast.error(error.message || 'Failed to update settings')
        } finally {
            setIsUpdating(false)
        }
    }

    return (
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2 mt-4 inline-flex">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                Exec Only
            </span>
            <span className="text-gray-600">|</span>
            <label className="text-[10px] font-black tracking-widest text-gray-300 uppercase cursor-pointer select-none">
                Require ISTE ID
            </label>
            <div 
                onClick={isUpdating ? undefined : toggleAuth}
                className={`w-10 h-5 flex items-center rounded-full p-1 cursor-pointer transition-colors ${isUpdating ? 'opacity-50' : ''} ${requiresAuth ? 'bg-pink-600' : 'bg-gray-700'}`}
            >
                <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform ${requiresAuth ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
        </div>
    )
}
