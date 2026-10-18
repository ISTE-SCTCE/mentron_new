import {pipeline} from 'node:stream/promises';
import {Readable} from 'node:stream';

export function noteFilePath(rawUrl){
 const raw=String(rawUrl||'').split('?')[0];
 if(!raw.startsWith('/api/files/notes_bucket/'))return null;
 let parts;try{parts=raw.slice('/api/files/notes_bucket/'.length).split('/').map(decodeURIComponent);}catch{return null;}
 if(!parts.length||parts.some(p=>!p||p==='.'||p==='..'||/[\\/\x00-\x1f\x7f]/.test(p))||parts.join('/').length>1500)return null;
 return {key:'notes_bucket/'+parts.join('/'),relativeUrl:'/api/files/notes_bucket/'+parts.join('/'),filename:parts.at(-1)};
}
function json(res,status,error){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify({error}));}
export function createFileHandler({authorize,readObject}){
 return async(req,res,next=()=>json(res,404,'File unavailable.'))=>{
  if(!String(req.url).startsWith('/api/files/'))return next();
  if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');return json(res,405,'Method not allowed.');}
  const file=noteFilePath(req.url);if(!file)return json(res,404,'File unavailable.');
  const authorization=req.headers.authorization;
  if(!/^Bearer [A-Za-z0-9._-]+$/.test(authorization||''))return json(res,401,'Please log in to view this document.');
  try{
   if(!await authorize(authorization,file.relativeUrl))return json(res,404,'File unavailable for this account.');
   const object=await readObject(file.key);
   if(!object?.Body)return json(res,404,'This document is unavailable. Please contact ISTE.');
   const mime={pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',mp4:'video/mp4',mp3:'audio/mpeg',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation'};
   const headers={'Content-Type':mime[file.filename.split('.').at(-1).toLowerCase()]||'application/octet-stream','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Vary':'Authorization','Cross-Origin-Resource-Policy':'same-origin','Content-Disposition':`inline; filename*=UTF-8''${encodeURIComponent(file.filename)}`};
   if(object.ContentLength!==undefined)headers['Content-Length']=String(object.ContentLength);
   res.writeHead(200,headers);
   if(req.method==='HEAD'){object.Body.destroy?.();return res.end();}
   await pipeline(object.Body instanceof Uint8Array?Readable.from([object.Body]):object.Body,res);
  }catch(error){
   if(res.headersSent){res.destroy();return;}
   const status=error?.name==='NoSuchKey'||error?.$metadata?.httpStatusCode===404?404:503;
   json(res,status,status===404?'This document is unavailable. Please contact ISTE.':'Unable to open the document right now. Please try again.');
  }
 };
}
