'use server'

import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getPermissions } from '@/app/lib/utils/coreAuth'

export async function createProject(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const cv_required = formData.get('cv_required') === 'true'

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/admin/projects?error=Unauthorized')

    // Check if user is exec/admin for auto-approval
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAutoApprove = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'

    const { error } = await supabase
        .from('projects')
        .insert({
            title,
            description,
            cv_required,
            posted_by: user.id,
            is_approved: isAutoApprove // Auto approve leadership projects
        })

    if (error) {
        console.error('Create project error:', error)
        redirect(`/admin/projects?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/admin/projects')
    revalidatePath('/projects')
    redirect('/admin/projects')
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

export async function approveProject(formData: FormData) {
    const supabase = await createClient()
    const projectId = formData.get('project_id') as string

    if (!projectId) redirect('/admin/projects?error=Missing project id')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/admin/projects?error=Unauthorized')

    // Check permission (must be exec/core/admin)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    const isAuthorized = profile?.role === 'exec' || profile?.role === 'core' || profile?.role === 'admin'

    if (!isAuthorized) redirect('/admin/projects?error=Unauthorized')

    const { error } = await supabase
        .from('projects')
        .update({ is_approved: true })
        .eq('id', projectId)

    if (error) {
        console.error('Approve project error:', error)
        redirect(`/admin/projects?error=${encodeURIComponent(error.message)}`)
    }

    revalidatePath('/admin/projects')
    revalidatePath('/projects')
    redirect('/admin/projects?success=Project approved')
}

