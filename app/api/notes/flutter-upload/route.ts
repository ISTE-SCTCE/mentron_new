import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { s3Client, BUCKET_NAME } from '@/app/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

export const maxDuration = 60 // Allow up to 60s for large file uploads

export async function POST(request: NextRequest) {
    // ── AUTH: Support both cookie-based (web) and Bearer token (Flutter) ──
    let userId: string | null = null

    const authHeader = request.headers.get('authorization') || request.headers.get('x-supabase-auth')
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader

    if (bearerToken) {
        // Flutter path: validate the access token directly
        const anonClient = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        const { data: { user }, error } = await anonClient.auth.getUser(bearerToken)
        if (!error && user) {
            userId = user.id
        }
    }

    if (!userId) {
        // Fallback: cookie-based auth (web)
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) userId = user.id
    }

    if (!userId) {
        return NextResponse.json({ error: 'You must be logged in to upload notes.' }, { status: 401 })
    }

    // Use anon client with service role for DB insert (bypasses RLS issues with token auth)
    const db = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )


    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
    }

    const title       = formData.get('title') as string
    const description = formData.get('description') as string
    const department  = formData.get('department') as string
    const year        = formData.get('year') as string
    const semester    = formData.get('semester') as string
    const subject     = formData.get('subject') as string
    const folderId    = formData.get('folder_id') as string | null
    const file        = formData.get('file') as File | null

    if (!title || !year || !semester || !subject || !department) {
        return NextResponse.json({ error: 'Missing required metadata fields.' }, { status: 400 })
    }

    if (!file || file.size === 0) {
        return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    // ── STEP 1: Upload file to Cloudflare R2 ──
    const ext = file.name.split('.').pop() ?? 'pdf'
    const fileKey = `notes_bucket/${randomUUID()}.${ext}`

    try {
        const fileBuffer = Buffer.from(await file.arrayBuffer())
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: fileKey,
            Body: fileBuffer,
            ContentType: file.type || 'application/octet-stream',
        }))
    } catch (err: any) {
        console.error('R2 Upload error:', err)
        return NextResponse.json({ error: 'Failed to upload file to storage.' }, { status: 500 })
    }

    // ── STEP 2: Save note metadata to Supabase ──
    const fileUrl = `/api/files/${fileKey}`

    const insertPayload: Record<string, any> = {
        title,
        description: description || null,
        department,
        year: parseInt(year),
        semester,
        subject,
        file_url: fileUrl,
        profile_id: userId,
    }

    // Only include folder_id if provided and non-empty
    if (folderId && folderId.trim() !== '') {
        insertPayload.folder_id = folderId.trim()
    }

    const { error: insertError } = await db.from('notes').insert(insertPayload)

    if (insertError) {
        console.error('DB insert error:', insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // ── STEP 3: Revalidate caches ──
    const yearNum = parseInt(year)
    revalidatePath('/notes', 'layout')
    revalidatePath('/dashboard', 'page')
    if (yearNum === 1) {
        revalidatePath(`/notes/year/1/group/${department}/${semester}`, 'page')
    } else {
        revalidatePath(`/notes/year/${yearNum}/dept/${department}/${semester}`, 'page')
    }

    return NextResponse.json({ success: true, message: 'Note uploaded successfully.' })
}
