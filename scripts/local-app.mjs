import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { createServer } from "node:net";
import { setTimeout as pause } from "node:timers/promises";

export const root = fileURLToPath(new URL("../", import.meta.url));
export function port(value, fallback) {
  const n = value === undefined ? fallback : Number(value);
  if (!Number.isInteger(n) || n < 1024 || n > 65535)
    throw new Error("Local ports must be integers between 1024 and 65535.");
  return n;
}
export async function available(portNumber) {
  await new Promise((ok, fail) => {
    const server = createServer();
    server.once("error", () =>
      fail(
        new Error(
          `Port ${portNumber} is already in use. Stop the existing app or set LOCAL_WEB_PORT / LOCAL_API_PORT in .env.local.`,
        ),
      ),
    );
    server.listen(portNumber, "127.0.0.1", () => server.close(ok));
  });
}
export async function healthy(url, signal, timeout = 120000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    signal.throwIfAborted();
    try {
      const response = await fetch(url, {
        signal: AbortSignal.any([signal, AbortSignal.timeout(3000)]),
      });
      if (response.ok) {
        await response.body?.cancel();
        return;
      }
      await response.body?.cancel();
    } catch {
      signal.throwIfAborted();
    }
    await pause(500, undefined, { signal });
  }
  throw new Error(
    `Startup health check timed out: ${url}. Check the application output above.`,
  );
}

