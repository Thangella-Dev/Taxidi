"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShieldAlert, X } from "lucide-react";

import { getSupabase } from "@/lib/supabase";
import type { AppNotification } from "@/types/database";

export function LiveNotificationBanner({ profileId }: { profileId: string | null }) {
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const [offset, setOffset] = useState(0);
  const offsetRef = useRef(0);
  const startXRef = useRef<number | null>(null);

  const loadLatest = useCallback(async () => {
    if (!profileId) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("app_notifications")
      .select("*")
      .eq("profile_id", profileId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setNotification((data as AppNotification | null) ?? null);
  }, [profileId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadLatest(), 0);
    if (!profileId) return () => window.clearTimeout(timer);
    const supabase = getSupabase();
    if (!supabase) return () => window.clearTimeout(timer);
    const channel = supabase
      .channel("live-alert-banner-" + profileId)
      .on(
        "postgres_changes",
        { event: "INSERT", filter: "profile_id=eq." + profileId, schema: "public", table: "app_notifications" },
        (payload) => setNotification(payload.new as AppNotification),
      )
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [loadLatest, profileId]);

  async function dismiss() {
    if (!notification) return;
    const supabase = getSupabase();
    if (supabase) await supabase.from("app_notifications").update({ read_at: new Date().toISOString() }).eq("id", notification.id);
    setNotification(null);
    offsetRef.current = 0;
    setOffset(0);
  }

  function onPointerDown(event: React.PointerEvent<HTMLElement>) {
    startXRef.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLElement>) {
    if (startXRef.current === null) return;
    const delta = event.clientX - startXRef.current;
    offsetRef.current = Math.min(120, Math.max(-120, delta));
    setOffset(offsetRef.current);
  }

  function onPointerUp(event: React.PointerEvent<HTMLElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (Math.abs(offsetRef.current) > 64) void dismiss();
    else {
      offsetRef.current = 0;
      setOffset(0);
    }
    startXRef.current = null;
  }

  if (!notification) return null;

  const body = (
    <div className="flex items-start gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-700"><ShieldAlert className="size-5" /></span>
      <div className="min-w-0 flex-1">
        <p className="font-black">{notification.title}</p>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">{notification.body}</p>
        <div className="mt-2 flex items-center gap-3 text-[11px] font-bold">
          <span className="text-muted-foreground">Swipe to dismiss</span>
          {notification.related_ride_id ? <Link className="text-primary underline underline-offset-2" href={`/rides/${notification.related_ride_id}`} onClick={() => void dismiss()}>Open ride</Link> : null}
        </div>
      </div>
      <button aria-label="Dismiss notification" className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted" onClick={() => void dismiss()} type="button"><X className="size-4" /></button>
    </div>
  );

  return (
    <aside
      className="fixed left-3 right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-[2200] mx-auto max-w-lg rounded-lg border border-red-200 bg-white p-4 shadow-2xl transition-transform touch-pan-y"
      onPointerCancel={onPointerUp}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      role="alert"
      style={{ transform: `translateX(${offset}px)` }}
    >
      {body}
    </aside>
  );
}