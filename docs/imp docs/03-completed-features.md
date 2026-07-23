# 03 - Taxiro Completed Features

**Date:** 23 July 2026

## User App

- User signup/signin foundation.
- Role-based user dashboard.
- Ride now and advance booking.
- Pickup/drop search.
- Current location detection foundation.
- Map selection for pickup/drop.
- Vehicle selection: Bike, Auto, Hatchback, Sedan, SUV.
- Fare estimate and ETA display.
- Booking for self or someone else.
- Ready signal with expiry options.
- Active ride view.
- Private ride code flow.
- Rider info display after assignment.
- Ride history sections.
- In-app chat foundation.
- In-app notifications foundation.
- SOS foundation.

## Rider App

- Rider signup/profile foundation.
- Rider vehicle setup and verification foundation.
- Rider online/offline.
- Active verified vehicle switching.
- Live foreground GPS tracking.
- Ready job visibility.
- Demand signal visibility.
- Ride acceptance.
- Code verification.
- Pickup/drop phase-aware route display.
- Payment collection/completion foundation.
- Rider cancellation before code verification.

## Admin App

- Admin dashboard.
- People/user/rider visibility.
- Rider verification queue.
- Vehicle review foundation.
- Ride audit view.
- Notification broadcast foundation.
- Safety command foundation.
- Service area controls.
- Pricing rule controls.
- Fraud/location anomaly foundation.
- Admin health diagnostics.

## Backend And Database

- 40 additive Supabase migrations.
- Profiles, rides, rider locations, routes, status events.
- Ride confirmation code support.
- Rider vehicle support.
- Safety alerts and app notifications.
- Chat foundation.
- Fare/pricing tables.
- Payment/wallet/settlement foundation tables.
- Realtime publication support.
- RLS policies and security-definer RPCs.
- Live migration repairs applied for pricing/cancellation reliability.

## Recent Stabilization

- Fare fallback pricing added.
- OSRM network fallback added.
- Vehicle surcharge database compatibility fixed.
- Supabase pricing/cancellation permission repair applied live.