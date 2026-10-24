import { spawn } from "node:child_process";
import { mkdir, writeFile, readFile, rename } from "node:fs/promises";
import path from "node:path";
export const stateDir=path.resolve(process.env.OPS_STATE_DIR||"/var/lib/nexadvisor-ops");
export async function state(name,value){await mkdir(stateDir,{recursive:true,mode:0o700});const file=path.join(stateDir,name+".json");await writeFile(file+".tmp",JSON.stringify(value),{mode:0o600});await rename(file+".tmp",file);}
export async function readState(name){try{return JSON.parse(await readFile(path.join(stateDir,name+".json"),"utf8"));}catch{return null;}}
export async function alert(text){const target=process.env.OPS_ALERT_WEBHOOK;if(!target)throw new Error("OPS_ALERT_WEBHOOK is required for operational alerts");if(new URL(target).protocol!=="https:")throw new Error("Alert destination must use HTTPS");const r=await fetch(target,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text}),signal:AbortSignal.timeout(10000)});if(!r.ok)throw new Error("Alert delivery failed");}
export function command(file,args,stdout="ignore"){return new Promise((resolve,reject)=>{const child=spawn(file,args,{shell:false,stdio:["ignore",stdout,"ignore"],timeout:1800000});child.on("error",()=>reject(new Error(file+" could not start")));child.on("exit",(code,signal)=>code===0?resolve():reject(new Error(file+" failed ("+(signal||code)+")")));});}
export function backupFresh(record,now=Date.now()){const time=Date.parse(record?.completedAt||"");return Number.isFinite(time)&&time<=now+60000&&now-time<26*3600000;}
export function remoteRepository(value){return /^(s3:|b2:|sftp:|rest:https:\/\/|azure:|gs:)/.test(value||"");}
