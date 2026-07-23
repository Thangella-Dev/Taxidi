# Taxiro Production Readiness, Gap Analysis, API Plan, And Cost Estimate

**Date:** 23 July 2026  
**Project:** Taxiro ride-booking platform  
**Purpose:** Manager-ready explanation of what has been completed, what is still missing for a real-world ride-hailing product, which APIs/services are needed, and estimated operating cost.

## Executive Summary

Taxiro has progressed from a simple MVP into an advanced full-stack ride-hailing web MVP. It now has a real Next.js frontend, Supabase-backed authentication/database, user/rider/admin dashboards, ride booking, vehicle-based fare logic, live tracking foundations, ride status flows, SOS/admin foundations, demand signals, and enterprise pricing tables.

However, it is **not yet a complete real-world ride-hailing business system** because the payment and wallet layer is currently only a foundation. Users cannot yet add money to wallet through a real payment gateway, the app does not yet perform real online payment capture/refund/settlement, and production-grade mobility features such as native background tracking, push notifications, OTP/SMS, call masking, regulatory KYC, and professional map/routing APIs are still needed.

## Overall Completion Estimate

These percentages are practical product-readiness estimates, not marketing numbers.

| Area | Current completion | Status |
|---|---:|---|
| Web MVP application | 75% | Major user/rider/admin flows exist and build successfully. |
| User ride booking flow | 75% | Booking, fare estimate, vehicle choice, pickup/drop, ready signal, ride history exist. Needs deeper QA and production payment. |
| Rider app flow | 65% | Online/offline, live location, vehicle switching, job acceptance, code verification exist. Needs better native/background tracking and production verification workflow. |
| Admin operations | 70% | Admin dashboard, people, rides, verification, pricing/service areas, health checks exist. Needs deeper role controls, audit exports, dispute/refund tooling. |
| Database/backend | 72% | 40 additive Supabase migrations, RLS, RPCs, PostGIS, pricing/payment foundations exist. Needs security hardening and production load testing. |
| Payment + wallet | 25% | Schema/foundation exists, but real gateway top-up/payment/refund/settlement is not integrated. |
| Notifications/SOS | 35% | In-app notification foundation exists. Needs push, SMS/WhatsApp fallback, delivery tracking, escalation rules. |
| Maps/routing/tracking | 45% | OSM/Leaflet/OSRM MVP exists. Needs production-grade maps, routing, traffic ETA, background GPS, geofencing. |
| Production readiness | 50% | Build/tests pass and health checks exist. Needs staging/production migration automation, monitoring, E2E tests, security review. |
| Real-world Ola/Uber-level readiness | 40% | Strong prototype/MVP base, but many production systems still missing. |

**Overall honest status:** Taxiro is around **65-70% complete as an advanced web MVP**, but around **40-45% complete compared to a real commercial Ola/Uber-style production platform**.

## Current Codebase Size

Measured locally on 23 July 2026, excluding `node_modules`, `.next`, `.git`, coverage, dist, and build folders.

| Category | Files | Lines |
|---|---:|---:|
| Frontend app routes | 23 | 9,822 |
| Frontend components | 41 | 4,279 |
| Client/server helpers | 19 | 1,883 |
| Type definitions | 1 | 406 |
| Database migrations | 40 | 5,816 |
| Tests | 9 | 372 |
| Scripts/tooling | 2 | 47 |
| Documentation | 65 | 5,095 |
| Project config/assets | 14 | 12,877 |
| **Total** | **214** | **40,597** |

By extension:

| Extension | Files | Lines |
|---|---:|---:|
| `.tsx` | 57 | 12,309 |
| `.ts` | 38 | 3,291 |
| `.sql` | 41 | 9,170 |
| `.md` | 66 | 5,907 |
| `.json` | 6 | 8,628 |
| `.css` | 1 | 1,203 |
| `.mjs` | 4 | 69 |
| `.js` | 1 | 20 |
| **Total** | **214** | **40,597** |

## What Is Already Built

