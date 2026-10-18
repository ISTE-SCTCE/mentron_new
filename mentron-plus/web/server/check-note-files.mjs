import {readFileSync,writeFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';
import {S3Client,HeadObjectCommand} from '@aws-sdk/client-s3';
import {noteFilePath} from './file-handler.mjs';
const env={...parseEnv(readFileSync(new URL('../.env.local',import.meta.url),'utf8')),...process.env};
const paths=JSON.parse(readFileSync(new URL('../../.tools/note-file-paths.json',import.meta.url),'utf8'));
const storage=new S3Client({region:'auto',endpoint:env.R2_ENDPOINT,credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY}});
const report=[];let cursor=0;
await Promise.all(Array.from({length:4},async()=>{
 while(cursor<paths.length){const source=paths[cursor++];const ref=noteFilePath(source);if(!ref){report.push({path:source,status:'invalid'});continue;}
  try{const result=await storage.send(new HeadObjectCommand({Bucket:env.R2_BUCKET_NAME||'mentron-files',Key:ref.key}));report.push({path:source,status:'available',bytes:result.ContentLength});}
  catch(error){report.push({path:source,status:error.$metadata?.httpStatusCode===404?'missing':'unavailable'});}
 }
}));
writeFileSync(fileURLToPath(new URL('../../.tools/note-file-audit.json',import.meta.url)),JSON.stringify(report,null,2));
console.log(JSON.stringify({uniqueFiles:paths.length,available:report.filter(r=>r.status==='available').length,missing:report.filter(r=>r.status==='missing').length,errors:report.filter(r=>!['available','missing'].includes(r.status)).length}));
