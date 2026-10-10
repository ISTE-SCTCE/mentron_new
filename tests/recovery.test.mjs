import test from 'node:test'
import assert from 'node:assert/strict'
import {establishRecoverySession} from '../app/lib/platform/recovery.mjs'

function client() {
    const calls=[]
    const success={data:{session:{user:{id:'verified'}}},error:null}
    return {calls,auth:{
        verifyOtp:async input=>{calls.push(['verifyOtp',input]);return success},
        exchangeCodeForSession:async input=>{calls.push(['code',input]);return success},
        setSession:async input=>{calls.push(['setSession',input]);return success},
        getUser:async()=>{calls.push(['getUser']);return {data:{user:{id:'verified'}},error:null}},
    }}
}
test('app-generated implicit recovery links establish the shared browser session',async()=>{
    const {auth,calls}=client()
    assert.equal(await establishRecoverySession(auth,'https://example.com/reset-password#access_token=test-access&refresh_token=test-refresh&type=recovery'),true)
    assert.deepEqual(calls[0],['setSession',{access_token:'test-access',refresh_token:'test-refresh'}])
})
test('PKCE and token-hash recovery links exchange through the same client',async()=>{
    for(const suffix of ['?code=test-code','?token_hash=test-hash&type=recovery']) {
        const {auth,calls}=client()
        assert.equal(await establishRecoverySession(auth,'https://example.com/reset-password'+suffix),true)
        assert.equal(calls.at(-1)[0],'getUser')
    }
})
test('explicit failed recovery cannot use an existing session',async()=>{
    const {auth,calls}=client()
    auth.exchangeCodeForSession=async()=>({data:{session:null},error:new Error('Expired')})
    assert.equal(await establishRecoverySession(auth,'https://example.com/reset-password?code=expired'),false)
    assert.equal(calls.length,0)
})
test('errors, incomplete tokens and non-recovery links are rejected',async()=>{
    for(const suffix of ['#error=access_denied','?error_description=Expired','#access_token=test&type=recovery','?token_hash=test&type=signup','#access_token=test&refresh_token=test&type=magiclink']) {
        const {auth,calls}=client()
        assert.equal(await establishRecoverySession(auth,'https://example.com/reset-password'+suffix),false)
        assert.equal(calls.length,0)
    }
})
