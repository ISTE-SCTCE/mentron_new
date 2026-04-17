'use server'

import { createClient } from '@/app/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createMarketplaceItem(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const price = parseFloat(formData.get('price') as string)
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
    const { compressImage, compressFile } = await import('@/app/lib/utils/compression')

    // Convert to WebP and then Gzip
    const webpBuffer = await compressImage(buffer)
    const compressedBuffer = await compressFile(webpBuffer)

    const fileName = `${user.id}/${Date.now()}-${image.name.split('.')[0]}.webp`

    const { error: uploadError } = await supabase.storage
        .from('marketplace_bucket')
        .upload(fileName, compressedBuffer, {
            contentType: 'image/webp',
            cacheControl: '3600',
            upsert: false
        })

    if (uploadError) {
        console.error('Image Upload error:', uploadError)
        redirect(`/marketplace/new?error=${encodeURIComponent(uploadError.message)}`)
    }

    // 2. Point to our decompression API route
    const fileUrl = `/api/files/marketplace_bucket/${fileName}`

    // 3. Ensure profile exists (Self-healing mechanism)
    const { data: profile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

    if (profileCheckError || !profile) {
        console.log('Profile missing, attempting self-healing...')
        const meta = user.user_metadata

        // Generate a unique fallback roll number if metadata is missing to avoid FK/Unique violations
        const fallbackRoll = `TEMP-${user.id.slice(0, 8)}`

        // Robust Year Parsing: Extract digits from "2nd year", "Year 3", etc.
        const yearRaw = meta?.year?.toString() || '0'
        const yearValue = parseInt(yearRaw.replace(/\D/g, '')) || 0

        const { error: healError } = await supabase.from('profiles').insert({
            id: user.id,
            full_name: meta?.full_name || 'Anonymous',
            roll_number: meta?.roll_number || fallbackRoll,
            department: meta?.department || 'Other',
            year: yearValue, // Now sending an integer
            role: meta?.role || 'member'
        })

        if (healError) {
            console.error('Profile healing failed:', healError)
            // If profile healing fails, we must stop and report the error
            redirect(`/marketplace/new?error=${encodeURIComponent('Profile Sync Error: ' + healError.message)}`)
        }
    }

    // 4. Insert record into 'marketplace_items'
    const { error: insertError } = await supabase
        .from('marketplace_items')
        .insert({
            title,
            description,
            price,
            image_url: fileUrl,
            seller_id: user.id
        })

    if (insertError) {
        console.error('Marketplace Insert error:', insertError)
        // Cleanup storage if database insert fails
        await supabase.storage.from('marketplace_bucket').remove([fileName])
        redirect(`/marketplace/new?error=${encodeURIComponent(insertError.message)}`)
    }

    redirect('/marketplace?success=Listing created successfully')
}
