import React,{useEffect,useState} from 'react';
import {ScanLine,RefreshCw} from 'lucide-react';
import {issueAttendanceToken} from '../core/repository';
import {useAuth} from '../core/Auth';
import {Intro} from './CollectionPage';
export default function CheckIn(){
 const {profile}=useAuth();const [token,setToken]=useState(null);const [error,setError]=useState('');const [busy,setBusy]=useState(false);
 async function issue(){setBusy(true);setToken(null);setError('');try{setToken(await issueAttendanceToken());}catch{setError('Check-in is unavailable right now. Please ask the event coordinator for assistance.');}finally{setBusy(false);}}
 useEffect(()=>{issue();},[]);
 useEffect(()=>{if(!token)return;const timer=setTimeout(()=>{setToken(null);issue();},Math.max(0,new Date(token.expires_at)-Date.now()-1000));return()=>clearTimeout(timer);},[token]);
 return <><Intro title="Your event check-in" text="Show your personal code to the event coordinator."/><div className="qr-layout"><section className="qr-card"><h2>{profile.name}</h2>{token?<TokenImage token={token}/>:<ScanLine size={120} strokeWidth={1}/>}<p>{busy?'Preparing your code…':error||'Your code refreshes automatically.'}</p>{error&&<button className="primary-button" onClick={issue} disabled={busy}><RefreshCw size={16}/>Try again</button>}</section><div className="qr-explanation"><h2>Show up.<br/>Check in.</h2><p>Your code is personal and short-lived. A coordinator records attendance when they scan it.</p><p>Keep your screen open at the event entrance.</p></div></div></>;
}
function TokenImage({token}){const [src,setSrc]=useState(null);useEffect(()=>{let active=true;import('qrcode').then(module=>module.default.toDataURL(JSON.stringify(token),{width:300,margin:2,errorCorrectionLevel:'M'})).then(value=>{if(active)setSrc(value);});return()=>{active=false;};},[token]);return src?<img width="300" height="300" className="attendance-qr" src={src} alt="Your personal event check-in code"/>:<span>Preparing code…</span>;}
