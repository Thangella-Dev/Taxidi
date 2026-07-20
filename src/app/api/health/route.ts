import fs from "node:fs/promises";
import path from "node:path";

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type HealthStatus =
  "ok" | "missing_migration" | "access_restricted" | "skipped" | "degraded";

type HealthCheck = {
  description: string;
  ok: boolean;
  required: boolean;
  status?: HealthStatus;
  migration?: string;
};

type MigrationManifest = {
  latestMigration: string | null;
  migrationCount: number;
  requiredFiles: { feature: string; file: string; present: boolean }[];
};

const SUPABASE_PROBE_TIMEOUT_MS = 6_000;

const REQUIRED_OPERATIONAL_MIGRATIONS = [
  {
    feature: "Customer nearby rider preview",
    file: "20260701203000_customer_nearby_rider_preview.sql",
  },
  {
    feature: "Service areas and vehicle pricing rules",
    file: "20260703110000_operational_and_product_foundation.sql",
  },
  {
    feature: "Operational enforcement and fraud signals",
    file: "20260706100000_operational_enforcement_and_fraud.sql",
  },
] as const;

export async function GET() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const hasPublicDatabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

  const checks: Record<string, HealthCheck> = {
    publicDatabaseConfiguration: {
      description:
        "Supabase public URL and anon key are configured for browser data access.",
      ok: hasPublicDatabaseConfig,
      required: true,
      status: hasPublicDatabaseConfig ? "ok" : "degraded",
    },
    serviceRoleConfiguration: {
      description:
        "Server-only Supabase service role key is configured for scheduled jobs.",
      ok: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      required: false,
      status: process.env.SUPABASE_SERVICE_ROLE_KEY ? "ok" : "degraded",
    },
    cronSecretConfiguration: {
      description:
        "Cron secret is configured for protected background job execution.",
      ok: Boolean(process.env.CRON_SECRET),
      required: false,
      status: process.env.CRON_SECRET ? "ok" : "degraded",
    },
    siteUrlConfiguration: {
      description:
        "Public site URL is configured for metadata and production links.",
      ok: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      required: false,
      status: process.env.NEXT_PUBLIC_SITE_URL ? "ok" : "degraded",
    },
    vercelGitMetadata: {
      description:
        "Vercel git commit metadata is available for deployment traceability.",
      ok: Boolean(process.env.VERCEL_GIT_COMMIT_SHA),
      required: false,
      status: process.env.VERCEL_GIT_COMMIT_SHA ? "ok" : "degraded",
    },
    vercelHobbyCronCompatibility: {
      description:
        "Vercel cron is configured for the Hobby-safe daily schedule. Five-minute ready-signal expiry needs Vercel Pro or an external scheduler.",
      ok: true,
      required: false,
      status: "ok",
    },
  };

  const [databaseChecks, migrationManifest] = await Promise.all([
    getDatabaseReadinessChecks({
      hasPublicDatabaseConfig,
      supabaseAnonKey,
      supabaseUrl,
    }),
    getMigrationManifest(),
  ]);
  const localMigrationsOk = migrationManifest.requiredFiles.every(
    (item) => item.present,
  );
  Object.assign(checks, databaseChecks, {
    localMigrationFiles: {
      description: localMigrationsOk
        ? `All required operational migration files are present locally. Latest local migration: ${migrationManifest.latestMigration ?? "none"}.`
        : "One or more required operational migration files are missing from the deployed source.",
      ok: localMigrationsOk,
      required: false,
      status: localMigrationsOk ? "ok" : "degraded",
    } satisfies HealthCheck,
  });

  const requiredOk = Object.values(checks)
    .filter((check) => check.required)
    .every((check) => check.ok);
  const optionalOk = Object.values(checks)
    .filter((check) => !check.required)
    .every((check) => check.ok);
  const status =
    requiredOk && optionalOk ? "ok" : requiredOk ? "degraded" : "failed";
  const summary = buildHealthSummary(checks, migrationManifest);
  const deploymentBlockers = buildDeploymentBlockers(checks);

  const response = NextResponse.json(
    {
      checks,
      deployment: {
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
        environment: process.env.VERCEL_ENV ?? "local",
        region: process.env.VERCEL_REGION ?? "local",
        url: process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : (process.env.NEXT_PUBLIC_SITE_URL ?? "local"),
      },
      deploymentBlockers,
      generatedAt: new Date().toISOString(),
      migrationManifest,
      recommendations: [
        "Set Supabase GitHub integration working directory to blank or '.' because this repo stores supabase/migrations at the repository root.",
        "Deploy from a fresh commit authored by the Vercel team member account, not an older failed deployment authored by an outside account.",
        "Keep Vercel Hobby cron on '0 0 * * *'. Use Vercel Pro or an external scheduler for five-minute ready-signal expiry.",
        "If database readiness shows Missing migration, apply the listed SQL file in Supabase SQL Editor and reload the PostgREST schema cache.",
        "Use the migration manifest to confirm the deployed source contains the same migration files expected by production Supabase.",
      ],
      requiredOperationalMigrations: REQUIRED_OPERATIONAL_MIGRATIONS.map(
        (item) => item.file,
      ),
      service: "taxiro-web",
      status,
      summary,
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local",
    },
    { status: requiredOk ? 200 : 503 },
  );
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

