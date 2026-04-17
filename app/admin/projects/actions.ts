'use server'

import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createProject(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const cv_required = formData.get('cv_required') === 'true'

    const { error } = await supabase
        .from('projects')
        .insert({
            title,
            description,
            cv_required,
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

    const { data: updatedApp, error } = await supabase
        .from('project_applications')
        .update({ status })
        .eq('id', applicationId)
        .select(`
            *,
            projects (
                title
            )
        `)
        .single()

    if (error) {
        console.error('Update status error:', error)
        redirect(`/admin/projects?error=${encodeURIComponent(error.message)}`)
    }

    if (updatedApp && (status === 'approved' || status === 'rejected')) {
        const title = status === 'approved' ? 'Application Accepted 🎉' : 'Application Update'
        const message = status === 'approved' 
            ? `Your application for "${updatedApp.projects?.title}" has been accepted. The respective person will contact you soon.`
            : `Your application for "${updatedApp.projects?.title}" has been rejected. Thank you for your interest.`
            
        await supabase.from('notifications').insert({
            user_id: updatedApp.profile_id,
            title,
            message
        })
    }

    redirect('/admin/projects?success=Status updated')
}
