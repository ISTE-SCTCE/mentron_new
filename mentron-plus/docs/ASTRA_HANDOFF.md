# Current checkpoint

The resumed work implemented the Phase 1 design foundation. See PHASE_1_REPORT.md and DESIGN_SYSTEM.md. The historical Phase 0 handoff below records the earlier stop; its no-code status is superseded. Backend decisions remain unresolved.

---

# Astra handoff — stop before design

The user requested a Flutter super-app **and a website**, and explicitly wants Astra for designing. Phase 0 source audit is prepared in this folder. No themes, mockups, layouts, widgets, app scaffolds, database changes or deployment have begun.

Read `PHASE_0_AUDIT.md` and `SOURCE_INVENTORY.md`, then the original attached brief. References are read-only. All new work belongs under `C:/Users/Sarvesh R/Downloads/admin/campus_app`. Existing Mentron website edits belong to the user and must remain untouched.

Before implementing, obtain the Phase 0 OK required by the brief and resolve the concrete conflicts: public vs mentron profile schema/backend, incompatible events IDs, membership truth/expiry rules, legacy QR compatibility vs client-held signing material, and preserving the existing role models. Do not infer that this report authorizes database operations. All database deliverables are new additive migration files only, written for review and never executed; data import is separate with SELECT-only dry run first.

The website is provisionally a full responsive companion with both Learn and Campus worlds, not merely a marketing page. The old Next.js app remains reference only. A fresh web client and Flutter client should share backend/domain behavior while using platform-appropriate presentation and security adapters.

User-specified design inputs, awaiting Astra's work:

- Learn: Mentron palette, Poppins display/Inter body, purple-to-coral marketplace hero.
- Campus: slate blue/terracotta/teal/gold with Space Grotesk headings.
- Shared spacing/radii/type scale; isolated dark EXECOM theme.
- Coordinated 420ms world switch, five-slot adaptive nav, unified Today strip, shared profile/events/inbox.
- Motion kit, layout-accurate skeletons, cached-first loading, restrained glass, reduced-motion support and lazy tabs.
- Design every screen in the original brief, with loading/empty/error/offline states; adapt thoughtfully for desktop and mobile web.

Do not claim real-device performance, analyze/build success, migration deployment or QA completion until actually measured or run. The previous agent stopped here exactly to leave all visual design to Astra. Resume with the user's chosen model; no model switch has been performed automatically.

