import {configuredFileHandler} from '../../server/files.mjs';
import {securityHeaders} from '../../server/security.mjs';
const files=configuredFileHandler(process.env);
export default async function handler(req,res){
 securityHeaders(res,{https:true});
 return files(req,res,()=>{res.writeHead(404,{'Cache-Control':'no-store'});res.end();});
}
