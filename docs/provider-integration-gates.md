# Taxiro Provider Integration Gates

These roadmap items require external accounts, credentials, compliance, and operational ownership. They cannot be truthfully completed by repository code alone.

## Native Android And iOS

- Choose React Native/Expo or a Capacitor wrapper after foreground/background location requirements are approved.
- Obtain Apple Developer and Google Play accounts, signing certificates, privacy declarations, and store review approval.
- Native tracking must disclose background collection and provide an always-visible stop control.

## Push Notifications

- Create Firebase projects for Android/Web and APNs credentials for iOS.
- Store server credentials only in encrypted server-side environment variables.
- Add device-token registration, opt-out, token rotation, delivery receipts, and stale-token cleanup.

## SOS SMS And Calling

- Select an India-compliant SMS/voice provider and approved templates/sender IDs.
- Require explicit consent, rate limits, delivery receipts, retries, escalation rules, and an operations owner.
- In-app SOS remains available while provider integration is gated.

## Payment Gateway

- Complete merchant KYC and choose a gateway supporting UPI and webhooks.
- Verify webhook signatures server-side and make events idempotent.
- Never trust frontend payment success. Store provider IDs, reconciliation state, refunds, disputes, and settlement batches.

## Maps And Dispatch

- Replace public Nominatim/OSRM endpoints with contracted providers or self-hosted capacity before production scale.
- Move ready-signal expiry, dispatch retries, recurring rides, incentives, notifications, and settlement work to durable scheduled/background workers.
- Define monitoring, retry policy, dead-letter handling, and manual replay controls.
