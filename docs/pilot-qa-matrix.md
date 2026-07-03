# Taxiro Pilot QA Matrix

Run on two physical devices with separate user and rider accounts for Bike, Auto, and Car.

## Ride Lifecycle

- User books Ride Now and advance rides for each vehicle type.
- Only riders with the matching active verified vehicle see and accept the request.
- Ready signals expire at 15, 30, and 60 minutes and cannot be accepted after expiry.
- User sees assigned rider identity, vehicle, registration, rating, live marker, pickup route, and ETA.
- Rider verifies the private code before start; destination route appears only after verification.
- Chat, cancellation, SOS, drop reached, payment, completion, and rating update both devices without refresh.

## Session And Realtime

- Close and reopen the installed app; the session persists.
- Sign in on a second device; the first device is revoked within 30 seconds.
- Disable network, mutate on the other device, reconnect, and confirm automatic resync.
- Put both apps to sleep for five minutes and confirm foreground resync.
- Rider opens app online, backgrounds/closes offline, and manual Offline remains respected in-session.

## GPS And Routing

- Test permission allowed, denied, one-time permission, approximate location, and precise location.
- Test indoors/weak accuracy and confirm poor fixes are rejected with map fallback.
- Test stale positions, simulated route jumps, and multiple route changes.
- Confirm pickup and destination routes switch by ride phase and stale rider timestamps remain visible.

## Safety And Operations

- SOS reaches admin and a linked emergency-contact Taxiro account.
- Late-trip and route-change alerts deduplicate within 30 minutes.
- Support tickets are owner-visible and admin-visible only.
- Suspended users cannot continue using protected dashboards.
- Verify all admin actions and safety resolution steps produce audit evidence before pilot sign-off.

Record device, OS, browser/app version, account IDs, ride ID, expected result, actual result, screenshot, and logs for every failure.
