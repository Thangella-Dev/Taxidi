# 05 - Payment, Wallet, Settlement And Reconciliation Plan

**Date:** 23 July 2026

## Current State

Taxiro currently has a payment and wallet foundation, but not a real production payment system.

Already present:

- Payment method/status fields.
- Fare breakdown tables.
- Platform commission and rider earning calculations.
- UPI-after-ride manual payment foundation.
- Payment order/event/settlement foundation tables.

Not present yet:

- User cannot add money to wallet.
- No real Razorpay/Cashfree/PhonePe gateway checkout.
- No webhook-driven payment confirmation.
- No automatic wallet credit/debit/refund lifecycle.
- No real driver payout API integration.
- No full reconciliation dashboard.

## Recommended Implementation Plan

### Phase 1 - Real Payment Gateway

- Choose Razorpay, Cashfree, PhonePe PG, or PayU.
- Add backend-only payment order creation route.
- Add checkout UI in user app.
- Store gateway order/payment IDs.
- Add webhook endpoint.
- Verify webhook signature.
- Update payment status only from verified webhook.
- Add failed/retry payment flow.

### Phase 2 - Wallet Top-Up

- Add Wallet screen.
- Show balance and transaction history.
- Add money button.
- Create wallet top-up order through backend.
- On successful webhook, credit wallet ledger.
- Add wallet debit when booking/completing ride.
- Add refund-to-wallet support.
- Prevent negative wallet balance.

### Phase 3 - Driver Settlement

- Maintain driver ledger per ride.
- Hold driver earning until ride/payment is completed.
- Create payout batch.
- Integrate payout provider/API.
- Track pending/processing/paid/failed payout statuses.
- Add admin settlement dashboard.

### Phase 4 - Reconciliation And Compliance

- Payment reconciliation report.
- Wallet reconciliation report.
- Driver payout report.
- Refund report.
- GST receipt/invoice support.
- Dispute/chargeback tracking.

## Recommended Provider

For India MVP, Razorpay is a practical first option because it supports UPI, cards, netbanking, wallets, refunds, webhooks, and payout products. Cashfree and PhonePe PG are also valid alternatives.