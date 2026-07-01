"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, CheckCheck, ChevronRight, ShieldAlert, Trash2, X } from "lucide-react";

import { getSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import type { AppNotification } from "@/types/database";

export function AppNotificationBell({
  className,
  profileId,
}: {
  className?: string;
  profileId: string | null;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationError, setNotificationError] = useState("");
  const [open, setOpen] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!profileId) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = await supabase
      .from("app_notifications")
      .select("*")
      .eq("profile_id", profileId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(20);
    setNotifications((data as AppNotification[]) ?? []);
  }, [profileId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadNotifications(), 0);
    if (!profileId) return () => window.clearTimeout(timer);
    const supabase = getSupabase();
    if (!supabase) return () => window.clearTimeout(timer);
    const channel = supabase
      .channel("taxiro-home-notification-bell-" + profileId)
      .on(
        "postgres_changes",
        { event: "*", filter: "profile_id=eq." + profileId, schema: "public", table: "app_notifications" },
        () => void loadNotifications(),
      )
      .subscribe();
    return () => {
      window.clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [loadNotifications, profileId]);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  async function dismissNotification(notificationId: string) {
    setNotifications((current) => current.filter((notification) => notification.id !== notificationId));
    setNotificationError("");
    const supabase = getSupabase();
    if (!supabase || !profileId) return;
    const { error } = await supabase
      .from("app_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notificationId)
      .eq("profile_id", profileId);
    if (error) {
      setNotificationError("Could not dismiss this notification. Please try again.");
      await loadNotifications();
    }
  }

  async function markAllRead() {
    if (!profileId) return;
    setNotifications([]);
    setNotificationError("");
    const supabase = getSupabase();
    if (!supabase) return;
    const { error } = await supabase
      .from("app_notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("profile_id", profileId)
      .is("read_at", null);
    if (error) {
      setNotificationError("Could not clear notifications. Please try again.");
      await loadNotifications();
    }
  }

  const unreadCount = notifications.length;

  return (
    <div className={cn("relative", className)}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Open notifications"
        className="relative flex size-10 items-center justify-center rounded-xl border border-border bg-card/95 shadow-[var(--shadow-soft)] backdrop-blur transition active:scale-95 sm:size-11"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Bell className="size-4 text-primary sm:size-5" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-5 text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[2400]">
              <button
                aria-label="Close notifications"
                className="absolute inset-0 cursor-default bg-black/10 backdrop-blur-[1px]"
                onClick={() => setOpen(false)}
                type="button"
              />
              <section
                aria-label="Notifications"
                aria-modal="true"
                className="taxiro-notification-panel fixed max-h-[calc(100dvh-5rem)] overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
                role="dialog"
              >
                <header className="flex items-center justify-between gap-3 border-b border-border bg-muted/70 p-3 backdrop-blur">
                  <div className="min-w-0">
                    <p className="font-black">Notifications</p>
                    <p className="truncate text-xs text-muted-foreground">Swipe left or tap dismiss</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {notifications.length ? (
                      <button aria-label="Clear all notifications" className="flex size-9 items-center justify-center rounded-xl bg-card text-primary shadow-sm" onClick={() => void markAllRead()} type="button">
                        <CheckCheck className="size-4" />
                      </button>
                    ) : null}
                    <button aria-label="Close notifications" className="flex size-9 items-center justify-center rounded-xl bg-card text-primary shadow-sm" onClick={() => setOpen(false)} type="button">
                      <X className="size-4" />
                    </button>
                  </div>
                </header>
                {notificationError ? <p className="mx-2 mt-2 rounded-xl bg-red-50 p-2 text-xs font-bold text-red-700" role="status">{notificationError}</p> : null}
                <div className="grid max-h-[calc(100dvh-9.75rem)] gap-2 overflow-y-auto overscroll-contain p-2">
                  {notifications.length ? notifications.map((notification) => (
                    <SwipeNotificationCard
                      key={notification.id}
                      notification={notification}
                      onDismiss={() => void dismissNotification(notification.id)}
                    />
                  )) : (
                    <div className="grid place-items-center rounded-2xl bg-muted p-8 text-center">
                      <Bell className="size-6 text-muted-foreground" />
                      <p className="mt-3 font-black">You are all caught up</p>
                      <p className="mt-1 text-sm text-muted-foreground">New ride and safety updates will appear here.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function SwipeNotificationCard({
  notification,
  onDismiss,
}: {
  notification: AppNotification;
  onDismiss: () => void;
}) {
  const startXRef = useRef<number | null>(null);
  const startYRef = useRef<number | null>(null);
  const horizontalDragRef = useRef(false);
  const offsetRef = useRef(0);
  const [dismissing, setDismissing] = useState(false);
  const [offset, setOffset] = useState(0);

  function updateOffset(value: number) {
    offsetRef.current = value;
    setOffset(value);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    horizontalDragRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (startXRef.current === null || startYRef.current === null) return;
    const deltaX = event.clientX - startXRef.current;
    const deltaY = event.clientY - startYRef.current;
    if (!horizontalDragRef.current) {
      if (Math.abs(deltaX) < 7 && Math.abs(deltaY) < 7) return;
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        startXRef.current = null;
        startYRef.current = null;
        updateOffset(0);
        return;
      }
      horizontalDragRef.current = true;
    }
    event.preventDefault();
    updateOffset(Math.min(0, Math.max(-132, deltaX)));
  }

  function finishPointer(event: React.PointerEvent<HTMLDivElement>) {
    const shouldDismiss = horizontalDragRef.current && offsetRef.current < -54;
    startXRef.current = null;
    startYRef.current = null;
    horizontalDragRef.current = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (shouldDismiss) {
      setDismissing(true);
      updateOffset(-420);
      window.setTimeout(onDismiss, 180);
    } else {
      updateOffset(0);
    }
  }

  function cancelPointer(event: React.PointerEvent<HTMLDivElement>) {
    startXRef.current = null;
    startYRef.current = null;
    horizontalDragRef.current = false;
    updateOffset(0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function dismissNow() {
    setDismissing(true);
    updateOffset(-420);
    window.setTimeout(onDismiss, 180);
  }

  return (
    <article className="relative overflow-hidden rounded-2xl bg-red-600">
      <div className="absolute inset-y-0 right-0 flex w-24 items-center justify-center gap-1 text-xs font-black text-white">
        <Trash2 className="size-4" />
        Dismiss
      </div>
      <div
        className={cn(
          "relative rounded-2xl border border-red-200 bg-red-50 p-3 text-sm touch-pan-y",
          dismissing ? "transition-transform duration-200 ease-in" : "transition-transform duration-150 ease-out",
        )}
        onPointerCancel={cancelPointer}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishPointer}
        style={{ transform: "translateX(" + offset + "px)" }}
      >
        <div className="flex items-start gap-2">
          <ShieldAlert className={cn("mt-0.5 size-4 shrink-0", notification.category === "safety" ? "text-red-600" : "text-primary")} />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 font-black">{notification.title}</p>
            <p className="mt-1 line-clamp-3 text-muted-foreground">{notification.body}</p>
            <p className="mt-2 text-[11px] font-bold text-muted-foreground">
              {new Date(notification.created_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
            </p>
            {notification.related_ride_id ? (
              <Link className="mt-2 inline-flex items-center gap-1 font-black text-primary" href={"/rides/" + notification.related_ride_id}>
                Open ride <ChevronRight className="size-3.5" />
              </Link>
            ) : null}
          </div>
          <button aria-label="Dismiss notification" className="grid size-8 shrink-0 place-items-center rounded-xl bg-white shadow-sm" onClick={dismissNow} type="button">
            <X className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
