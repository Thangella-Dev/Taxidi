import { NextResponse } from "next/server";

const ALLOWED_LEVELS = new Set(["info", "warn", "error"]);
const MAX_BODY_BYTES = 12_000;

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Payload too large", requestId }, { status: 413 });
  }

  let incoming: Record<string, unknown>;
  try {
    incoming = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON", requestId }, { status: 400 });
  }

  const name = cleanText(incoming.name, 80);
  if (!name) return NextResponse.json({ error: "Event name is required", requestId }, { status: 400 });
  const level = typeof incoming.level === "string" && ALLOWED_LEVELS.has(incoming.level) ? incoming.level : "info";
  const entry = {
    type: "taxiro.telemetry",
    requestId,
    name,
    level,
    message: cleanText(incoming.message, 500),
    route: cleanRoute(incoming.route),
    durationMs: cleanNumber(incoming.durationMs),
    value: cleanNumber(incoming.value),
    metadata: cleanMetadata(incoming.metadata),
    occurredAt: cleanText(incoming.occurredAt, 40) ?? new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    userAgent: cleanText(request.headers.get("user-agent"), 180),
  };
  const serialized = JSON.stringify(entry);
  if (level === "error") console.error(serialized);
  else if (level === "warn") console.warn(serialized);
  else console.info(serialized);
  return NextResponse.json({ accepted: true, requestId }, { status: 202 });
}

function cleanText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const cleaned = value.replace(/sb_[A-Za-z0-9_-]+/g, "[redacted]").replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]").trim();
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function cleanRoute(value: unknown) {
  const route = cleanText(value, 180);
  return route?.startsWith("/") ? route.split("?")[0] : null;
}

function cleanNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function cleanMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const cleaned: Record<string, string | number | boolean | null> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 20)) {
    const safeKey = key.replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 40);
    if (!safeKey) continue;
    if (typeof item === "boolean" || item === null) {
      cleaned[safeKey] = item;
      continue;
    }
    if (typeof item === "number" && Number.isFinite(item)) {
      cleaned[safeKey] = item;
      continue;
    }
    const text = cleanText(item, 160);
    if (text !== null) cleaned[safeKey] = text;
  }
  return cleaned;
}
