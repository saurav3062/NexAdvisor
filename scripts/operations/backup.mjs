import { open, mkdir, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { stateDir,state,alert,command,remoteRepository } from "./common.mjs";
let handle;
try {
 if(!remoteRepository(process.env.RESTIC_REPOSITORY))throw new Error("Configure an off-host restic repository");
 if(!process.env.RESTIC_PASSWORD_FILE)throw new Error("RESTIC_PASSWORD_FILE is required");
 await mkdir(stateDir,{recursive:true,mode:0o700});
 const filename=path.join(stateDir,"nexadvisor-"+randomUUID()+".dump");
 handle=await open(filename,"wx",0o600);
 await command("docker",["compose","--env-file","deploy/.env","-f","deploy/compose.yaml","exec","-T","db","pg_dump","-U","nexadvisor","-d","nexadvisor","-Fc"],handle.fd);
 await handle.close();handle=null;
 await command("restic",["backup","--tag","nexadvisor",filename]);
 await command("restic",["check"]);
 await state("backup",{completedAt:new Date().toISOString(),file:path.basename(filename),tag:"nexadvisor"});
 await unlink(filename);
 console.log("Database backup uploaded and repository metadata checked. Restore drills remain required.");
} catch(error) {
 if(handle)await handle.close();
 console.error(error.message);
 try{await alert("NexAdvisor database backup failed. Check the private host logs; the last successful backup has not been advanced.");}catch(e){console.error(e.message);}
 process.exitCode=1;
}
