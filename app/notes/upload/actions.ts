'use server'

import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function uploadNote(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const department = formData.get('department') as string
    const year = formData.get('year') as string
    const file = formData.get('file') as File

    if (!file || file.size === 0) {
        redirect(`/notes/upload?error=${encodeURIComponent('Please select a file to upload.')}`)
    }

    // 0. Get the current user
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/notes/upload?error=${encodeURIComponent('You must be logged in to upload notes.')}`)
    }

    // 1. Prepare and Compress File
    const buffer = Buffer.from(await file.arrayBuffer())
    const { compressFile } = await import('@/app/lib/utils/compression')
    const compressedBuffer = await compressFile(buffer)

    const fileName = `${Date.now()}-${file.name}.gz`
    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('notes_bucket')
        .upload(fileName, compressedBuffer, {
            contentType: file.type,
            cacheControl: '3600'
        })

    if (uploadError) {
        console.error('Upload error:', uploadError)
        redirect(`/notes/upload?error=${encodeURIComponent(uploadError.message)}`)
    }

    // 2. Point to our decompression API route
    const fileUrl = `/api/files/notes_bucket/${fileName}`

    // 3. Insert record into 'notes' table
    const { error: insertError } = await supabase
        .from('notes')
        .insert({
            title,
            description,
            department,
            year,
            file_url: fileUrl,
            profile_id: user.id
        })

    if (insertError) {
        console.error('Insert error:', insertError)
        // Optionally delete the uploaded file if DB insert fails
        await supabase.storage.from('notes_bucket').remove([fileName])
        redirect(`/notes/upload?error=${encodeURIComponent(insertError.message)}`)
    }

    redirect('/notes?success=Note uploaded successfully')
}
