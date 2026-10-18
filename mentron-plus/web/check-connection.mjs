import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env.local','utf8').trim().split(/\r?\n/).map(l=>{const i=l.indexOf('=');return[l.slice(0,i),l.slice(i+1)];}));
const response=await fetch(env.VITE_SUPABASE_URL+'/auth/v1/settings',{headers:{apikey:env.VITE_SUPABASE_PUBLISHABLE_KEY}});
const settings=await response.json();
console.log(JSON.stringify({status:response.status,emailEnabled:settings.external?.email,signupDisabled:settings.disable_signup,emailConfirmationRequired:!settings.mailer_autoconfirm}));
