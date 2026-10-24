# Developer SOP: run, deploy and operate NexAdvisor

Owner: the developer/operator maintaining this repository. Updated: 24 October 2026.

New to the product? Read the [Developer Handbook](DEVELOPER-HANDBOOK.md), [architecture](ARCHITECTURE.md) and [data model](DATA-MODEL.md) before changing business logic.

## 1. Choose the environment

| Mode | Started automatically | Data | Requirements |
| --- | --- | --- | --- |
| Local / dev | Spring API, embedded H2 database, Next.js frontend, backend scheduled jobs | `backend/data/` | Node 22.13+, npm, JDK 21+ |
| Debian deployment | PostgreSQL, Spring API with scheduled jobs, Next.js frontend in Docker | Docker volumes | Node 22.13+, running Docker Engine with Compose |

No Redis, separate queue worker or separate database installation is required locally. Maven on PATH is optional: the backend wrapper downloads Maven when needed. First builds need internet access. Payments and emails remain simulated; no external provider credentials are required to start.

Use a supported JDK (21 is the container runtime). Confirm `node --version`, `npm --version` and `java -version` for local work. For deployment confirm `node --version`, `docker info` and `docker compose version`. Install prerequisites once using your team's OS setup process; the startup script does not install system packages, change firewall rules or grant Docker permissions.

## 2. First local startup

Windows PowerShell:

```powershell
cd D:\Projects\NexAdvisor
.\start.ps1
```

Linux/macOS:

```sh
cd /path/to/NexAdvisor
sh start.sh
```

If PowerShell execution policy prevents scripts, use `node scripts/start.mjs local` instead; no policy change is necessary. The scripts locate the repository relative to themselves, so an absolute path also works from another directory.

The entry point installs locked npm dependencies if Next.js is missing, builds the backend and frontend, starts the API, waits for database/API health, then starts the frontend and verifies its API proxy. Open http://127.0.0.1:3000 only after the ready message. API port is 8081. Keep the console open; Ctrl+C stops the local app. Existing data is preserved, and occupied ports produce an error instead of terminating another application.

Optional: copy `.env.local.example` to `.env.local` and set `LOCAL_WEB_PORT`, `LOCAL_API_PORT`, and initial `ADMIN_EMAIL`/`ADMIN_PASSWORD`. Do not commit this file. Remove bootstrap administrator fields after first login. Bootstrap never resets an existing account's password or promotes an existing user. Local startup uses embedded H2; it is not the production deployment command.

## 3. Everyday development

```sh
node scripts/start.mjs dev     # backend + frontend hot reload
node scripts/start.mjs fast    # existing successful builds only
node scripts/start.mjs local   # rebuild and start everything
```

`npm run launch -- dev` is equivalent. Existing `npm start`, `npm run dev` and `npm run start:fast` remain available. Restart after Java changes; frontend hot reload applies only in dev mode. Run `npm ci` after changes to package-lock.json: automatic installation only detects missing dependencies, not every dependency change. Run local again after source/config changes before using fast.

Verification before handing off changes:

```sh
npm run lint
npm run typecheck
npm run test:api
npm run test:calendar
npm run test:launcher
npm run test:deployment
node scripts/operations/test.mjs
npm run build
cd backend
# Windows: .\mvnw.cmd verify
sh mvnw verify
```

Startup builds are not a substitute for tests. Integration tests clear their database; use only in-memory H2 or the disposable PostgreSQL database named `nexadvisor_test`. Never place real user data there. See [verification history](VERIFICATION.md).

## 4. First Debian deployment

Place the repository at `/opt/NexAdvisor`. Install host prerequisites and configure domain DNS, Nginx and TLS using [the Debian guide](../deploy/debian/README.md). Run as an operator with access to the Docker daemon. Docker access is privileged; restrict it to trusted operators.

```sh
cd /opt/NexAdvisor
sh start.sh deploy https://nexadvisor.in admin@nexadvisor.in
```

