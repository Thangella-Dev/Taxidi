Hi Sir,

This update covers work completed on 23 July 2026 for the Taxiro application.

Today I focused on production stabilization and Supabase reliability issues reported from the live app console.

Completed:

- Fixed fare display reliability when `calculate_taxiro_fare` returns a Supabase permission error.
- Added app-side fallback fare calculation so price still shows to the user instead of blocking booking.
- Implemented fallback pricing rules:
  - Standard time: Rs 7/km.
  - Peak time: Rs 8/km.
  - Auto: Rs 1/km extra.
  - Car-family vehicles: Rs 2/km extra.
- Added session-level suppression for repeated failed fare RPC calls to reduce console/API noise.
- Fixed booking payloads so selected vehicle type, per-km rate, surcharge, fare estimate, commission, and rider earning remain database-compatible.
- Fixed OSRM network-change failures by adding fallback route distance and ETA estimation.
- Added Supabase migration `20260723100000_pricing_permission_and_fallback_repair.sql`.
- Applied the migration to the live Supabase project.
- Repaired stale fare validation constraints and vehicle surcharge validation for Bike, Auto, Hatchback, Sedan, SUV, and legacy Car values.
- Repaired fare audit insert policy and RPC execute grants for pricing, fare breakdown attachment, and cancellation flows.
- Refreshed Supabase PostgREST schema cache.

Verification completed:

- `npm run db:validate` passed with 40 additive migrations.
- `npm run typecheck` passed.
- `npm run lint` passed.
- `npm run build` passed with 24 app routes.
- `git diff --check` passed.

Current status:

- Fare preview is now more reliable in production.
- Booking has a safe fallback if enterprise pricing is temporarily unavailable.
- Vehicle-based surcharge values are aligned between frontend and database.
- Route/network interruptions from OSRM no longer break the booking flow.
- Supabase production permissions are more stable for fare and cancellation related flows.

Next planned work:

- Run a two-device user/rider booking test on production after deployment.
- Confirm live fare display for Bike, Auto, Hatchback, Sedan, and SUV.
- Re-test user and rider cancellation on scheduled, ready, assigned, started, and completed ride states.
- Continue tightening Supabase security linter warnings without breaking MVP functionality.

Regards,
Thangella G