import {createHash,randomUUID,timingSafeEqual} from 'node:crypto';
export const digest=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const sameSecret=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length>=32&&b.length>=32&&timingSafeEqual(createHash('sha256').update(a).digest(),createHash('sha256').update(b).digest());
export const redact=value=>String(value).slice(0,12000).replace(/Bearer\s+\S+/gi,'Bearer [redacted]').replace(/\bsk-[A-Za-z0-9_-]+/g,'[redacted key]').replace(/([?&](?:token|key|password|secret)=)[^&\s]+/gi,'$1[redacted]').replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,'[redacted email]');
export function validateProposal(p,snapshot){
 if(!p||typeof p.summary!=='string'||typeof p.risk!=='string'||typeof p.tests!=='string'||!Array.isArray(p.files)||p.files.length>3)throw Error('Invalid AI repair proposal');
 const seen=new Set();let size=0;
 const files=p.files.map(f=>{if(!f||typeof f.path!=='string'||typeof f.content!=='string'||!Object.hasOwn(snapshot.files,f.path)||!/^Oathkeeper\/(web\/[a-z0-9-]+\.(js|css)|tests\/[a-z0-9.-]+\.mjs)$/.test(f.path)||seen.has(f.path))throw Error('Proposal path is not approved');seen.add(f.path);size+=f.content.length;if(size>300000||f.content.length>200000)throw Error('Proposal is too large');return {path:f.path,content:f.content}});
 return {summary:p.summary.slice(0,4000),risk:p.risk.slice(0,4000),tests:p.tests.slice(0,4000),files};
}
export function createRepairService({store,diagnose,github,ownerToken,clientToken,now=Date.now}){
 if(!ownerToken||!clientToken||ownerToken.length<32||clientToken.length<32||sameSecret(ownerToken,clientToken))throw Error('Set distinct owner and client credentials, each at least 32 characters');
 let queue=Promise.resolve();const exclusive=fn=>{const job=queue.then(fn,fn);queue=job.catch(()=>{});return job};
 const authorize=(credential,owner=false)=>{if(!sameSecret(credential,owner?ownerToken:clientToken))throw Object.assign(Error('Unauthorized'),{status:401})};
 const rate=new Map();function limit(key,max){const start=Math.floor(now()/3600000),entry=rate.get(key);const count=entry?.start===start?entry.count+1:1;rate.set(key,{start,count});if(count>max)throw Object.assign(Error('Hourly request limit reached'),{status:429})}
 const publicProposal=r=>({id:r.id,digest:r.digest,baseSha:r.baseSha,baseBranch:r.baseBranch,proposal:r.proposal,status:r.status});
 return {
 async report(credential,body){authorize(credential);limit('reports',20);if(!body||typeof body.report!=='string'||!body.report.trim()||body.report.length>16000)throw Object.assign(Error('Enter a bounded diagnostic report'),{status:400});
  const snapshot=await github.snapshot();const proposal=validateProposal(await diagnose(redact(body.report),snapshot),snapshot);
  const record={id:randomUUID(),created:now(),baseSha:snapshot.sha,baseBranch:snapshot.branch,proposal,status:'awaiting-owner-approval'};record.digest=digest({id:record.id,baseSha:record.baseSha,baseBranch:record.baseBranch,proposal});
  await exclusive(async()=>{const records=(await store.load()).filter(r=>now()-r.created<86400000).slice(-99);records.push(record);await store.save(records)});return publicProposal(record);
 },
 async approve(credential,id,expectedDigest){authorize(credential,true);limit('approvals',30);return exclusive(async()=>{
  const records=await store.load(),r=records.find(x=>x.id===id);if(!r)throw Object.assign(Error('Proposal not found'),{status:404});if(now()-r.created>86400000)throw Object.assign(Error('Proposal expired; request a fresh diagnosis'),{status:409});
  if(r.digest!==expectedDigest||digest({id:r.id,baseSha:r.baseSha,baseBranch:r.baseBranch,proposal:r.proposal})!==r.digest)throw Object.assign(Error('Proposal changed; review again'),{status:409});
  if(r.status!=='awaiting-owner-approval')throw Object.assign(Error('Proposal has already been handled'),{status:409});if(!r.proposal.files.length)throw Object.assign(Error('Diagnosis contains no proposed file changes'),{status:400});
  if(await github.head(r.baseBranch)!==r.baseSha)throw Object.assign(Error('Source branch changed; request and approve a fresh proposal'),{status:409});
  // Persist explicit approval before the first repository write. Never merge or install here.
  r.status='approved-creating-pr';r.approvedAt=now();await store.save(records);
  try{const result=await github.createPullRequest(r);r.status='repair-pr-created';r.pullRequestURL=result.url;await store.save(records);return {status:r.status,pullRequestURL:r.pullRequestURL}}
  catch(error){r.status='repair-creation-failed';r.failure='Repository write failed. Inspect the repair branch before requesting a fresh proposal.';await store.save(records);throw Error(r.failure)}
 })}
 };
}
