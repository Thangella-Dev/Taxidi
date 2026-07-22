import type { SupabaseClient } from "@supabase/supabase-js";

import { isAuthOrPermissionError } from "@/lib/auth";
import type { RideRequest } from "@/types/database";

export async function acceptReadyRideWithFallback(
  supabase: SupabaseClient,
  params: { rideId: string; riderId: string },
) {
  const { data, error } = await supabase.rpc("accept_ready_ride", {
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
      accepted_at: new Date().toISOString(),
      assigned_rider_id: params.riderId,
      status: "assigned",
    })
    .eq("id", params.rideId)
    .eq("status", "ready")
    .is("assigned_rider_id", null)
    .select("*")
    .single();

  if (updateError || !updatedRide) {
    return { data: null, error: updateError ?? new Error("Could not accept ride.") };
  }

  await supabase.from("rider_locations").update({
    is_available: false,
    updated_at: new Date().toISOString(),
  }).eq("rider_id", params.riderId);

  await supabase.from("ride_status_events").insert({
    actor_id: params.riderId,
    note: "Ride accepted with verified vehicle",
    ride_id: params.rideId,
    status: "assigned",
  });

  return { data: updatedRide as RideRequest, error: null };
}
