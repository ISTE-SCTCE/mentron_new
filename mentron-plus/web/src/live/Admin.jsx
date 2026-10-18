import React,{useState} from 'react';
import {useResource} from '../core/hooks';
import {managementList,publishManagement} from '../core/repository';
import {useAuth} from '../core/Auth';
import {ResourceState} from './Dashboard';
import {Intro} from './CollectionPage';
import CoordinatorCheckIn from './CoordinatorCheckIn';
import ReviewQueue from './ReviewQueue';
const tabs=[['checkin','Event check-in'],['events','Events'],['announcements','Announcements'],['pending_notes','Resource submissions'],['pending_projects','Project submissions'],['listings','Marketplace submissions'],['payments','Payment verification']];
export default function Admin(){
 const {profile,user}=useAuth();const [tab,setTab]=useState('events');const [error,setError]=useState('');const [message,setMessage]=useState('');const [busy,setBusy]=useState(false);
 const allowed=['forum_execcom','core_execcom','vice_chairman','chairman'].includes(profile.role);
 const publishing=['events','announcements'].includes(tab);
 const state=useResource(async()=>{if(!allowed)throw new Error('Access restricted.');return publishing?managementList(tab):[];},[tab,allowed]);
 async function create(e){
  e.preventDefault();setBusy(true);setError('');setMessage('');const form=e.currentTarget;const data=Object.fromEntries(new FormData(form));
  try{await publishManagement(tab,data,user.id);form.reset();state.reload();setMessage(tab==='events'?'Event published.':'Announcement published.');}catch(e){setError(e.message);}finally{setBusy(false);}
 }
 if(!allowed)return <p>Access restricted.</p>;
 return <div className="admin-panel">
  <Intro title="ISTE management" text="Manage events, submissions, and community updates."/>
  <div className="filters">{tabs.map(([id,label])=><button key={id} aria-pressed={id===tab} onClick={()=>{setTab(id);setError('');setMessage('');}}>{label}</button>)}</div>
  {tab==='checkin'&&<CoordinatorCheckIn/>}
  {!publishing&&tab!=='checkin'&&<ReviewQueue key={tab} kind={tab}/>}
  {publishing&&<>
   <form key={tab} className="live-publish-form" onSubmit={create}>
    <h2>{tab==='events'?'Publish an event':'Publish an announcement'}</h2>
    <label className="form-field">Title<input name="title" required maxLength={180}/></label>
    <label className="form-field">Description<textarea name="content" required maxLength={10000}/></label>
    {tab==='events'&&<div className="form-grid"><label className="form-field">Date<input name="date" type="date" required/></label><label className="form-field">Location<input name="location" required/></label></div>}
    <button disabled={busy} className="primary-button">{busy?'Publishing…':'Publish'}</button>
    {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
   </form>
   <ResourceState state={state}>{state.data?.length?<div className="live-list">{state.data.map(row=><article key={row.id}><div><h2>{row.title}</h2><p>{row.content||row.description||row.location}</p><small>{row.date||new Date(row.created_at).toLocaleDateString('en-IN')}</small></div></article>)}</div>:<p>No records yet.</p>}</ResourceState>
  </>}
 </div>;
}
