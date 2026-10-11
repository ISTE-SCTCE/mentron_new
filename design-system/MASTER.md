# ISTE product UI — the idea studio and campus journal

## Creative revision · 11 October 2026

Mentron is an illustrated idea studio: violet paper, cyan backing sheets, a graphic asterisk, oversized geometric headings and occasional italic serif emphasis. Mlynq is a campus journal: teal ink, pale blue, green and peach paper, admission-ticket edges, a flower motif and editorial spacing. Preserve the products' existing colour families while replacing generic glass panels with tactile paper surfaces.

Use asymmetrical folded corners, fine borders, offset shadows and deliberate typographic hierarchy. Artwork is original CSS/SVG-style geometry on web and CustomPainter on Flutter; exclude decoration from accessibility semantics. Never draw a fake attendance QR or fabricate account activity.

Motion serves orientation: 360–500ms route/section entrances, 130ms press feedback, 240ms selected navigation states and a restrained pointer-driven artwork tilt. Web includes a persistent pause control; operating-system reduced motion suppresses CSS motion and new native entrances/transitions. iOS Mlynq routes retain native Cupertino pages. Keyboard users can operate the feature tabs and the searchable feature finder; the finder uses a modal dialog with Escape and focus restoration.

Shared Flutter corner tokens extend the visual system across 31 feature screens. Native cards, forms, headings, dialogs, navigation and backgrounds use the same direction. Keep circular avatars, useful imagery, QR contrast, input semantics and all original callbacks. Data, membership restrictions and authentication are independent of visual presentation.

Implementation: `app/creative.css`, `app/components/platform/CreativeExperience.tsx`, `mentron_flutter/lib/design/campus_widgets.dart`, `creative_motion.dart` and `creative_surfaces.dart`. The earlier baseline below remains context; this creative revision takes precedence for shapes, typography, illustration and motion.

## Shared rules

Use clear headings, generous spacing, visible navigation labels and useful real destinations. Avoid invented activity, member counts or testimonials. Account state, membership and permissions come from existing services. Decorative orbit artwork is excluded from accessibility trees.

Web uses bundled Space Grotesk for headings and Inter for body copy. Flutter inherits each product's existing font theme. Cards use restrained borders and rounded corners; feature panels use a larger asymmetric corner. Do not apply motion to form surfaces. Respect reduced motion.

Keep controls at least 44px on web and 48 logical pixels on Flutter where practical. Test 320px widths and doubled native text. Use wrapping/variable-height cards instead of fixed text heights. Preserve visible keyboard focus and named icon buttons.

## Mentron

Web: ink `#0d1018`, panel `#171b27`, text `#f1f1fa`, secondary text `#a8aec2`, lilac `#b6a0ff`. Existing cyan remains an accent in academic screens.

Flutter: existing lavender canvas `#f8f6ff`, deep-violet feature panel `#342748`, lilac action `#c9b3f0`, pastel lavender/peach/mint supporting cards. Secondary text `#6d6880` improves readability.

## Mlynq

Web: light canvas `#f2f6f3`, white cards, deep-teal text `#173c38`, secondary text `#526c68`, teal actions `#17665d`, cream accent `#e0edc9`.

Flutter: preserve soft-blue canvas `#ebf3fc` and existing pastel cards. Add deep-teal feature panels `#184d46` and cream actions. Membership status is descriptive; a guest must not be labeled as an expired paid plan.

## Implementation

Web product tokens and styles live in `app/studio.css`. Public page content and artwork are shared through `ProductLanding`. Native reusable widgets live in `mentron_flutter/lib/design/campus_widgets.dart`; screen owners supply data and callbacks.
