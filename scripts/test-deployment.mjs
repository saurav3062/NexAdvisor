import assert from "node:assert/strict";
import { validateDeployment } from "./check-deployment.mjs";

const valid = {
  DATABASE_PASSWORD: "synthetic-test-password-only",
  PUBLIC_ORIGIN: "https://advisor.acme.io",
};
assert.deepEqual(validateDeployment(valid), []);
assert.ok(validateDeployment({}).length >= 3);
for (const origin of [
  "http://advisor.acme.io",
  "https://advisor.example.com",
  "https://localhost",
  "https://advisor.acme.io/reset",
  "https://user:pass@advisor.acme.io",
  "https://advisor.acme.io/?token=secret",
]) {
  assert.ok(
    validateDeployment({ ...valid, PUBLIC_ORIGIN: origin }).some((e) =>
      e.includes("PUBLIC_ORIGIN"),
    ),
  );
}
for (const port of ["0", "65536", "abc", "12.5"]) {
  assert.ok(
    validateDeployment({ ...valid, WEB_PORT: port }).some((e) =>
      e.includes("WEB_PORT"),
    ),
  );
}
assert.ok(
  validateDeployment({ ...valid, ADMIN_EMAIL: "admin@acme.io" }).length,
);
assert.ok(validateDeployment({ ...valid, DATABASE_PASSWORD: "short" }).length);
assert.deepEqual(
  validateDeployment({
    ...valid,
    ADMIN_EMAIL: "admin@acme.io",
    ADMIN_PASSWORD: "synthetic-long-password",
    WEB_PORT: "3000",
  }),
  [],
);
console.log("Deployment configuration checks passed.");
