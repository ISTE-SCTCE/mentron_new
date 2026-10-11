import {NextRequest,NextResponse} from 'next/server'
import {getAuthUser} from '@/app/lib/supabase/server'
import {MENTRON_BUCKETS} from '@/app/lib/platform/storage'
const mime:Record<string,string>={pdf:'application/pdf',jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',mp4:'video/mp4',mov:'video/quicktime',mp3:'audio/mpeg',zip:'application/zip',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'}
export async function GET(request:NextRequest,{params}:{params:Promise<{bucket:string,path:string[]}>}) {
    const {bucket,path}=await params
    if(!(MENTRON_BUCKETS as readonly string[]).includes(bucket) || path.some(part=>part==='..'||part==='.'||!part)) {
        return NextResponse.json({error:'File unavailable'},{status:404})
    }
    const {user,supabase}=await getAuthUser(request)
    if(!user) return NextResponse.json({error:'Sign in to view this file.'},{status:401})
    const {data:enrolled}=await supabase.schema('public').rpc('platform_product_access',{p_product:'mentron'})
    if(!enrolled) return NextResponse.json({error:'Mentron access required.'},{status:403})
    const filePath=path.join('/')
    const relativeUrl='/api/files/'+bucket+'/'+filePath
    // Product row policies enforce private CV visibility and verified-member notes.
    if(bucket==='notes_bucket' || bucket==='academy-lectures') {
        const table=bucket==='notes_bucket'?'notes':'academy_lectures'
        const {data,error}=await supabase.from(table).select('id').eq(bucket==='notes_bucket'?'file_url':'video_url',relativeUrl).limit(1)
        if(error || !data?.length) return NextResponse.json({error:'File unavailable'},{status:404})
    }
    if(bucket==='cv_bucket' && path[0]!==user.id) {
        const {data,error}=await supabase.from('project_applications').select('id').eq('cv_url',relativeUrl).limit(1)
        if(error || !data?.length) return NextResponse.json({error:'File unavailable'},{status:404})
    }
    const ext=filePath.split('.').pop()?.toLowerCase()??''
    const headers:Record<string,string>={
        'Content-Type':mime[ext]??'application/octet-stream',
        'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff',
        'Content-Disposition':mime[ext]?'inline':'attachment'
    }
    // Supabase objects are authorized by their bucket/owner policies.
    // R2 remains the source for the existing notes API paths.
    if(bucket==='notes_bucket' || bucket==='cv_bucket' || bucket==='academy-lectures') {
        try {
            const {s3Client,BUCKET_NAME}=await import('@/app/lib/s3')
            const {GetObjectCommand}=await import('@aws-sdk/client-s3')
            const object=await s3Client.send(new GetObjectCommand({Bucket:BUCKET_NAME,Key:bucket+'/'+filePath}))
            if(object.Body) return new NextResponse(Buffer.from(await object.Body.transformToByteArray()),{headers})
        } catch { /* Try the migrated Supabase bucket under the caller's RLS. */ }
    }
    const {data,error}=await supabase.storage.from(bucket).download(filePath)
    if(error || !data) return NextResponse.json({error:'File unavailable'},{status:404})
    return new NextResponse(Buffer.from(await data.arrayBuffer()),{headers})
}
