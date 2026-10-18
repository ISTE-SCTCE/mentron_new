import {readFileSync,readdirSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
let local={};try{local=parseEnv(readFileSync(path.join(root,'.env.local'),'utf8'));}catch{}
const env={...local,...process.env};let failures=0;
function check(ok,label){console.log(`${ok?'PASS':'FAIL'} ${label}`);if(!ok)failures++;}
const html=readFileSync(path.join(root,'dist/index.html'),'utf8');
check(html.includes('Mentron+')&&!html.includes('design preview'),'Production title and description');
const pkg=JSON.parse(readFileSync(path.join(root,'package.json'),'utf8'));
check(Object.values({...pkg.dependencies,...pkg.devDependencies}).every(v=>/^\d+\.\d+\.\d+/.test(v)),'Dependency versions pinned');
check(Boolean(env.VITE_SUPABASE_URL&&env.VITE_SUPABASE_PUBLISHABLE_KEY),'Public backend configuration available');
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(dir,entry.name)):[path.join(dir,entry.name)]);}
const outputs=files(path.join(root,'dist'));
check(!outputs.some(file=>/\.env|\.map$/.test(file)),'No environment files or source maps in build');
const text=outputs.filter(f=>/\.(js|html|css|json)$/.test(f)).map(f=>readFileSync(f,'utf8')).join('\n');
check(!['R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY'].some(key=>env[key]&&text.includes(env[key])),'Storage credentials absent from browser build');
const privilegedJwt=[...text.matchAll(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)].some(([token])=>{try{return JSON.parse(Buffer.from(token.split('.')[1],'base64url').toString()).role==='service_role';}catch{return false;}});
check(!privilegedJwt&&!/sb_secret_[A-Za-z0-9_-]{20,}/.test(text),'No privileged credential literals in browser build');
if(process.argv.includes('--runtime'))check(['R2_ENDPOINT','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY'].every(key=>Boolean(env[key])),'Runtime file service configured');
process.exitCode=failures?1:0;
