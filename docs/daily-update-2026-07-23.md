# Taxiro Daily Development Update - 23 July 2026

Project: **Taxiro**
Date: **23 July 2026**
Focus: **Production pricing reliability, Supabase permission repair, route fallback stability, and booking validation**

## Summary

Today I completed a production stabilization pass for issues seen in the live app console. The main problems were fare calculation not showing because `calculate_taxiro_fare` returned `403`, ride cancellation still returning permission errors in some states, OSRM route calls throwing `Failed to fetch` during network changes, and vehicle fare data not always matching the database constraint expectations.

## Completed Work

- Added a resilient app-side fare fallback so Taxiro can still show price when the Supabase pricing RPC is blocked or unavailable.
- Implemented the requested fallback fare rule:
  - Standard time: Rs 7/km base rate.
  - Peak time: Rs 8/km base rate.
  - Auto adds Rs 1/km.
  - Car-family vehicles add Rs 2/km.
- Added session-level suppression for repeated `calculate_taxiro_fare` calls after a permission failure so the browser console is not flooded.
- Updated ride booking insert payloads so `fare_rate_per_km` and `vehicle_surcharge_per_km` match the selected vehicle type.
- Fixed route calculation reliability by adding an OSRM fallback distance/ETA estimate when OSRM fails due to network changes or non-OK responses.
- Added Supabase migration `20260723100000_pricing_permission_and_fallback_repair.sql`.
- The migration repairs stale fare constraints, vehicle surcharge validation, fare audit insert permissions, RPC execute grants, and PostgREST schema cache refresh.
- Applied the new Supabase migration to the live Supabase project successfully.
- Preserved the existing cancellation RPC repair and strengthened production-side grants for `cancel_ride`.

## Supabase Work Completed

- Relaxed obsolete `ride_requests_vehicle_fare_valid` and legacy fare-rate constraints that could block valid enterprise/fallback fare rows.
- Recreated vehicle surcharge validation to support Bike, Auto, Hatchback, Sedan, SUV, and legacy Car values.
- Enabled and repaired insert permission for `fare_audit_logs`.
- Refreshed grants for:
  - `calculate_taxiro_fare`
  - `attach_ride_fare_breakdown`
  - `cancel_ride`
- Revoked those RPCs from anonymous access where appropriate.
- Triggered `notify pgrst, 'reload schema'` so Supabase REST sees the latest function/policy shape.

## Verification Completed

```bash
npm run db:validate
npm run typecheck
npm run lint
npm run build
git diff --check
```

Results:

- 40 additive Supabase migrations validated.
- TypeScript passed.
- ESLint passed.
- Next.js 16.2.7 production build passed with 24 app routes.
- Git whitespace validation passed.
- Live Supabase migration apply returned success.

## Current Status

- Price should now show even if the enterprise pricing RPC is temporarily blocked.
- Booking no longer depends only on the Supabase pricing RPC for the first visible estimate.
- Auto/car-family vehicle surcharge values are now consistent between UI and database.
- OSRM network interruptions should no longer crash route/fare rendering.
- Supabase production permissions and constraints are more aligned with the current app code.

## Notes

The browser message `A listener indicated an asynchronous response...` is usually caused by browser extensions and is not a Taxiro application error. The real app issues addressed today were Supabase `403` fare/cancel behavior and OSRM network fallback behavior.