import React,{useState} from 'react';
import {applyWithCV} from '../core/transactions';
import {useAuth} from '../core/Auth';
export default function ProjectApplication({item,onDone}){
 const {user}=useAuth();const [id]=useState(()=>crypto.randomUUID());const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function submit(e){e.preventDefault();const data=new FormData(e.currentTarget);setBusy(true);setError('');try{const file=data.get('cv');await applyWithCV(item,user.id,data.get('message'),file?.size?file:null,id);onDone();}catch(e){setError(e.message);}finally{setBusy(false);}}
 if(item.posted_by===user.id)return <p>You own this project.</p>;
 return <form onSubmit={submit}><label className="form-field">Why would you like to join?<textarea name="message" required minLength={10} maxLength={2000}/></label><label className="form-field">CV {item.cv_required?'(required)':'(optional)'}<input name="cv" type="file" accept="application/pdf,.pdf" required={item.cv_required}/><small>PDF, up to 10 MB. Shared with the project coordinator.</small></label>{error&&<p role="alert" className="auth-feedback error">{error}</p>}<button className="primary-button" disabled={busy}>{busy?'Sending…':'Apply to project'}</button></form>;
}
