import "server-only";

export type SmtpConfig = { host: string; port: number; secure: boolean; user: string; pass: string };

export type AuthEnv = {
  appOrigin: string;
  otpPepper: Buffer;
  hashKey: Buffer;
  ipHeader: string | null;
  emailFrom: string;
  /** null = dev console mailer (codes printed to the server log). */
  smtp: SmtpConfig | null;
};

const REQUIRED = ["APP_URL", "AUTH_OTP_PEPPER", "AUTH_HASH_KEY", "EMAIL_PROVIDER", "EMAIL_FROM"] as const;
const SMTP_REQUIRED = ["SMTP_HOST", "SMTP_PORT", "SMTP_SECURE", "SMTP_USER", "SMTP_PASS"] as const;
const MIN_KEY_BYTES = 32;

let cached: AuthEnv | undefined;

/** Auth config from env, checked once (instrumentation.ts calls this at server start, so bad config stops boot). */
export function authEnv(): AuthEnv {
  return (cached ??= readAuthEnv(process.env));
}

/**
 * Startup check (instrumentation.ts, Node runtime only). A throw there only logs and the server would keep running and
 * answer every request with 500, so bad config ends the process instead.
 */
export function assertAuthEnvOrExit(): void {
  try {
    authEnv();
  } catch (error) {
    console.error(`[auth] server not started: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

function readAuthEnv(env: NodeJS.ProcessEnv): AuthEnv {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length) throw new Error(`Auth config missing: ${missing.join(", ")}`);
  const dev = env.NODE_ENV === "development";
  if (env.EMAIL_PROVIDER !== "console" && env.EMAIL_PROVIDER !== "smtp") {
    throw new Error(`EMAIL_PROVIDER must be "smtp" or "console", got "${env.EMAIL_PROVIDER}"`);
  }
  if (env.EMAIL_PROVIDER === "console" && !dev) throw new Error("EMAIL_PROVIDER=console is only allowed with NODE_ENV=development");
  // Behind a proxy every client would share one rate-limit key without it, so only dev may leave it empty.
  if (!dev && !env.AUTH_TRUSTED_IP_HEADER) throw new Error("Auth config missing: AUTH_TRUSTED_IP_HEADER");
  return {
    appOrigin: new URL(env.APP_URL!).origin,
    otpPepper: secretKey(env, "AUTH_OTP_PEPPER"),
    hashKey: secretKey(env, "AUTH_HASH_KEY"),
    ipHeader: env.AUTH_TRUSTED_IP_HEADER?.toLowerCase() || null,
    emailFrom: env.EMAIL_FROM!,
    smtp: env.EMAIL_PROVIDER === "smtp" ? readSmtp(env) : null,
  };
}

function readSmtp(env: NodeJS.ProcessEnv): SmtpConfig {
  const missing = SMTP_REQUIRED.filter((name) => !env[name]);
  if (missing.length) throw new Error(`SMTP config missing: ${missing.join(", ")}`);
  const port = Number(env.SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT must be a port number");
  if (env.SMTP_SECURE !== "true" && env.SMTP_SECURE !== "false") throw new Error('SMTP_SECURE must be "true" or "false"');
  return { host: env.SMTP_HOST!, port, secure: env.SMTP_SECURE === "true", user: env.SMTP_USER!, pass: env.SMTP_PASS! };
}

function secretKey(env: NodeJS.ProcessEnv, name: string): Buffer {
  const key = Buffer.from(env[name]!, "base64");
  if (key.length < MIN_KEY_BYTES) throw new Error(`${name} must be at least ${MIN_KEY_BYTES} random bytes (base64)`);
  return key;
}