### Frontend

- Next.js App Router application.
- Public landing page.
- Auth page.
- User dashboard.
- Rider dashboard.
- Admin dashboard.
- Ride details page.
- About, Help, Support, Rules, Privacy pages.
- PWA manifest, icons, SEO files, sitemap, robots, `llms.txt` files.
- Light/dark mode foundation.
- Mobile-first map layout and responsive sheets.
- Vehicle selection for Bike, Auto, Hatchback, Sedan, SUV.
- Location search, detect location, map picker, route display.
- Ride cards, status badges, chat panel, notification bell, admin panels.

### Backend And Database

- Supabase Auth integration.
- Supabase PostgreSQL schema with 40 additive migrations.
- PostGIS enabled.
- RLS policies across user/rider/admin areas.
- Tables for profiles, rides, rider locations, rider routes, status events, vehicle verification, safety alerts, notifications, pricing, wallet/payment foundations, fare audit, and admin operations.
- RPCs for ready signals, ride acceptance, cancellation, code verification, payment completion foundation, fare calculation, rider nearby preview, account/session handling, admin operations.
- Realtime subscriptions for ride updates, rider locations, chat, notifications, demand signals.

### Admin / Operations

- Admin command dashboard.
- User/rider/admin people management foundation.
- Rider verification and vehicle review foundation.
- Ride audit and safety command foundation.
- Notification broadcast foundation.
- System health endpoint and admin health panel.
- Service area and pricing rule controls.
- Fraud signal foundation for rider GPS anomalies.

### Payment Foundation

Already present:

- Payment status fields.
- Payment method fields.
- Fare breakdown tables.
- Wallet/payment order/settlement foundations.
- Driver earning/platform commission calculations.
- UPI-after-ride manual payment flow foundation.

Not yet real:

- No real Razorpay/PhonePe/Cashfree gateway capture.
- No user wallet top-up UI connected to a payment gateway.
- No real wallet ledger top-up, debit, refund, reconciliation fully connected to gateway webhooks.
- No automatic driver bank/UPI settlement through payout APIs.
- No GST invoice, TDS/TCS, refund, chargeback, dispute lifecycle.

## Main Missing Items For A Real-World App

### 1. Real Payment And Wallet System

Needed:

- Payment gateway account setup: Razorpay, Cashfree, PhonePe PG, PayU, or Stripe India alternative.
- Wallet top-up flow.
- Payment order creation from backend only.
- Gateway checkout on user app.
- Webhook verification with signature validation.
- Wallet ledger: credit, debit, hold, release, refund.
- Driver settlement ledger.
- Admin reconciliation dashboard.
- Refund and failed-payment recovery.
- GST invoice/receipt generation.
- Bank/UPI payout integration.

Recommended provider for India MVP: **Razorpay** because it supports UPI/cards/netbanking/wallets and has public pay-as-you-go pricing.

Razorpay pricing reference: official page says payment gateway starts around **2% + GST per transaction**, with no setup/AMC in the standard model. Source: https://razorpay.com/pricing/

### 2. Production Notifications

Needed:

- Firebase Cloud Messaging for push notifications.
- Push token storage per user/device.
- Ride assigned, rider arriving, trip started, SOS, payment, cancellation notifications.
- Notification delivery status.
- SMS/WhatsApp fallback for critical flows.
- OTP login/mobile verification if phone-based auth is required.

Firebase Cloud Messaging is listed as no-cost on Firebase pricing. Source: https://firebase.google.com/pricing

For SMS in India, Twilio lists India SMS pricing and pay-as-you-go usage. Twilio page shows India outbound SMS pricing and notes prices can change. Source: https://www.twilio.com/en-us/sms/pricing/in

MSG91 is another India-friendly option with SMS, OTP, WhatsApp and helpdesk products. Source: https://msg91.com/pricing

### 3. Production Maps, Routes, Traffic, And Tracking