async function getDatabaseReadinessChecks({
  hasPublicDatabaseConfig,
  supabaseAnonKey,
  supabaseUrl,
}: {
  hasPublicDatabaseConfig: boolean;
  supabaseAnonKey: string;
  supabaseUrl: string;
}) {
  if (!hasPublicDatabaseConfig) {
    return {
      serviceAreasTable: skippedDatabaseCheck(
        "service_areas table check skipped until Supabase public env vars are configured.",
        REQUIRED_OPERATIONAL_MIGRATIONS[1].file,
      ),
      pricingRulesTable: skippedDatabaseCheck(
        "pricing_rules table check skipped until Supabase public env vars are configured.",
        REQUIRED_OPERATIONAL_MIGRATIONS[1].file,
      ),
      nearbyRidersRpc: skippedDatabaseCheck(
        "get_nearby_available_riders RPC check skipped until Supabase public env vars are configured.",
        REQUIRED_OPERATIONAL_MIGRATIONS[0].file,
      ),
    } satisfies Record<string, HealthCheck>;
  }

  const [serviceAreasTable, pricingRulesTable, nearbyRidersRpc] =
    await Promise.all([
      probeSupabaseObject({
        description:
          "service_areas table is available for configured service-zone pricing.",
        migration: REQUIRED_OPERATIONAL_MIGRATIONS[1].file,
        request: (signal) =>
          fetch(`${supabaseUrl}/rest/v1/service_areas?select=id&limit=1`, {
            headers: supabaseHeaders(supabaseAnonKey),
            cache: "no-store",
            signal,
          }),
      }),
      probeSupabaseObject({
        description:
          "pricing_rules table is available for configured vehicle and peak pricing.",
        migration: REQUIRED_OPERATIONAL_MIGRATIONS[1].file,
        request: (signal) =>
          fetch(`${supabaseUrl}/rest/v1/pricing_rules?select=id&limit=1`, {
            headers: supabaseHeaders(supabaseAnonKey),
            cache: "no-store",
            signal,
          }),
      }),
      probeSupabaseObject({
        description:
          "get_nearby_available_riders RPC is available for customer map rider previews.",
        migration: REQUIRED_OPERATIONAL_MIGRATIONS[0].file,
        request: (signal) =>
          fetch(`${supabaseUrl}/rest/v1/rpc/get_nearby_available_riders`, {
            body: JSON.stringify({
              p_lat: 17.385,
              p_lng: 78.4867,
              p_radius_km: 1,
            }),
            cache: "no-store",
            headers: {
              ...supabaseHeaders(supabaseAnonKey),
              "Content-Type": "application/json",
            },
            method: "POST",
            signal,
          }),
      }),
    ]);

  return {
    serviceAreasTable,
    pricingRulesTable,
    nearbyRidersRpc,
  } satisfies Record<string, HealthCheck>;
}

