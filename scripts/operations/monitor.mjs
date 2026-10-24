import { statfs } from "node:fs/promises";
import { stateDir,state,readState,alert,backupFresh } from "./common.mjs";
const failures=[];
try {
 const origin=new URL(process.env.PUBLIC_ORIGIN);
 if(origin.protocol!=="https:")throw new Error("HTTPS required");
 const r=await fetch(new URL("/api/v1/categories",origin),{signal:AbortSignal.timeout(10000),redirect:"error"});
 if(!r.ok||!Array.isArray(await r.json()))throw new Error("API unavailable");
} catch{failures.push("Public HTTPS/API check failed");}
if(!backupFresh(await readState("backup")))failures.push("Off-host backup missing or older than 26 hours");
try{const disk=await statfs(stateDir);if(disk.bavail/disk.blocks<0.15)failures.push("Host disk has less than 15% free space");}catch{failures.push("Host disk check unavailable");}
const previous=await readState("monitor");
const signature=failures.join("; ");
const remind=signature && Date.now()-Date.parse(previous?.notifiedAt||0)>3600000;
try {
 if(signature!==previous?.signature||remind){if(signature||previous?.signature){await alert(signature?"NexAdvisor alert: "+signature:"NexAdvisor recovered: service, disk and backup checks are healthy.");}await state("monitor",{signature,notifiedAt:new Date().toISOString()});}
 console.log(signature||"Service and backup checks passed");
 process.exitCode=failures.length?1:0;
}catch{console.error("Monitoring alert could not be delivered. Check OPS_ALERT_WEBHOOK privately.");process.exitCode=1;}
