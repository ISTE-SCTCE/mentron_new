import {backend,check} from './backend';
import {isMember,safeUrl} from './domain';
import {storageReference,certificateReference} from './storage-reference';
const study=()=>backend().schema('mentron');
export const columns={
 notes:'id,title,description,department,year,semester,subject,folder_id,require_iste_id,profile_id,created_at',
 projects:'id,title,description,category,role,duration,posted_by,created_at,cv_required,is_approved',
 events:'id,title,date,description,details,perks,posters,type,category,location,poster_url,is_paid,member_price,non_member_price,allowed_roles,num_days',
 market:'id,title,description,category,condition,price,images,status,seller_id,created_at',
};
export async function collection(kind,page=0,search='',options={}){
 if(options.ids){
  const ids=[...new Set(options.ids)].filter(id=>/^[a-f0-9-]{36}$/i.test(String(id)));
  if(!ids.length)return {items:[],count:0};
  const matches=[];
  for(let start=0;start<ids.length;start+=100){
   const result=await collection(kind,0,search,{...options,ids:undefined,idBatch:ids.slice(start,start+100),batch:true});
   matches.push(...result.items);
  }
  matches.sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at))||String(a.id).localeCompare(String(b.id)));
  return {items:matches.slice(page*24,page*24+24),count:matches.length};
 }
 let query;
 if(kind==='events')query=backend().from('events').select(columns.events,{count:'exact'}).order('date',{ascending:false});
 else if(kind==='notes')query=study().from('notes').select(columns.notes,{count:'exact'}).order('created_at',{ascending:false});
 else if(kind==='gate')throw new Error('The GATE library is not available yet.');
 else if(kind==='projects')query=study().from('projects').select(columns.projects,{count:'exact'}).eq('is_approved',true).order('created_at',{ascending:false});
 else if(kind==='market')query=study().from('marketplace_listings').select(columns.market,{count:'exact'}).eq('status','live').order('created_at',{ascending:false});
 else if(kind==='forum')query=study().from('forum_questions').select('id,title,content,topic,is_anonymous,created_at,resolved,author_id',{count:'exact'}).order('created_at',{ascending:false});
 else throw new Error('Unknown collection');
 query=query.order('id',{ascending:true});
 if(search){
  const value=`%${search.replace(/[%_\\]/g,'')}%`;
  if(kind==='notes'){const quoted=JSON.stringify(value);query=query.or(`title.ilike.${quoted},description.ilike.${quoted},subject.ilike.${quoted}`);}
  else query=query.ilike('title',value);
 }
 const filterColumn=kind==='notes'?'department':kind==='events'?'type':kind==='forum'?'topic':'category';
 if(options.filter)query=query.eq(filterColumn,options.filter);
 if(kind==='notes'&&options.semester)query=query.eq('semester',options.semester);
 if(kind==='notes'&&options.year)query=query.eq('year',Number(options.year));
 if(kind==='notes'&&options.subjects?.length)query=query.in('subject',options.subjects);
 if(kind==='notes'&&options.folder!==undefined)query=options.folder?query.eq('folder_id',options.folder):query.is('folder_id',null);
 if(kind==='notes'&&options.contributor)query=query.eq('profile_id',options.contributor);
 if(kind==='notes'&&options.subject)query=query.eq('subject',options.subject);
 if(options.idBatch)query=query.in('id',options.idBatch);
 const result=await query.range(options.batch?0:page*24,options.batch?99:page*24+23);check(result);return {items:result.data,count:result.count||0};
}
export async function collectionFacets(kind){
 const tables={notes:'notes',projects:'projects',market:'marketplace_listings',forum:'forum_questions',events:'events'};
 if(!tables[kind])return [];
 const fields=kind==='notes'?'id,department,year,semester,subject,folder_id,require_iste_id':kind==='events'?'id,type':kind==='forum'?'id,topic':'id,category';
 const rows=[];
 for(let page=0;;page++){
  let query=(kind==='events'?backend():study()).from(tables[kind]).select(fields).order('id');
  if(kind==='projects')query=query.eq('is_approved',true);
  if(kind==='market')query=query.eq('status','live');
  const batch=check(await query.range(page*1000,page*1000+999));rows.push(...batch);
  if(batch.length<1000)return rows;
 }
}
export async function notesDirectory(){
 const folders=[];
 for(let page=0;;page++){
  const rows=check(await study().from('note_folders').select('id,name,subject,department,year,semester,requires_auth').order('id').range(page*1000,page*1000+999));
  folders.push(...rows);if(rows.length<1000)break;
 }
 return {notes:await collectionFacets('notes'),folders};
}
export async function announcements(){return check(await backend().from('announcements').select('id,title,content,created_at,visibility').order('created_at',{ascending:false}).limit(5));}
export async function own(kind,user){
 if(kind==='certificates')return check(await backend().from('certificates').select('id,title,event_id,issued_at,uploaded_at,description,storage_path,certificate_url,file_url').eq('user_id',user).order('issued_at',{ascending:false}));
 if(kind==='attendance')return check(await backend().from('session_attendance').select('id,event_session_id,status,marked_at,event_sessions(event_id,session_date,session_period,events(title))').eq('profile_id',user).order('marked_at',{ascending:false}));
 if(kind==='applications')return check(await study().from('project_applications').select('id,project_id,status,created_at,message,projects(title)').eq('profile_id',user).order('created_at',{ascending:false}));
 if(kind==='orders')return check(await study().from('marketplace_orders').select('id,listing_id,amount,order_status,created_at,delivery_deadline,marketplace_listings(title)').eq('buyer_id',user).order('created_at',{ascending:false}));
 if(kind==='notifications')return check(await study().from('notifications').select('id,title,message,is_read,created_at').eq('user_id',user).order('created_at',{ascending:false}).limit(100));
 return [];
}
export async function documentUrl(note,profile,{signal}={}){
 if(note.require_iste_id&&!isMember(profile))throw new Error('An active ISTE membership is required for this resource.');
 const row=check(await study().from('notes').select('file_url,require_iste_id').eq('id',note.id).single());
 if(row.require_iste_id&&!isMember(profile))throw new Error('An active ISTE membership is required.');
 if(row.file_url?.startsWith('/api/files/notes_bucket/')){
  const session=check(await backend().auth.getSession()).session;
  if(!session)throw new Error('Please log in again to open this document.');
  const response=await fetch(row.file_url,{headers:{Authorization:`Bearer ${session.access_token}`},cache:'no-store',signal});
  if(!response.ok){const error=await response.json().catch(()=>null);throw new Error(error?.error||'This document is unavailable. Please contact ISTE.');}
  const blob=await response.blob();
  if(!blob.size||blob.type.includes('text/html'))throw new Error('The document service is unavailable. Please try again.');
  if(blob.type==='application/pdf'&&await blob.slice(0,5).text()!=='%PDF-')throw new Error('This PDF is unavailable. Please contact ISTE.');
  return URL.createObjectURL(blob);
 }
 const ref=storageReference(row.file_url);const url=ref?check(await backend().storage.from(ref.bucket).createSignedUrl(ref.path,120)).signedUrl:safeUrl(row.file_url);if(!url)throw new Error('This document link is unavailable. Please contact ISTE.');return url;
}
export async function saveProfile(patch,id){return check(await backend().from('profiles').update(patch).eq('id',id));}
export async function apply(project,user,message){if(project.posted_by===user)throw new Error('You own this project.');return check(await study().from('project_applications').insert({project_id:project.id,profile_id:user,message,status:'pending'}));}
export async function submitContent(kind,input,user){
 if(kind==='projects')return check(await study().from('pending_projects').insert({title:input.title,description:input.description,category:input.category,role:input.role,duration:input.duration,posted_by:user}));
 if(kind==='notes')return check(await study().from('pending_notes').insert({title:input.title,description:input.description,file_url:input.file_url,department:input.department,year:Number(input.year),semester:input.semester,subject:input.subject,profile_id:user}));
 if(kind==='forum')return check(await study().from('forum_questions').insert({title:input.title,content:input.description,topic:input.category,author_id:user,is_anonymous:false}));
 if(kind==='market')return check(await study().from('marketplace_listings').insert({title:input.title,description:input.description,category:input.category,condition:input.condition,price:Number(input.price),images:[],seller_id:user,status:'pending_review'}));
}
export async function answers(question){return check(await study().from('forum_answers').select('id,content,upvotes,author_id,is_anonymous,created_at,is_best_answer').eq('question_id',question).order('created_at'));}
export async function answer(question,user,content){return check(await study().from('forum_answers').insert({question_id:question,author_id:user,content,is_anonymous:false}));}
export async function vote(answer,user){return check(await study().rpc('handle_forum_vote',{p_answer_id:answer,p_user_id:user,p_vote_value:1}));}
export async function markRead(id,user){return check(await study().from('notifications').update({is_read:true}).eq('id',id).eq('user_id',user));}
export {storageReference} from './storage-reference';
export async function issueAttendanceToken(){return check(await backend().rpc('issue_attendance_token'));}
export async function eventSessions(){return check(await backend().from('event_sessions').select('id,event_id,session_date,session_period,events(title)').order('session_date',{ascending:false}).limit(100));}
export async function consumeAttendanceToken(input){return check(await backend().rpc('consume_attendance_token',input));}
export async function managementList(kind){if(kind==='events')return check(await backend().from('events').select('id,title,date,location').order('date',{ascending:false}).limit(100));if(kind==='announcements')return check(await backend().from('announcements').select('id,title,content,visibility,created_at').order('created_at',{ascending:false}).limit(100));if(!['pending_notes','pending_projects'].includes(kind))return [];return check(await study().from(kind).select('id,title,description,created_at').order('created_at',{ascending:false}).limit(100));}
export async function publishManagement(kind,input,user){if(kind==='events')return check(await backend().from('events').insert({id:Date.now(),title:input.title,date:input.date,description:input.content,location:input.location,created_by:user,is_paid:false}));if(kind==='announcements')return check(await backend().from('announcements').insert({title:input.title,content:input.content,visibility:'public',created_by:user}));throw new Error('Unsupported action.');}
export async function certificateUrl(item){const ref=certificateReference(item);if(!ref)throw new Error('Your certificate file is not available yet. Please contact ISTE.');return check(await backend().storage.from(ref.bucket).createSignedUrl(ref.path,120)).signedUrl;}
