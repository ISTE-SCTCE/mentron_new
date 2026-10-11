const test=require('node:test');
const assert=require('node:assert/strict');
const {isActiveExecutive,requireExecutive}=require('../firebase/functions/platform-auth.cjs');
function client(profile,{valid=true,verified=true}={}) {
 return {auth:{getUser:async()=>({data:{user:valid?{id:'fixture',email_confirmed_at:verified?'2026-10-10':null}:null},error:valid?null:new Error('invalid')})},
 schema:()=>({from:()=>({select:()=>({eq:()=>({single:async()=>({data:profile,error:null})})})})})};
}
test('missing and invalid JWTs cannot call privileged Firebase functions',async()=>{
 await assert.rejects(()=>requireExecutive(client({}),null));
 await assert.rejects(()=>requireExecutive(client({},{valid:false}),'invalid'));
});
test('client metadata and Mentron legacy role names cannot authorize an executive',async()=>{
 await assert.rejects(()=>requireExecutive(client({role:'core',status:'active',is_mentron_user:true}),'jwt'));
 await assert.rejects(()=>requireExecutive(client({role:'member',status:'active',is_mentron_user:true,user_metadata:{role:'chairman'}}),'jwt'));
});
test('unverified and suspended canonical executives cannot send or confirm payments',async()=>{
 const profile={role:'chairman',status:'active',is_mentron_user:true};
 await assert.rejects(()=>requireExecutive(client(profile,{verified:false}),'jwt'));
 assert.equal(isActiveExecutive({...profile,suspended_until:'2999-01-01'}),false);
 assert.equal(isActiveExecutive({...profile,status:'suspended'}),false);
});
test('active canonical executives with verified tokens pass',async()=>{
 assert.equal(await requireExecutive(client({role:'forum_execcom',status:'active',is_mentron_user:true}),'jwt'),'fixture');
});
