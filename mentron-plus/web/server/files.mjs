import {createClient} from '@supabase/supabase-js';
import {S3Client,GetObjectCommand} from '@aws-sdk/client-s3';
import {createFileHandler} from './file-handler.mjs';
import {accountAllowed} from '../src/core/domain.js';

export function configuredFileHandler(env){
 let storage;
 return createFileHandler({
  async authorize(authorization,relativeUrl){
   const url=env.VITE_SUPABASE_URL;const key=env.VITE_SUPABASE_PUBLISHABLE_KEY;
   if(!url||!key)return false;
   // This is the caller's client, never a service-role client. Existing note RLS
   // enforces active account and membership before any R2 object is requested.
   const caller=createClient(url,key,{global:{headers:{Authorization:authorization}},auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
   const {data,error}=await caller.auth.getUser(authorization.slice(7));
   if(error||!data.user)return false;
   const profile=await caller.from('profiles').select('id,status,suspended_until,is_mentron_user').eq('id',data.user.id).single();
   if(profile.error||!profile.data?.is_mentron_user||!accountAllowed(profile.data))return false;
   const result=await caller.schema('mentron').from('notes').select('id').eq('file_url',relativeUrl).limit(1);
   return !result.error&&Boolean(result.data?.length);
  },
  async readObject(key){
   if(!env.R2_ENDPOINT||!env.R2_ACCESS_KEY_ID||!env.R2_SECRET_ACCESS_KEY)throw new Error('Storage configuration unavailable');
   storage??=new S3Client({region:'auto',endpoint:env.R2_ENDPOINT,credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY}});
   return storage.send(new GetObjectCommand({Bucket:env.R2_BUCKET_NAME||'mentron-files',Key:key}));
  },
 });
}
