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

    // Convert WebP images (we compress everything to WebP)
    if (ext === 'webp' || filePath.includes('marketplace')) {
        contentType = 'image/webp'
    } else if (ext === 'pdf') {
        contentType = 'application/pdf'
    } else if (ext === 'zip') {
        contentType = 'application/zip'
    }

    // 4. Return the file with Gzip encoding header
    // The browser will automatically decompress if it sees Content-Encoding: gzip
    return new NextResponse(buffer, {
        headers: {
            'Content-Type': contentType,
            'Content-Encoding': 'gzip',
            'Cache-Control': 'public, max-age=31536000, immutable',
        },
    })
}
