import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import * as access from '../app/lib/platform/access.mjs'

// Exercise the actual middleware with isolated Auth/database adapters.
const require=createRequire(import.meta.url)
const source=readFileSync(new URL('../app/lib/supabase/middleware.ts',import.meta.url),'utf8')
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
function setup({user={id:'verified'},profile={status:'active',is_mentron_user:true,is_mlynq_user:true}}={}) {
    const records=[]
    let cookieOptions
    const client={auth:{getUser:async()=>{
        cookieOptions.setAll([{name:'refreshed-session',value:'fixture',options:{httpOnly:true}}])
        return {data:{user}}
    }},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:profile,error:null})})})})}
    const response=()=>({cookies:{set:(name,value,options)=>records.push(typeof name==='object'?name:{name,value,...options}),getAll:()=>[...records]}})
    const exports={}
    const modules={
        '@supabase/ssr':{createServerClient:(_url,_key,options)=>{cookieOptions=options.cookies;return client}},
        'next/server':{NextResponse:{next:()=>response(),redirect:url=>({...response(),destination:url.pathname+url.search})}},
        '../platform/config':{PLATFORM_URL:'https://shared.example',PLATFORM_PUBLISHABLE_KEY:'public-fixture',productHome:access.productHome},
        '../platform/access.mjs':access,
    }
    vm.runInNewContext(compiled,{exports,require:name=>modules[name]??require(name),URL})
    const request=path=>({url:'https://site.example'+path,nextUrl:new URL('https://site.example'+path),cookies:{getAll:()=>[],set:()=>{}}})
    return {run:path=>exports.updateSession(request(path)),records}
}
test('Mentron session opens Mlynq login without password or OTP reauthentication',async()=>{
    for(const path of ['/login?product=mlynq','/mlynq/login']) {
        const {run,records}=setup()
        assert.equal((await run(path)).destination,'/mlynq/home')
        assert.ok(records.some(c=>c.name==='refreshed-session'))
    }
})
test('valid shared sessions enter Mentron; unenrolled users join without another login',async()=>{
    assert.equal((await setup().run('/login?product=mentron')).destination,'/mentron/dashboard')
    const {run}=setup({profile:{status:'active',is_mentron_user:true,is_mlynq_user:false}})
    assert.equal((await run('/login?product=mlynq')).destination,'/join?product=mlynq')
})
test('anonymous and suspended accounts do not inherit active product access',async()=>{
    assert.equal((await setup({user:null}).run('/mlynq/home')).destination,'/login?product=mlynq')
    assert.equal((await setup({profile:{status:'suspended',is_mlynq_user:true}}).run('/mlynq/home')).destination,
        '/login?error=Your%20account%20is%20unavailable.%20Please%20contact%20ISTE.')
})
test('recovery route remains accessible even with an existing session',async()=>{
    assert.equal((await setup().run('/reset-password?code=fixture')).destination,undefined)
})
