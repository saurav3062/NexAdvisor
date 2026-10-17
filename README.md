# NexAdvisor

Next.js frontend and a Spring Boot backend, using the same core stack and layering as Fundrazor. Payments are simulated: no provider, card collection, charge, or payout occurs.

## Local demo

Requires Node.js 22.13+ and JDK 21+ (Java 21 target). Open two terminals:

```powershell
cd D:\Projects\NexAdvisor\backend
.\mvnw.cmd verify
java -jar target/nexadvisor-api-0.0.1-SNAPSHOT.jar --spring.profiles.active=demo
```

```powershell
cd D:\Projects\NexAdvisor
npm ci
npm run dev
```

Open http://localhost:3000. The API listens on loopback port 8081. The demo stores data in `backend/data/`, creates three fictional approved experts, and enables payment simulation. Sign up with your own client or expert account; there are no shared default passwords. Demo experts cannot be logged into.

For an administrator, set `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD` (minimum 16 characters) in the backend terminal **before starting it**. Startup creates an admin only when that email is new. It never promotes an existing account or resets its password. Remove these environment variables after the first successful startup.

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
