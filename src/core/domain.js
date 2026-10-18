export function accountAllowed(profile,now=Date.now()){
 return Boolean(profile?.id&&profile.status==='active'&&(!profile.suspended_until||Date.parse(profile.suspended_until)<=now));
}
export function isMember(profile,now=new Date()){
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 return Boolean(accountAllowed(profile,now.getTime())&&profile.is_iste_member&&profile.iste_membership_id&&(!profile.expiry_date||profile.expiry_date>=day));
}
export function editableProfile(input){
 const patch={};for(const key of ['name','phone','roll_number','branch','year','college'])if(Object.hasOwn(input,key))patch[key]=String(input[key]??'').trim().slice(0,key==='name'?120:200);
 if('name' in patch&&!patch.name)throw new Error('Please enter your name.');return patch;
}
export function safeUrl(value){try{const u=new URL(value);return u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)?u.href:null;}catch{return null;}}
export function authMessage(error){
 const code=error?.code;const message=error?.message||'';
 if(code==='invalid_credentials'||/invalid login credentials/i.test(message))return 'The email or password is incorrect.';
 if(code==='email_not_confirmed')return 'Confirm your email before signing in. Check your inbox for the confirmation link.';
 if(code==='over_email_send_rate_limit'||error?.status===429)return 'Too many attempts. Please wait a few minutes and try again.';
 if(/fetch|network/i.test(message))return 'Check your connection and try again.';
 return message||'Something went wrong. Please try again.';
}
