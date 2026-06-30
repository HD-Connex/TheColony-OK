// Centralized logging. Debug logs are dev-only; warnings and errors always
// emit. `error()` also forwards to Sentry (captureException for Error args,
// captureMessage otherwise) when a DSN is configured, so every existing
// `log.error(...)` call site becomes a Sentry capture point with no extra work.
import * as Sentry from "@sentry/nextjs";

// Resolved once at module load. On the server both vars are available; on the
// client NEXT_PUBLIC_SENTRY_DSN is inlined at build time. captureException is a
// no-op when Sentry isn't initialized, but this guard skips the work entirely.
const sentryEnabled = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
);

function argsToMessage(args: unknown[]): string {
  return args
    .map((a) => {
      if (typeof a === "string") return a;
      if (a instanceof Error) return a.message;
      try {
        return JSON.stringify(a);
      } catch {
        return String(a);
      }
    })
    .join(" ");
}

export const log = {
  debug(...args: unknown[]) {
    if (process.env.NODE_ENV !== "production") console.log(...args);
  },
  warn(...args: unknown[]) {
    console.warn(...args);
  },
  error(...args: unknown[]) {
    console.error(...args);
    if (!sentryEnabled) return;
    const err = args.find((a) => a instanceof Error) as Error | undefined;
    if (err) {
      Sentry.captureException(err);
    } else if (args.length > 0) {
      Sentry.captureMessage(argsToMessage(args), "error");
    }
  },
};
