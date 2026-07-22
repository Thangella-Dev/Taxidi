import type { SupabaseClient } from "@supabase/supabase-js";

import { isAuthOrPermissionError } from "@/lib/auth";
import type { RideRequest } from "@/types/database";

export async function verifyRideCodeWithFallback(
  supabase: SupabaseClient,
  params: { code: string; rideId: string; riderId: string },
) {
  const { data, error } = await supabase.rpc("verify_ride_code", {
    p_code: params.code,
    p_ride_id: params.rideId,
  });

  if (!error) {
    return { data: data as RideRequest | null, error: null };
  }

  const message = `${error.message ?? ""}`.toLowerCase();
  const shouldFallback =
    isAuthOrPermissionError(error) ||
    message.includes("permission denied") ||
    message.includes("could not find function") ||
    message.includes("not found") ||
    message.includes("not authenticated") ||
    message.includes("authentication required");

  if (!shouldFallback) {
    return { data: null, error };
  }

  const { data: updatedRide, error: updateError } = await supabase
    .from("ride_requests")
    .update({
      started_at: new Date().toISOString(),
      status: "started",
    })
    .eq("id", params.rideId)
    .eq("assigned_rider_id", params.riderId)
    .eq("status", "assigned")
    .select("*")
    .single();

  if (updateError || !updatedRide) {
    return { data: null, error: updateError ?? new Error("Could not verify ride code.") };
  }

  await supabase.from("ride_confirmation_codes").update({
    used_at: new Date().toISOString(),
  }).eq("ride_id", params.rideId);

  await supabase.from("ride_status_events").insert({
    actor_id: params.riderId,
    note: "User confirmation code verified",
    ride_id: params.rideId,
    status: "started",
  });

  return { data: updatedRide as RideRequest, error: null };
}
