const fs = require("node:fs");
const assert = require("node:assert/strict");
const ts = require("typescript");
const vm = require("node:vm");
const apiExports = {};
const responses = [];
const requests = [];
const events = [];
const code = ts.transpileModule(
  fs.readFileSync("src/lib/nexadvisor-api.ts", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  },
).outputText;
vm.runInNewContext(code, {
  exports: apiExports,
  Event,
  window: { dispatchEvent: (event) => events.push(event.type) },
  fetch: async (url, options) => {
    requests.push({ url, options });
    assert.ok(responses.length, "Unexpected request: " + url);
    const next = responses.shift();
    if (next instanceof Error) throw next;
    return next;
  },
});
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), { status });
(async () => {
  responses.push(json({ message: "Expired" }, 401));
  await assert.rejects(apiExports.api("/me/bookings"), { status: 401 });
  assert.deepEqual(events, ["nexadvisor:session-expired"]);
  responses.push(
    json({ token: "first", headerName: "X-CSRF" }),
    json({ message: "Bad credentials" }, 401),
  );
  await assert.rejects(apiExports.api("/auth/login", "POST", {}), {
    status: 401,
  });
  assert.equal(
    events.length,
    1,
    "Login failures must not trigger expiry redirects",
  );
  responses.push(json({ message: "CSRF expired" }, 403));
  await assert.rejects(apiExports.api("/bookings/one/cancel", "POST"), {
    status: 403,
  });
  const countAfterDenied = requests.length;
  responses.push(
    json({ token: "replacement", headerName: "X-CSRF" }),
    json({ status: "CANCELLED" }),
  );
  const result = await apiExports.api("/bookings/one/cancel", "POST");
  assert.equal(result.status, "CANCELLED");
  assert.equal(
    requests.length,
    countAfterDenied + 2,
    "Explicit retry must fetch a fresh CSRF token",
  );
  assert.equal(requests.at(-1).options.headers["X-CSRF"], "replacement");
  const beforeFailure = requests.length;
  responses.push(new Error("Connection interrupted"));
  await assert.rejects(
    apiExports.api("/bookings", "POST", {}),
    /Connection interrupted/,
  );
  assert.equal(
    requests.length,
    beforeFailure + 1,
    "Never automatically replay a failed mutation",
  );
  assert.equal(responses.length, 0);
  console.log(
    "PASS: session expiry, login failure isolation, CSRF renewal and no automatic mutation replay",
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
