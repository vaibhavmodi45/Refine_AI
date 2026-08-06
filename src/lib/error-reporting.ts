/**
 * Generic client-side error reporter.
 *
 * This replaces the Lovable-specific error-reporting shim that forwarded
 * errors to window.__lovableEvents (only present inside Lovable's editor
 * preview iframe).
 *
 * Currently logs to console.error with context. To wire in a real
 * error-tracking service (e.g. Sentry), replace the body of reportError()
 * with the appropriate SDK call — the signature stays the same.
 */

export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  // Loaders and server fns commonly throw a raw Response; String(it) is the
  // opaque "[object Response]", so pull out the status and URL instead.
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  const stack = error instanceof Error ? error.stack : undefined;

  console.error("[Refine Error]", {
    route: window.location.pathname,
    message,
    stack,
    ...context,
  });
}
