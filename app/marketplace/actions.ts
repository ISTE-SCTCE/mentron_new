'use server'

import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createMarketplaceItem(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = (formData.get('description') as string) || ''
    const price = parseFloat(formData.get('price') as string)
    const category = (formData.get('category') as string) || 'other'
    const condition = (formData.get('condition') as string) || 'used'
    const image = formData.get('image') as File

    if (!image || image.size === 0) {
        redirect(`/marketplace/new?error=${encodeURIComponent('Please upload an image for your item.')}`)
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/login')
    }

    // 1. Prepare and Compress Image
    const buffer = Buffer.from(await image.arrayBuffer())
    const { compressImage } = await import('@/app/lib/utils/compression')

    const webpBuffer = await compressImage(buffer)
    const fileName = `${Date.now()}-${image.name.split('.')[0]}.webp`
    const { s3Client, BUCKET_NAME } = await import('@/app/lib/s3')
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')

    try {
        await s3Client.send(new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: `marketplace_bucket/${fileName}`,
            Body: webpBuffer,
            ContentType: 'image/webp',
            CacheControl: 'max-age=31536000',
        }))
    } catch (e: any) {
        console.error('Image Upload error:', e)
        redirect(`/marketplace/new?error=${encodeURIComponent('Storage Error: ' + e.message)}`)
    }

    const fileUrl = `/api/files/marketplace_bucket/${fileName}`

    // 2. Insert record into 'marketplace_listings' (the live table used by Flutter & web)
    const { error: insertError } = await supabase
        .from('marketplace_listings')
        .insert({
            title,
            description,
            price,
            category,
            condition,
            images: [fileUrl],
            seller_id: user.id,
            status: 'live',
        })

    if (insertError) {
        console.error('Marketplace Insert error:', insertError)
        redirect(`/marketplace/new?error=${encodeURIComponent(insertError.message)}`)
    }

    revalidatePath('/marketplace')
    redirect('/marketplace?success=Listing created successfully')
}

export async function deleteMarketplaceListing(listingId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { error } = await supabase
        .from('marketplace_listings')
        .delete()
        .eq('id', listingId)

    if (error) throw error
    revalidatePath('/marketplace')
}
