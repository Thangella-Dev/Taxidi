# 08 - Taxiro Production Roadmap

**Date:** 23 July 2026

## Immediate Work: 1-2 Weeks

- Integrate Razorpay/Cashfree test-mode payment gateway.
- Add wallet top-up UI and backend order creation.
- Add gateway webhook verification.
- Add wallet ledger credit/debit/refund.
- Run full two-device user/rider/admin QA.
- Fix true Supabase security linter risks.
- Add staging database and migration runbook.

## Short Term: 3-6 Weeks

- Add Firebase Cloud Messaging push notifications.
- Add SMS/OTP provider.
- Add SOS push + SMS/WhatsApp escalation.
- Add production map provider or self-hosted OSM services.
- Add route deviation and long-stop alerts.
- Add driver payout settlement workflow.
- Add support/dispute workflow.

## Medium Term: 2-3 Months

- Build Android app or Capacitor wrapper.
- Add native background tracking for riders.
- Add KYC provider integration.
- Add call masking.
- Add production analytics.
- Add admin finance/reconciliation exports.
- Run load testing and security review.

## Production Launch Gate

Before commercial launch:

- Real payments tested.
- Wallet top-up/debit/refund tested.
- Rider payouts tested.
- OTP/push/SOS delivery tested.
- Production map/routing provider selected.
- Supabase RLS security review completed.
- Admin audit logs working.
- Support escalation working.
- Legal/privacy/payment documents reviewed.
- At least 50-100 real pilot rides completed.