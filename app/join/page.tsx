import { createClient } from '@/app/lib/supabase/server'
import { isProduct, productHome } from '@/app/lib/platform/config'
import { redirect } from 'next/navigation'
import Link from 'next/link'

async function enroll(form: FormData) {
    'use server'
    const product = form.get('product')
    if(!isProduct(product)) redirect('/')
    const client = await createClient()
    const {data:{user}} = await client.auth.getUser()
    if(!user) redirect('/login?product=' + product)
    const {error} = await client.schema('public').rpc('enroll_current_user',{p_product:product})
    if(error) redirect('/join?product=' + product + '&error=' + encodeURIComponent('Could not join. Please try again or contact ISTE.'))
    await client.schema('public').from('analytics_events').insert({
        profile_id:user.id,product,event_name:'enrollment',properties:{client:'web'}
    })
    redirect(productHome(product))
}

export default async function JoinPage({searchParams}: {searchParams: Promise<{product?:string,error?:string}>}) {
    const params = await searchParams
    const product = isProduct(params.product) ? params.product : 'mentron'
    return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-6 p-6">
        <h1 className="text-4xl font-bold">Join {product==='mlynq' ? 'Mlynq' : 'Mentron'}</h1>
        <p className="text-gray-300">Use your existing ISTE account. Joining gives you access to this product; ISTE membership is verified separately.</p>
        {params.error && <p role="alert" className="text-red-300">{params.error}</p>}
        <form action={enroll}><input type="hidden" name="product" value={product}/>
            <button className="w-full rounded-2xl bg-cyan-300 p-4 font-bold text-black">Continue to {product==='mlynq'?'Mlynq':'Mentron'}</button>
        </form><Link href="/">Back to products</Link>
    </main>
}
