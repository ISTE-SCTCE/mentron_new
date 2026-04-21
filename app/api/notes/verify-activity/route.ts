import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { s3Client, BUCKET_NAME } from '@/app/lib/s3'
import { HeadObjectCommand } from '@aws-sdk/client-s3'

/**
 * POST /api/notes/verify-activity
 * Accepts a list of note IDs, checks each file exists in R2,
 * and returns only the IDs that have valid files.
 */
export async function POST(request: NextRequest) {
    const supabase = await createClient()

    const body = await request.json()
    const noteIds: string[] = body.noteIds ?? []

    if (noteIds.length === 0) {
        return NextResponse.json({ validIds: [] })
    }

    // Fetch file_url for these note IDs
    const { data: notes } = await supabase
        .from('notes')
        .select('id, file_url')
        .in('id', noteIds)

    if (!notes || notes.length === 0) {
        return NextResponse.json({ validIds: [] })
    }

    // Check each file in R2 in parallel (HEAD request — no download)
    const validIds: string[] = []

    await Promise.all(notes.map(async (note) => {
        if (!note.file_url) return

        // file_url format: /api/files/notes_bucket/<uuid>.<ext>
        // Strip the /api/files/ prefix to get the R2 key
        const key = note.file_url.replace(/^\/api\/files\//, '')

        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: BUCKET_NAME,
                Key: key,
            }))
            // If HEAD succeeds, file exists
            validIds.push(note.id)
        } catch {
            // File doesn't exist in R2 — skip it
            console.warn(`Note ${note.id} has missing R2 file: ${key}`)
        }
    }))

    return NextResponse.json({ validIds })
}
