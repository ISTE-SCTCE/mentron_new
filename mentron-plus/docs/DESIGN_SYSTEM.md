# Design foundation

The visual direction is a calm editorial student workspace: generous pale surfaces, warm copy, line illustrations, compact navigation, and distinct Learn and Campus identities. The website uses a desktop sidebar and supporting calendar rail; small screens use five bottom tabs and an expandable navigation drawer.

## Shared language

| Token | Learn | Campus |
|---|---|---|
| Main accent | #6C63FF | #5F85A2 |
| Text on light surfaces | #2D2845 | #293F51 |
| Strong interactive ink | #5144C0 | #365D79 |
| Secondary | #FF8C69 | #D97D55 |
| Supporting teal | #4ECDC4 | #3AAFA9 |
| Flutter background | #F8F6FF | #EBF3FC |
| Web canvas | #FCFBFE | #F9FBFD |
| Heading font | Poppins | Space Grotesk |
| Body font | Inter | Inter |

The website uses lighter canvas variants for large desktop areas. Lavender, peach, mint and butter surfaces identify content without encoding permissions. Gold #F5C842 remains a supporting accent. Fonts and their licenses are bundled locally. The serif emphasis in web hero headlines is a system serif; it adds editorial contrast without another downloaded font.

Flutter tokens live in `mobile/lib/core/theme/world_theme.dart`; web tokens live in `web/src/styles.css`. Shared radius scale: 12/16/24/32. Spacing scale starts at 4px. Shadows are soft and tinted. Strong ink variants are used for interactive text; accent colors remain decorative where appropriate. EXECOM has an isolated dark Flutter theme; its screens belong to later phases.

## Motion and state

Durations: instant 90ms, quick 160ms, base 240ms, calm 360ms, hero 480ms, world 420ms. Flutter press spring uses mass 1, stiffness 220, damping 24. A world switch updates theme and navigation together. Flutter uses a circular clip reveal; supported browsers use a circular View Transition. Unsupported browsers update directly. Reduced-motion preference suppresses continuous animation and uses short fades for routes.

The Flutter kit includes press scale/haptics, stagger entrances, shared-axis routes, an open-container primitive, a custom-painted orbit loader, a shared skeleton shimmer controller, empty state and offline banner. Five Flutter tabs are created on first visit and retained within the current world; inactive tickers are disabled. Changing worlds discards the previous world's tabs.

The website includes loading, empty, error and offline samples under Design preview. Native dialogs support Escape and restore focus to the opener. Mobile drawers are hidden from accessibility navigation when closed. Browser bookmarking and event-plan actions are local samples, not real service operations.

## Boundaries

This phase establishes visual primitives and representative layouts. Full auth/splash/onboarding, protected document viewing, real images/cache policies, QR issuance, certificate generation, payments, all feature forms and EXECOM screens are later work. No real-device frame-budget claim has been made. Full screen-reader, large-text and cross-browser audits remain to be completed with the feature screens.
