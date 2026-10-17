import { pathToFileURL } from "node:url";

export function validateDeployment(env) {
  const errors = [];
  const required = ["DATABASE_PASSWORD", "PUBLIC_ORIGIN"];
  for (const name of required) {
    if (!env[name]?.trim()) errors.push(`${name} is required.`);
  }
  if ((env.DATABASE_PASSWORD || "").length < 20) {
    errors.push("DATABASE_PASSWORD must contain at least 20 characters.");
  }
  try {
    const origin = new URL(env.PUBLIC_ORIGIN);
    if (
      origin.protocol !== "https:" ||
      origin.username ||
      origin.password ||
      origin.search ||
      origin.hash ||
      origin.pathname !== "/" ||
      /^(localhost|127\.|\[::1\])/.test(origin.hostname) ||
      /(^|\.)example\.(com|org|net)$|\.test$|\.invalid$/.test(origin.hostname)
    )
      errors.push(
        "PUBLIC_ORIGIN must be your real HTTPS origin, without a path.",
      );
  } catch {
    errors.push("PUBLIC_ORIGIN must be a valid HTTPS origin.");
  }
  for (const name of ["WEB_PORT"]) {
    if (
      env[name] !== undefined &&
      (!/^\d+$/.test(env[name]) || +env[name] < 1 || +env[name] > 65535)
    ) {
      errors.push(`${name} must be a port between 1 and 65535.`);
    }
  }
  if (Boolean(env.ADMIN_EMAIL) !== Boolean(env.ADMIN_PASSWORD)) {
    errors.push(
      "Supply both ADMIN_EMAIL and ADMIN_PASSWORD, or leave both empty.",
    );
  }
  if (env.ADMIN_PASSWORD && env.ADMIN_PASSWORD.length < 16) {
    errors.push("ADMIN_PASSWORD must contain at least 16 characters.");
  }
  return errors;
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const errors = validateDeployment(process.env);
  if (errors.length) {
    console.error(errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
  } else {
    console.log(
      "Deployment settings passed. Payments and emails remain simulated. Verify HTTPS, private email previews and backups before inviting users.",
    );
  }
}
