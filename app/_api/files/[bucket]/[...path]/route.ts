import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ bucket: string; path: string[] }> }
) {
    const { bucket, path } = await params
    const filePath = path.join('/')
    const supabase = await createClient()

    // 1. Download file from R2 Storage
    const { s3Client, BUCKET_NAME } = await import('@/app/lib/s3')
    const { GetObjectCommand } = await import('@aws-sdk/client-s3')

    let data: any
    try {
        const response = await s3Client.send(new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `${bucket}/${filePath}`,
        }))
        data = response.Body
    } catch (error: any) {
        console.error('File Fetch error:', error)
        return new NextResponse('File not found', { status: 404 })
    }

    if (!data) {
        return new NextResponse('File not found', { status: 404 })
    }

    // 2. Convert to ArrayBuffer -> Buffer (transformToByteArray available in recent AWS SDK)
    const buffer = Buffer.from(await data.transformToByteArray())

    // 3. Determine Content-Type based on extension (simple approach)
    const ext = filePath.split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'

    // Map common extensions to content types
    const mimeMap: Record<string, string> = {
        'webp': 'image/webp',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'pdf': 'application/pdf',
        'zip': 'application/zip',
        'mp4': 'video/mp4',
        'mov': 'video/quicktime',
        'mp3': 'audio/mpeg',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    }

    if (ext && mimeMap[ext]) {
        contentType = mimeMap[ext]
    } else if (filePath.includes('marketplace')) {
        contentType = 'image/webp'
    }

    // 4. Return the file
    // Removed 'Content-Encoding': 'gzip' as we now skip compression for speed
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    })
}
