import React,{useEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowUpRight,BookOpen,Folder,FileText,Film,Lock,Plus,RefreshCw,ChevronRight} from 'lucide-react';
import {useAuth} from '../core/Auth';
import {useDebounce,useResource} from '../core/hooks';
import {collection,notesDirectory} from '../core/repository';
import {years,groups,departments,notesHref,readNotesSelection,inNotesScope,subjectDirectory,subjectVariants,visibleSubjectFolders,normalizeSubject} from '../core/notes-navigation';
import {Intro,Detail} from './CollectionPage';
import {ResourceState} from './Dashboard';
import {EmptyState} from '../components';
import ContributionForm from './ContributionForm';
import './notes.css';

function BrowseCard({href,title,description,count,Icon=Folder,index=0,locked=false}){
 return <a href={href} className={`notes-folder-card ${['lavender','peach','mint','butter'][index%4]}`}><span className="notes-folder-top"><Icon size={27} strokeWidth={1.5}/><ArrowUpRight size={19}/></span><h2>{title}</h2>{description&&<p>{description}</p>}<span className="notes-folder-foot">{count!==undefined?`${count} ${count===1?'resource':'resources'}`:'Browse resources'}{locked&&<span><Lock size={13}/>ISTE members</span>}<ArrowRight size={17}/></span></a>;
}
export default function NotesPage({search,notify}){
 const {user}=useAuth();const [selection,setSelection]=useState(()=>readNotesSelection(location.hash));const [selected,setSelected]=useState(null);const [creating,setCreating]=useState(false);const heading=useRef(null);
 const storageKey=`mentron.saved.${user.id}`;
 const readSaved=()=>{try{const value=JSON.parse(localStorage.getItem(storageKey));return Array.isArray(value)?value.filter(x=>typeof x==='string'):[];}catch{return [];}};
 const [saved,setSaved]=useState(readSaved);
 useEffect(()=>{const changed=()=>{setSelection(readNotesSelection(location.hash));setSelected(null);window.scrollTo(0,0);heading.current?.focus({preventScroll:true});};window.addEventListener('hashchange',changed);return()=>window.removeEventListener('hashchange',changed);},[]);
 useEffect(()=>{const sync=e=>{if(e.key===storageKey)setSaved(readSaved());};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[storageKey]);
 const directory=useResource(notesDirectory,[]);const notes=directory.data?.notes||[];const folders=directory.data?.folders||[];
 const query=useDebounce(search.trim());const view=selection.view||'';const list=Boolean(query||view||selection.subject);
 const [pagination,setPagination]=useState({key:'',page:0});const key=JSON.stringify([selection,query,view==='saved'?saved:[]]);const page=pagination.key===key?pagination.page:0;
 const state=useResource(()=>list?collection('notes',page,query,{
  filter:query?'':selection.department,year:query?'':selection.year,semester:query?'':selection.semester,
  subjects:!query&&selection.subject?subjectVariants(notes,folders,selection):undefined,
  folder:!query&&selection.subject?selection.folder||null:undefined,
  ids:view==='saved'?saved:undefined,contributor:view==='contributions'?user.id:undefined,
 }):Promise.resolve({items:[],count:0}),[key,page,list,directory.data]);
 useEffect(()=>{if(!state.loading&&state.data&&page>0&&page*24>=state.data.count)setPagination({key,page:Math.max(0,Math.ceil(state.data.count/24)-1)});},[state.data,page,key]);
 function toggle(id){try{const next=saved.includes(id)?saved.filter(x=>x!==id):[...saved,id];localStorage.setItem(storageKey,JSON.stringify(next));setSaved(next);}catch{notify('Unable to save on this device. Please check your browser storage.');}}
 const branchMeta=selection.year==='1'?groups:departments;
 const scoped=notes.filter(n=>inNotesScope(n,selection));
 const subjectEntries=subjectDirectory(notes,folders,selection);
 const subjectFolders=selection.subject?visibleSubjectFolders(notes,folders,selection):[];
 const currentFolder=folders.find(f=>f.id===selection.folder);
 const currentSubject=(selection.type==='pyq'?'PYQ - ':selection.type==='video'?'Video - ':'')+(selection.subject||'');
 const subjectCount=type=>scoped.filter(n=>normalizeSubject(n.subject)===normalizeSubject((type==='pyq'?'PYQ - ':'Video - ')+selection.subject)).length;
 const title=query?'Search results':view==='saved'?'Saved notes':view==='contributions'?'My contributions':view==='all'?'All notes':selection.folder?currentFolder?.name||'Folder':selection.type==='pyq'?'Past year questions':selection.type==='video'?'Video lectures':selection.subject||(!selection.year?'Study library':!selection.semester?years.find(y=>y[0]===selection.year)?.[1]:!selection.department?'Choose your '+(selection.year==='1'?'group':'department'):'Choose your subject');
 const text=query?`Results across your study library for “${query}”.`:selection.subject?`${selection.subject} · ${selection.semester} · ${branchMeta[selection.department]?.[0]||selection.department}`:'Start with your year, then choose a semester, department, and subject.';
 const crumbs=[['Notes',{}],...(selection.year?[[years.find(y=>y[0]===selection.year)?.[1],{year:selection.year}]]:[]),...(selection.semester?[[selection.semester,{year:selection.year,semester:selection.semester}]]:[]),...(selection.department?[[branchMeta[selection.department]?.[0]||selection.department,{year:selection.year,semester:selection.semester,department:selection.department}]]:[]),...(selection.subject?[[selection.subject,{year:selection.year,semester:selection.semester,department:selection.department,subject:selection.subject}]]:[]),...(selection.type?[[selection.type==='pyq'?'PYQs':'Video lectures',{...selection,folder:''}]]:[]),...(selection.folder?[[currentFolder?.name||'Folder',selection]]:[])];
 const countFor=s=>notes.filter(n=>inNotesScope(n,s)).length;
 return <>
  <nav className="notes-breadcrumb" aria-label="Study library breadcrumb">{crumbs.map(([label,value],i)=><React.Fragment key={i}>{i>0&&<ChevronRight size={13} aria-hidden="true"/>}<a href={notesHref(value)} aria-current={i===crumbs.length-1?'page':undefined}>{label}</a></React.Fragment>)}</nav>
  <div ref={heading} tabIndex={-1} className="notes-heading"><Intro title={title} text={text}><button className="primary-button" onClick={()=>setCreating(true)}><Plus size={17}/>Share notes</button></Intro></div>
  <div className="notes-tools"><nav aria-label="Study library views">{[['','Browse'],['all','All notes'],['saved','Saved notes'],['contributions','My contributions']].map(([id,label])=><a key={id} href={notesHref(id?{view:id}:{})} aria-current={view===id?'page':undefined}>{label}</a>)}</nav><button className="text-button" disabled={directory.refreshing||state.refreshing} onClick={()=>{directory.reload();state.reload();}}><RefreshCw size={15}/>{directory.refreshing||state.refreshing?'Refreshing…':'Refresh'}</button></div>
  <ResourceState state={directory}>
   {!list&&!selection.year&&<div className="notes-folder-grid notes-year-grid">{years.map(([year,label,sems],i)=><BrowseCard key={year} href={notesHref({year})} title={label} description={sems} count={countFor({year})} Icon={BookOpen} index={i}/>)}</div>}
   {!list&&selection.year&&!selection.semester&&<div className="notes-folder-grid">{[Number(selection.year)*2-1,Number(selection.year)*2].map((n,i)=><BrowseCard key={n} href={notesHref({...selection,semester:`S${n}`})} title={`Semester ${n}`} description={`${years.find(y=>y[0]===selection.year)?.[1]} · S${n}`} count={countFor({...selection,semester:`S${n}`})} index={i}/>)}</div>}
   {!list&&selection.semester&&!selection.department&&<div className="notes-folder-grid">{Object.entries(branchMeta).map(([id,[name,description]],i)=><BrowseCard key={id} href={notesHref({...selection,department:id})} title={name} description={description} count={countFor({...selection,department:id})} index={i}/>)}</div>}
   {!list&&selection.department&&<>{subjectEntries.length?<div className="notes-folder-grid">{subjectEntries.map((s,i)=><BrowseCard key={s.name} href={notesHref({...selection,subject:s.name})} title={s.name} count={s.count} index={i}/>)}</div>:<EmptyState title="No subjects published here yet." text="Try another semester or department."/>}{scoped.some(n=>!n.subject)&&<a className="text-button" href={notesHref({...selection,view:'all'})}>Browse uncategorised resources <ArrowRight size={16}/></a>}</>}
   {!query&&!view&&selection.subject&&!selection.folder&&<>
    {!selection.type&&<div className="notes-virtual-grid"><BrowseCard href={notesHref({...selection,type:'pyq'})} title="PYQs" description="Past year questions" count={subjectCount('pyq')} Icon={FileText}/><BrowseCard href={notesHref({...selection,type:'video'})} title="Video lectures" description="Tutorials and guides" count={subjectCount('video')} Icon={Film} index={1}/></div>}
    {subjectFolders.length>0&&<><h2 className="notes-subheading">Folders</h2><div className="notes-folder-grid notes-custom-folders">{subjectFolders.map((folder,i)=><BrowseCard key={folder.id} href={notesHref({...selection,folder:folder.id})} title={folder.name} count={scoped.filter(n=>n.folder_id===folder.id).length} locked={folder.requires_auth} index={i}/>)}</div></>}
   </>}
   {list&&<><h2 className="notes-subheading">{selection.subject&&!view&&!query?'Resources':'Notes'}</h2><ResourceState state={state}>{state.data?.items.length?<div className="live-card-grid">{state.data.items.map((item,i)=><article className={`live-card ${['lavender','peach','mint','butter'][i%4]}`} key={item.id} data-resource-id={item.id}><span className="eyebrow">{item.subject||'Study resource'}</span><h2>{item.title}</h2><p>{item.description}</p><span className="mini-label">{item.department} · {item.semester} · Year {item.year}{item.require_iste_id?' · ISTE members':''}</span><div className="live-card-actions"><button className="text-button" onClick={()=>setSelected(item)}>View resource <ArrowUpRight size={17}/></button><button className="text-button" aria-pressed={saved.includes(item.id)} onClick={()=>toggle(item.id)}>{saved.includes(item.id)?'Saved':'Save'}</button></div></article>)}</div>:<EmptyState title={view==='saved'?'No saved notes match.':'No resources here yet.'} text={selection.subject?'Check the subject folders or choose another subject.':'Try another search or browse by year.'}/>}<div className="pagination"><button className="outline-button" disabled={page===0} onClick={()=>setPagination({key,page:page-1})}>Previous</button><span>Page {page+1} · {state.data?.count||0} results</span><button className="outline-button" disabled={(page+1)*24>=(state.data?.count||0)} onClick={()=>setPagination({key,page:page+1})}>Next</button></div></ResourceState></>}
  </ResourceState>
  {selected&&<Detail kind="notes" item={selected} onClose={()=>setSelected(null)} notify={notify}/>}
  {creating&&<ContributionForm kind="notes" initial={{year:selection.year,semester:selection.semester,department:selection.department,subject:currentSubject}} onClose={()=>setCreating(false)} onDone={()=>{setCreating(false);directory.reload();state.reload();notify('Submitted for review.');}}/>}
 </>;
}
