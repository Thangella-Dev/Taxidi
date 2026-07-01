"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabase } from "@/lib/supabase";

const DEVICE_KEY = "taxiro-active-device-v1";
let memoryDeviceId: string | null = null;

type AccountSession = {
  profile_id: string;
  device_id: string;
  claimed_at: string;
  last_seen_at: string;
};

export function getOrCreateDeviceId() {
  if (memoryDeviceId) return memoryDeviceId;
  try {
    const current = window.localStorage.getItem(DEVICE_KEY);
    if (current) return (memoryDeviceId = current);
    const created = "taxiro-" + crypto.randomUUID();
    window.localStorage.setItem(DEVICE_KEY, created);
    return (memoryDeviceId = created);
  } catch {
    const created = "taxiro-" + crypto.randomUUID();
    memoryDeviceId = created;
    return created;
  }
}

export async function establishSingleDeviceSession(
  supabase: SupabaseClient,
  userId: string,
) {
  const deviceId = getOrCreateDeviceId();
  await supabase.auth.signOut({ scope: "others" });
  const { error } = await supabase.rpc("claim_account_session", {
    p_device_id: deviceId,
  });
  if (error) throw error;
  return { deviceId, userId };
}

async function validateDeviceClaim(
  supabase: SupabaseClient,
  userId: string,
  deviceId: string,
) {
  const { data, error } = await supabase
    .from("account_sessions")
    .select("*")
    .eq("profile_id", userId)
    .maybeSingle();
  if (error) return true;

  const claim = data as AccountSession | null;
  if (!claim) {
    const { error: claimError } = await supabase.rpc("claim_account_session", {
      p_device_id: deviceId,
    });
    return !claimError;
  }
  if (claim.device_id !== deviceId) return false;
  await supabase.rpc("touch_account_session", { p_device_id: deviceId });
  return true;
}

export function useSingleDeviceSession(enabled = true) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const client = supabase;

    let active = true;
    let channel: ReturnType<typeof client.channel> | null = null;
    const deviceId = getOrCreateDeviceId();

    async function endReplacedSession() {
      if (!active) return;
      active = false;
      await client.auth.signOut({ scope: "local" });
      router.replace("/auth?reason=session-replaced");
      router.refresh();
    }

    async function initialize() {
      const { data } = await client.auth.getSession();
      const userId = data.session?.user.id;
      if (!userId || !active) return;
      if (!(await validateDeviceClaim(client, userId, deviceId))) {
        await endReplacedSession();
        return;
      }

      channel = client
        .channel("account-session-" + userId)
        .on(
          "postgres_changes",
          {
            event: "*",
            filter: "profile_id=eq." + userId,
            schema: "public",
            table: "account_sessions",
          },
          (payload) => {
            const incoming = payload.new as Partial<AccountSession>;
            if (incoming.device_id && incoming.device_id !== deviceId) {
              void endReplacedSession();
            }
          },
        )
        .subscribe();
    }

    void initialize();
    const validateOnResume = () => {
      if (document.visibilityState !== "visible") return;
      void client.auth.getSession().then(async ({ data }) => {
        const userId = data.session?.user.id;
        if (userId && !(await validateDeviceClaim(client, userId, deviceId))) {
          await endReplacedSession();
        }
      });
    };
    const interval = window.setInterval(validateOnResume, 30_000);
    document.addEventListener("visibilitychange", validateOnResume);

    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", validateOnResume);
      if (channel) void client.removeChannel(channel);
    };
  }, [enabled, router]);
}