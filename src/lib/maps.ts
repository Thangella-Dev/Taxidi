import type { LatLng } from "@/types/database";

export type SearchResult = LatLng & {
  label: string;
};

const nominatimBase =
  process.env.NEXT_PUBLIC_NOMINATIM_BASE_URL ??
  "https://nominatim.openstreetmap.org";
const osrmBase =
  process.env.NEXT_PUBLIC_OSRM_BASE_URL ?? "https://router.project-osrm.org";

export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  if (query.trim().length < 3) {
    return [];
  }

  const params = new URLSearchParams({
    addressdetails: "1",
    countrycodes: "in",
    format: "json",
    limit: "5",
    q: query,
  });

  const response = await fetch(`${nominatimBase}/search?${params.toString()}`, {
    signal,
  });
  if (!response.ok) {
    throw new Error("Location search failed");
  }

  const rows = (await response.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;

  return rows.map((row) => ({
    address: row.display_name,
    label: row.display_name,
    lat: Number(row.lat),
    lng: Number(row.lon),
  }));
}


export async function reverseGeocode(point: LatLng): Promise<string | null> {
  const params = new URLSearchParams({
    addressdetails: "1",
    format: "json",
    lat: String(point.lat),
    lon: String(point.lng),
    zoom: "18",
  });

  try {
    const response = await fetch(`${nominatimBase}/reverse?${params.toString()}`);
    if (!response.ok) return null;
    const row = (await response.json()) as { display_name?: string };
    return row.display_name ?? null;
  } catch {
    return null;
  }
}
export async function getRouteSummary(pickup: LatLng, drop: LatLng) {
  const coords = `${pickup.lng},${pickup.lat};${drop.lng},${drop.lat}`;

  try {
    const response = await fetch(
      `${osrmBase}/route/v1/driving/${coords}?overview=full&geometries=polyline`,
    );

    if (!response.ok) {
      return getFallbackRouteSummary(pickup, drop);
    }

    const data = (await response.json()) as {
      routes?: Array<{ distance: number; duration: number; geometry: string }>;
    };
    const route = data.routes?.[0];

    if (!route) {
      return getFallbackRouteSummary(pickup, drop);
    }

    return {
      distanceKm: Number((route.distance / 1000).toFixed(2)),
      durationMin: Math.round(route.duration / 60),
      polyline: route.geometry ?? null,
    };
  } catch {
    return getFallbackRouteSummary(pickup, drop);
  }
}

function getFallbackRouteSummary(pickup: LatLng, drop: LatLng) {
  const distanceKm = Number((distanceKmBetween(pickup, drop) * 1.25).toFixed(2));
  return {
    distanceKm,
    durationMin: Math.max(1, Math.round((distanceKm / 28) * 60)),
    polyline: null,
  };
}

function distanceKmBetween(from: LatLng, to: LatLng) {
  const earthRadiusKm = 6371;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.lat - from.lat);
  const longitudeDelta = radians(to.lng - from.lng);
  const fromLatitude = radians(from.lat);
  const toLatitude = radians(to.lat);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export async function getRoutePath(pickup: LatLng, drop: LatLng): Promise<LatLng[]> {
  const summary = await getRouteSummary(pickup, drop);
  return summary.polyline ? decodePolyline(summary.polyline) : [];
}

export function decodePolyline(encoded: string): LatLng[] {
  const points: LatLng[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    const latitudeResult = decodeChunk(encoded, index);
    index = latitudeResult.nextIndex;
    lat += latitudeResult.delta;

    const longitudeResult = decodeChunk(encoded, index);
    index = longitudeResult.nextIndex;
    lng += longitudeResult.delta;

    points.push({
      lat: lat / 100000,
      lng: lng / 100000,
    });
  }

  return points;
}

function decodeChunk(encoded: string, startIndex: number) {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte = 0;

  do {
    byte = encoded.charCodeAt(index) - 63;
    result |= (byte & 0x1f) << shift;
    shift += 5;
    index += 1;
  } while (byte >= 0x20 && index <= encoded.length);

  return {
    delta: result & 1 ? ~(result >> 1) : result >> 1,
    nextIndex: index,
  };
}



