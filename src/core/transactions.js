import {backend,check} from './backend';
import {validateUpload} from './uploads';
const study=()=>backend().schema('mentron');
async function upload(bucket,file,user,id,kind){
 const {extension,contentType}=await validateUpload(file,kind);
 const path=`${user}/${id}.${extension}`;
 check(await backend().storage.from(bucket).upload(path,file,{contentType,upsert:true}));
 return {bucket,path,url:backend().storage.from(bucket).getPublicUrl(path).data.publicUrl};
}
export async function applyWithCV(project,user,message,file,id){
 if(project.posted_by===user)throw new Error('You own this project.');
 const previous=check(await study().from('project_applications').select('id').eq('project_id',project.id).eq('profile_id',user).maybeSingle());
 if(previous)throw new Error('You have already applied to this project.');
 if(project.cv_required&&!file)throw new Error('Attach your PDF CV to apply.');
 const cv=file?await upload('mentron-cv_bucket',file,user,id,'cv'):null;
 // Keep the same submission id on retry so an interrupted response cannot create a second application.
 check(await study().from('project_applications').insert({id,project_id:project.id,profile_id:user,message:message.trim(),cv_url:cv?.url||null,status:'pending'}));
}
export async function checkoutDetails(listing,user){
 const ready=await backend().rpc('mentronplus_payment_ready');
 if(ready.error||ready.data!==true)throw new Error('Marketplace payments are temporarily unavailable. Please contact ISTE before paying.');
 const [item,settings,existing]=await Promise.all([
  study().from('marketplace_listings').select('id,title,price,status,seller_id').eq('id',listing).single(),
  study().from('payment_settings').select('qr_image_url,upi_id').limit(1).maybeSingle(),
  study().from('marketplace_orders').select('id,order_status').eq('listing_id',listing).eq('buyer_id',user).in('order_status',['pending_verification','payment_confirmed','delivered']).limit(1).maybeSingle(),
 ]);
 return {item:check(item),settings:check(settings),existing:check(existing)};
}
export async function submitPayment({id,listing,user,file,utr,phone,accepted}){
 if(!accepted)throw new Error('Confirm the payment details before submitting.');
 if(!/^[A-Za-z0-9]{6,40}$/.test(utr.trim()))throw new Error('Enter a valid transaction reference.');
 if(!/^\+?[\d\s()-]{10,18}$/.test(phone.trim()))throw new Error('Enter a valid contact number.');
 const details=await checkoutDetails(listing,user);
 if(details.existing){if(details.existing.id===id)return;throw new Error('An order already exists. Check your orders for its status.');}
 if(details.item.status!=='live'||details.item.seller_id===user)throw new Error('This listing is unavailable for purchase.');
 const proof=await upload('mentron-marketplace-payment-proofs',file,user,id,'proof');
 check(await study().from('marketplace_orders').insert({id,listing_id:listing,buyer_id:user,amount:details.item.price,payment_proof_url:proof.path,utr_number:utr.trim(),phone_number:phone.trim(),disclaimer_accepted_at:new Date().toISOString(),order_status:'pending_verification'}));
}
