import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
export default function LoginPage() {
    const navigate = useNavigate();
    const [email,setEmail] = useState('');
    const [otp,setOtp] = useState('');
    const [sent,setSent] = useState(false);
    const [busy,setBusy] = useState(false);
    const [error,setError] = useState('');
    async function submit(event) {
        event.preventDefault(); setError(''); setBusy(true);
        try {
            if(!sent) {
                const {error} = await supabase.auth.signInWithOtp({
                    email:email.trim().toLowerCase(),options:{shouldCreateUser:false}
                });
                if(error) throw error;
                setSent(true);
            } else {
                const {error} = await supabase.auth.verifyOtp({email:email.trim().toLowerCase(),token:otp.trim(),type:'email'});
                if(error) throw error;
                const {error:enrollmentError} = await supabase.rpc('enroll_current_user',{p_product:'mlynq'});
                if(enrollmentError) throw enrollmentError;
                navigate('/home',{replace:true});
            }
        } catch(e) { setError(e.message??'Could not sign in. Please try again.'); }
        finally { setBusy(false); }
    }
    return <main style={{maxWidth:440,margin:'auto',padding:'64px 24px',color:'#111'}}>
        <h1 style={{fontSize:32,marginBottom:16}}>Welcome to Mlynq</h1>
        <p style={{marginBottom:24}}>Use your shared ISTE account. Your membership is verified separately.</p>
        <form onSubmit={submit} style={{display:'grid',gap:16}}>
            <label>Email address<input type="email" required value={email} disabled={sent}
                onChange={e=>setEmail(e.target.value)} autoComplete="email" style={{display:'block',width:'100%',minHeight:48,padding:12,borderRadius:12,border:'1px solid #5f85a2'}}/></label>
            {sent && <label>Email verification code<input value={otp} required inputMode="numeric" autoComplete="one-time-code"
                onChange={e=>setOtp(e.target.value)} style={{display:'block',width:'100%',minHeight:48,padding:12,borderRadius:12,border:'1px solid #5f85a2'}}/></label>}
            {error && <p role="alert" style={{color:'#a11919'}}>{error}</p>}
            <button disabled={busy} style={{minHeight:48,borderRadius:12,background:'#111',color:'white',fontWeight:700}}>
                {busy?'Please wait…':sent?'Verify and open Mlynq':'Send sign-in code'}
            </button>
        </form>
        <div style={{display:'grid',gap:16,marginTop:24}}>
            <a href="/login?product=mlynq">Sign in with a password</a>
            <a href="/signup?product=mlynq">Create a shared account</a>
            {sent && <button onClick={()=>{setSent(false);setOtp('');setError('');}}>Use a different email</button>}
        </div>
    </main>;
}
