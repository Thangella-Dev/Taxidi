# 11 - Convert Taxiro Into A Proper Play Store App

**Date:** 23 July 2026  
**Goal:** Convert the current Taxiro web/PWA project into a proper Android app that can be tested and launched on Google Play Store.

## Recommended Technical Path

Taxiro is currently a Next.js web app. The fastest path to Android is:

1. Keep the existing Next.js app as the main product.
2. Make it fully PWA-ready.
3. Wrap it using **Capacitor** or a similar WebView/native bridge.
4. Add native Android permissions for location, notifications, camera, storage as needed.
5. Build Android App Bundle `.aab`.
6. Upload to Google Play Console.

## Why Capacitor Is Recommended

- It lets us reuse the existing web app.
- It is faster than rewriting the app in native Android or React Native.
- It supports native plugins for location, push notifications, camera, and app lifecycle.
- It can later be extended into a stronger native app.

## Main App Conversion Tasks

### Phase 1 - PWA Hardening

- Confirm manifest icons, app name, theme color, start URL.
- Fix mobile safe-area spacing for Android devices.
- Ensure auth session persists inside Android WebView.
- Ensure location permission prompts work inside the wrapper.
- Ensure maps render correctly inside WebView.
- Ensure all pages are responsive.

### Phase 2 - Capacitor Setup

- Install Capacitor packages.
- Create Android project.
- Configure app ID, for example `com.taxiro.app`.
- Configure app name: Taxiro.
- Add app icons and splash screen.
- Configure deep links if needed.
- Configure Android permissions.

### Phase 3 - Native Features

- Add geolocation plugin.
- Add push notification plugin with Firebase Cloud Messaging.
- Add camera plugin for rider verification/live selfie.
- Add app state handling for online/offline rider presence.
- Add background location strategy for rider app if required.

### Phase 4 - Payment Compatibility

- Ensure Razorpay/Cashfree/PhonePe checkout works inside Android WebView or native SDK.
- Handle payment success/failure redirects.
- Ensure webhook remains the final source of payment truth.

### Phase 5 - Testing

- Test on multiple Android devices.
- Test login persistence.
- Test current location.
- Test rider live GPS.
- Test push notifications.
- Test payment flow.
- Test app resume/background behavior.
- Test poor network behavior.

### Phase 6 - Play Store Preparation

- Create Google Play Console developer account.
- Pay one-time $25 fee, approx Rs 2,125 plus possible taxes/conversion charges.
- Complete developer identity verification.
- Prepare privacy policy URL.
- Prepare app description.
- Prepare screenshots.
- Prepare app icon and feature graphic.
- Fill Data Safety section.
- Fill permissions declarations, especially location/background location if used.
- Upload signed `.aab`.
- Run closed testing.
- Submit production release.

## Google Play Requirements To Remember

- Google Play Console has a **one-time $25 registration fee**.
- You must be at least 18 years old to create a Play Console account.
- Personal and organization accounts have different verification requirements.
- Google may require identity verification.
- Personal developer accounts created after 13 November 2023 have specific testing requirements before public release.
- Apps using sensitive permissions like background location need strong justification and policy compliance.

## Estimated Cost To Make Play Store Version

| Item | Estimated cost |
|---|---:|
| Google Play Console registration | Rs 2,125 approx + taxes/conversion |
| Android Studio | Rs 0 |
| Capacitor framework | Rs 0 |
| Firebase Cloud Messaging | Rs 0 |
| App icons/screenshots if self-made | Rs 0 |
| App icons/screenshots if outsourced | Rs 5,000-Rs 25,000 |
| Testing devices | Rs 0 if existing devices available; otherwise variable |
| Legal/privacy review | Rs 10,000-Rs 75,000+ recommended |

## Estimated Time For One Person

| Stage | Time |
|---|---:|
| Basic Android wrapper build | 1-2 weeks |
| Permissions, location, notification integration | 2-4 weeks |
| Payment compatibility and testing | 1-3 weeks |
| Play Store assets and closed testing | 2-4 weeks |
| Production-ready Play Store launch | 6-10 weeks total |

## Important Technical Warning

A simple WebView wrapper is easy, but a real ride-hailing app needs reliable location, notifications, and payment behavior. For rider tracking, a proper Android implementation may eventually need native background location services, not only browser geolocation.

## Recommended Launch Path

1. First publish a closed testing Android build.
2. Test with 10-20 known users/riders.
3. Fix GPS, auth, payment, notification issues.
4. Run a pilot in one local area.
5. Only then move to public Play Store production.

## Official Google References

- Play Console setup and $25 fee: https://support.google.com/googleplay/android-developer/answer/6112435?hl=en-IN
- Android Developer Console distribution fee and verification: https://support.google.com/android-developer-console/answer/16604405?hl=en
- Android developer verification FAQ: https://developer.android.com/developer-verification/guides/faq?hl=en