Current app uses OpenStreetMap tiles, Nominatim, and OSRM. This is acceptable for demo/MVP, but not ideal for production ride-hailing because public free services have rate limits, reliability limits, and may not allow heavy commercial use without dedicated infrastructure.

Production options:

- Google Maps Platform: Maps, Places, Geocoding, Routes, Distance Matrix, Roads/Snap-to-road.
- Mapbox: Maps, Geocoding/Search, Directions, Navigation SDK.
- Self-hosted OSM stack: tile server, Nominatim/Photon/Pelias, OSRM/Valhalla, monitoring.

Google Maps official pricing lists Dynamic Maps, Geocoding, Geolocation, Places, Routes and other SKUs. Example shown on official pricing page: Dynamic Maps has a monthly free threshold and paid per-1,000 pricing tiers; Geocoding is also listed as a paid SKU. Source: https://developers.google.com/maps/billing-and-pricing/pricing

Mapbox pricing is pay-as-you-go with free tiers, volume discounts, and navigation/search/map products. Source: https://www.mapbox.com/pricing

### 4. Native Mobile Apps Or Wrapper

Current Taxiro is a responsive PWA/web app. For true Ola/Uber-like behavior, native Android/iOS or a Capacitor/React Native wrapper is needed.

Needed:

- Background location tracking for riders.
- Foreground service notification on Android.
- iOS significant location/background modes where allowed.
- Push notification reliability.
- Deep links.
- App-store-ready permission handling.
- Crash reporting.

### 5. Identity, KYC, And Safety

Needed:

- Phone OTP verification.
- Rider KYC: Aadhaar/PAN/driving licence/RC/insurance checks.
- Live selfie/liveness check.
- Admin verification workflow with audit trail.
- SOS escalation to emergency contact via push + SMS/WhatsApp.
- Trip share link for emergency contact.
- Route deviation and long-stop detection.
- Customer/rider block/report system.

### 6. Business Operations

Needed:

- Driver onboarding pipeline.
- Driver payout settlement.
- Commission reports.
- Revenue dashboard.
- Dispute management.
- Refund workflows.
- Support ticket SLA dashboard.
- Coupon/referral campaign control.
- City/service-zone rollout controls.
- Tax reports and invoice export.

### 7. Security And Compliance

Needed:

- Full RLS security review.
- Service role usage only in backend/server endpoints, never client.
- Secrets moved fully to Vercel/Supabase secret managers.
- Rate limiting for auth, ride creation, SOS, chat, notifications.
- Audit logs for admin actions.
- Data retention policy.
- Privacy policy reviewed legally.
- Payment compliance through gateway.
- Vulnerability scanning and penetration test before public launch.

## APIs And Services Needed

| Category | Recommended options | Why needed | Status now |
|---|---|---|---|
| Hosting | Vercel Pro | Production deploy, faster builds, team collaboration, better limits | Currently Vercel deployment exists, likely Hobby/limited |
| Database/Auth/Storage | Supabase Pro | Production database, Auth, Realtime, Storage, backups | Supabase active, many migrations in place |
| Payment gateway | Razorpay / Cashfree / PhonePe PG | Online payments, wallet top-up, refunds, webhooks | Not integrated live |
| Payouts | RazorpayX / Cashfree Payouts / bank APIs | Rider settlement | Foundation only |
| Push notifications | Firebase Cloud Messaging | App notifications even when app is closed | In-app only/foundation |
| SMS/OTP | MSG91 / Twilio / Exotel | OTP login, emergency fallback, critical alerts | Not production-integrated |
| WhatsApp alerts | MSG91 / Interakt / Twilio WhatsApp | Emergency/contact alerts and support | Not integrated |
| Maps | Google Maps / Mapbox / self-hosted OSM | Production geocoding, places, route, ETA, traffic | Free OSM/Nominatim/OSRM MVP |
| Monitoring | Sentry / Vercel Observability / Supabase logs | Crash/error tracking | Basic health checks only |
| Analytics | PostHog / Firebase Analytics / Google Analytics | Funnel and product analytics | Limited/no full analytics |
| Customer support | Freshdesk / Zoho Desk / MSG91 Hello | Support tickets and SLA | Internal support foundation only |
| KYC | HyperVerge / Signzy / IDfy / Karza | Rider identity and document verification | Manual admin verification only |
| Email | Resend / SendGrid / Postmark | Receipts, admin alerts, onboarding | Not core-integrated |

