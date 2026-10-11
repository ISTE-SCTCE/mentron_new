# Creative UI revision

The websites and Flutter app use two related visual directions: Mentron's illustrated idea studio and Mlynq's campus journal. Both retain their theme families and existing product features.

## Implemented surfaces

| Surface | Change |
| --- | --- |
| Public product pages and gateway | Layered interactive artwork, editorial typography, folded-paper shapes, redesigned feature links and calls to action |
| Discovery | Keyboard-operable feature tabs with contextual descriptions and real feature destinations |
| Global web navigation | Searchable feature finder (button or Ctrl/Cmd+K), native modal keyboard behavior, persisted decorative-motion preference |
| Account pages | Redesigned login artwork, fields and panels; shared paper treatment for signup and recovery |
| Mentron web features | Shared workspace background, page transitions, typography, tables, forms, glass-card replacement, navigation selection and dashboard panels |
| Mlynq web features | Campus palette across events, attendance, QR and profile; unified certificates, history and notifications; sidebar and mobile navigation styling |
| Both Flutter homes | Illustrated study sheet / campus ticket, new headers, tactile action cards, section headings and animated selected navigation |
| Native feature screens | Shared folded-corner token across 31 screens, updated Material themes, forms, cards, dialogs, paper backgrounds and existing dark Mlynq detail surfaces |
| Native navigation | Directional entrances and press feedback with reduced-motion handling; Mlynq retains Cupertino routes on Apple platforms |

Feature handlers, data requests, permissions, existing destinations and account flows are retained. The feature finder provides navigation; it does not search private content or bypass authorization. Existing Mentron password / Mlynq OTP authentication and shared-session switching are unchanged.

## Validation

The web production build and type checks passed, as did eight auth tests, five platform tests, twenty existing Flutter tests and two new motion tests. Android debug APK compilation passed. Full-app Flutter analysis found no errors and retained 569 existing warnings/information items. Browser checks passed for public pages at 320, 390, 768 and 1366px, keyboard tabs, feature search, modal Escape, motion preference, horizontal overflow and runtime errors. Product-specific login, OTP and recovery browser checks passed with mocked email requests. Native component tests exercise 320/390/900 logical pixels with 1x/2x text; motion tests cover immediate visibility when disabled and push/back behavior.

Previews are generated from the local implementation. Flutter images show the actual reusable production components with clearly identified sample data; they are not a signed-in device session. The Android debug APK contains the production app changes. Authenticated feature pages are compiled/analyzed but require a real member session for full workflow acceptance. No production deployment is performed by this design revision.

Normal-motion browser checks also passed: pointer tilt, persisted pause across reloads, Ctrl+K, empty search results, and narrow gateway/account pages. Finished page entrances release their transform so fixed navigation stays attached to the viewport. The preview gallery's image loading and mobile layout were verified.
