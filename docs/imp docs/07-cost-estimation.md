# 07 - Taxiro India Cost Estimation After Full Integration

**Date:** 23 July 2026  
**Currency:** Indian Rupees  
**Planning conversion used:** 1 USD = Rs 85 approximately. Actual bank/card conversion, GST, platform tax, and vendor invoices can differ.

## Important Note

This estimate assumes Taxiro is upgraded from the current MVP into a real production-ready ride-hailing app with payment gateway, wallet, push notifications, SMS/OTP, maps/routing, monitoring, KYC, and support systems.

The biggest variable cost will be:

- Payment gateway percentage on total ride GMV.
- Map/search/route API usage.
- SMS/OTP/WhatsApp volume.
- KYC verification volume.
- Supabase/hosting usage as users grow.

## Current MVP Cost

| Item | Monthly cost | Yearly cost | Notes |
|---|---:|---:|---|
| Vercel Hobby | Rs 0 | Rs 0 | Limited production capability. |
| Supabase Free | Rs 0 | Rs 0 | Limited database/storage/realtime. |
| OpenStreetMap/Nominatim/OSRM public APIs | Rs 0 | Rs 0 | Not reliable for commercial heavy usage. |
| Firebase Cloud Messaging | Rs 0 | Rs 0 | Not fully integrated yet. |
| Payment gateway | Rs 0 fixed | Transaction-based | Not integrated yet. |
| SMS/WhatsApp | Rs 0 | Rs 0 | Not integrated yet. |
| **Current fixed cost** | **Rs 0/month** | **Rs 0/year** | Good only for development/demo. |

## Minimum Controlled Pilot Cost In India

Use this when testing with limited users/riders in one city or one service area.

| Service | Monthly estimate | Yearly estimate | Why needed |
|---|---:|---:|---|
| Vercel Pro | Rs 1,700 | Rs 20,400 | Production hosting and better limits. |
| Supabase Pro | Rs 2,125 | Rs 25,500 | Production database, Auth, Storage, Realtime, backups. |
| Supabase extra compute/storage | Rs 0-Rs 5,000 | Rs 0-Rs 60,000 | Depends on database/realtime/storage growth. |
| Payment gateway fixed cost | Rs 0 | Rs 0 | Razorpay/Cashfree usually usage-based for standard gateway. |
| Payment gateway transaction fee | 2% + GST of ride GMV | GMV-based | Example: Rs 3,00,000 monthly GMV = about Rs 6,000 + GST. |
| SMS/OTP provider | Rs 1,000-Rs 10,000 | Rs 12,000-Rs 1,20,000 | Login OTP, booking alerts, emergency fallback. |
| WhatsApp alerts | Rs 1,000-Rs 15,000 | Rs 12,000-Rs 1,80,000 | Emergency/contact/support alerts. |
| Firebase Cloud Messaging | Rs 0 | Rs 0 | Push notifications. |
| Maps/routing/search | Rs 5,000-Rs 25,000 | Rs 60,000-Rs 3,00,000 | Google Maps/Mapbox/self-hosted OSM starter usage. |
| Monitoring/logging | Rs 0-Rs 5,000 | Rs 0-Rs 60,000 | Sentry/Vercel/Supabase logs. |
| Email provider | Rs 0-Rs 2,000 | Rs 0-Rs 24,000 | Receipts, onboarding, alerts. |
| Support tool | Rs 0-Rs 5,000 | Rs 0-Rs 60,000 | Freshdesk/Zoho/other support desk. |
| Google Play Console | One-time Rs 2,125 approx | One-time | $25 one-time registration fee. |
| **Estimated fixed pilot cost** | **Rs 10,825-Rs 70,825/month** | **Rs 1,29,900-Rs 8,49,900/year** | Excludes payment gateway % and KYC per verification. |

## Practical Production Small-City Cost In India

Use this when Taxiro is live with real users, real riders, payments, support, alerts, and monitoring.

