export function storageReference(value,fallbackBucket){
 if(!value||typeof value!=='string')return null;
 const aliases={notes_bucket:'mentron-notes_bucket',cv_bucket:'mentron-cv_bucket','project bucket':'mentron-project bucket','academy-lectures':'mentron-academy-lectures'};
 let bucket,path;
 if(value.startsWith('/api/files/')){const parts=value.slice(11).split('/');bucket=aliases[parts.shift()];path=parts.join('/');}
 else if(value.startsWith('https://')){try{const u=new URL(value);if(!u.hostname.endsWith('.supabase.co'))return null;const match=u.pathname.match(/^\/storage\/v1\/object\/(?:sign|public|authenticated)\/([^/]+)\/(.+)$/);if(!match)return null;bucket=aliases[decodeURIComponent(match[1])]||decodeURIComponent(match[1]);path=decodeURIComponent(match[2]);}catch{return null;}}
 else if(fallbackBucket){bucket=fallbackBucket;path=value;}
 if(!bucket||!path||path.split('/').some(s=>s==='..'||s==='.')||path.startsWith('/'))return null;
 return {bucket,path};
}
export function certificateReference(item){
 // Existing issuers use both buckets. A URL carries the bucket explicitly;
 // a bare storage_path does not, so use it only as the legacy fallback.
 const ref=storageReference(item.storage_path)||storageReference(item.certificate_url)||storageReference(item.file_url)||storageReference(item.storage_path,'issued-certificates');
 return ref&&['certificates','issued-certificates'].includes(ref.bucket)?ref:null;
}