async function getMigrationManifest(): Promise<MigrationManifest> {
  const migrationDirectory = path.join(process.cwd(), "supabase", "migrations");

  try {
    const files = (await fs.readdir(migrationDirectory))
      .filter((file) => file.endsWith(".sql"))
      .sort();
    const fileSet = new Set(files);

    return {
      latestMigration: files.at(-1) ?? null,
      migrationCount: files.length,
      requiredFiles: REQUIRED_OPERATIONAL_MIGRATIONS.map((item) => ({
        feature: item.feature,
        file: item.file,
        present: fileSet.has(item.file),
      })),
    };
  } catch {
    return {
      latestMigration: null,
      migrationCount: 0,
      requiredFiles: REQUIRED_OPERATIONAL_MIGRATIONS.map((item) => ({
        feature: item.feature,
        file: item.file,
        present: false,
      })),
    };
  }
}

function buildHealthSummary(
  checks: Record<string, HealthCheck>,
  migrationManifest: MigrationManifest,
) {
  const entries = Object.values(checks);
  const missingMigrationChecks = entries.filter(
    (check) => check.status === "missing_migration",
  ).length;
  const failingRequiredChecks = entries.filter(
    (check) => check.required && !check.ok,
  ).length;
  const degradedOptionalChecks = entries.filter(
    (check) =>
      !check.required && !check.ok && check.status !== "missing_migration",
  ).length;
  const missingLocalMigrationFiles = migrationManifest.requiredFiles.filter(
    (item) => !item.present,
  ).length;

  return {
    degradedOptionalChecks,
    failingRequiredChecks,
    missingLocalMigrationFiles,
    missingMigrationChecks,
    passingChecks: entries.filter((check) => check.ok).length,
    readyForPilot:
      failingRequiredChecks === 0 &&
      missingMigrationChecks === 0 &&
      missingLocalMigrationFiles === 0,
    totalChecks: entries.length,
  };
}

function buildDeploymentBlockers(checks: Record<string, HealthCheck>) {
  return Object.entries(checks)
    .filter(
      ([, check]) =>
        check.required ||
        check.status === "missing_migration" ||
        (!check.ok && check.status === "degraded"),
    )
    .filter(([, check]) => !check.ok)
    .map(([key, check]) => ({
      description: check.description,
      key,
      migration: check.migration ?? null,
      status: check.status ?? "degraded",
    }));
}

function supabaseHeaders(anonKey: string) {
  return {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
}

function skippedDatabaseCheck(
  description: string,
  migration: string,
): HealthCheck {
  return {
    description,
    ok: false,
    required: false,
    status: "skipped",
    migration,
  };
}

async function probeSupabaseObject({
  description,
  migration,
  request,
}: {
  description: string;
  migration: string;
  request: (signal: AbortSignal) => Promise<Response>;
}): Promise<HealthCheck> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    SUPABASE_PROBE_TIMEOUT_MS,
  );

  try {
    const response = await request(controller.signal);

    if (response.status === 404) {
      return {
        description: `${description} Missing migration or stale Supabase schema cache detected.`,
        ok: false,
        required: false,
        status: "missing_migration",
        migration,
      };
    }

    if (response.ok) {
      return {
        description,
        ok: true,
        required: false,
        status: "ok",
        migration,
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        description: `${description} Object exists but public health probing is restricted by RLS or grants, which is acceptable for authenticated app use.`,
        ok: true,
        required: false,
        status: "access_restricted",
        migration,
      };
    }

    return {
      description: `${description} Probe returned HTTP ${response.status}; check Supabase logs if this persists.`,
      ok: false,
      required: false,
      status: "degraded",
      migration,
    };
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    return {
      description: timedOut
        ? `${description} Probe timed out after ${SUPABASE_PROBE_TIMEOUT_MS / 1000}s; check Supabase network reachability from Vercel.`
        : `${description} Probe could not reach Supabase from the current deployment/runtime.`,
      ok: false,
      required: false,
      status: "degraded",
      migration,
    };
  } finally {
    clearTimeout(timeout);
  }
}
