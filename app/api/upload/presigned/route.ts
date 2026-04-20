import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { s3Client, BUCKET_NAME } from '@/app/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { fileName, fileType, bucketFolder } = await request.json()

        if (!fileName || !fileType) {
            return NextResponse.json({ error: 'Filename and fileType are required' }, { status: 400 })
        }

        // Default folder to notes_bucket if not specified
        const folder = bucketFolder || 'notes_bucket'
        
        // Clean filename: remove non-alphanumeric chars (except . and -) and replace spaces with underscores
        const cleanName = fileName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9.\-_]/g, '')
        const key = `${folder}/${Date.now()}-${cleanName}`

        const command = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        })

        // Generated URL is valid for 5 minutes
        const url = await getSignedUrl(s3Client, command, { expiresIn: 300 })

        return NextResponse.json({ url, key })
    } catch (error: any) {
        console.error('Presigned URL error:', error)
        return NextResponse.json({ error: error.message || 'Failed to generate presigned URL' }, { status: 500 })
    }
}
