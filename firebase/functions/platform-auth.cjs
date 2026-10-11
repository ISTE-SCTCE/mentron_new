const executiveRoles=new Set(['forum_execcom','core_execcom','vice_chairman','chairman']);
function isActiveExecutive(profile,now=new Date()) {
  if(!profile || profile.status!=='active' || profile.is_mentron_user!==true || !executiveRoles.has(profile.role)) return false;
  if(profile.suspended_until==null) return true;
  const until=new Date(profile.suspended_until);
  return Number.isFinite(until.getTime()) && until<=now;
}
async function requireExecutive(client,token) {
  if(typeof token!=='string' || !token) throw new Error('Executive authentication required');
  const {data,error}=await client.auth.getUser(token);
  if(error || !data?.user?.email_confirmed_at) throw new Error('Verified authentication required');
  const {data:profile,error:profileError}=await client.schema('public').from('profiles')
    .select('id,role,status,suspended_until,is_mentron_user').eq('id',data.user.id).single();
  if(profileError || !isActiveExecutive(profile)) throw new Error('Active executive required');
  return data.user.id;
}
module.exports={isActiveExecutive,requireExecutive};
