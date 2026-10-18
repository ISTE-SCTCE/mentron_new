export async function validateUpload(file,kind){
 const pdf=kind==='cv';const limit=(pdf?10:5)*1024*1024;
 if(!file||file.size<=0)throw new Error('Choose a file to upload.');
 if(file.size>limit)throw new Error(`Choose a file smaller than ${pdf?10:5} MB.`);
 const bytes=new Uint8Array(await file.slice(0,8).arrayBuffer());
 const isPdf=bytes[0]===37&&bytes[1]===80&&bytes[2]===68&&bytes[3]===70&&bytes[4]===45;
 const isPng=[137,80,78,71,13,10,26,10].every((n,i)=>bytes[i]===n);
 const isJpeg=bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(pdf&&isPdf&&/\.pdf$/i.test(file.name))return {extension:'pdf',contentType:'application/pdf'};
 if(!pdf&&isPng&&/\.png$/i.test(file.name))return {extension:'png',contentType:'image/png'};
 if(!pdf&&isJpeg&&/\.jpe?g$/i.test(file.name))return {extension:'jpg',contentType:'image/jpeg'};
 throw new Error(pdf?'Choose a valid PDF CV.':'Choose a valid JPG or PNG image.');
}
