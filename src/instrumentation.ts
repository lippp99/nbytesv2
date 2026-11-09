// Runs once at server start: invalid auth config (missing env, short pepper, console mailer outside dev) stops the
// process. The check lives in a Node-only module, imported only for the Node runtime (docs: instrumentation.md).
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertAuthEnvOrExit } = await import("@/lib/server/auth/auth-env");
    assertAuthEnvOrExit();
  }
}
