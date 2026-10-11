import { NextRequest,NextResponse } from 'next/server'
import { getAuthUser } from '@/app/lib/supabase/server'
export async function POST(request: NextRequest) {
    const {user} = await getAuthUser(request)
    if(!user) return NextResponse.json({error:'Unauthorized'},{status:401})
    return NextResponse.json({error:'This account is shared with Mlynq. Manage account removal through ISTE administration.'},{status:409})
}

