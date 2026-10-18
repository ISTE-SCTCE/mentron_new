import React,{useEffect,useState} from 'react';
import {ArrowLeft,ArrowUpRight,Eye,EyeOff,BookOpen,Compass} from 'lucide-react';
import {Brand,IsteCredit,SiteFooter} from './Brand';
import {useAuth} from './core/Auth';
import {authMessage} from './core/domain';
import DepthScene from './DepthScene';
export default function Login({world,navigate,mainRef,initialMode='login',onSuccess}){
 const auth=useAuth();const [show,setShow]=useState(false);const [mode,setMode]=useState(initialMode);const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('');
 const campus=world==='campus';const name=campus?'mlynq':'Mentron';const recovery=mode==='password';
 useEffect(()=>{if(auth.recovery)setMode('password');},[auth.recovery]);
 async function submit(e){
  e.preventDefault();setMessage('');setError('');setBusy(true);const form=new FormData(e.currentTarget);
  try{
   if(mode==='reset'){await auth.reset(form.get('email'),world);setMessage('If an account exists for that email, you’ll receive a password reset link.');}
   else if(mode==='signup'){const data=await auth.signUp(form.get('email'),form.get('password'),form.get('name'),world);if(data.session)onSuccess();else setMessage('Check your inbox to confirm your email, then return here to log in.');}
   else if(recovery){if(form.get('password')!==form.get('confirm'))throw new Error('The passwords do not match.');await auth.updatePassword(form.get('password'));onSuccess();}
   else{await auth.signIn(form.get('email'),form.get('password'));onSuccess();}
  }catch(e){setError(authMessage(e));}finally{setBusy(false);}
 }
 function change(next){setMode(next);setError('');setMessage('');}
 const heading=recovery?'Choose a new password':mode==='reset'?'Reset your password':mode==='signup'?`Join ${name}`:`Log in to ${name}`;
 return <div className={`auth-page ${campus?'auth-campus':''}`}><header className="auth-header"><a href={campus?'#/campus-landing':'#/learn-landing'}><Brand mode={world}/></a><IsteCredit/></header><main ref={mainRef} tabIndex={-1} className="auth-main"><section className="auth-story"><span className="auth-kicker">PART OF MENTRON+</span>{!campus&&<h1>Good company. <br/>Better learning. <br/><span>That’s Mentron.</span></h1>}<p>{campus?'Reconnect with your tribe. Discover what’s happening, show up for something new, and keep every milestone close.':'Pick up your notes, find your next project, and learn alongside a tribe that wants to see you grow.'}</p><DepthScene className="auth-depth" strength={1.7}><div className="auth-art" aria-hidden="true"><div className="auth-art-ring"/><span>{campus?<img src="/brand/mlynq-mark.svg" alt=""/>:<BookOpen size={72} strokeWidth={1.3}/>}</span><i className="auth-chip-one">{campus?'Find your people':'Share what you know'}</i><i className="auth-chip-two">{campus?'Make it a memory':'Build what’s next'}</i></div></DepthScene><span className="auth-story-credit">Built by ISTE SCTCE. Made for your tribe.</span></section><section className="auth-form-panel"><a className="auth-back" href={campus?'#/campus-landing':'#/learn-landing'}><ArrowLeft size={16}/> Back to {name}</a><div className="auth-world-tabs" aria-label="Choose login"><a href="#/mentron-login" aria-current={!campus?'page':undefined}><BookOpen size={16}/>Mentron</a><a href="#/mlynq-login" aria-current={campus?'page':undefined}><Compass size={16}/>mlynq</a></div><span className="auth-kicker">{mode==='signup'?'FIND YOUR TRIBE':'WELCOME TO YOUR SPACE'}</span><h2>{heading}</h2><p className="auth-description">{recovery?'Use at least 12 characters.':mode==='reset'?'We’ll email you a link to get back into your account.':'One account for Mentron and mlynq.'}</p><form onSubmit={submit} aria-busy={busy}>
 {mode==='signup'&&<label className="form-field">Your name<input name="name" autoComplete="name" required maxLength={120}/></label>}
 {!recovery&&<><label htmlFor="login-email">Email address</label><input id="login-email" type="email" name="email" autoComplete={mode==='signup'?'email':'username'} placeholder="you@example.com" required/></>}
 {mode!=='reset'&&<><div className="auth-password-label"><label htmlFor="login-password">{recovery?'New password':'Password'}</label>{mode==='login'&&<button type="button" onClick={()=>change('reset')}>Forgot password?</button>}</div><div className="auth-password"><input id="login-password" name="password" type={show?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} placeholder={mode==='login'?'Enter your password':'At least 12 characters'} required minLength={mode==='login'?1:12}/><button type="button" aria-label={show?'Hide password':'Show password'} aria-pressed={show} onClick={()=>setShow(!show)}>{show?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></>}
 {recovery&&<label className="form-field">Confirm password<input type="password" name="confirm" autoComplete="new-password" required minLength={12}/></label>}
 {(error||auth.error)&&<p role="alert" className="auth-feedback error">{error||auth.error}</p>}{message&&<p role="status" className="auth-feedback">{message}</p>}
 <button disabled={busy} type="submit" className="auth-submit">{busy?'Please wait…':recovery?'Update password':mode==='reset'?'Send reset link':mode==='signup'?'Create account':'Log in'}<ArrowUpRight size={18}/></button></form>
 {!recovery&&<p className="auth-bottom-note">{mode==='login'?'New to Mentron+?':'Already have an account?'} <button className="auth-reset-back" onClick={()=>change(mode==='login'?'signup':'login')}>{mode==='login'?'Create an account':'Log in'}</button></p>}<p className="auth-bottom-note"><a href="#/landing">Discover Mentron+</a></p></section></main><SiteFooter/></div>;
}
