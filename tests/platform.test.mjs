import test from 'node:test'
import assert from 'node:assert/strict'
import {isProduct,productHome,isActiveProfile,canOpenProduct,routeTemplate} from '../app/lib/platform/access.mjs'
test('product destinations stay inside their own namespace',() => {
    assert.equal(productHome('mlynq'),'/mlynq/home')
    assert.equal(productHome('mentron'),'/mentron/dashboard')
    for(const value of ['../admin','https://evil.example','//evil.example',null,'Mlynq']) assert.equal(isProduct(value),false)
})
test('membership alone never grants access to either product',() => {
    const member = {status:'active',is_iste_member:true}
    assert.equal(canOpenProduct(member,'mlynq'),false)
    assert.equal(canOpenProduct(member,'mentron'),false)
})
test('enrollment remains independent for each product',() => {
    const profile={status:'active',is_mlynq_user:true,is_mentron_user:false}
    assert.equal(canOpenProduct(profile,'mlynq'),true)
    assert.equal(canOpenProduct(profile,'mentron'),false)
    assert.equal(canOpenProduct({...profile,is_mentron_user:'true'},'mentron'),false)
})
test('suspended, deleted and missing profiles cannot switch into a product',() => {
    for(const profile of [null,{status:'suspended',is_mlynq_user:true},{status:'deleted',is_mlynq_user:true},
        {status:'active',suspended_until:'2999-01-01',is_mlynq_user:true}]) assert.equal(canOpenProduct(profile,'mlynq'),false)
    assert.equal(isActiveProfile({status:'active',suspended_until:'invalid'}),false)
    assert.equal(isActiveProfile({status:'active',suspended_until:'2000-01-01'}),true)
})
test('analytics strips identifiers, arbitrary slugs and query strings',() => {
    assert.equal(routeTemplate('/mentron/notes/3fa85f64-5717-4562-b3fc-2c963f66afa6?email=private@example.com'),'/mentron/notes/:item')
    assert.equal(routeTemplate('/mlynq/events/123#user'),'/mlynq/events/:item')
    assert.equal(routeTemplate('/mentron/projects/private@example.com'),'/mentron/projects/:item')
})
