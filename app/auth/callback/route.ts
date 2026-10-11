import { NextRequest,NextResponse } from 'next/server'
import { createClient } from '@/app/lib/supabase/server'
import { isProduct,productHome } from '@/app/lib/platform/config'
export async function GET(request: NextRequest) {
    const product = isProduct(request.nextUrl.searchParams.get('product')) ? request.nextUrl.searchParams.get('product') as 'mlynq'|'mentron' : 'mentron'
    const code = request.nextUrl.searchParams.get('code')
    if(code) {
        const client = await createClient()
        const {error} = await client.auth.exchangeCodeForSession(code)
        if(!error) {
            const {error:enrollmentError} = await client.schema('public').rpc('enroll_current_user',{p_product:product})
            return NextResponse.redirect(new URL(enrollmentError ? '/join?product='+product : productHome(product),request.url))
        }
    }
    return NextResponse.redirect(new URL('/login?product='+product+'&error=Confirmation+link+has+expired',request.url))
}
