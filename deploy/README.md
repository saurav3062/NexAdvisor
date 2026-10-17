# Deploy the simulated-payment pilot

This setup uses PostgreSQL 17, Java 21 and Node 22. It keeps the API and database
off host ports. The frontend listens on host loopback; configure an HTTPS reverse
proxy on the same host to forward your domain to `127.0.0.1:3000`. Do not expose
the pilot over HTTP: session cookies require HTTPS.

## Prepare

1. Install Docker Engine with Compose and Node 22 on the deployment host.
2. Copy `deploy/.env.example` to `deploy/.env`, and fill in your real domain,
   database password. Payments and emails are simulated; no provider credentials are required.
3. Set both administrator fields for initial bootstrap. After first successful
   login, remove both fields and recreate the API container.
4. From the repository root, run:

```sh
node --env-file=deploy/.env scripts/check-deployment.mjs
docker compose --env-file deploy/.env -f deploy/compose.yaml config --quiet
docker compose --env-file deploy/.env -f deploy/compose.yaml up --build -d
```

The checker validates settings without printing secrets. Keep `.env` private.
Docker administrators can inspect container environment variables; limit host
access. Do not paste plain `docker compose config` output into tickets.

The frontend's backend address is embedded at build time. This Compose file
builds it with `http://api:8081`; rebuild when changing that address. Docker
builds exclude local databases, mail previews, dependencies and `.env` files.
Both application processes run as non-root users.

## Verify before inviting users

- Confirm HTTPS redirects and secure session cookies on your real domain.
- Complete registration, verification and password recovery using private email
  previews. No email is delivered. An operator must privately provide each pilot
  participant their own verification/reset link after checking their identity.
- Approve a real expert, book an available slot, complete simulated payment,
  exchange a message, and cancel to verify the simulated refund.
- Confirm database and API ports are not publicly reachable. Add proxy rate
  limits, log rotation, disk alerts and host monitoring.
- Supply your actual privacy/terms/contact information and deletion process.
- Check `docker compose --env-file deploy/.env -f deploy/compose.yaml ps` and
  API logs. Frontend health only checks its homepage, not email or the database.

Payments and emails are intentionally simulated. There is no payment provider integration.
Email previews are stored in the private `mail-previews` Docker volume at
`/app/data/mail-preview` inside the API container (locally: `backend/data/mail-preview`).
They contain verification/reset tokens: never expose this directory as a web route
or share its full contents. Participants should check bookings and messages in the
app for updates; there are no delivered email reminders. Retain previews only for
the pilot's agreed retention period and delete expired sensitive previews securely.
Experts create real Zoom or Google Meet meetings themselves and save the join link
on the confirmed booking. NexAdvisor does not create calls or validate provider-side
passcodes, admission settings, attendance or meeting cancellation. Cancelling here
does not cancel the external meeting; the expert must do that in the provider.
No demo profile is enabled here. Flyway applies migrations at API startup;
make a backup before each upgrade. Never roll an older application back onto
a changed schema without checking compatibility.

## Database backups and restore drills

For Windows or PowerShell hosts with PostgreSQL client tools, use
`scripts/database-backup.ps1`. Supply `-Action Backup` or `-Action Restore`,
`-Database`, `-File`, and optionally `-DatabaseHost`, `-Port`, `-Username`,
`-PostgresBin`. Configure a private PostgreSQL password file (`PGPASSFILE`) for
authentication. Backups never overwrite existing files; restore creates a new
database and refuses existing names. Use a private destination directory and
encrypt/off-host-copy backups. Failed backups retain a `.partial` file for
inspection; failed restores may leave an empty new database for investigation.


Run the following in a POSIX shell from the repository root on the Docker host.
These commands use the database container's local credentials; they do not put
passwords on the command line. Backups contain private user data: store them
encrypted, restrict access, and copy them off-host according to your retention
policy. Schedule backups using your host's scheduler.

```sh
umask 077
mkdir -p backups
backup="backups/nexadvisor-$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose --env-file deploy/.env -f deploy/compose.yaml exec -T db \
  pg_dump -U nexadvisor -d nexadvisor -Fc > "$backup.partial" &&
  mv "$backup.partial" "$backup"
```

Check the command succeeded and the final file exists. A `.partial` file is not
a successful backup. For a restore drill, select an existing backup and restore
into a **new** database. `createdb` refuses to overwrite an existing database.
Do not point the running API at this drill database.

```sh
backup=backups/REPLACE-WITH-EXISTING-BACKUP.dump
restore_db="nexadvisor_restore_$(date -u +%Y%m%d%H%M%S)"
docker compose --env-file deploy/.env -f deploy/compose.yaml exec -T db \
  createdb -U nexadvisor "$restore_db" &&
docker compose --env-file deploy/.env -f deploy/compose.yaml exec -T db \
  pg_restore -U nexadvisor -d "$restore_db" --exit-on-error --single-transaction \
  --no-owner --no-privileges < "$backup"
```

Inspect restored tables and compare booking/user counts with the backup source.
Keep a dated record of the drill. A named Docker volume survives container
recreation, but it is not a backup. **Do not run `down -v` on the deployment**:
it deletes the database volume. A production recovery should be rehearsed on
a separate host and coordinated with application downtime.

## Validation status

Local configuration checks and the Next.js production build are tested separately.
The Docker engine was unavailable in the development environment when these
files were added. Full container startup, private preview access, HTTPS and a restore
drill must be verified on the deployment host before launch.
