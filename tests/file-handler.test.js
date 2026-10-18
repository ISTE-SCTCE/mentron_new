import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {createFileHandler,noteFilePath} from '../server/file-handler.mjs';
async function withServer(handler,run){const server=createServer(handler);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});try{await run(`http://127.0.0.1:${server.address().port}`);}finally{await new Promise(resolve=>server.close(resolve));}}
test('private note paths reject traversal, encoded separators, other buckets and control characters',()=>{
 for(const path of ['/api/files/notes_bucket/%2e%2e/file.pdf','/api/files/notes_bucket/a%2fb.pdf','/api/files/notes_bucket/a%5cb.pdf','/api/files/cv_bucket/a.pdf','/api/files/notes_bucket/%00a.pdf','/api/files/notes_bucket/%zz'])assert.equal(noteFilePath(path),null);
 assert.deepEqual(noteFilePath('/api/files/notes_bucket/a%20b.pdf'),{key:'notes_bucket/a b.pdf',relativeUrl:'/api/files/notes_bucket/a b.pdf',filename:'a b.pdf'});
});
test('anonymous and unauthorized callers never reach private object storage',async()=>{
 let reads=0;const handler=createFileHandler({authorize:async()=>false,readObject:async()=>{reads++;}});
 await withServer(handler,async base=>{
  assert.equal((await fetch(base+'/api/files/notes_bucket/a.pdf')).status,401);
  assert.equal((await fetch(base+'/api/files/notes_bucket/a.pdf',{headers:{Authorization:'Bearer test.jwt'}})).status,404);
  assert.equal((await fetch(base+'/api/files/notes_bucket/a.pdf',{method:'POST'})).status,405);
 });assert.equal(reads,0);
});
test('authorized file streaming checks the exact row path and uses private no-store headers',async()=>{
 const pdf=Buffer.from('%PDF-1.7\nfixture');const checked=[];const read=[];
 const handler=createFileHandler({authorize:async(...args)=>{checked.push(args);return true;},readObject:async key=>{read.push(key);return {Body:pdf,ContentLength:pdf.length};}});
 await withServer(handler,async base=>{
  const response=await fetch(base+'/api/files/notes_bucket/a.pdf',{headers:{Authorization:'Bearer test.jwt'}});
  assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'application/pdf');assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('vary'),'Authorization');assert.equal(response.headers.get('access-control-allow-origin'),null);
  assert.equal(await response.text(),pdf.toString());
 });assert.deepEqual(checked,[['Bearer test.jwt','/api/files/notes_bucket/a.pdf']]);assert.deepEqual(read,['notes_bucket/a.pdf']);
});
