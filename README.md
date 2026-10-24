# NexAdvisor

Next.js frontend and a Spring Boot backend, using the same core stack and layering as Fundrazor. Payments are simulated: no provider, card collection, charge, or payout occurs.

See [launch gates and reliability guarantees](docs/LAUNCH-GATE.md) for verified behavior and the remaining production acceptance work.

## New developer reading guide

Start with the [Developer Handbook](docs/DEVELOPER-HANDBOOK.md), then read the [internal architecture](docs/ARCHITECTURE.md), [data model](docs/DATA-MODEL.md) and [API reference](docs/API.md). The handbook maps product journeys to code and explains the rules to preserve when extending features.

## Developer quick start

Read the [Developer SOP](docs/DEVELOPER-SOP.md) for setup, daily work, deployment, updates and troubleshooting.

- Windows: `.\start.ps1`
- Linux/macOS: `sh start.sh`
- Debian first deploy: `sh start.sh deploy https://YOUR-DOMAIN admin@YOUR-DOMAIN`
- Existing deployment: `sh start.sh deploy`

These entry points install missing local npm dependencies and reuse the full-app launchers below. Use `node scripts/start.mjs help` for all commands.

## Local demo

Requires **Node.js 22.13+ and JDK 21+** on PATH. Maven is used if installed; otherwise the included Maven wrapper downloads it on first use.

```powershell
cd D:\Projects\NexAdvisor
npm ci
npm start
```

`npm start` builds and starts **both** services, waits for the API and frontend to be ready, and prints the app URL: **http://127.0.0.1:3000**. Keep this console open. **Ctrl+C stops both services.** Your data stays in `backend/data/`. It never kills an unrelated process already using a port.

- `npm run dev` — full app with frontend hot reload; restart after backend changes.
- `npm run start:fast` — start both using existing builds, after a successful `npm start`. Rebuild after code/config changes.
- `npm run dev:web` — frontend only, for developers managing the API separately.

The first build needs internet access. Local startup uses H2, private email previews and simulated payments. It does not publish fictional experts. For optional local ports or a first administrator, copy `.env.local.example` to `.env.local` and edit it privately. Remove administrator bootstrap fields after first login. Startup never resets an existing password or promotes an existing account.

## Debian: one-command deployment

Install Docker Engine, its Compose plugin, Node.js 22.13+, Nginx and your TLS certificate tools. The application runs in containers; Java and Maven are not needed on the host. From the project directory:

```sh
# Once: substitute your actual domain and administrator email.
npm run deploy -- init https://nexadvisor.in admin@nexadvisor.in
# Builds and starts PostgreSQL, API and frontend; waits for health checks.
npm run deploy -- up
```

No `npm ci` is required on the Debian host for deployment commands. `init` creates `deploy/.env` with random database/admin passwords and refuses to overwrite existing settings. Read the admin password privately from that file. Configure Nginx and HTTPS before first login; the web binds to loopback and cookies require HTTPS. Follow [the Debian deployment guide](deploy/debian/README.md) for TLS, backups, alerts and real-host acceptance.

```sh
npm run deploy -- status
npm run deploy -- logs
npm run deploy -- stop   # preserves the database and email previews
npm run deploy -- up     # start again or rebuild after an update
```

Back up before updates. Containers restart automatically after host reboot once Docker is enabled. Stopping them explicitly keeps them stopped until `up`. Payments and emails remain simulated. Never delete production Docker volumes to restart the app.

## PostgreSQL

The default profile uses PostgreSQL; demo uses H2. From `backend/`, set `DATABASE_PASSWORD`, then run `docker compose up -d`. Set these process environment variables before launching the backend without the demo profile:

```powershell
$env:DATABASE_URL = 'jdbc:postgresql://localhost:5433/nexadvisor'
$env:DATABASE_USER = 'nexadvisor'
$env:COOKIE_SECURE = 'false' # local HTTP only; use true with HTTPS
$env:PAYMENT_SIMULATION_ENABLED = 'true' # explicitly enable simulated payments
java -jar target/nexadvisor-api-0.0.1-SNAPSHOT.jar
```

Use your own database password; no credential is committed. Spring does not automatically load `.env` files. Flyway applies migrations at startup. Do not enable the demo profile in deployment. Keep the API private behind Next.js, serve HTTPS, and use secure cookies. `BACKEND_URL` is a server-only Next.js setting; set it before building because rewrites are compiled into the build.

## Maintainability

- `src/features/`: expert directory, booking, payments, messages, profiles and admin UI.
- `src/lib/nexadvisor-api.ts`: shared API types, CSRF and error handling.
- `src/app/`: thin Next.js route entries.
- `backend/`: controllers → transactional services → JDBC repositories; Flyway schema history.
- `legacy/`: reference archive of the former mock/Supabase implementation, excluded from active builds.

Read [architecture](docs/ARCHITECTURE.md), [API behavior](docs/API.md), [email and meeting setup](docs/COMMUNICATIONS.md), and [remaining work](docs/ROADMAP.md) before extending features.

## Checks

```powershell
npm run lint
npm run typecheck
npm run format:check
npm run build
cd backend
.\mvnw.cmd verify
```

Format frontend with `npm run format`, backend with `./mvnw spotless:apply`. CI runs the frontend checks and backend integration suite against H2 and PostgreSQL 17.

## MVP handoff
See [MVP readiness](docs/MVP-READINESS.md) for completed flows, test commands, and required public-launch setup. Calendar export checks run with `npm run test:calendar`. Local simulated-payment acceptance is separate from production deployment and SMTP validation.
