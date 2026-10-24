import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { port, available, healthy } from "./local-app.mjs";
import { composeArgs, initialConfig } from "./deploy.mjs";
import { parseEnv } from "node:util";
import { validateDeployment } from "./check-deployment.mjs";

test("local ports reject invalid values", () => {
  assert.equal(port(undefined, 3000), 3000);
  for (const value of ["abc", "0", "1023", "65536", "3000.5"])
    assert.throws(() => port(value, 3000));
  assert.equal(port("3100", 3000), 3100);
});
test("occupied ports are rejected without terminating the service", async () => {
  const server = createServer((req, res) => res.end("ok"));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const endpoint = server.address().port;
  try {
    await assert.rejects(available(endpoint), /already in use/);
    await healthy(
      `http://127.0.0.1:${endpoint}`,
      new AbortController().signal,
      1000,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
test("health checks wait through failures and honor cancellation", async () => {
  let count = 0;
  const server = createServer((req, res) => {
    res.statusCode = ++count < 2 ? 503 : 200;
    res.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    await healthy(url, new AbortController().signal, 3000);
    assert.ok(count >= 2);
    const aborted = new AbortController();
    aborted.abort(new Error("cancelled"));
    await assert.rejects(healthy(url, aborted.signal), /cancelled/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
test("generated deployment settings are strong, valid and injection resistant", () => {
  const a = parseEnv(
    initialConfig("https://nexadvisor.in", "admin@nexadvisor.in"),
  );
  const b = parseEnv(
    initialConfig("https://nexadvisor.in", "admin@nexadvisor.in"),
  );
  assert.deepEqual(validateDeployment(a), []);
  assert.equal(a.DATABASE_PASSWORD.length, 64);
  assert.equal(a.ADMIN_PASSWORD.length, 48);
  assert.notEqual(a.DATABASE_PASSWORD, b.DATABASE_PASSWORD);
  for (const email of ["", "x\nEVIL=1", "a@b.in;whoami"])
    assert.throws(() => initialConfig("https://nexadvisor.in", email));
  assert.throws(() =>
    initialConfig("http://nexadvisor.in", "admin@nexadvisor.in"),
  );
});
test("deployment commands wait for health and never remove volumes", () => {
  assert.ok(composeArgs("up").includes("--wait"));
  assert.deepEqual(composeArgs("stop").slice(-1), ["stop"]);
  for (const action of ["up", "stop", "logs", "status", "check"])
    assert.ok(!composeArgs(action).includes("--volumes"));
  assert.throws(() => composeArgs("down"));
});

test("deployment origin rejects newline injection", () => {
  assert.throws(() =>
    initialConfig("https://nexadvisor.in\nEVIL=1", "admin@nexadvisor.in"),
  );
});

const { startupPlan } = await import("./start.mjs");
test("startup installs only missing local dependencies before starting services", () => {
  assert.deepEqual(startupPlan([], { dependencies: false }), [
    { kind: "install" },
    { kind: "local", args: [] },
  ]);
  assert.deepEqual(startupPlan(["dev"], { dependencies: true }), [
    { kind: "local", args: ["--dev"] },
  ]);
  assert.deepEqual(startupPlan(["fast"], { dependencies: true }), [
    { kind: "local", args: ["--no-build"] },
  ]);
  assert.throws(() => startupPlan(["local", "deploy"], {}));
});
test("first deployment requires valid configuration and never replaces existing settings", () => {
  assert.throws(
    () => startupPlan(["deploy"], { configured: false }),
    /First deployment/,
  );
  assert.throws(
    () =>
      startupPlan(
        ["deploy", "https:\/\/nexadvisor.in", "admin@nexadvisor.in"],
        { configured: true },
      ),
    /already exists/,
  );
  assert.throws(() =>
    startupPlan(
      ["deploy", "http:\/\/nexadvisor.in", "admin@nexadvisor.in"],
      {},
    ),
  );
  assert.deepEqual(
    startupPlan(
      ["deploy", "https:\/\/nexadvisor.in", "admin@nexadvisor.in"],
      {},
    ),
    [
      {
        kind: "deploy",
        args: ["init", "https:\/\/nexadvisor.in", "admin@nexadvisor.in"],
      },
      { kind: "deploy", args: ["up"] },
    ],
  );
  assert.deepEqual(startupPlan(["deploy"], { configured: true }), [
    { kind: "deploy", args: ["up"] },
  ]);
});
test("startup rejects unsupported operations and maps stop without volume deletion", () => {
  assert.deepEqual(startupPlan(["stop"], {}), [
    { kind: "deploy", args: ["stop"] },
  ]);
  assert.throws(() => startupPlan(["down", "--volumes"], {}));
  assert.throws(() => startupPlan(["deploy", "incomplete"], {}));
  assert.deepEqual(startupPlan(["help"], {}), [{ kind: "help" }]);
});
