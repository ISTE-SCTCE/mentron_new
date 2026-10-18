import test from 'node:test';
import assert from 'node:assert/strict';
import {startWorkspaceSync} from '../src/core/live-sync.js';
function fixture(){
 const handlers=[];let status;let removed;let id=0;const pending=new Map();
 const channel={on(event,filter,callback){handlers.push({event,filter,callback});return this;},subscribe(callback){status=callback;return this;}};
 const client={channel(){return channel;},removeChannel(value){removed=value;}};
 const timers={setTimeout(fn){pending.set(++id,fn);return id;},clearTimeout(value){pending.delete(value);}};
 return {handlers,channel,client,timers,pending,status:value=>status(value),removed:()=>removed,flush(){for(const [key,fn] of [...pending]){pending.delete(key);fn();}}};
}
test('Realtime coalesces change bursts and refreshes after subscription without forwarding row payloads',()=>{
 const f=fixture();const changes=[];const stop=startWorkspaceSync(f.client,'owner',(...args)=>changes.push(args),f.timers);
 assert.equal(f.handlers.length,5);
 assert.equal(f.handlers.find(x=>x.filter.table==='notifications').filter.filter,'user_id=eq.owner');
 f.status('SUBSCRIBED');f.handlers[0].callback({new:{private:'never forward'}});f.handlers[2].callback({new:{title:'updated'}});
 assert.equal(f.pending.size,1);f.flush();assert.deepEqual(changes,[[]]);stop();
});
test('cleanup cancels pending invalidation and prevents late channel callbacks after logout',()=>{
 const f=fixture();let count=0;const stop=startWorkspaceSync(f.client,'owner',()=>count++,f.timers);
 f.handlers[0].callback();stop();f.handlers[0].callback();f.flush();
 assert.equal(count,0);assert.equal(f.pending.size,0);assert.equal(f.removed(),f.channel);
});
