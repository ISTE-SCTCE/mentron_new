import { NextRequest,NextResponse } from 'next/server'
import { getAuthUser } from '@/app/lib/supabase/server'
export async function POST(request: NextRequest) {
    const {user,supabase} = await getAuthUser(request)
    if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
    let body
    try { body = await request.json() } catch { return NextResponse.json({error:'Invalid payload'},{status:400}) }
    if(!/^[0-9a-f-]{36}$/i.test(body.profileId??'') || !['member','exec'].includes(body.newRole)) {
        return NextResponse.json({error:'Invalid target or role'},{status:400})
    }
    const {error} = await supabase.schema('public').rpc('admin_promote_demote_user',{
        p_target_user_id:body.profileId,p_new_role:body.newRole==='exec'?'forum_execcom':'member',
        p_new_post:null,p_new_forum:null,p_is_forum_head:false,p_clear_forum:false
    })
    if(error) return NextResponse.json({error:'Role change was not permitted.'},{status:403})
    return NextResponse.json({success:true,profileId:body.profileId,newRole:body.newRole,count:1})
}
