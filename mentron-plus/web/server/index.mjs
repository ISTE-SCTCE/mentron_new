import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {configuredFileHandler} from './files.mjs';
import {createWebsite} from './website.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
let local={};try{local=parseEnv(readFileSync(path.join(root,'.env.local'),'utf8'));}catch{}
const env={...local,...process.env};
for(const key of ['VITE_SUPABASE_URL','VITE_SUPABASE_PUBLISHABLE_KEY','R2_ENDPOINT','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY'])if(!env[key])throw new Error(`Missing required server configuration: ${key}`);
const files=configuredFileHandler(env);const dist=path.join(root,'dist');
const server=createWebsite({dist,files,https:env.PUBLIC_ORIGIN?.startsWith('https://')});
server.listen(Number(env.PORT||4173),env.HOST||'127.0.0.1',()=>console.log('Mentron+ website and authenticated file service are ready.'));
function stop(){server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();}
process.on('SIGTERM',stop);process.on('SIGINT',stop);
