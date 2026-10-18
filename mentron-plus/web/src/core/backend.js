import {createClient} from '@supabase/supabase-js';
const url=import.meta.env.VITE_SUPABASE_URL;
const key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const configured=Boolean(url&&key);
export const supabase=configured?createClient(url,key,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'mentron.auth'}}):null;
export function backend(){if(!supabase)throw new Error('Unable to connect. Please contact ISTE support.');return supabase;}
export function check(result){if(result.error)throw result.error;return result.data;}
