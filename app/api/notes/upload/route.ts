import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

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
    const department  = formData.get('department') as string  // dept code or group code (Y1)
    const year        = formData.get('year') as string
    const semester    = formData.get('semester') as string    // e.g. 'S3'
    const subject     = formData.get('subject') as string     // exact subject name
    const file        = formData.get('file') as File
    const folderId    = formData.get('folder_id') as string | null  // optional custom folder

    if (!file || file.size === 0) {
        return NextResponse.json({ error: 'Please select a file to upload.' }, { status: 400 })
    }
    if (!semester || !subject) {
        return NextResponse.json({ error: 'Please select a semester and subject.' }, { status: 400 })
    }

    // Compress and upload the file
    const buffer = Buffer.from(await file.arrayBuffer())
    const { compressFile } = await import('@/app/lib/utils/compression')
    const compressedBuffer = await compressFile(buffer)
    const fileName = `${Date.now()}-${file.name}.gz`

    const { s3Client, BUCKET_NAME } = await import('@/app/lib/s3')
    const { PutObjectCommand, DeleteObjectCommand } = await import('@aws-sdk/client-s3')

    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `notes_bucket/${fileName}`,
            Body: compressedBuffer,
            ContentType: file.type,
            CacheControl: 'max-age=31536000',
        }))
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Error uploading file to storage.' }, { status: 500 })
    }

    const fileUrl = `/api/files/notes_bucket/${fileName}`

    const insertPayload: Record<string, any> = {
        title,
        description,
        department,
        year: parseInt(year),
        semester,
        subject,
        file_url: fileUrl,
        profile_id: user.id,
    }
    if (folderId && folderId.trim() !== '') {
        insertPayload.folder_id = folderId.trim()
    }

    const { error: insertError } = await supabase.from('notes').insert(insertPayload)

    if (insertError) {
        await s3Client.send(new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `notes_bucket/${fileName}`,
        }))
        return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Build redirect URL to the exact subject page
    const yearNum = parseInt(year)
    let redirectUrl: string
    if (yearNum === 1) {
        // group = department field for year 1 (A/B/C/D)
        redirectUrl = `/notes/year/1/group/${department}/${semester}`
    } else {
        redirectUrl = `/notes/year/${yearNum}/dept/${department}/${semester}`
    }

    return NextResponse.json({ redirect: redirectUrl })
}
