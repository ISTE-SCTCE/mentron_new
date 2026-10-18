import {createServer} from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {securityHeaders} from './security.mjs';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.ttf':'font/ttf','.json':'application/json','.txt':'text/plain; charset=utf-8'};
export function createWebsite({dist,files,https=false}){
 dist=path.resolve(dist);
 const server=createServer((req,res)=>{
  securityHeaders(res,{https});
  files(req,res,async()=>{
   try{
    if(!['GET','HEAD'].includes(req.method)){res.setHeader('Allow','GET, HEAD');res.writeHead(405);return res.end();}
    const requested=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    // Never serve hidden files, backslash aliases, or source maps, even if included by mistake.
    if(requested.split('/').some(part=>part.startsWith('.'))||/[\\\x00-\x1f\x7f]/.test(requested)||requested.endsWith('.map')){res.writeHead(404);return res.end();}
    if(requested==='/healthz'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});return res.end(req.method==='HEAD'?undefined:JSON.stringify({status:'ok'}));}
    if(requested.startsWith('/api/')){res.writeHead(404,{'Cache-Control':'no-store'});return res.end();}
    const target=path.resolve(dist,'.'+requested);
    if(target!==dist&&!target.startsWith(dist+path.sep)){res.writeHead(404);return res.end();}
    let file=target;
    try{if(!(await stat(file)).isFile())file=path.join(dist,'index.html');}
    catch{if(path.extname(requested)){res.writeHead(404);return res.end();}file=path.join(dist,'index.html');}
    const cache=path.basename(file)==='index.html'?'no-cache':path.dirname(file)===path.join(dist,'assets')?'public, max-age=31536000, immutable':'public, max-age=3600';
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':cache});
    if(req.method==='HEAD')return res.end();
    createReadStream(file).on('error',()=>res.destroy()).pipe(res);
   }catch{if(!res.headersSent)res.writeHead(404);res.end();}
  }).catch(()=>{if(!res.headersSent)res.writeHead(503);res.end();});
 });
 server.requestTimeout=30000;server.headersTimeout=15000;server.keepAliveTimeout=5000;server.maxHeadersCount=100;
 return server;
}
