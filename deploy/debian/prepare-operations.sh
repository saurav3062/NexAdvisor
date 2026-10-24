#!/bin/sh
set -eu
[ "$(id -u)" -eq 0 ] || { echo "Run with sudo on the Debian deployment host."; exit 1; }
. /etc/os-release
[ "$ID" = debian ] || { echo "This helper is for Debian."; exit 1; }
cd /opt/NexAdvisor
for tool in docker restic nginx systemctl; do
    command -v "$tool" >/dev/null || { echo "Install $tool first."; exit 1; }
done
[ -x /usr/bin/node ] || { echo "Install Node 22+ at /usr/bin/node or adapt the service files first."; exit 1; }
/usr/bin/node -e 'if(Number(process.versions.node.split(".")[0])<22)process.exit(1)'
docker compose version >/dev/null
[ -f deploy/.env ] || { echo "Configure deploy/.env first."; exit 1; }
if ! id nexadvisor-ops >/dev/null 2>&1; then
    useradd --system --user-group --home-dir /var/lib/nexadvisor-ops --shell /usr/sbin/nologin nexadvisor-ops
fi
usermod -aG docker nexadvisor-ops
install -d -o nexadvisor-ops -g nexadvisor-ops -m 0700 /var/lib/nexadvisor-ops
install -d -o root -g nexadvisor-ops -m 0750 /etc/nexadvisor
chown root:nexadvisor-ops deploy/.env
chmod 0640 deploy/.env
if [ ! -f /etc/nexadvisor/ops.env ]; then
    install -o root -g root -m 0600 deploy/operations/ops.env.example /etc/nexadvisor/ops.env
fi
for unit in deploy/operations/nexadvisor-*.service deploy/operations/nexadvisor-*.timer; do
    install -o root -g root -m 0644 "$unit" /etc/systemd/system/
done
systemctl daemon-reload
echo "Units installed; timers are NOT enabled. Configure /etc/nexadvisor/ops.env, initialize restic, test backup and alert delivery, then enable timers."
echo "The operations account has Docker access, which is effectively host administration."
