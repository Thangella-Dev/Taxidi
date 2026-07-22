import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { Profile, UserRole, VehicleType } from "@/types/database";

export type SupabasePermissionError = {
  code?: string;
  message?: string;
  status?: number;
};

export function isAuthOrPermissionError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as SupabasePermissionError;
  const message = candidate.message?.toLowerCase() ?? "";
  const code = candidate.code?.toLowerCase() ?? "";

  return (
    candidate.status === 401 ||
    candidate.status === 403 ||
    code === "42501" ||
    code === "28000" ||
    code === "pgrst116" ||
    message.includes("jwt") ||
    message.includes("not authenticated") ||
    message.includes("permission denied") ||
    message.includes("forbidden") ||
    message.includes("authentication required") ||
    message.includes("row-level security") ||
    message.includes("rls") ||
    message.includes("unauthorized") ||
    message.includes("new row violates")
  );
}

export async function getCurrentUser(supabase: SupabaseClient) {
  const { data, error } = await supabase.auth.getUser();
  if (!error && data.user) {
    return data.user;
  }

  if (isAuthOrPermissionError(error)) {
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      // Ignore sign-out failures during auth recovery.
    }
  }

  return null;
}

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (!userError && user?.id === userId) {
    const { data: ownProfile, error: ownProfileError } =
      await supabase.rpc("get_own_profile");

    if (!ownProfileError) {
      return ownProfile as Profile | null;
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error && !isAuthOrPermissionError(error)) {
    return null;
  }

  return data as Profile | null;
}

export async function ensureProfile(
  supabase: SupabaseClient,
  user: User,
  fallbackRole: UserRole = "user",
) {
  const current = await getProfile(supabase, user.id);
  if (current) {
    return current;
  }

  const metadata = user.user_metadata as {
    full_name?: string;
    phone?: string;
    role?: UserRole;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_number?: string;
    vehicle_type?: VehicleType;
    license_number?: string;
  };
  const requestedRole = metadata.role ?? fallbackRole;
  const safeRole: UserRole =
    requestedRole === "rider" || requestedRole === "user"
      ? requestedRole
      : "user";
  const profile = {
    full_name: metadata.full_name?.trim() || "Taxiro user",
    id: user.id,
    phone: metadata.phone ?? null,
    role: safeRole,
  };

  const { data, error } = await supabase.rpc("upsert_own_profile", {
    p_full_name: profile.full_name,
    p_phone: profile.phone,
    p_role: profile.role,
  });

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("profiles")
      .upsert(profile)
      .select("*")
      .single();

    if (fallbackError) {
      if (isAuthOrPermissionError(fallbackError)) {
        return profile as Profile;
      }
      throw fallbackError;
    }

    return fallbackData as Profile;
  }

  return data as Profile;
}
export async function ensureInitialRiderVehicle(
  supabase: SupabaseClient,
  user: User,
) {
  const metadata = user.user_metadata as {
    license_number?: string;
    role?: UserRole;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_number?: string;
    vehicle_type?: VehicleType;
  };
  if (metadata.role !== "rider") return;

  const vehicleType = metadata.vehicle_type;
  const make = metadata.vehicle_make?.trim();
  const model = metadata.vehicle_model?.trim();
  const registrationNumber = metadata.vehicle_number?.trim().toUpperCase();
  if (!vehicleType || !make || !model || !registrationNumber) return;

  const { data: existing } = await supabase
    .from("rider_vehicles")
    .select("id")
    .eq("rider_id", user.id)
    .eq("vehicle_type", vehicleType)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("rider_vehicles").insert({
      make,
      model,
      registration_number: registrationNumber,
      rider_id: user.id,
      vehicle_type: vehicleType,
    });
    if (error) {
      if (!isAuthOrPermissionError(error)) {
        throw error;
      }
    }
  }

  if (metadata.license_number) {
    const { error } = await supabase.from("rider_profiles").upsert({
      license_number: metadata.license_number.trim().toUpperCase(),
      rider_id: user.id,
      updated_at: new Date().toISOString(),
    });
    if (error && !isAuthOrPermissionError(error)) {
      throw error;
    }
  }
}
export async function uploadRiderLivePhoto(
  supabase: SupabaseClient,
  riderId: string,
  photo: Blob,
) {
  const path = riderId + "/live-selfie-" + Date.now() + ".jpg";
  const { error: uploadError } = await supabase.storage
    .from("rider-verification")
    .upload(path, photo, {
      cacheControl: "3600",
      contentType: "image/jpeg",
      upsert: false,
    });
  if (uploadError) {
    if (!isAuthOrPermissionError(uploadError)) {
      throw uploadError;
    }
    return path;
  }
  const { error } = await supabase.from("rider_profiles").upsert({
    live_selfie_captured_at: new Date().toISOString(),
    live_selfie_path: path,
    rider_id: riderId,
    updated_at: new Date().toISOString(),
  });
  if (error && !isAuthOrPermissionError(error)) {
    throw error;
  }
  return path;
}
