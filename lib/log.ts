// Centralized logging. Debug logs are dev-only; warnings and errors always
// emit (and feed Sentry once wired via instrumentation).

export const log = {
  debug(...args: unknown[]) {
    if (process.env.NODE_ENV !== "production") console.log(...args);
  },
  warn(...args: unknown[]) {
    console.warn(...args);
  },
  error(...args: unknown[]) {
    console.error(...args);
  },
};