| Service | Monthly estimate | Yearly estimate | Notes |
|---|---:|---:|---|
| Vercel Pro/usage | Rs 1,700-Rs 12,750 | Rs 20,400-Rs 1,53,000 | More usage may increase cost. |
| Supabase Pro + compute | Rs 7,225-Rs 42,500 | Rs 86,700-Rs 5,10,000 | Database, realtime, storage, backups. |
| Production maps/routing | Rs 17,000-Rs 1,70,000 | Rs 2,04,000-Rs 20,40,000 | Map loads, search, geocoding, routes, ETA. |
| SMS/OTP/WhatsApp | Rs 4,250-Rs 85,000 | Rs 51,000-Rs 10,20,000 | Depends on OTP and alert volume. |
| Monitoring/logging | Rs 4,250-Rs 42,500 | Rs 51,000-Rs 5,10,000 | Error/crash/log monitoring. |
| Email/support tools | Rs 2,000-Rs 25,000 | Rs 24,000-Rs 3,00,000 | Helpdesk, receipts, admin alerts. |
| KYC provider | Per verification | Per verification | Rider verification cost depends vendor and volume. |
| Payment gateway | 2% + GST of GMV | GMV-based | Main variable payment cost. |
| Payout API | Provider-dependent | Provider-dependent | Driver settlement/payout cost. |
| **Estimated production platform cost** | **Rs 36,425-Rs 3,77,750/month** | **Rs 4,37,100-Rs 45,33,000/year** | Excludes payment gateway %, KYC volume, salaries, legal, customer support staff. |

## Example Payment Gateway Cost By Ride GMV

Assuming payment gateway fee is about 2% + GST.

| Monthly ride GMV | Gateway fee before GST | GST on fee at 18% | Approx monthly gateway cost | Approx yearly gateway cost |
|---:|---:|---:|---:|---:|
| Rs 1,00,000 | Rs 2,000 | Rs 360 | Rs 2,360 | Rs 28,320 |
| Rs 3,00,000 | Rs 6,000 | Rs 1,080 | Rs 7,080 | Rs 84,960 |
| Rs 10,00,000 | Rs 20,000 | Rs 3,600 | Rs 23,600 | Rs 2,83,200 |
| Rs 25,00,000 | Rs 50,000 | Rs 9,000 | Rs 59,000 | Rs 7,08,000 |

## One-Time / Setup Costs

| Item | Estimate | Notes |
|---|---:|---|
| Google Play Console registration | Rs 2,125 approx + possible taxes | $25 one-time. |
| Domain | Rs 800-Rs 2,000/year | Optional but recommended. |
| Business email | Rs 1,500-Rs 7,000/user/year | Google Workspace/Zoho/etc. |
| App icon/screenshots/design polish | Rs 0-Rs 25,000 | If self-made, cost is time. |
| Legal/privacy/terms review | Rs 10,000-Rs 75,000+ | Strongly recommended before public launch. |
| KYC/business registrations | Variable | Depends company structure and providers. |

## Recommended Budget For First 6 Months

| Scenario | 6-month platform budget | Notes |
|---|---:|---|
| Very lean pilot | Rs 75,000-Rs 2,00,000 | Careful low-volume test, many free tiers, limited maps/SMS. |
| Practical pilot | Rs 2,00,000-Rs 5,00,000 | Better APIs, monitoring, SMS, payment, map provider starter usage. |
| Strong production pilot | Rs 5,00,000-Rs 15,00,000+ | More serious production setup, support, KYC, maps, alerting, legal. |

## Pricing Source Links

- Vercel pricing: https://vercel.com/pricing
- Supabase pricing: https://supabase.com/pricing
- Razorpay pricing: https://razorpay.com/pricing/
- Firebase pricing: https://firebase.google.com/pricing
- Twilio India SMS pricing: https://www.twilio.com/en-us/sms/pricing/in
- MSG91 pricing: https://msg91.com/pricing
- Google Maps pricing: https://developers.google.com/maps/billing-and-pricing/pricing
- Mapbox pricing: https://www.mapbox.com/pricing
- Google Play Console fee: https://support.google.com/googleplay/android-developer/answer/6112435?hl=en-IN