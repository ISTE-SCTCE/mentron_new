# Mentron+ brand and login update — 18 October 2026

Historical design checkpoint. Authentication, footer, and implementation status below were superseded by [Live integration](LIVE_INTEGRATION.md).

Brand hierarchy: Mentron+ is the shared platform, Mentron is the study/project world, and mlynq is the events/community world. Main message: **Find your tribe. Build your next chapter.** Supporting line: Study together. Build bold ideas. Show up for the moments that matter.

The website now uses Inter headings instead of decorative serif/italic styling. Mentron remains a text wordmark pending the user's uploaded logo. The custom mlynq vector mark combines two connected arches into an m, with a coral link and small connection dot. Assets are in `web/public/brand/`: `mlynq-mark.svg`, white-background `mlynq-logo.svg`, and the supplied `iste.png`. The ISTE mark appears as a small header credit and in the footer. The temporary favicon is a text-derived M+ mark.

The footer structure and destinations were checked against https://istesctce.in/HTML/index.html: Menu (Home, Events, Execom, Gallery), More (Forums, Contact, Join ISTE), Instagram, LinkedIn, email, and ISTE Tech Team credit. A product column was added. Copyright year is current. Introductory copy is adapted to the product.

Login routes: `#/mentron-login` and `#/mlynq-login`. Each world has a visible Log in button. Both use the shared login component, with accessible labels, browser validation, password visibility, password recovery view, and an explicit preview entry. Switching login worlds remounts the form so entered credentials do not carry over. Forms do not call a service, persist credentials, or claim a successful sign-in/reset. Backend auth remains Phase 2 work pending the existing schema decisions.

Verified: production web build, both world-specific login routes, password visibility, preview submit feedback, reset feedback, 375px layout without horizontal document overflow, and responsive footer. Screenshots in `docs/previews/` record this revision. No database changes or public deployment.
