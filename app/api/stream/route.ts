import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/app/lib/supabase/server'
import { s3Client, BUCKET_NAME } from '@/app/lib/s3'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * GET /api/stream?key=academy-lectures/filename.mp4
 *
 * Returns a short-lived (1 hour) presigned R2 GET URL for direct video streaming.
 * The browser then streams the video directly from R2 with full range-request support,
 * avoiding the memory-intensive proxy route.
 */
export async function GET(request: NextRequest) {
    const { user } = await getAuthUser(request)

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
        return NextResponse.json({ error: 'key parameter is required' }, { status: 400 })
    }

    try {
        const command = new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        })

        // Presigned GET URL valid for 1 hour — enough to watch a full video session
        const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

        return NextResponse.json({ url: signedUrl })
    } catch (error: any) {
        console.error('Stream presign error:', error)
        return NextResponse.json({ error: error.message || 'Failed to generate stream URL' }, { status: 500 })
    }
}