## Cost Estimate

Assumptions:

- Currency estimate uses rough planning conversion of **1 USD = Rs 85**. Actual billing exchange rate and taxes may differ.
- Gateway transaction cost depends on ride GMV, not server usage.
- Google/Mapbox map cost depends heavily on map loads, geocoding searches, routes, and navigation sessions.
- SMS/WhatsApp cost depends on OTP/emergency/support volume.

### Current MVP / Testing Cost

| Service | Monthly estimate | Yearly estimate | Notes |
|---|---:|---:|---|
| Vercel Hobby | $0 | $0 | Limited cron/build/team features. |
| Supabase Free | $0 | $0 | Limited DB/storage/backup scale. |
| OSM/Nominatim/OSRM public | $0 | $0 | Not suitable for heavy production. |
| Razorpay | 2% + GST per successful transaction | Volume-based | No real integration yet. |
| FCM | $0 | $0 | Push not integrated yet. |
| SMS/WhatsApp | $0 currently | $0 currently | Not integrated yet. |
| **Estimated current fixed cost** | **$0/month** | **$0/year** | Works only for demo/MVP, not reliable commercial production. |

### Controlled Pilot Cost: 1 city, low usage

| Service | Monthly estimate | Yearly estimate | Notes |
|---|---:|---:|---|
| Vercel Pro | $20/month | $240/year | Official Vercel Pro is $20/mo. Source: https://vercel.com/pricing |
| Supabase Pro | $25/month | $300/year | Official Supabase Pro starts at $25/mo. Source: https://supabase.com/pricing |
| Supabase compute/storage extras | $0-$60/month | $0-$720/year | Depends on DB load; Pro includes credits. |
| Payment gateway | 2% + GST of GMV | Volume-based | Example: Rs 3,00,000 GMV/month costs about Rs 6,000 + GST/month. |
| SMS/OTP | Rs 1,000-Rs 10,000/month | Rs 12,000-Rs 1,20,000/year | Depends provider and OTP volume. |
| Push notifications | $0/month | $0/year | FCM no-cost. |
| Maps: keep OSM/self-host later | $0-$200/month | $0-$2,400/year | Public free APIs risky; production provider may cost more. |
| Monitoring/email/support | $0-$100/month | $0-$1,200/year | Depends vendor. |
| **Estimated fixed platform cost** | **$45-$380/month** | **$540-$4,560/year** | Excludes payment transaction fees and team salaries. |

Approx INR fixed platform cost: **Rs 3,825-Rs 32,300/month**, or **Rs 45,900-Rs 3,87,600/year**, excluding gateway fees.

### Production Small City Cost: growing commercial usage

| Service | Monthly estimate | Yearly estimate | Notes |
|---|---:|---:|---|
| Vercel Pro + usage | $20-$150/month | $240-$1,800/year | Depends traffic/build/observability. |
| Supabase Pro + compute | $85-$500/month | $1,020-$6,000/year | Higher compute/realtime/storage. |
| Professional maps | $200-$2,000/month | $2,400-$24,000/year | Depends maps, geocoding, routes, navigation. |
| SMS/OTP/WhatsApp | $50-$1,000/month | $600-$12,000/year | Critical alerts and OTP volume. |
| Monitoring/logging/support | $50-$500/month | $600-$6,000/year | Sentry/logs/helpdesk/email. |
| Payment gateway | 2% + GST of GMV | Volume-based | Major variable cost. |
| Payout APIs | Provider-dependent | Provider-dependent | Often per payout or monthly package. |
| KYC APIs | Per verification | Per verification | Usually charged per document/person check. |
| **Estimated fixed/usage platform cost** | **$405-$4,150/month** | **$4,860-$49,800/year** | Excludes payment gateway percentage, KYC volume, staff, legal, support operations. |

