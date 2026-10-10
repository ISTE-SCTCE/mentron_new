'use server'
import { createClient } from '@/app/lib/supabase/server'
import { isProduct, productHome } from '@/app/lib/platform/config'
import { redirect } from 'next/navigation'
export async function login(formData: FormData) {
    const client = await createClient()
    const intent = formData.get('product')
    const product = isProduct(intent) ? intent : 'mentron'
    const email = String(formData.get('email')??'').trim().toLowerCase()
    const password = String(formData.get('password')??'')
    const {data:{user},error} = await client.auth.signInWithPassword({email,password})
    if(error || !user) redirect('/login?product='+product+'&error='+encodeURIComponent(error?.message??'Login failed'))
    const {error: enrollmentError} = await client.schema('public').rpc('enroll_current_user',{p_product:product})
    if(enrollmentError) redirect('/join?product='+product+'&error='+encodeURIComponent('Could not open this product. Please try again or contact ISTE.'))
    redirect(productHome(product))
}
export async function logout() {
    const client = await createClient()
    await client.auth.signOut()
    redirect('/')
}
