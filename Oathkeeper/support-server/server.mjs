import http from 'node:http';
import {createRepairService} from './service.mjs';
import {fileStore,githubProvider,openAIDiagnose} from './providers.mjs';
export function createHandler(service,origins){return async(req,res)=>{
 const origin=req.headers.origin;res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(body))};
 if(origin&&!origins.has(origin))return reply(403,{error:'Origin not allowed'});if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin')}
 if(req.method==='OPTIONS'){res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS');res.writeHead(204);return res.end()}
 if(req.method!=='POST')return reply(405,{error:'Use POST'});
 try{if(!String(req.headers['content-type']).startsWith('application/json'))return reply(415,{error:'Use application/json'});let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>20000)return reply(413,{error:'Report too large'})}let body;try{body=JSON.parse(text)}catch{return reply(400,{error:'Invalid JSON'})}const credential=String(req.headers.authorization||'').replace(/^Bearer /,'');
  if(req.url==='/reports')return reply(200,await service.report(credential,body));const match=req.url?.match(/^\/repairs\/([a-f0-9-]{36})\/approve$/);if(match)return reply(200,await service.approve(credential,match[1],body.digest));return reply(404,{error:'Route not found'});
 }catch(error){return reply(error.status||400,{error:error.message})}
}}
if(import.meta.url===new URL(process.argv[1]||'', 'file:').href){
 const service=createRepairService({store:fileStore(process.env.SUPPORT_DATA_FILE||'/var/lib/oathkeeper/proposals.json'),diagnose:openAIDiagnose({apiKey:process.env.OPENAI_API_KEY,model:process.env.OPENAI_MODEL}),github:githubProvider({token:process.env.SUPPORT_GITHUB_TOKEN,repository:process.env.SUPPORT_GITHUB_REPOSITORY,branch:process.env.SUPPORT_GITHUB_BRANCH}),ownerToken:process.env.SUPPORT_OWNER_TOKEN,clientToken:process.env.SUPPORT_CLIENT_TOKEN});
 const origins=new Set((process.env.SUPPORT_ALLOWED_ORIGINS||'https://localhost,capacitor://localhost').split(',').map(s=>s.trim()).filter(Boolean));
 const server=http.createServer(createHandler(service,origins));server.requestTimeout=65000;server.headersTimeout=10000;server.listen(Number(process.env.PORT||8787),process.env.HOST||'127.0.0.1',()=>console.log('Oathkeeper approval-gated repair service started'));
}
