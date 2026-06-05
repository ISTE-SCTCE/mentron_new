import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/app/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
    const { user, supabase } = await getAuthUser(request)

    if (!user || !supabase) {
        return NextResponse.json({ error: 'You must be logged in to upload notes.' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    let title: string
    let description: string
    let department: string
    let groups: string[] = []
    let year: string
    let semester: string
    let subject: string
    let fileKey: string
    let folderId: string | null = null

    if (contentType.includes('application/json')) {
        try {
            const body = await request.json()
            title = body.title || ''
            description = body.description || ''
            department = body.department || ''
            groups = body.groups || []
            year = body.year ? body.year.toString() : ''
            semester = body.semester || ''
            subject = body.subject || ''
            fileKey = body.fileKey || ''
            folderId = body.folder_id || null
        } catch {
            return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
        }
    } else {
        let formData: FormData
        try {
            formData = await request.formData()
        } catch {
            return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
        }
        title = formData.get('title') as string || ''
        description = formData.get('description') as string || ''
        department = formData.get('department') as string || ''
        groups = formData.getAll('groups') as string[] || []
        year = formData.get('year') as string || ''
        semester = formData.get('semester') as string || ''
        subject = formData.get('subject') as string || ''
        fileKey = formData.get('fileKey') as string || ''
        folderId = formData.get('folder_id') as string | null
    }

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
