import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ bucket: string; path: string[] }> }
) {
    const { bucket, path } = await params
    const filePath = path.join('/')
    const supabase = await createClient()

    // 1. Download file from Supabase Storage
    const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath)

    if (error || !data) {
        console.error('File Fetch error:', error)
        return new NextResponse('File not found', { status: 404 })
    }

    // 2. Convert to ArrayBuffer -> Buffer
    const buffer = Buffer.from(await data.arrayBuffer())

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
