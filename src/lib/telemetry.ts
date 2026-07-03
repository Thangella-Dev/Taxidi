export type TelemetryLevel = "info" | "warn" | "error";

export type TelemetryEvent = {
  name: string;
  level?: TelemetryLevel;
  message?: string;
  route?: string;
  durationMs?: number;
  value?: number;
  metadata?: Record<string, string | number | boolean | null>;
};

export function reportTelemetry(event: TelemetryEvent) {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    ...event,
    route: event.route ?? window.location.pathname,
    occurredAt: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/telemetry", new Blob([payload], { type: "application/json" }));
    return;
  }

  void fetch("/api/telemetry", {
    body: payload,
    headers: { "content-type": "application/json" },
    keepalive: true,
    method: "POST",
  });
}
