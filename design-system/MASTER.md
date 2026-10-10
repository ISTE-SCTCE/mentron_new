# ISTE product UI

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
