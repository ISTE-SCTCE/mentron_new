import {backend,check} from './backend';
const study=()=>backend().schema('mentron');
const fields={pending_notes:'id,title,description,department,year,file_url,profile_id,created_at,semester,subject',pending_projects:'id,title,description,category,role,duration,posted_by,created_at'};
export async function reviewQueue(kind){
 if(kind==='listings')return check(await study().from('marketplace_listings').select('id,title,description,price,category,condition,status,created_at').eq('status','pending_review').order('created_at',{ascending:false}).limit(100));
 if(kind==='payments')return check(await study().from('marketplace_orders').select('id,amount,order_status,utr_number,payment_proof_url,created_at,marketplace_listings(title)').in('order_status',['pending_verification','payment_confirmed']).order('created_at',{ascending:false}).limit(100));
 if(!fields[kind])throw new Error('Unknown review queue.');
 const pending=check(await study().from(kind).select(fields[kind]).order('created_at',{ascending:false}).limit(100));
 if(!pending.length)return [];
 const published=check(await study().from(kind==='pending_notes'?'notes':'projects').select('id').in('id',pending.map(row=>row.id)));
 const ids=new Set(published.map(row=>row.id));return pending.filter(row=>!ids.has(row.id));
}
export async function approveSubmission(kind,id){
 if(!fields[kind])throw new Error('Unknown submission type.');
 const row=check(await study().from(kind).select(fields[kind]).eq('id',id).single());
 const table=kind==='pending_notes'?'notes':'projects';
 const previous=check(await study().from(table).select('id').eq('id',id).maybeSingle());
 if(previous)return;
 // Retain the original submission as an audit record; its id prevents duplicate publication on retry.
 const input=kind==='pending_notes'?{...row,created_by:row.profile_id,require_iste_id:true}:{...row,is_approved:true,cv_required:false};
 check(await study().from(table).insert(input));
}
export async function approveListing(id){return check(await study().from('marketplace_listings').update({status:'live'}).eq('id',id).eq('status','pending_review').select('id').single());}
export async function paymentReceipt(row){
 if(!row.payment_proof_url)throw new Error('No payment receipt was attached.');
 return check(await backend().storage.from('mentron-marketplace-payment-proofs').createSignedUrl(row.payment_proof_url,120)).signedUrl;
}
export async function advanceOrder(row,user){
 const status=row.order_status==='pending_verification'?'payment_confirmed':row.order_status==='payment_confirmed'?'delivered':null;
 if(!status)throw new Error('This order cannot be advanced.');
 const patch=status==='payment_confirmed'?{order_status:status,verified_by:user,verified_at:new Date().toISOString()}:{order_status:status};
 check(await study().from('marketplace_orders').update(patch).eq('id',row.id).eq('order_status',row.order_status).select('id').single());
}
