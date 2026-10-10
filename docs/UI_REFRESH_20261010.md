# Mentron and Mlynq UI refresh

Implemented after the shared backend transfer, on `feat/person3-shared-product-platform`.

## Design

- Mentron web keeps its dark violet/cyan identity, with clear editorial typography, lilac feature panels and an original CSS orbital illustration.
- Mlynq web keeps a light campus identity, adding deep teal and cream to the existing pastel palette.
- The shared gateway, public product pages and sign-in page now use the same visual system. Sign-in follows the selected product and retains both password and email-code flows.
- Mentron's dashboard gains study/project/event shortcuts and labeled navigation. Mlynq's dashboard gains a campus-pass feature and clearer membership status, while retaining real feeds and counts.
- Flutter retains the existing light/pastel themes. Both home screens now use reusable headers, feature panels, action cards and labeled navigation. Unread counts, profile actions, executive requests and existing destinations remain available.
- Mobile menus, focus states, password visibility, safe-area spacing, larger text and request/empty states received targeted improvements.
- Page transitions retain an identical server/client wrapper and use CSS motion preferences, fixing hydration failures with reduced motion enabled.

## Validation and previews

- Next production build and TypeScript validation.
- Five platform access/routing tests.
- Twenty Flutter tests, including both products at 320, 390 and 900 logical pixels with 1× and 2× text scaling, primary callbacks, profile/community/inbox actions and existing access tests.
- Android debug APK built at `mentron_flutter/build/app/outputs/flutter-apk/app-debug.apk`.
- Browser checks cover public pages, both sign-in themes, password visibility, email-code expansion, product switching, protected redirects, clipped controls and runtime errors at 320, 390, 768 and 1366 pixels.
- Local gallery: `.person3/preview/index.html`. Web images are browser captures of the implementation. Flutter images render the actual reusable production widgets with sample account data and the SDK Roboto font; they are component previews, not screenshots of a signed-in device session.

The Flutter analyzer still reports existing warnings/deprecations across the app. Authenticated web dashboards were checked through source/type validation rather than a live member session. Real-device sign-in, live email delivery and iOS builds were not exercised. The UI has not been deployed to production.

The pre-existing uncommitted recovery changes in `app/reset-password/page.tsx` are preserved separately.
