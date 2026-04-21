import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'You must be logged in to upload notes.' }, { status: 401 })
    }

    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
    }

    const title       = formData.get('title') as string
    const description = formData.get('description') as string
    const department  = formData.get('department') as string  // dept code (Y2-4)
    const groups      = formData.getAll('groups') as string[] // group codes (Y1)
    const year        = formData.get('year') as string
    const semester    = formData.get('semester') as string    // e.g. 'S3'
    const subject     = formData.get('subject') as string     // exact subject name
    const fileKey     = formData.get('fileKey') as string     // The R2 key provided by the client
    const folderId    = formData.get('folder_id') as string | null  // optional custom folder

    if (!fileKey) {
        return NextResponse.json({ error: 'Missing file reference (Direct-to-R2).' }, { status: 400 })
    }

    if (!semester || !subject) {
        return NextResponse.json({ error: 'Missing required metadata.' }, { status: 400 })
    }

    const fileUrl = `/api/files/${fileKey}`

    const yearNum = parseInt(year)
    const isFirstYear = yearNum === 1

    const basePayload: Record<string, any> = {
        title,
        description,
        year: yearNum,
        semester,
        subject,
        file_url: fileUrl,
        profile_id: user.id,
    }

    if (folderId && folderId.trim() !== '') {
        basePayload.folder_id = folderId.trim()
    }

    let insertError
    let redirectUrl: string

    if (isFirstYear && groups.length > 0) {
        // Insert for multiple groups
        const payloads = groups.map(g => ({
            ...basePayload,
            department: g
        }))
        const { error } = await supabase.from('notes').insert(payloads)
        insertError = error
        redirectUrl = `/notes/year/1/group/${groups[0]}/${semester}`
    } else {
        // Insert for single department
        basePayload.department = department
        const { error } = await supabase.from('notes').insert(basePayload)
        insertError = error
        redirectUrl = `/notes/year/${yearNum}/dept/${department}/${semester}`
    }

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Purge cache for all affected pages
    revalidatePath('/notes', 'layout')
    revalidatePath('/dashboard', 'page')
    if (isFirstYear && groups.length > 0) {
        groups.forEach(g => {
            revalidatePath(`/notes/year/1/group/${g}/${semester}`, 'page')
        })
    } else {
        revalidatePath(redirectUrl, 'page')
    }

    return NextResponse.json({ redirect: redirectUrl })
}
