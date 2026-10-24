import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateDeployment } from "./check-deployment.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
export function composeArgs(action) {
  const commands = {
    up: ["up", "--build", "--detach", "--wait", "--wait-timeout", "180"],
    stop: ["stop"],
    status: ["ps"],
    logs: ["logs", "--follow", "--tail", "100"],
    check: ["config", "--quiet"],
  };
  if (!commands[action])
    throw new Error("Choose up, stop, status, logs or check.");
  return [
    "compose",
    "--env-file",
    resolve(root, "deploy/.env"),
    "-f",
    resolve(root, "deploy/compose.yaml"),
    ...commands[action],
  ];
}
export function initialConfig(origin, email) {
  if (typeof origin !== "string" || /[\s\r\n]/.test(origin))
    throw new Error("Supply a single HTTPS origin without whitespace.");
  const env = {
    PUBLIC_ORIGIN: origin,
    ADMIN_EMAIL: email,
    ADMIN_PASSWORD: randomBytes(24).toString("hex"),
    DATABASE_PASSWORD: randomBytes(32).toString("hex"),
    WEB_PORT: "3000",
  };
  if (!/^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email || ""))
    throw new Error("Supply a valid administrator email.");
  const errors = validateDeployment(env);
  if (errors.length) throw new Error(errors.join("\n"));
  return (
    Object.entries(env)
      .map(([k, v]) => `${k}=${v}`)
      .join("\n") + "\n"
  );
}
export function main(args = process.argv.slice(2)) {
  process.chdir(root);
  const [action = "help", origin, email] = args;
  if (action === "help" || action === "--help") {
    console.log(
      "Debian console commands:\n  npm run deploy -- init https://YOUR-DOMAIN admin@YOUR-DOMAIN\n  npm run deploy -- up\n  npm run deploy -- status\n  npm run deploy -- logs\n  npm run deploy -- stop\n  npm run deploy -- check\nInit creates private deploy/.env without overwriting it. Up validates settings, builds and waits for healthy services. Stop preserves data. Configure HTTPS with deploy/debian/README.md before inviting users.",
    );
    return;
  }
  const file = resolve(root, "deploy/.env");
  if (action === "init") {
    writeFileSync(file, initialConfig(origin, email), {
      flag: "wx",
      mode: 0o600,
    });
    console.log(
      "Created deploy/.env with generated passwords. Read ADMIN_PASSWORD privately from that file for first login; remove both ADMIN fields after login. Keep this file private and never commit it. Configure HTTPS, then run npm run deploy -- up.",
    );
    return;
  }
  const dockerArgs = composeArgs(action);
  if (!existsSync(file))
    throw new Error(
      "Run deploy init first, or copy deploy/.env.example to deploy/.env and fill it in.",
    );
  const env = { ...process.env, ...parseEnv(readFileSync(file, "utf8")) };
  const errors = validateDeployment(env);
  if (errors.length) throw new Error(errors.join("\n"));
  if (action === "up")
    console.log(
      "Building the simulated-payment pilot. Back up existing databases before upgrades. Database volumes are preserved.",
    );
  const result = spawnSync("docker", dockerArgs, {
    cwd: root,
    env,
    stdio: "inherit",
    windowsHide: true,
  });
  if (result.error)
    throw new Error(
      "Docker is unavailable. Install Docker Engine and the Compose plugin, then start Docker.",
    );
  if (result.status !== 0)
    throw new Error(
      "Docker command failed. Check Docker availability and service logs; existing data has not been removed. Fix the failure and retry.",
    );
  if (action === "up")
    console.log(
      `Services are healthy. Verify HTTPS at ${env.PUBLIC_ORIGIN} and complete the deployment checklist. Payments and emails remain simulated.`,
    );
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  try {
    main();
  } catch (e) {
    console.error(
      e.code === "EEXIST"
        ? "deploy/.env already exists; left unchanged."
        : e.message,
    );
    process.exitCode = 1;
  }
