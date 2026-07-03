"use client";

import { useEffect } from "react";
import { useReportWebVitals } from "next/web-vitals";

import { reportTelemetry } from "@/lib/telemetry";

export function TelemetryReporter() {
  useReportWebVitals((metric) => reportTelemetry({ name: "web_vital", metadata: { id: metric.id, metric: metric.name, rating: metric.rating }, value: metric.value }));

  useEffect(() => {
    const reportError = (event: ErrorEvent) => reportTelemetry({ level: "error", message: event.message || "Unhandled browser error", metadata: { column: event.colno, line: event.lineno }, name: "browser_error" });
    const reportRejection = (event: PromiseRejectionEvent) => reportTelemetry({ level: "error", message: event.reason instanceof Error ? event.reason.message : typeof event.reason === "string" ? event.reason : "Unhandled promise rejection", name: "unhandled_rejection" });
    window.addEventListener("error", reportError);
    window.addEventListener("unhandledrejection", reportRejection);
    return () => {
      window.removeEventListener("error", reportError);
      window.removeEventListener("unhandledrejection", reportRejection);
    };
  }, []);
  return null;
}
