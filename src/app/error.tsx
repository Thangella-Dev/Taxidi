"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { reportTelemetry } from "@/lib/telemetry";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportTelemetry({ level: "error", message: error.message, metadata: { digest: error.digest ?? null }, name: "app_route_error" });
  }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center bg-background p-6 text-foreground">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-lg">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-muted-foreground">Taxiro recovery</p>
        <h1 className="mt-2 text-2xl font-black">This screen could not load</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Your ride data is still stored. Check your connection and try this screen again.</p>
        <Button className="mt-5 w-full" onClick={reset}>Try again</Button>
      </section>
    </main>
  );
}
