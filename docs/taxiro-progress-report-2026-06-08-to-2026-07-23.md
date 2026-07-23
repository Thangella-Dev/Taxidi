# Taxiro Progress Report - 08 June 2026 to 23 July 2026

## Latest Update - 23 July 2026

Today focused on production reliability and Supabase permission stabilization.

### Completed Today

- Added resilient fare fallback logic for production cases where `calculate_taxiro_fare` returns `403` or becomes unavailable.
- Added Taxiro fallback fare rules: Rs 7/km standard, Rs 8/km peak, Auto + Rs 1/km, and Car-family + Rs 2/km.
- Prevented repeated pricing RPC spam after a permission failure by suppressing repeat calls during the same session.
- Fixed ride booking inserts to save vehicle-compatible `fare_rate_per_km` and `vehicle_surcharge_per_km` values.
- Added OSRM route fallback distance/ETA calculation so network changes do not break route/fare rendering.
- Added and live-applied Supabase migration `20260723100000_pricing_permission_and_fallback_repair.sql`.
- Repaired stale fare constraints, vehicle surcharge validation, fare audit insert policy, and execute grants for fare/cancel RPCs.
- Refreshed the Supabase PostgREST schema cache after migration apply.

### Verification

- `npm run db:validate` passed with 40 additive migrations.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed with 24 routes.
- `git diff --check` passed.

### Production Impact

- User price display is no longer blocked by a temporary Supabase pricing RPC permission issue.
- Booking has a reliable fallback path while enterprise pricing remains available when permissions are correct.
- Vehicle fare data is aligned with database constraints.
- OSRM network interruptions are handled gracefully.

## Overall Status

Taxiro now includes user/rider/admin dashboards, role-based authentication, map-first booking, vehicle-based matching, live rider tracking, ready signals, private ride codes, ride chat, SOS/notification foundations, admin controls, service areas, enterprise pricing tables, wallet/payment foundations, and production-health diagnostics.

The latest work improves pilot readiness by reducing production breakage from database permission drift, pricing RPC failures, stale constraints, and routing network interruptions.