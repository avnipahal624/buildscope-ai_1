import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';

type RecordData = Record<string, any>;
const message = (e: unknown) => e instanceof Error ? e.message : 'Request failed';
const terminal = new Set(['completed', 'completed_with_errors', 'failed']);
export function JobTracker({ projectId, kind, refresh }: {projectId:string;kind:'research'|'stakeholders';refresh:()=>void}) {
  const key = `buildscope:${kind}:${projectId}`;
  const [jobId,setJobId]=useState(()=>sessionStorage.getItem(key) || '');
  const [job,setJob]=useState<RecordData|null>(null);
  const [error,setError]=useState('');
  const [busy,setBusy]=useState(false);
  const [retry,setRetry]=useState(0);
  useEffect(()=>{
    if(!jobId) return;
    let cancelled=false;
    let timer:ReturnType<typeof setTimeout>;
    async function poll(){
      try {
        const response=await api.job(jobId);
        if(cancelled)return;
        setJob(response);setError('');
        if(terminal.has(response.status)){refresh();return}
        timer=setTimeout(poll,2500);
      }catch(e){if(!cancelled)setError(message(e))}
    }
    void poll();
    return ()=>{cancelled=true;clearTimeout(timer)};
  },[jobId,refresh,retry]);
  async function start(){setBusy(true);setError('');setJob(null);sessionStorage.removeItem(key);setJobId('');
    try{const response=kind==='research'?await api.startResearch(projectId):await api.startStakeholderAnalysis(projectId);sessionStorage.setItem(key,response.job_id);setJob({id:response.job_id,status:response.status});setJobId(response.job_id)}
    catch(e){setError(message(e))}finally{setBusy(false)}
  }
  return <div className="rounded-xl border border-[#dce0d6] bg-white/75 p-5">
    <h3 className="font-serif text-xl">{kind==='research'?'Project research':'Stakeholder analysis'}</h3>
    <button onClick={()=>void start()} disabled={busy || !!(jobId && (!job || !terminal.has(job.status)) && !error)} className="mt-3 rounded-full bg-[#1d4939] px-4 py-2 text-sm text-white disabled:opacity-50">{busy?'Starting…':kind==='research'?'Run research':'Analyze stakeholders'}</button>
    {jobId&&<p className="mt-3 break-all text-xs">Job ID: {jobId} · Status: {job?.status||'Checking'}</p>}
    {job?.error&&<p className="mt-2 text-sm text-red-700">{job.error}</p>}
    {job?.status==='completed_with_errors'&&<p className="mt-2 text-xs">Some steps reported errors. Inspect available results and the job log.</p>}
    {error&&<div role="alert" className="mt-3 text-sm text-red-700">{error} <button className="underline" onClick={()=>{setError('');setRetry(v=>v+1)}}>Retry status</button></div>}
  </div>;
}
const resources = [
  ['Comparable projects',api.similar],['Project comparisons',api.comparisons],['Stakeholders',api.stakeholders],['Stakeholder needs',api.needs],['Evidence',api.evidence],['Opportunities',api.opportunities],
] as const;
export function ResearchResults({projectId,revision=0}:{projectId:string;revision?:number}){
  return <div className="grid gap-4 lg:grid-cols-2">{resources.map(([label,fetcher])=><Resource key={label} label={label} projectId={projectId} fetcher={fetcher} revision={revision}/>)}</div>
}
function Resource({label,projectId,fetcher,revision}:{label:string;projectId:string;fetcher:(id:string)=>Promise<RecordData[]>;revision:number}){
  const [rows,setRows]=useState<RecordData[]>([]),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;setLoading(true);fetcher(projectId).then(r=>{if(active){setRows(r);setError('')}}).catch(e=>{if(active)setError(message(e))}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[revision,fetcher,projectId]);
  return <section className="rounded-2xl border border-[#dce0d6] bg-white/75 p-5"><h3 className="font-serif text-xl">{label}</h3>{loading?<p className="mt-3 text-sm">Loading…</p>:error?<p role="alert" className="mt-3 text-sm text-red-700">{error}</p>:rows.length===0?<p className="mt-3 text-sm text-[#748078]">No records returned yet.</p>:<ul className="mt-3 space-y-3">{rows.map((row,index)=><li key={row.id||index} className="rounded-xl bg-[#f5f7f1] p-3 text-sm"><strong>{row.name||row.source_title||row.need_text||row.description||row.excerpt||row.explanation||`Record ${index+1}`}</strong>{row.description&&row.name&&<p>{row.description}</p>}{row.excerpt&&row.source_title&&<p>“{row.excerpt}”</p>}{row.ai_interpretation&&<p>AI interpretation: {row.ai_interpretation}</p>}{row.status&&<p>Status: {row.status}</p>}{(row.source_url||row.url)&&<a className="mt-1 block break-all text-[#35654e] underline" href={row.source_url||row.url} target="_blank" rel="noreferrer">Original source</a>}</li>)}</ul>}</section>
}
export function StakeholderTools({projectId,refresh}:{projectId:string;refresh:()=>void}){
  const [name,setName]=useState(''),[description,setDescription]=useState(''),[rows,setRows]=useState<RecordData[]>([]),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  const load=useCallback(()=>api.stakeholders(projectId).then(setRows).catch(e=>setError(message(e))),[projectId]);
  useEffect(()=>{void load()},[load]);
  async function run(action:()=>Promise<unknown>){setBusy(true);setError('');try{await action();await load();refresh()}catch(e){setError(message(e))}finally{setBusy(false)}}
  return <section className="rounded-2xl border border-[#dce0d6] bg-white/75 p-5"><h3 className="font-serif text-xl">Stakeholder groups</h3><button disabled={busy} onClick={()=>void run(()=>api.identifyStakeholders(projectId))} className="mt-3 rounded-full border px-3 py-2 text-sm">Suggest groups with AI</button><ul className="my-3 space-y-2">{rows.map(row=><li key={row.id} className="text-sm">{row.name} · {row.status} {row.status==='suggested'&&<button disabled={busy} className="underline" onClick={()=>void run(()=>api.confirmStakeholder(row.id))}>Confirm</button>}</li>)}</ul><form onSubmit={e=>{e.preventDefault();void run(async()=>{await api.addStakeholder(projectId,name,description);setName('');setDescription('')})}} className="flex flex-wrap gap-2"><input required value={name} onChange={e=>setName(e.target.value)} placeholder="Stakeholder group" className="rounded-xl border p-2 text-sm"/><input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" className="rounded-xl border p-2 text-sm"/><button disabled={busy} className="rounded-full bg-[#1d4939] px-4 py-2 text-sm text-white">Add group</button></form>{error&&<p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}</section>
}
export function PriorArt(){const [query,setQuery]=useState(''),[data,setData]=useState<RecordData|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');return <section className="rounded-2xl border border-[#dce0d6] bg-white/75 p-5"><h3 className="font-serif text-xl">Public repository discovery</h3><p className="mt-2 text-xs">Repository discovery uses public GitHub metadata. It is not a patent database or a legal novelty assessment.</p><form onSubmit={async e=>{e.preventDefault();setLoading(true);setError('');setData(null);try{setData(await api.priorArt(query))}catch(e){setError(message(e))}finally{setLoading(false)}}} className="mt-3 flex gap-2"><input required minLength={2} value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search public repositories" className="min-w-0 flex-1 rounded-xl border p-2 text-sm"/><button disabled={loading} className="rounded-full bg-[#1d4939] px-4 py-2 text-sm text-white">{loading?'Searching…':'Search'}</button></form>{error&&<p role="alert" className="mt-3 text-red-700">{error}</p>}{data&&<><p className="mt-3 text-xs">Retrieved: {data.checkedAt||'Not available'}</p>{data.items?.length?<ul className="mt-3 space-y-3">{data.items.map((item:RecordData)=><li key={item.id} className="rounded-xl bg-[#f5f7f1] p-3 text-sm"><a href={item.url} target="_blank" rel="noreferrer" className="font-semibold text-[#35654e] underline">{item.owner}/{item.name}</a><p>{item.description||'Not available'}</p><p>Language: {item.language||'Not available'} · Topics: {item.topics?.join(', ')||'Not available'} · Stars: {item.stars??'Not available'} · Forks: {item.forks??'Not available'}</p><p>Updated: {item.lastUpdated||'Not available'} · Licence: {item.licence||'Not available'}</p></li>)}</ul>:<p className="mt-3 text-sm">No repositories returned.</p>}</>}</section>}
