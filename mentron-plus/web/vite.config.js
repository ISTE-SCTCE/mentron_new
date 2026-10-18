import {defineConfig,loadEnv} from 'vite';
import {configuredFileHandler} from './server/files.mjs';
export default defineConfig(({mode,command})=>{
 const env={...loadEnv(mode,process.cwd(),''),...process.env};
 if(command==='build'&&(!env.VITE_SUPABASE_URL||!env.VITE_SUPABASE_PUBLISHABLE_KEY))throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY before building.');
 const handler=configuredFileHandler(env);
 // This product does not use PostCSS plugins. Do not inherit the old Next.js
 // repository's parent Tailwind configuration when built from a subdirectory.
 return {css:{postcss:{plugins:[]}},plugins:[{name:'mentron-authenticated-files',configureServer(server){server.middlewares.use(handler);},configurePreviewServer(server){server.middlewares.use(handler);}}]};
});
