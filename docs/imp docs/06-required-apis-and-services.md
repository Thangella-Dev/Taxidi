# 06 - Required APIs And Production Services

**Date:** 23 July 2026

| Category | Recommended options | Why needed | Current status |
|---|---|---|---|
| Hosting | Vercel Pro | Production deploy, team collaboration, better limits | Vercel exists, likely Hobby/limited |
| Database/Auth/Storage | Supabase Pro | Production database, Auth, Realtime, Storage, backups | Supabase active |
| Payment gateway | Razorpay / Cashfree / PhonePe PG / PayU | Online payments, wallet top-up, refunds | Not integrated live |
| Payouts | RazorpayX / Cashfree Payouts / bank APIs | Rider settlement | Foundation only |
| Push notifications | Firebase Cloud Messaging | Ride/SOS/payment notifications even when app closed | Not fully integrated |
| SMS/OTP | MSG91 / Twilio / Exotel | OTP, emergency fallback, critical alerts | Not integrated |
| WhatsApp alerts | MSG91 / Interakt / Twilio WhatsApp | Emergency and support alerts | Not integrated |
| Maps | Google Maps / Mapbox / self-hosted OSM | Production maps, search, route, ETA, traffic | Free OSM/Nominatim/OSRM MVP |
| Monitoring | Sentry / Vercel Observability / Supabase logs | Crash/error monitoring | Basic health checks only |
| Analytics | PostHog / Firebase Analytics / GA | Funnel and product analytics | Limited |
| Support | Freshdesk / Zoho Desk / MSG91 Hello | Support tickets and SLA | Internal foundation only |
| KYC | HyperVerge / Signzy / IDfy / Karza | Rider verification | Manual foundation only |
| Email | Resend / SendGrid / Postmark | Receipts, onboarding, admin alerts | Not core-integrated |

## Main API Priority

1. Payment gateway.
2. Wallet and webhook backend.
3. Push notifications.
4. SMS/OTP and SOS fallback.
5. Production maps/routing.
6. KYC verification.
7. Monitoring and analytics.
8. Support desk integration.