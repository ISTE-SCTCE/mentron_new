'use server'
import { createClient } from '@/app/lib/supabase/server'
import { isProduct, productHome } from '@/app/lib/platform/config'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
export async function signup(formData: FormData) {
    const client = await createClient()
    const intent = formData.get('product')
    const product = isProduct(intent) ? intent : 'mentron'
    const email = String(formData.get('email')??'').trim().toLowerCase()
    const password = String(formData.get('password')??'')
    const name = String(formData.get('full_name')??'').trim()
    const roll = String(formData.get('roll_number')??'').trim().toUpperCase()
    const branch = String(formData.get('department')??'').trim()
    const year = String(formData.get('year')??'').trim()
    const origin = (await headers()).get('origin') ?? 'https://mentron.istesctce.in'
    const {data,error} = await client.auth.signUp({
        email,password,options:{
            emailRedirectTo: origin+'/auth/callback?product='+product,
            data:{name,full_name:name,roll_number:roll,branch,department:branch,year}
        }
    })
    if(error) redirect('/signup?product='+product+'&error='+encodeURIComponent(error.message))
    // Profiles and privileges are created by the trusted Auth trigger, never client upserts.
    if(data.session) {
        const {error: enrollmentError} = await client.schema('public').rpc('enroll_current_user',{p_product:product})
        if(!enrollmentError) redirect(productHome(product))
    }
    redirect('/login?product='+product+'&message='+encodeURIComponent('Check your email to confirm your shared ISTE account.'))
}
