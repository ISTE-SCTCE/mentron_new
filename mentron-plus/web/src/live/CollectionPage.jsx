import React,{useEffect,useRef,useState} from 'react';
import {ArrowUpRight,Plus,BookOpen,CalendarDays,Lock,ThumbsUp} from 'lucide-react';
import {collection,collectionFacets,documentUrl,answers,answer,vote} from '../core/repository';
import {useDebounce,useResource} from '../core/hooks';
import {useAuth} from '../core/Auth';
import {safeUrl} from '../core/domain';
import {Modal,EmptyState} from '../components';
import {ResourceState} from './Dashboard';
import ContributionForm from './ContributionForm';
import ProjectApplication from './ProjectApplication';
import MarketCheckout from './MarketCheckout';
export function Intro({title,text,children}){return <div className="page-intro"><div><span className="eyebrow">MENTRON+</span><h1>{title}</h1><p>{text}</p></div>{children}</div>;}
const titles={notes:['Study resources','Browse notes by subject, department, and semester.'],events:['Events','Find workshops, meetups, and opportunities from ISTE.'],projects:['Projects','Find a team, contribute your skills, and build something together.'],market:['Marketplace','Discover useful finds from your campus community.'],forum:['Community','Ask questions and share what you know.'],gate:['GATE library','Resources for your next step.']};
const departmentNames={A:'Group A · CS / IT',B:'Group B · EEE / ECE',C:'Group C · Mechanical / Civil',D:'Group D · Biotechnology',CSE:'Computer Science',ECE:'Electronics & Communication',BT:'Biotechnology',ME:'Mechanical Engineering',MEA:'Mechanical · Automobile'};
const unique=values=>[...new Set(values.filter(Boolean))].sort((a,b)=>a.localeCompare(b));
export default function CollectionPage({kind,search,notify}){
 const auth=useAuth();const [pagination,setPagination]=useState({key:'',page:0});const [selected,setSelected]=useState(null);const [creating,setCreating]=useState(false);
 const [filter,setFilter]=useState('');const [semester,setSemester]=useState('');const [subject,setSubject]=useState('');const [onlySaved,setOnlySaved]=useState(false);
 const [saved,setSaved]=useState(()=>{try{const value=JSON.parse(localStorage.getItem(`mentron.saved.${auth.user.id}`));return Array.isArray(value)?value.filter(id=>typeof id==='string'):[];}catch{return [];}});
 const query=useDebounce(search);const key=JSON.stringify([query,filter,semester,subject,onlySaved,onlySaved?saved:[]]);
 const page=pagination.key===key?pagination.page:0;
 const setPage=next=>setPagination({key,page:next});
 const state=useResource(()=>collection(kind,page,query,{filter,semester,subject,ids:onlySaved?saved:undefined}),[kind,page,key]);
 const facets=useResource(()=>collectionFacets(kind),[kind]);
 useEffect(()=>{if(!state.loading&&state.data&&page>0&&page*24>=state.data.count)setPagination({key,page:Math.max(0,Math.ceil(state.data.count/24)-1)});},[state.data,page,key]);
 function toggle(id){const next=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];setSaved(next);localStorage.setItem(`mentron.saved.${auth.user.id}`,JSON.stringify(next));}
 const [title,text]=titles[kind];const canCreate=['notes','projects','forum','market'].includes(kind);
 const items=state.data?.items||[];const metadata=facets.data||[];
 const options=unique(metadata.map(i=>kind==='notes'?i.department:kind==='events'?i.type:kind==='forum'?i.topic:i.category));
 const semesters=unique(metadata.filter(i=>!filter||i.department===filter).map(i=>i.semester));
 const subjects=unique(metadata.filter(i=>(!filter||i.department===filter)&&(!semester||i.semester===semester)).map(i=>i.subject));
 return <>
  <Intro title={title} text={text}>{canCreate&&<button className="primary-button" onClick={()=>setCreating(true)}><Plus size={17}/>{kind==='notes'?'Share notes':kind==='forum'?'Ask a question':kind==='market'?'Sell an item':'Submit a project'}</button>}</Intro>
  <div className="live-filter-row">
   <label>{kind==='notes'?'Department / group':'Filter'}<select aria-label={kind==='notes'?'Department / group':'Filter'} value={filter} disabled={facets.loading} onChange={e=>{setFilter(e.target.value);setSemester('');setSubject('');}}><option value="">{facets.loading?'Loading filters…':'All'}</option>{options.map(o=><option key={o} value={o}>{kind==='notes'?departmentNames[o]||o:o.replaceAll('_',' ')}</option>)}</select></label>
   {kind==='notes'&&<><label>Semester<select aria-label="Semester" value={semester} disabled={facets.loading} onChange={e=>{setSemester(e.target.value);setSubject('');}}><option value="">All semesters</option>{semesters.map(value=><option key={value}>{value}</option>)}</select></label><label>Subject<select aria-label="Subject" value={subject} disabled={facets.loading} onChange={e=>setSubject(e.target.value)}><option value="">All subjects</option>{subjects.map(value=><option key={value}>{value}</option>)}</select></label><button className="outline-button" aria-pressed={onlySaved} onClick={()=>setOnlySaved(!onlySaved)}>{onlySaved?'Show all notes':'Saved notes'}</button></>}
   {(filter||semester||subject)&&<button className="text-button" onClick={()=>{setFilter('');setSemester('');setSubject('');}}>Clear filters</button>}
   {facets.error&&<button className="text-button" onClick={facets.reload}>Reload filters</button>}
  </div>
  <ResourceState state={state}>
   {items.length?<div className="live-card-grid">{items.map((item,index)=><article className={`live-card ${['lavender','peach','mint','butter'][index%4]}`} key={item.id} data-resource-id={item.id}>
    <span className="eyebrow">{item.subject||departmentNames[item.department]||item.department||item.category||item.type||item.topic||'ISTE'}</span>
    {kind==='events'&&safeUrl(item.poster_url)&&<img className="live-poster" src={safeUrl(item.poster_url)} alt="" loading="lazy"/>}
    <h2>{item.title||item.name}</h2><p>{(item.description||item.content||'').slice(0,190)}</p>
    <span className="mini-label">{kind==='notes'?`${item.semester||''} · Year ${item.year}`:kind==='events'?`${item.date||'Date to be announced'} · ${item.location||'Location to be announced'}`:kind==='market'?`₹${Number(item.price).toLocaleString('en-IN')} · ${item.condition}`:kind==='projects'?item.role||'Collaborators welcome':item.topic}</span>
    <div className="live-card-actions"><button className="text-button" onClick={()=>setSelected(item)}>View {kind==='notes'?'resource':kind==='events'?'event':'details'}<ArrowUpRight size={17}/></button>{kind==='notes'&&<button className="text-button" aria-pressed={saved.includes(item.id)} onClick={()=>toggle(item.id)}>{saved.includes(item.id)?'Saved':'Save'}</button>}</div>
   </article>)}</div>:<EmptyState title={onlySaved?'No saved resources match.':'No results found.'} text="Try another search or filter."/>}
   <div className="pagination"><button className="outline-button" disabled={page===0} onClick={()=>setPage(page-1)}>Previous</button><span>Page {page+1} · {state.data?.count||0} results</span><button className="outline-button" disabled={(page+1)*24>=(state.data?.count||0)} onClick={()=>setPage(page+1)}>Next</button></div>
  </ResourceState>
  {selected&&<Detail kind={kind} item={selected} onClose={()=>setSelected(null)} notify={notify}/>}
  {creating&&<ContributionForm kind={kind} onClose={()=>setCreating(false)} onDone={()=>{setCreating(false);state.reload();facets.reload();notify(kind==='forum'?'Your question is published.':'Submitted for review.');}}/>}
 </>;
}
export function Detail({kind,item,onClose,notify}){
 const {profile,user}=useAuth();const [busy,setBusy]=useState(false);const [error,setError]=useState('');const [url,setUrl]=useState(null);
 const fileRequest=useRef(null);
 useEffect(()=>()=>fileRequest.current?.abort(),[]);
 useEffect(()=>()=>{if(url?.startsWith('blob:'))URL.revokeObjectURL(url);},[url]);
 async function open(){setBusy(true);setError('');fileRequest.current=new AbortController();try{setUrl(await documentUrl(item,profile,{signal:fileRequest.current.signal}));const key=`mentron.recent.${user.id}`;let history=[];try{history=JSON.parse(localStorage.getItem(key))||[];}catch{}localStorage.setItem(key,JSON.stringify([{id:item.id,title:item.title,at:new Date().toISOString()},...history.filter(i=>i.id!==item.id)].slice(0,50)));}catch(e){if(e.name!=='AbortError')setError(e.message);}finally{setBusy(false);}}
 return <Modal title={item.title||item.name} onClose={onClose} wide={kind==='notes'}><p className="live-body-text">{item.description||item.content}</p>{kind==='notes'&&<><div className="detail-facts"><span><BookOpen size={16}/>{item.subject}</span><span>{item.department} · {item.semester}</span>{item.require_iste_id&&<span><Lock size={16}/>ISTE members</span>}</div>{!url?<button className="primary-button" disabled={busy} onClick={open}>{busy?'Opening…':'Open document'}<ArrowUpRight size={17}/></button>:<a className="primary-button" href={url} target="_blank" rel="noreferrer">View document <ArrowUpRight size={17}/></a>}</>}
 {kind==='events'&&<><div className="detail-facts"><span><CalendarDays size={16}/>{item.date||'Date to be announced'}</span><span>{item.location||'Location to be announced'}</span><span>{item.is_paid?`Members ₹${item.member_price||0} · Non-members ₹${item.non_member_price||0}`:'Free event'}</span></div>{item.details&&<p className="event-details-copy">{item.details}</p>}{item.perks?.length>0&&<ul className="event-perks">{item.perks.map((p,i)=><li key={i}>{p}</li>)}</ul>}{(item.posters||[]).some(p=>safeUrl(p))&&<div className="event-detail-posters">{item.posters.filter(p=>safeUrl(p)).map((p,i)=><img key={i} src={safeUrl(p)} alt={`${item.title} poster ${i+1}`} loading="lazy"/>)}</div>}<a className="primary-button" href="https://istesctce.in/HTML/events.html" target="_blank" rel="noreferrer">Registration details<ArrowUpRight size={17}/></a></>}
 {kind==='projects'&&<ProjectApplication item={item} onDone={()=>{notify('Your application was sent.');onClose();}}/>}
 {kind==='market'&&<><p>Condition: {item.condition}</p><MarketCheckout item={item} onDone={()=>{notify('Payment submitted for verification. View its status in Orders.');onClose();}}/></>}
 {kind==='forum'&&<Discussion question={item.id} notify={notify}/>}
 {error&&<p role="alert" className="auth-feedback error">{error}</p>}</Modal>;
}
function Discussion({question,notify}){
 const {user}=useAuth();const state=useResource(()=>answers(question),[question]);const [text,setText]=useState('');const [busy,setBusy]=useState(false);const [error,setError]=useState('');
 async function post(e){e.preventDefault();setBusy(true);setError('');try{await answer(question,user.id,text.trim());setText('');state.reload();notify('Reply posted.');}catch(e){setError(e.message);}finally{setBusy(false);}}
 async function upvote(id){try{await vote(id,user.id);state.reload();}catch(e){setError(e.message);}}
 return <><h3>Replies</h3><ResourceState state={state}><div className="discussion-list">{state.data?.map(a=><article key={a.id}><p>{a.content}</p><button className="text-button" onClick={()=>upvote(a.id)}><ThumbsUp size={16}/>{a.upvotes} helpful</button></article>)}{!state.data?.length&&<p>No replies yet. Start the discussion.</p>}</div></ResourceState><form onSubmit={post}><label className="form-field">Your reply<textarea value={text} onChange={e=>setText(e.target.value)} required minLength={2} maxLength={5000}/></label><button className="primary-button" disabled={busy}>{busy?'Posting…':'Post reply'}</button></form>{error&&<p role="alert">{error}</p>}</>;
}