export async function main(args = process.argv.slice(2)) {
  process.chdir(root);
  if (args.includes("--help")) {
    console.log(
      "npm start: build and start the full local demo. npm run dev: full app with frontend hot reload. npm run start:fast: reuse existing builds. Ctrl+C stops both services. Optional .env.local: LOCAL_WEB_PORT, LOCAL_API_PORT, ADMIN_EMAIL, ADMIN_PASSWORD.",
    );
    return;
  }
  if (args.some((a) => !["--dev", "--no-build"].includes(a)))
    throw new Error("Unknown option. Use --help.");
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (!existsSync("node_modules/next/dist/bin/next"))
    throw new Error("Install dependencies first: npm ci");
  const web = port(process.env.LOCAL_WEB_PORT, 3000),
    api = port(process.env.LOCAL_API_PORT, 8081);
  if (web === api)
    throw new Error("Frontend and backend must use different ports.");
  await available(web);
  await available(api);
  const java = spawnSync("java", ["-version"], {
    encoding: "utf8",
    windowsHide: true,
  });
  const version = Number(
    (java.stderr + java.stdout).match(/version "(\d+)/)?.[1],
  );
  if (java.status !== 0 || version < 21 || !version)
    throw new Error("Install JDK 21 or newer and make java available on PATH.");
  const controller = new AbortController();
  const children = new Set();
  let stopping = false;
  function launch(command, args, cwd, env, watch = false) {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: "inherit",
      windowsHide: true,
      detached: process.platform !== "win32",
      shell: process.platform === "win32" && /\.cmd$/i.test(command),
    });
    children.add(child);
    const done = new Promise((ok, fail) => {
      child.once("error", (e) => {
        children.delete(child);
        fail(e);
      });
      child.once("exit", (code) => {
        children.delete(child);
        code === 0
          ? ok()
          : fail(new Error(`${command} exited with code ${code}.`));
      });
    });
    if (watch)
      done.then(
        () => {
          if (!stopping)
            controller.abort(
              new Error("An application service stopped unexpectedly."),
            );
        },
        (e) => controller.abort(e),
      );
    return done;
  }
  async function stop() {
    if (stopping) return;
    stopping = true;
    await Promise.all(
      [...children].map(
        (child) =>
          new Promise((done) => {
            if (!child.pid) return done();
            if (process.platform === "win32") {
              const killer = spawn(
                "taskkill",
                ["/pid", String(child.pid), "/t", "/f"],
                { stdio: "ignore", windowsHide: true },
              );
              killer.once("error", done);
              killer.once("exit", done);
            } else {
              try {
                process.kill(-child.pid, "SIGTERM");
              } catch {
                return done();
              }
              const timer = setTimeout(() => {
                try {
                  process.kill(-child.pid, "SIGKILL");
                } catch {
                  /* Already stopped. */
                }
                done();
              }, 8000);
              child.once("exit", () => {
                clearTimeout(timer);
                done();
              });
            }
          }),
      ),
    );
  }
  for (const signal of ["SIGINT", "SIGTERM"])
    process.once(signal, () => {
      controller.abort(new Error("Stopped by user"));
      void stop();
    });
  const localEnv = {
    ...process.env,
    PORT: String(api),
    PUBLIC_ORIGIN: `http://127.0.0.1:${web}`,
    BIND_ADDRESS: "127.0.0.1",
    COOKIE_SECURE: "false",
    PAYMENT_SIMULATION_ENABLED: "true",
    MAIL_MODE: "PREVIEW",
    NEXADVISOR_MAIL_PREVIEW_ENABLED: "true",
    NEXADVISOR_DEMO_SEED_ENABLED: "false",
    SPRING_PROFILES_ACTIVE: "demo",
    NEXT_TELEMETRY_DISABLED: "1",
    BACKEND_URL: `http://127.0.0.1:${api}`,
  };
  const jar = "target/nexadvisor-api-0.0.1-SNAPSHOT.jar";
  const dev = args.includes("--dev"),
    reuse = args.includes("--no-build");
  try {
    if (!reuse) {
      console.log("Building backend…");
      const systemMaven = process.platform === "win32" ? "mvn.cmd" : "mvn";
      const probe = spawnSync(systemMaven, ["-version"], {
        stdio: "ignore",
        shell: process.platform === "win32",
        windowsHide: true,
      });
      const maven =
        probe.status === 0
          ? systemMaven
          : process.platform === "win32"
            ? "mvnw.cmd"
            : "sh";
      const args =
        probe.status === 0 || process.platform === "win32" ? [] : ["./mvnw"];
      await launch(
        maven,
        [
          ...args,
          ...(process.env.NEXADVISOR_OFFLINE === "true" ? ["-o"] : []),
          "-B",
          "-DskipTests",
          "package",
        ],
        resolve(root, "backend"),
        localEnv,
      );
      controller.signal.throwIfAborted();
      if (!dev) {
        console.log("Building frontend…");
        await launch(
          process.execPath,
          ["node_modules/next/dist/bin/next", "build"],
          root,
          localEnv,
        );
      }
    }
    controller.signal.throwIfAborted();
    if (!existsSync(resolve(root, "backend", jar)))
      throw new Error(
        "Backend build is missing. Run npm start without --no-build.",
      );
    if (!dev) {
      if (!existsSync(".next/standalone/server.js"))
        throw new Error("Frontend build is missing. Run npm start.");
      const routes = JSON.parse(
        await readFile(".next/routes-manifest.json", "utf8"),
      );
      if (
        !(routes.rewrites?.afterFiles || routes.rewrites || []).some((r) =>
          r.destination?.startsWith(localEnv.BACKEND_URL + "/"),
        )
      )
        throw new Error(
          "Existing frontend was built for a different backend. Run npm start to rebuild.",
        );
      await cp("public", ".next/standalone/public", {
        recursive: true,
        force: true,
      });
      await cp(".next/static", ".next/standalone/.next/static", {
        recursive: true,
        force: true,
      });
    }
    void launch(
      "java",
      ["-jar", jar, "--spring.profiles.active=demo"],
      resolve(root, "backend"),
      localEnv,
      true,
    );
    await healthy(`http://127.0.0.1:${api}/actuator/health`, controller.signal);
    void launch(
      process.execPath,
      dev
        ? [
            "node_modules/next/dist/bin/next",
            "dev",
            "--hostname",
            "127.0.0.1",
            "--port",
            String(web),
          ]
        : [".next/standalone/server.js"],
      root,
      { ...localEnv, PORT: String(web), HOSTNAME: "127.0.0.1" },
      true,
    );
    await healthy(
      `http://127.0.0.1:${web}/api/v1/categories`,
      controller.signal,
    );
    console.log(
      `\nNexAdvisor is ready: http://127.0.0.1:${web}\nPayments and emails are simulated. Data persists in backend/data.\nPress Ctrl+C to stop the full app.\n`,
    );
    await new Promise((resolve) => {
      if (controller.signal.aborted) resolve();
      else controller.signal.addEventListener("abort", resolve, { once: true });
    });
    if (!stopping) throw controller.signal.reason;
  } catch (error) {
    if (!stopping) throw error;
  } finally {
    await stop();
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  main().catch((error) => {
    console.error(`\nStartup failed: ${error.message}`);
    process.exitCode = 1;
  });
