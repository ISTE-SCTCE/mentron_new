import test from 'node:test';
import assert from 'node:assert/strict';
import {accountAllowed,isMember,editableProfile,safeUrl,authMessage} from '../src/core/domain.js';
const profile={id:'user',status:'active',is_iste_member:true,iste_membership_id:'ISTE-1',expiry_date:'2026-10-18'};
test('account status fails closed for missing, suspended and disabled profiles',()=>{assert.equal(accountAllowed(null),false);assert.equal(accountAllowed({...profile,status:'suspended'}),false);assert.equal(accountAllowed({...profile,suspended_until:'2099-01-01'}),false);assert.equal(accountAllowed(profile),true);});
test('membership expiry uses the inclusive India calendar day',()=>{assert.equal(isMember(profile,new Date('2026-10-18T18:29:59Z')),true);assert.equal(isMember(profile,new Date('2026-10-18T18:30:00Z')),false);assert.equal(isMember({...profile,is_iste_member:false},new Date('2026-10-18')),false);});
test('profile editing cannot send authority or membership claims',()=>{assert.deepEqual(editableProfile({name:' Alex ',role:'chairman',is_sudo:true,is_iste_member:true,email:'other@example.test'}),{name:'Alex'});assert.throws(()=>editableProfile({name:' '}));});
test('document links reject active-content and insecure external schemes',()=>{for(const url of ['javascript:alert(1)','data:text/html,test','http://outside.example/doc','file:///tmp/a'])assert.equal(safeUrl(url),null);assert.equal(safeUrl('https://example.com/notes.pdf'),'https://example.com/notes.pdf');});
test('auth errors distinguish confirmation and rate limits without disclosing account existence',()=>{assert.equal(authMessage({code:'invalid_credentials'}),'The email or password is incorrect.');assert.match(authMessage({code:'email_not_confirmed'}),/Confirm your email/);assert.match(authMessage({status:429}),/Too many attempts/);});
import {storageReference,certificateReference} from '../src/core/storage-reference.js';
test('migrated private note paths resolve to scoped storage without retaining old signed tokens',()=>{
 assert.deepEqual(storageReference('/api/files/notes_bucket/user/file.pdf'),{bucket:'mentron-notes_bucket',path:'user/file.pdf'});
 assert.deepEqual(storageReference('https://example.supabase.co/storage/v1/object/sign/mentron-notes_bucket/a.pdf?token=expired'),{bucket:'mentron-notes_bucket',path:'a.pdf'});
 assert.equal(storageReference('/api/files/notes_bucket/../private'),null);
 assert.equal(storageReference('https://untrusted.example/a.pdf'),null);
});
test('certificate issuer bucket from explicit URL takes precedence over an ambiguous bare path',()=>{
 assert.deepEqual(certificateReference({storage_path:'student/a.pdf',certificate_url:'https://example.supabase.co/storage/v1/object/public/certificates/student/a.pdf'}),{bucket:'certificates',path:'student/a.pdf'});
 assert.deepEqual(certificateReference({storage_path:'student/a.pdf'}),{bucket:'issued-certificates',path:'student/a.pdf'});
 assert.equal(certificateReference({certificate_url:'https://external.example/certificate.pdf'}),null);
 assert.equal(certificateReference({certificate_url:'https://example.supabase.co/storage/v1/object/public/receipts/a.pdf'}),null);
});
