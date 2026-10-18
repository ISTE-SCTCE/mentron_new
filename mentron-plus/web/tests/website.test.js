import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createWebsite} from '../server/website.mjs';
import {createFileHandler} from '../server/file-handler.mjs';
test('production server serves SPA/assets with security headers, private API errors and hidden-file denial',async()=>{
 const dist=await mkdtemp(path.join(tmpdir(),'mentron-web-'));
 await mkdir(path.join(dist,'assets'));await writeFile(path.join(dist,'index.html'),'<title>Mentron+</title>');await writeFile(path.join(dist,'assets/app-123.js'),'/* fixture */');await writeFile(path.join(dist,'.env'),'never public');
 const server=createWebsite({dist,files:createFileHandler({authorize:async()=>false,readObject:async()=>{throw Error('must not read');}}),https:true});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
 try{
  const base=`http://127.0.0.1:${server.address().port}`;
  const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(await page.text(),/Mentron/);assert.match(page.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(page.headers.get('x-frame-options'),'DENY');assert.equal(page.headers.get('referrer-policy'),'no-referrer');assert.equal(page.headers.get('strict-transport-security'),'max-age=31536000');
  const asset=await fetch(base+'/assets/app-123.js');assert.match(asset.headers.get('cache-control'),/immutable/);
  for(const route of ['/.env','/%2eenv','/missing.js','/api/unknown','/app.js.map','/%5csecret'])assert.equal((await fetch(base+route)).status,404,route);
  const denied=await fetch(base+'/api/files/notes_bucket/a.pdf');assert.equal(denied.status,401);assert.equal(denied.headers.get('cache-control'),'private, no-store');
  assert.equal((await fetch(base+'/',{method:'POST'})).status,405);
  const head=await fetch(base+'/',{method:'HEAD'});assert.equal(await head.text(),'');
  assert.deepEqual(await (await fetch(base+'/healthz')).json(),{status:'ok'});
 }finally{await new Promise(resolve=>server.close(resolve));await rm(dist,{recursive:true,force:true});}
});
