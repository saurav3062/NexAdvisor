import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { main as local } from "./local-app.mjs";
import { main as deploy, initialConfig } from "./deploy.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));

export function startupPlan(args, { dependencies, configured }) {
  const [mode = "local", ...extra] = args;
  if (["help", "--help", "-h"].includes(mode)) return [{ kind: "help" }];
  if (["local", "dev", "fast"].includes(mode)) {
    if (extra.length)
      throw new Error("Local modes do not accept extra arguments.");
    return [
      ...(!dependencies ? [{ kind: "install" }] : []),
      {
        kind: "local",
        args:
          mode === "dev" ? ["--dev"] : mode === "fast" ? ["--no-build"] : [],
      },
    ];
  }
  if (mode === "deploy") {
    if (extra.length && extra.length !== 2)
      throw new Error(
        "Use deploy, or deploy https://YOUR-DOMAIN admin@YOUR-DOMAIN.",
      );
    if (configured && extra.length)
      throw new Error(
        "deploy/.env already exists. Use deploy without arguments; edit settings privately if needed.",
      );
    if (!configured && extra.length !== 2)
      throw new Error(
        "First deployment: use deploy https://YOUR-DOMAIN admin@YOUR-DOMAIN, or prepare deploy/.env.",
      );
    if (extra.length) initialConfig(...extra); // Validate before any side effects.
    return [
      ...(!configured ? [{ kind: "deploy", args: ["init", ...extra] }] : []),
      { kind: "deploy", args: ["up"] },
    ];
  }
  if (["status", "logs", "stop", "check"].includes(mode) && !extra.length)
    return [{ kind: "deploy", args: [mode] }];
  throw new Error("Unknown startup command. Use help for supported commands.");
}

async function main() {
  const plan = startupPlan(process.argv.slice(2), {
    dependencies: existsSync(resolve(root, "node_modules/next/dist/bin/next")),
    configured: existsSync(resolve(root, "deploy/.env")),
  });
  for (const step of plan) {
    if (step.kind === "help") {
      console.log(`NexAdvisor startup (run from any directory):
  Windows: .\\start.ps1 [command]
  Debian/macOS: sh start.sh [command]
  Anywhere with Node: node scripts/start.mjs [command]

  local     Install missing dependencies, build and start frontend + backend (default).
  dev       Full local app with frontend hot reload.
  fast      Reuse existing builds. Run local after code/config changes.
  deploy https://YOUR-DOMAIN admin@YOUR-DOMAIN
            First Debian deployment: generate private settings, build and start PostgreSQL + API + web.
  deploy    Start or update an existing deployment; back up before updates.
  status | logs | stop | check
            Operate the Docker deployment. Stop preserves data.

Local prerequisites: Node 22.13+, npm and JDK 21+. Deployment: Node 22.13+ and running Docker with Compose.
Ctrl+C stops the local app. Deployment runs in the background; use stop.
HTTPS, host setup and backup destinations require configuration. See docs/DEVELOPER-SOP.md.
Payments and emails stay simulated.`);
    } else if (step.kind === "install") {
      console.log("Installing locked frontend dependencies…");
      const result = spawnSync(
        process.platform === "win32" ? "npm.cmd" : "npm",
        ["ci"],
        {
          cwd: root,
          stdio: "inherit",
          windowsHide: true,
          shell: process.platform === "win32",
        },
      );
      if (result.error || result.status !== 0)
        throw new Error(
          "Dependency installation failed. Check npm/network access and retry; services were not started.",
        );
    } else if (step.kind === "local") await local(step.args);
    else deploy(step.args);
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  main().catch((error) => {
    console.error(`Startup failed: ${error.message}`);
    process.exitCode = 1;
  });
