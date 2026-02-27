'use server'

import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string

    const { error } = await supabase
        .from('projects')
        .insert({
            title,
            description,
        })

    if (error) {
        console.error('Project creation error:', error)
        redirect(`/admin/projects?error=${encodeURIComponent(error.message)}`)
    }

    redirect('/admin/projects?success=Project created successfully')
}

export async function updateApplicationStatus(formData: FormData) {
    const supabase = await createClient()

    const applicationId = formData.get('application_id') as string
    const status = formData.get('status') as string

    const { error } = await supabase
        .from('project_applications')
        .update({ status })
        .eq('id', applicationId)

    if (error) {
        console.error('Update status error:', error)
        redirect(`/admin/projects?error=${encodeURIComponent(error.message)}`)
    }

    redirect('/admin/projects?success=Status updated')
}
