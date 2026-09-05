import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/app/lib/supabase/server'
import { s3Client, BUCKET_NAME } from '@/app/lib/s3'
import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

export async function POST(request: NextRequest) {
    const { user, supabase } = await getAuthUser(request)

    if (!user || !supabase) {
        return NextResponse.json({ error: 'You must be logged in to list an item.' }, { status: 401 })
    }

    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
    }

    const title       = formData.get('title') as string
    const description = formData.get('description') as string
    const price       = parseFloat(formData.get('price') as string)
    const file        = formData.get('image') as File | null

    if (!title || isNaN(price)) {
        return NextResponse.json({ error: 'Title and price are required.' }, { status: 400 })
    }

    let imageUrl = 'https://source.unsplash.com/random/400x300?book,study' // default
    let fileName = ''

    if (file && file.size > 0) {
        // Here we could compress with Sharp to WebP if needed, but for now we'll just upload directly based on original
        // Wait, since we are dealing with images, compressing is a good idea. But let's keep it simple for now or use sharp.
        // It's a next.js app so we have jimp / sharp. 
        const buffer = Buffer.from(await file.arrayBuffer())
        const ext = 'webp'
        fileName = `marketplace_${Date.now()}.${ext}`

        // Let's compress it with the already existing compression utility?
        // Let's just use sharp or Jimp directly, or just upload directly for now to preserve compatibility 
        // Oh wait, `app/lib/utils/compression.ts` is only for PDFs/GZip! Let's just upload raw buffer.
        
        try {
            await s3Client.send(new PutObjectCommand({
                Bucket: BUCKET_NAME,
                Key: `marketplace_bucket/${fileName}`,
                Body: buffer,
                ContentType: file.type,
                CacheControl: 'max-age=31536000',
            }))
            imageUrl = `/api/files/marketplace_bucket/${fileName}`
        } catch (e: any) {
            return NextResponse.json({ error: 'Error uploading image: ' + e.message }, { status: 500 })
        }
    }

    const rawCategory = formData.get('category') as string
    const validCategories = ['textbook', 'electronics', 'project_components', 'stationery', 'other']
    const category = validCategories.includes(rawCategory) ? rawCategory : 'other'

    const rawCondition = formData.get('condition') as string
    const validConditions = ['new', 'like_new', 'used']
    const condition = validConditions.includes(rawCondition) ? rawCondition : 'used'

    const { error: insertError } = await supabase.from('marketplace_listings').insert({
        title,
        description: description || null,
        price,
        category,
        condition,
        images: imageUrl ? [imageUrl] : [],
        seller_id: user.id,
        status: 'pending_review',
    })

    if (insertError) {
        if (fileName) {
            await s3Client.send(new DeleteObjectCommand({
                Bucket: BUCKET_NAME,
                Key: `marketplace_bucket/${fileName}`,
            }))
        }
        return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ redirect: '/marketplace' })
}