Substitute the actual domain and administrator email. This generates random passwords in private `deploy/.env`, builds the containers, starts PostgreSQL → API → frontend in health-check order and waits for readiness. Database migrations run when the API starts. It does not require host Java, Maven or npm dependencies. It refuses to overwrite existing configuration. If `deploy/.env` already exists, review it privately and run `sh start.sh deploy` without domain/email arguments.

Read the bootstrap administrator password privately from `deploy/.env`; do not paste it in logs or tickets. Remove both ADMIN fields after first login and run deploy again to recreate the API with updated settings. The web binds to host loopback; API/database ports remain private. HTTPS must be configured before browser login because deployed cookies are secure. A healthy container does not establish working public DNS/TLS.

The script does not automatically start a stopped Docker daemon or change Nginx: on Debian, enable/start Docker through your host administrator, then retry. Enable Docker at boot; containers use `unless-stopped` restart policies. No machine-specific secrets are stored in these scripts.

## 5. Operate and update

```sh
sh start.sh status     # container status
sh start.sh logs       # follow logs; Ctrl+C exits log viewing only
sh start.sh check      # validate settings/Compose without displaying secrets
sh start.sh stop       # stop containers, preserve database and preview mail
sh start.sh deploy     # rebuild/start and wait for health
```

Before updating, take and verify an off-host backup, record the deployed Git revision, review migration notes, then deploy the reviewed revision and run the smoke check below. Do not change DATABASE_PASSWORD on an initialized volume as a password-reset shortcut: PostgreSQL needs a coordinated credential change. Do not use `docker compose down -v` or delete database files to fix startup. A failed health check leaves services available for diagnosis; inspect logs, fix the cause and retry.

For rollback, stop new writes and have an operator assess migration compatibility before restoring an older app. Do not assume reverting Git reverses database migrations. Restore backups into an isolated environment first. Backups, alerts and recovery credentials are configured using [operations instructions](../deploy/debian/README.md) and [launch operations](LAUNCH-OPERATIONS.md). The startup command does not create a backup destination or enable unconfigured alert schedules.

## 6. Smoke check after deployment

- Confirm status is healthy and the public HTTPS homepage/login work.
- Sign in as the intended administrator; approve a real test expert and verify scheduling.
- With a test client, book, simulate payment, add a meeting link as expert, exchange a message, reschedule and cancel; confirm expected refund status.
- Verify the preview email workflow privately. Never expose the preview directory or share reset/verification tokens.
- Confirm backup execution and alert delivery, and complete a restore drill before public use.

Record results in the admin operations checklist. Use [LAUNCH-GATE.md](LAUNCH-GATE.md) for live payments/email and public launch requirements; this startup procedure does not enable real money or deliver email.

## 7. Troubleshooting

| Symptom | Action |
| --- | --- |
| Node/npm/Java missing | Install the required version and reopen the console. Java is required only for local mode. |
| Dependency installation failed | Check internet/proxy access, run `npm ci`, then retry. No app services start after a failed install. |
| Port already in use | Stop your previous app console or choose local ports in `.env.local`; do not kill unrelated services. |
| Missing/stale build in fast mode | Run local mode to rebuild. |
| Docker unavailable/permission denied | Start Docker and verify operator access with `docker info`; do not delete volumes. |
| Deployment environment already exists | Use deploy without domain/email; edit the existing file privately when needed. |
| Health check failed | Inspect logs for API/database/web failure, including migration errors and disk space. Preserve data and retry after fixing the cause. |
| Login fails on deployment | Check HTTPS, PUBLIC_ORIGIN, proxy settings and secure cookies; do not disable cookie security for production. |
| Backend URL changed | Rebuild frontend: its API proxy target is embedded at build time. |
| User reports a server error | Ask for the displayed support reference and correlate X-Request-ID in backend logs; do not request passwords or tokens. |
