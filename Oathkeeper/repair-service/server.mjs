import {createServer} from 'node:http';
import {pathToFileURL} from 'node:url';
import {authorized,createRepairService} from './core.mjs';
export function repairHandler({service,accessToken,ownerToken,origins=[]}){
 if(!accessToken||accessToken.length<32||!ownerToken||ownerToken.length<32||accessToken===ownerToken)throw Error('Configure distinct access and owner tokens, each at least 32 characters');
 let inFlight=0;const requests=[];
 return async(req,res)=>{
  res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','application/json');res.setHeader('X-Content-Type-Options','nosniff');
  const origin=req.headers.origin;
  if(origin&&!origins.includes(origin)){res.writeHead(403);res.end(JSON.stringify({error:'Origin not permitted'}));return}
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.setHeader('Access-Control-Allow-Headers','Authorization, Content-Type');res.setHeader('Access-Control-Allow-Methods','POST, OPTIONS')}
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return}
  const approve=/^\/repairs\/([a-f0-9-]{36})\/approve$/.exec(req.url);
  const send=(status,data)=>{res.writeHead(status);res.end(JSON.stringify(data))};
  if(req.method!=='POST'||(!approve&&req.url!=='/reports'))return send(404,{error:'Not found'});
  if(!authorized(req.headers.authorization,approve?ownerToken:accessToken))return send(401,{error:'Invalid credential'});
  if(!String(req.headers['content-type']).startsWith('application/json'))return send(415,{error:'Use application/json'});
  const now=Date.now();while(requests.length&&requests[0]<now-60000)requests.shift();
  if(inFlight>=2||requests.length>=10)return send(429,{error:'Busy; retry in a minute'});requests.push(now);inFlight++;
  try{let data='',bytes=0;for await(const part of req){bytes+=part.length;if(bytes>30000)throw Error('Report body too large');data+=part.toString('utf8')}const body=JSON.parse(data);const result=approve?await service.approve(approve[1],body.digest):await service.diagnose(body.report);send(200,result)}catch(error){const known=/^(Invalid|Report|Proposal|Source|No file|Approval|AI output|Upstream|Repair service)/.test(error.message);send(400,{error:known?error.message:'Request could not be completed. Check the service configuration and request a new diagnosis.'})}finally{inFlight--}
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const env=process.env;
 const service=createRepairService({repo:env.GITHUB_REPOSITORY,baseBranch:env.REPAIR_BASE_BRANCH||'main',githubToken:env.GITHUB_TOKEN,openaiKey:env.OPENAI_API_KEY,model:env.OPENAI_MODEL,storeDir:env.REPAIR_DATA_DIR||'./repair-data'});
 const server=createServer(repairHandler({service,accessToken:env.REPAIR_ACCESS_TOKEN,ownerToken:env.REPAIR_OWNER_TOKEN,origins:(env.REPAIR_ORIGINS||'https://localhost').split(',')}));
 server.requestTimeout=70000;server.headersTimeout=10000;server.listen(Number(env.PORT||8787),'0.0.0.0',()=>console.log('Oathkeeper repair service listening'));
}
