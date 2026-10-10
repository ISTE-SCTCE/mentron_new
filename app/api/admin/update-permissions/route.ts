import { NextRequest,NextResponse } from 'next/server'
import { getAuthUser } from '@/app/lib/supabase/server'
export async function POST(request: NextRequest) {
    const {user,supabase} = await getAuthUser(request)
    if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
    let body
    try { body = await request.json() } catch { return NextResponse.json({error:'Invalid payload'},{status:400}) }
    if(!/^[0-9a-f-]{36}$/i.test(body.targetUserId??'')) return NextResponse.json({error:'Invalid target'},{status:400})
    const {error} = await supabase.schema('public').rpc('set_mentron_permissions',{
        p_target:body.targetUserId,p_permissions:body.permissions
    })
    if(error) return NextResponse.json({error:'Permission change was not permitted.'},{status:403})
    return NextResponse.json({success:true,count:1})
}

