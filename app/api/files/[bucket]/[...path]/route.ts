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
        
        if (!data) {
            throw new Error('No body returned from R2')
        }

        // Convert to ArrayBuffer -> Buffer
        const buffer = Buffer.from(await data.transformToByteArray())

        // Determine Content-Type based on extension
        const ext = filePath.split('.').pop()?.toLowerCase()
        let contentType = 'application/octet-stream'
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

        return new NextResponse(buffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        })
    } catch (error: any) {
        console.warn('R2 Fetch failed, attempting Supabase Storage fallback:', error.message)
        try {
            const { data: supabaseFile, error: supabaseError } = await supabase
                .storage
                .from(bucket)
                .download(filePath)

            if (supabaseError || !supabaseFile) {
                throw new Error(supabaseError?.message || 'File not found in Supabase storage')
            }
            
            const arrayBuffer = await supabaseFile.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            
            const ext = filePath.split('.').pop()?.toLowerCase()
            let contentType = 'application/octet-stream'
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
            }

            return new NextResponse(buffer, {
                headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=31536000, immutable',
                },
            })
        } catch (fallbackError: any) {
            console.error('File Fetch error (both R2 and Supabase storage failed):', fallbackError.message)
            return new NextResponse('File not found', { status: 404 })
        }
    }
}
