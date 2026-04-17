'use server'

import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function applyToProject(formData: FormData) {
    const supabase = await createClient()

    const projectId = formData.get('project_id') as string
    const file = formData.get('cv') as File

    if (!file || file.size === 0) {
        redirect(`/projects/${projectId}?error=${encodeURIComponent('Please upload your CV.')}`)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // 1. Prepare and Compress CV
    const buffer = Buffer.from(await file.arrayBuffer())
    const { compressFile } = await import('@/app/lib/utils/compression')
    const compressedBuffer = await compressFile(buffer)

    // Folder structure: applicant_id/timestamp-filename
    const fileName = `${user.id}/${Date.now()}-${file.name}.gz`
    const { error: uploadError } = await supabase.storage
        .from('cv_bucket')
        .upload(fileName, compressedBuffer, {
            contentType: file.type,
            cacheControl: '3600'
        })

    if (uploadError) {
        console.error('CV Upload error:', uploadError)
        redirect(`/projects/${projectId}?error=${encodeURIComponent(uploadError.message)}`)
    }

    // 2. Point to our decompression API route
    const fileUrl = `/api/files/cv_bucket/${fileName}`

    const { error: insertError } = await supabase
        .from('project_applications')
        .insert({
            project_id: projectId,
            applicant_id: user.id,
            cv_url: fileUrl,
        })

    if (insertError) {
        console.error('Application error:', insertError)
        // Cleanup storage if database insert fails
        await supabase.storage.from('cv_bucket').remove([fileName])
        redirect(`/projects/${projectId}?error=${encodeURIComponent(insertError.message)}`)
    }

    redirect('/projects?success=true')
}
