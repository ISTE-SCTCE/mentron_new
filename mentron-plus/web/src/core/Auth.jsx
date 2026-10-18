import React,{createContext,useContext,useEffect,useRef,useState} from 'react';
import {backend,check,supabase,configured} from './backend';
import {accountAllowed,editableProfile} from './domain';
const Context=createContext(null);
export function AuthProvider({children}){
 const [state,setState]=useState({loading:true,user:null,profile:null,error:null,recovery:false});
 const generation=useRef(0);const current=useRef(null);
 async function synchronize(session){
  const version=++generation.current;
  if(!session){current.current=null;setState(s=>({...s,loading:false,user:null,profile:null,error:null}));return;}
  try{
   const user=check(await backend().auth.getUser()).user;if(!user)throw new Error('Please log in again.');
   const profile=check(await backend().from('profiles').select('id,name,email,phone,roll_number,branch,year,college,forum,role,status,suspended_until,is_iste_member,iste_membership_id,expiry_date,is_mentron_user,is_mlynq_user').eq('id',user.id).single());
   if(!accountAllowed(profile))throw new Error('Your account is not active. Contact ISTE support.');
   if(version!==generation.current)return;
   current.current=user.id;setState(s=>({...s,loading:false,user,profile,error:null}));
  }catch(error){if(version===generation.current)setState(s=>({...s,loading:false,user:null,profile:null,error:error.message}));}
 }
 useEffect(()=>{
  if(!configured){setState(s=>({...s,loading:false,error:'Unable to connect. Please contact ISTE support.'}));return;}
  let mounted=true;
  const {data:{subscription}}=supabase.auth.onAuthStateChange((event,session)=>{
   if(event==='PASSWORD_RECOVERY')setState(s=>({...s,recovery:true}));
   if(event==='SIGNED_OUT'){if(current.current){localStorage.removeItem(`mentron.recent.${current.current}`);localStorage.removeItem(`mentron.saved.${current.current}`);}generation.current++;current.current=null;setState({loading:false,user:null,profile:null,error:null,recovery:false});return;}
   queueMicrotask(()=>{if(mounted)synchronize(session);});
  });
  supabase.auth.getSession().then(({data,error})=>{if(!mounted)return;if(error)setState(s=>({...s,loading:false,error:error.message}));else synchronize(data.session);});
  const resume=()=>{if(document.visibilityState==='visible')supabase.auth.getSession().then(({data})=>{if(mounted)synchronize(data.session);});};
  document.addEventListener('visibilitychange',resume);
  return()=>{mounted=false;generation.current++;subscription.unsubscribe();document.removeEventListener('visibilitychange',resume);};
 },[]);
 async function enroll(world){
  check(await backend().rpc('enroll_current_user',{p_product:world==='campus'?'mlynq':'mentron'}));
  const {data}=await backend().auth.getSession();await synchronize(data.session);
 }
 async function signIn(email,password){const data=check(await backend().auth.signInWithPassword({email:email.trim(),password}));await synchronize(data.session);return data;}
 async function signUp(email,password,name,world){return check(await backend().auth.signUp({email:email.trim(),password,options:{data:{name:name.trim()},emailRedirectTo:callback(world,'confirm')}}));}
 function callback(world,flow){const u=new URL(location.origin+location.pathname);u.searchParams.set('world',world);u.searchParams.set('flow',flow);return u.href;}
 async function reset(email,world){check(await backend().auth.resetPasswordForEmail(email.trim(),{redirectTo:callback(world,'recovery')}));}
 async function updatePassword(password){check(await backend().auth.updateUser({password}));setState(s=>({...s,recovery:false}));history.replaceState(null,'',location.pathname+'#/home');}
 async function signOut(){check(await backend().auth.signOut({scope:'local'}));if(state.user){localStorage.removeItem(`mentron.recent.${state.user.id}`);localStorage.removeItem(`mentron.saved.${state.user.id}`);}current.current=null;generation.current++;setState({loading:false,user:null,profile:null,error:null,recovery:false});}
 async function updateProfile(input){const profile=check(await backend().from('profiles').update(editableProfile(input)).eq('id',state.user.id).select('id,name,email,phone,roll_number,branch,year,college,forum,role,status,suspended_until,is_iste_member,iste_membership_id,expiry_date,is_mentron_user,is_mlynq_user').single());setState(s=>({...s,profile}));return profile;}
 return <Context.Provider value={{...state,signIn,signUp,reset,updatePassword,signOut,updateProfile,enroll,refresh:async()=>{const {data}=await backend().auth.getSession();await synchronize(data.session);}}}>{children}</Context.Provider>;
}
export function useAuth(){return useContext(Context);}