Approx INR platform cost: **Rs 34,425-Rs 3,52,750/month**, or **Rs 4,13,100-Rs 42,33,000/year**, excluding payment gateway GMV fees and KYC.

## Payment And Wallet Implementation Plan

### Phase 1: Real online payments

- Add backend-only `create_payment_order` API route.
- Connect Razorpay/Cashfree checkout.
- Store payment order ID and expected amount.
- Add webhook endpoint with signature verification.
- Mark payment as authorized/paid/failed only from webhook.
- Add retry failed payment.
- Add admin payment audit view.

### Phase 2: Wallet top-up

- Add Wallet screen: balance, add money, history.
- Create wallet top-up order.
- On successful webhook, credit wallet ledger.
- Add wallet debit for rides.
- Add refund to wallet.
- Prevent negative balance.
- Add admin reconciliation report.

### Phase 3: Driver settlement

- Maintain driver ledger.
- Calculate driver earning per ride.
- Create payout batch.
- Integrate payout API.
- Track payout status: pending, processing, paid, failed.
- Add admin settlement dashboard.

### Phase 4: Accounting and compliance

- GST invoice/receipt generation.
- Payment reconciliation export.
- Refund and dispute handling.
- Taxiro commission reports.
- Driver payout reports.

## Recommended Roadmap To Real-World Launch

### Immediate: 1-2 weeks

- Complete Razorpay/Cashfree test-mode payment integration.
- Add wallet top-up and wallet ledger UI.
- Add gateway webhook signature verification.
- Complete two-device E2E QA for user/rider/admin.
- Fix remaining Supabase linter warnings that are true risks.
- Add staging database and production migration runbook.

### Short term: 3-6 weeks

- Add FCM push notifications.
- Add OTP/SMS provider.
- Add SOS push + SMS/WhatsApp escalation.
- Add production map provider or self-hosted OSM stack.
- Add route deviation and long-stop alerts.
- Add driver payout settlement workflow.
- Add support/dispute workflow.

### Medium term: 2-3 months

- Build Android app or Capacitor wrapper for rider/user apps.
- Add native background tracking for riders.
- Add KYC provider integration.
- Add call masking.
- Add stronger admin controls and analytics.
- Add load testing and security review.

### Production launch gate

Taxiro should not be launched commercially until these are done:

- Real payments and refunds tested.
- Wallet top-up/debit/refund ledger verified.
- Rider payouts tested.
- OTP/push/SOS delivery tested.
- Production map/routing provider selected.
- Supabase RLS security review completed.
- Admin audit logs and support escalation are working.
- Privacy/payment/legal docs reviewed.
- At least 50-100 real test rides completed in pilot.

## Sources Used For Cost References

- Vercel pricing: https://vercel.com/pricing
- Supabase pricing: https://supabase.com/pricing
- Razorpay pricing: https://razorpay.com/pricing/
- Firebase pricing / FCM: https://firebase.google.com/pricing
- Twilio India SMS pricing: https://www.twilio.com/en-us/sms/pricing/in
- MSG91 pricing: https://msg91.com/pricing
- Google Maps Platform pricing: https://developers.google.com/maps/billing-and-pricing/pricing
- Mapbox pricing: https://www.mapbox.com/pricing

## Final Manager Talking Point

Taxiro has reached a strong advanced MVP stage with around **40,000+ lines of project code and documentation**, real Supabase-backed ride flows, admin controls, pricing foundation, and tracking foundations. The biggest remaining gap is not UI anymore; it is **production infrastructure**: real payment gateway, wallet ledger, driver payouts, push/SMS/WhatsApp notifications, production maps/routing, native mobile tracking, KYC, and security/compliance hardening.

With those services and a focused production sprint, Taxiro can move from advanced MVP to controlled pilot readiness.