# Generated source inventory

Generated 17 October 2026 from local files. Static extraction is an index, not proof of deployed schema or a complete security audit. `from` references can include Storage buckets; schemas are reported separately. Raw source values, signing material, backend credentials and personal email lists are intentionally excluded.

## Mentron Flutter

151 source files read.

### Screens/pages and data dependencies

| File | Lines | Table/bucket references | RPC calls |
|---|---:|---|---|
| `core/splash_screen.dart` | 311 |  |  |
| `features/admin/screens/permission_management_screen.dart` | 298 | `profiles` |  |
| `features/auth/screens/forgot_password_screen.dart` | 165 |  |  |
| `features/auth/screens/login_screen.dart` | 295 |  |  |
| `features/auth/screens/onboarding_screen.dart` | 268 |  |  |
| `features/auth/screens/signup_screen.dart` | 401 |  | `enroll_current_user` |
| `features/dashboard/screens/core_members_screen.dart` | 834 | `profiles` |  |
| `features/dashboard/screens/dashboard_screen.dart` | 742 | `events`, `notes`, `profiles`, `projects` |  |
| `features/dashboard/screens/exec_dashboard_screen.dart` | 662 | `notes`, `profiles`, `projects` |  |
| `features/events/screens/event_detail_screen.dart` | 146 | `event_cal`, `registrations` |  |
| `features/events/screens/event_list_screen.dart` | 503 | `event_cal`, `event_concept_votes`, `event_concepts` |  |
| `features/execom/screens/buyers_list_screen.dart` | 869 |  |  |
| `features/execom/screens/event_manager_screen.dart` | 807 | `audit_log`, `event_cal`, `registrations` |  |
| `features/execom/screens/execom_login_screen.dart` | 266 | `audit_log`, `profiles` |  |
| `features/execom/screens/notification_manager_screen.dart` | 1348 | `broadcast_notifications`, `profiles` |  |
| `features/execom/screens/payment_management_screen.dart` | 1015 |  |  |
| `features/force_update/screens/force_update_screen.dart` | 116 |  |  |
| `features/forum/screens/add_question_screen.dart` | 323 | `forum_questions` |  |
| `features/forum/screens/forum_list_screen.dart` | 439 | `forum_questions` |  |
| `features/forum/screens/question_detail_screen.dart` | 950 | `forum_answers`, `forum_questions`, `forum_votes`, `profiles` | `handle_forum_vote` |
| `features/gate/screens/gate_dept_folders_screen.dart` | 521 | `profiles` |  |
| `features/gate/screens/gate_folder_notes_screen.dart` | 716 | `profiles` |  |
| `features/gate/screens/gate_landing_screen.dart` | 614 | `profiles` |  |
| `features/leaderboard/screens/leaderboard_screen.dart` | 148 | `leaderboard_view` |  |
| `features/marketplace/screens/ad_activity_screen.dart` | 277 |  |  |
| `features/marketplace/screens/add_marketplace_item_screen.dart` | 687 |  |  |
| `features/marketplace/screens/marketplace_screen.dart` | 234 |  |  |
| `features/marketplace/screens/my_orders_screen.dart` | 295 |  |  |
| `features/notes/screens/add_note_screen.dart` | 910 | `note_folders`, `profiles` |  |
| `features/notes/screens/create_folder_screen.dart` | 249 | `note_folders` |  |
| `features/notes/screens/dept_picker_screen.dart` | 197 | `profiles` |  |
| `features/notes/screens/first_year_group_screen.dart` | 146 | `profiles` |  |
| `features/notes/screens/group_screen.dart` | 418 | `profiles` |  |
| `features/notes/screens/note_list_screen.dart` | 418 | `mentron-notes_bucket`, `notes`, `profiles` |  |
| `features/notes/screens/note_viewer_screen.dart` | 370 |  |  |
| `features/notes/screens/notes_by_subject_screen.dart` | 830 | `note_folders`, `notes`, `profiles`, `project_a.members` | `increment_note_views` |
| `features/notes/screens/semester_screen.dart` | 190 | `profiles` |  |
| `features/notes/screens/subjects_screen.dart` | 194 |  |  |
| `features/notifications/screens/notifications_inbox_screen.dart` | 298 |  |  |
| `features/profile/screens/profile_screen.dart` | 784 | `mentron-profile-photos`, `profiles` |  |
| `features/projects/screens/add_project_screen.dart` | 257 | `projects` |  |
| `features/projects/screens/my_contributions_screen.dart` | 424 | `project_applications` |  |
| `features/projects/screens/project_applications_screen.dart` | 461 | `mentron-cv_bucket`, `notifications`, `project_applications` |  |
| `features/projects/screens/project_detail_screen.dart` | 243 | `mentron-cv_bucket`, `project_applications` |  |
| `features/projects/screens/project_list_screen.dart` | 251 | `profiles`, `project_applications`, `projects` |  |
| `features/requests/screens/requests_screen.dart` | 214 | `projects` |  |
| `main.dart` | 334 | `profiles` |  |
| `mlynq/screens/auth/login_screen.dart` | 601 |  |  |
| `mlynq/screens/auth/web_link_screen.dart` | 143 | `profiles`, `web_linking_codes` |  |
| `mlynq/screens/certificates/certificates_screen.dart` | 843 | `certificate_template_fields`, `certificate_templates`, `certificates`, `events`, `profiles` |  |
| `mlynq/screens/events/event_detail_screen.dart` | 774 | `certificate_template_fields`, `certificate_templates`, `certificates`, `events`, `member_attendance`, `profiles` |  |
| `mlynq/screens/events/event_list_screen.dart` | 461 | `events` |  |
| `mlynq/screens/home/home_screen.dart` | 702 | `announcements`, `events`, `member_attendance` |  |
| `mlynq/screens/membership/edit_profile_screen.dart` | 146 | `profiles` |  |
| `mlynq/screens/membership/membership_card_screen.dart` | 226 |  |  |
| `mlynq/screens/notifications/notifications_screen.dart` | 161 | `announcements` |  |
| `mlynq/screens/qr/qr_display_screen.dart` | 331 | `qr_tokens` |  |
| `mlynq/screens/splash/splash_screen.dart` | 440 |  |  |
| `screens/my_downloads_screen.dart` | 506 |  |  |
| `screens/video_player_screen.dart` | 80 |  |  |

### Services, state, security and helpers

| File | Lines | Classes/functions (up to 12) |
|---|---:|---|
| `core/providers/academic_provider.dart` | 16 | `AcademicProvider` |
| `core/providers/theme_provider.dart` | 13 | `ThemeProvider` |
| `core/services/academic_service.dart` | 37 | `AcademicService` |
| `core/services/compression_service.dart` | 67 | `CompressionService` |
| `core/services/session_guard_service.dart` | 142 | `SessionGuardService` |
| `core/services/supabase_service.dart` | 113 | `SupabaseService` |
| `core/services/version_service.dart` | 99 | `VersionCheckResult`, `VersionService` |
| `mlynq/core/providers/auth_provider.dart` | 87 | `MemberAuthState`, `AuthNotifier` |
| `platform/file_headers.dart` | 16 |  |
| `platform/platform_config.dart` | 5 | `PlatformConfig` |
| `platform/product_access.dart` | 14 |  |
| `platform/product_analytics.dart` | 30 | `ProductRouteObserver` |
| `platform/product_host.dart` | 259 | `ProductHost`, `_ProductHostState` |
| `platform/product_switcher.dart` | 58 | `ProductSwitcher` |
| `services/api_security_service.dart` | 186 | `ApiSecurityService`, `_RateLimitInterceptor`, `_RetryInterceptor` |
| `services/audit_logging_service.dart` | 232 | `AuditLoggingService`, `AnomalyReport`, `ContentDownloadStat` |
| `services/auth_security_service.dart` | 338 | `AuthSecurityService` |
| `services/buyers_service.dart` | 19 | `BuyersService` |
| `services/content_protection_service.dart` | 86 | `ContentProtectionService` |
| `services/device_security_service.dart` | 259 | `DeviceIntegrityStatus`, `DeviceSecurityService` |
| `services/fcm_service.dart` | 208 | `outside`, `FCMService` |
| `services/gate_service.dart` | 319 | `GateDepartment`, `GateFolder`, `GateNote`, `GateService` |
| `services/marketplace_service.dart` | 537 | `MarketplaceService` |
| `services/notification_manager_service.dart` | 318 | `NotificationManagerService`, `endpoint`, `returned` |
| `services/offline_storage_service.dart` | 425 | `OfflineStorageService` |

Observed schema qualifiers: `mentron`.

All static table/bucket references: `access_logs`, `analytics_events`, `announcements`, `app_config`, `audit_log`, `broadcast_notifications`, `certificate_template_fields`, `certificate_templates`, `certificates`, `event_cal`, `event_concept_votes`, `event_concepts`, `events`, `forum_answers`, `forum_questions`, `forum_votes`, `gate_departments`, `gate_folders`, `gate_notes`, `leaderboard_view`, `marketplace_listing_views`, `marketplace_listings`, `marketplace_orders`, `member_attendance`, `mentron-cv_bucket`, `mentron-notes_bucket`, `mentron-profile-photos`, `note_folders`, `notes`, `notifications`, `payment_settings`, `profiles`, `project_a.members`, `project_applications`, `projects`, `qr_tokens`, `registrations`, `user_sessions`, `web_linking_codes`.

## Lynq React

23 source files read.

### Screens/pages and data dependencies

| File | Lines | Table/bucket references | RPC calls |
|---|---:|---|---|
| `App.jsx` | 71 |  |  |
| `pages/AttendancePage.jsx` | 259 | `attendance` |  |
| `pages/CertificatesPage.jsx` | 559 | `certificates`, `event_posters`, `events`, `users` |  |
| `pages/EventDetailPage.jsx` | 457 | `attendance`, `certificates`, `event_posters`, `events`, `users` |  |
| `pages/EventsPage.jsx` | 224 | `events` |  |
| `pages/HistoryPage.jsx` | 340 | `attendance`, `certificates`, `events` |  |
| `pages/HomePage.jsx` | 302 | `announcements`, `attendance`, `certificates`, `events` |  |
| `pages/LandingPage.jsx` | 666 |  |  |
| `pages/LoginPage.jsx` | 603 | `users` | `check_member_email` |
| `pages/NotificationsPage.jsx` | 94 | `announcements` |  |
| `pages/ProfilePage.jsx` | 207 | `users` |  |
| `pages/QrPage.jsx` | 350 |  |  |

### Services, state, security and helpers

| File | Lines | Classes/functions (up to 12) |
|---|---:|---|
| `contexts/AuthContext.jsx` | 110 | `AuthProvider`, `useAuth` |
| `contexts/ToastContext.jsx` | 107 | `ToastProvider` |
| `lib/member_emails.js` | 43 | `isIsteMemberEmail` |
| `lib/qrSecurity.js` | 168 | `getQrSigningSecret`, `bufferToHex`, `uint8ToBase64`, `uint8ToBase64Url`, `deriveAesKey`, `computeTokenHash`, `encryptQrPayload`, `decryptQrPayload`, `generateStudentAttendanceToken` |
| `lib/supabase.js` | 14 |  |

Observed schema qualifiers: (default/public only).

All static table/bucket references: `announcements`, `attendance`, `certificates`, `event_posters`, `events`, `qr_tokens`, `users`.

## Mentron migrations

22 source files read.

| Migration | Lines | CREATE TABLE declarations |
|---|---:|---|
| `20260226030324_add_profile_id_to_notes.sql` | 0 |  |
| `20260226083315_add_profile_id_to_notes.sql` | 6 |  |
| `20260606000000_dynamic_progression_and_force_update.sql` | 63 | `public.app_config`, `public.subjects` |
| `20260702000001_security_tables.sql` | 88 | `user_sessions`, `content`, `access_logs` |
| `20260702000002_academy_tables.sql` | 88 | `academy_folders`, `academy_lectures` |
| `20260710000002_broadcast_notifications.sql` | 88 | `broadcast_notifications` |
| `20260710000003_add_event_dates.sql` | 11 |  |
| `20260710000004_increment_academic_sem.sql` | 1 |  |
| `20260712000001_marketplace_tables.sql` | 235 | `marketplace_listings`, `marketplace_orders`, `marketplace_listing_views`, `payment_settings` |
| `20260712000002_add_fcm_token_to_profiles.sql` | 31 |  |
| `20260712000003_add_require_iste_id_to_notes.sql` | 5 |  |
| `20260714000000_marketplace_and_academy_fixes.sql` | 21 |  |
| `20260715000000_execom_profiles_policy.sql` | 18 |  |
| `20260715233000_fix_projects_applications_visibility.sql` | 68 |  |
| `20260720231500_update_cv_bucket_rls_policy.sql` | 17 |  |
| `20260720234000_allow_applicants_view_leads.sql` | 15 |  |
| `20260721000000_allow_execom_update_member_role.sql` | 24 |  |
| `20260722000000_gate_initiative_schema.sql` | 154 | `public.gate_departments`, `public.gate_folders`, `public.gate_notes` |
| `20260723000000_fix_payment_settings_insert_rls.sql` | 43 |  |
| `add_note_folders.sql` | 44 | `note_folders` |
| `add_year_to_event_cal.sql` | 3 |  |
| `fix_marketplace_bucket_rls.sql` | 24 |  |

## Platform migrations

27 source files read.

| Migration | Lines | CREATE TABLE declarations |
|---|---:|---|
| `20260807_certificates_v2.sql` | 137 |  |
| `20260809_consolidation.sql` | 665 | `public.profiles` |
| `20260810_schema_cleanup_phase2.sql` | 1011 |  |
| `20260811_rls_role_hierarchy_bugfix.sql` | 424 |  |
| `20260812_global_feature_permissions.sql` | 51 | `public.global_feature_permissions` |
| `20260813_dummy_data_cleanup.sql` | 45 |  |
| `20260814_rls_recursion_and_column_fix.sql` | 173 |  |
| `20260815_fix_relation_users_not_exist.sql` | 176 |  |
| `20260816_add_missing_profiles_columns.sql` | 68 |  |
| `20260817_dynamic_certificate_system.sql` | 61 | `public.certificate_templates`, `public.certificate_template_fields`, `public.certificate_generation_jobs` |
| `20260818_certificates_rls_allow_write.sql` | 11 |  |
| `20260819_create_certificates_bucket.sql` | 25 |  |
| `20260909_import_offenso_and_unify_users.sql` | 1271 |  |
| `20261002_backfill_existing_mlynq_users.sql` | 7 |  |
| `20261002_unified_platform_foundation.sql` | 677 | `public.iste_memberships`, `public.organisation_positions`, `public.position_assignments`, `public.work_items`, `public.work_assignments`, `public.work_proofs`, `public.event_sessions`, `public.attendance_imports`, `public.session_attendance`, `public.certificate_eligibility`, `public.certificate_issuance_jobs`, `public.analytics_events` |
| `20261002_unified_platform_security_hardening.sql` | 18 |  |
| `20261003120000_session_attendance_qr_atomic.sql` | 80 |  |
| `20261003130000_certificate_eligibility_lifecycle_security.sql` | 608 |  |
| `20261003_lynq_work_items_web.sql` | 206 |  |
| `20261006_forum_heads_and_chair_promote_demote.sql` | 230 |  |
| `20261007_audit_remediation_and_security_lockdown.sql` | 623 |  |
| `20261010060630_converge_lynq_registration_intake.sql` | 139 |  |
| `20261010061007_archive_unused_lynq_legacy_tables.sql` | 109 | `legacy_lynq_20261010.manifest`, `legacy_lynq_20261010.function_definitions` |
| `20261010061600_backfill_canonical_iste_memberships.sql` | 28 |  |
| `20261010133336_integrate_mentron_product_schema.sql` | 1277 | `mentron."xp_history"`, `mentron."marketplace_listings"`, `mentron."marketplace_orders"`, `mentron."profiles"`, `mentron."marketplace_listing_views"`, `mentron."payment_settings"`, `mentron."app_config"`, `mentron."user_sessions"`, `mentron."notes"`, `mentron."interaction_logs"`, `mentron."subjects"`, `mentron."content"`, `mentron."access_logs"`, `mentron."registrations"`, `mentron."events"`, `mentron."admins"`, `mentron."forum_questions"`, `mentron."forum_answers"`, `mentron."forum_votes"`, `mentron."connect_profiles"`, `mentron."event_concepts"`, `mentron."event_cal"`, `mentron."project_applications"`, `mentron."connect_student_profiles"`, `mentron."projects"`, `mentron."connect_alumni_profiles"`, `mentron."pending_notes"`, `mentron."event_concept_votes"`, `mentron."note_folders"`, `mentron."note_views"`, `mentron."pending_projects"`, `mentron."connect_opportunities"`, `mentron."broadcast_notifications"`, `mentron."connect_events"`, `mentron."academy_folders"`, `mentron."connect_event_registrations"`, `mentron."academy_lectures"`, `mentron."connect_requests"`, `mentron."notifications"`, `mentron."offenso_participants"`, `platform_migration.mentron_identity_map`, `platform_migration.mentron_snapshot` |
| `20261010133414_verified_mentron_identity_import.sql` | 90 |  |
| `20261010133607_harden_mentron_integration_helpers.sql` | 2 |  |

## All Flutter source files

This also records widgets, models, motion and theme files that are not standalone routes.

- `core/exec_main_scaffold.dart`
- `core/main_scaffold.dart`
- `core/providers/academic_provider.dart`
- `core/providers/theme_provider.dart`
- `core/services/academic_service.dart`
- `core/services/compression_service.dart`
- `core/services/session_guard_service.dart`
- `core/services/supabase_service.dart`
- `core/services/version_service.dart`
- `core/splash_screen.dart`
- `core/theme/app_theme.dart`
- `core/theme/app_theme_old.dart`
- `core/theme/exec_theme.dart`
- `core/theme/marketplace_theme.dart`
- `core/utils/app_transitions.dart`
- `core/utils/department_mapper.dart`
- `core/utils/error_handler.dart`
- `core/utils/profanity_filter.dart`
- `core/widgets/animated_indexed_stack.dart`
- `data/models/forum_model.dart`
- `data/models/marketplace_model.dart`
- `data/models/note_model.dart`
- `data/models/project_model.dart`
- `data/models/subject_data.dart`
- `design/campus_widgets.dart`
- `design/creative_motion.dart`
- `design/creative_surfaces.dart`
- `features/admin/screens/permission_management_screen.dart`
- `features/auth/screens/forgot_password_screen.dart`
- `features/auth/screens/login_screen.dart`
- `features/auth/screens/onboarding_screen.dart`
- `features/auth/screens/signup_screen.dart`
- `features/dashboard/screens/core_members_screen.dart`
- `features/dashboard/screens/dashboard_screen.dart`
- `features/dashboard/screens/exec_dashboard_screen.dart`
- `features/dashboard/widgets/dashboard_carousel.dart`
- `features/dashboard/widgets/event_banner_widget.dart`
- `features/dashboard/widgets/real_time_calendar.dart`
- `features/events/screens/event_detail_screen.dart`
- `features/events/screens/event_list_screen.dart`
- `features/execom/screens/buyers_list_screen.dart`
- `features/execom/screens/event_manager_screen.dart`
- `features/execom/screens/execom_login_screen.dart`
- `features/execom/screens/notification_manager_screen.dart`
- `features/execom/screens/payment_management_screen.dart`
- `features/force_update/screens/force_update_screen.dart`
- `features/forum/screens/add_question_screen.dart`
- `features/forum/screens/forum_list_screen.dart`
- `features/forum/screens/question_detail_screen.dart`
- `features/gate/screens/gate_dept_folders_screen.dart`
- `features/gate/screens/gate_folder_notes_screen.dart`
- `features/gate/screens/gate_landing_screen.dart`
- `features/gate/widgets/gate_portal_banner.dart`
- `features/home/widgets/events_calendar_widget.dart`
- `features/leaderboard/screens/leaderboard_screen.dart`
- `features/marketplace/screens/ad_activity_screen.dart`
- `features/marketplace/screens/add_marketplace_item_screen.dart`
- `features/marketplace/screens/marketplace_screen.dart`
- `features/marketplace/screens/my_orders_screen.dart`
- `features/marketplace/widgets/category_chip_bar.dart`
- `features/marketplace/widgets/disclaimer_consent_sheet.dart`
- `features/marketplace/widgets/featured_listing_card.dart`
- `features/marketplace/widgets/full_screen_image_viewer.dart`
- `features/marketplace/widgets/listing_bottom_sheet.dart`
- `features/marketplace/widgets/listing_card.dart`
- `features/marketplace/widgets/marketplace_gradient_header.dart`
- `features/marketplace/widgets/order_status_stepper.dart`
- `features/notes/screens/add_note_screen.dart`
- `features/notes/screens/create_folder_screen.dart`
- `features/notes/screens/dept_picker_screen.dart`
- `features/notes/screens/first_year_group_screen.dart`
- `features/notes/screens/group_screen.dart`
- `features/notes/screens/note_list_screen.dart`
- `features/notes/screens/note_viewer_screen.dart`
- `features/notes/screens/notes_by_subject_screen.dart`
- `features/notes/screens/semester_screen.dart`
- `features/notes/screens/subjects_screen.dart`
- `features/notifications/screens/notifications_inbox_screen.dart`
- `features/profile/screens/profile_screen.dart`
- `features/projects/screens/add_project_screen.dart`
- `features/projects/screens/my_contributions_screen.dart`
- `features/projects/screens/project_applications_screen.dart`
- `features/projects/screens/project_detail_screen.dart`
- `features/projects/screens/project_list_screen.dart`
- `features/requests/screens/requests_screen.dart`
- `firebase_options.dart`
- `main.dart`
- `mlynq/core/providers/auth_provider.dart`
- `mlynq/core/router.dart`
- `mlynq/core/theme.dart`
- `mlynq/member_app.dart`
- `mlynq/screens/auth/login_screen.dart`
- `mlynq/screens/auth/web_link_screen.dart`
- `mlynq/screens/certificates/certificates_screen.dart`
- `mlynq/screens/events/event_detail_screen.dart`
- `mlynq/screens/events/event_list_screen.dart`
- `mlynq/screens/home/home_screen.dart`
- `mlynq/screens/membership/edit_profile_screen.dart`
- `mlynq/screens/membership/membership_card_screen.dart`
- `mlynq/screens/notifications/notifications_screen.dart`
- `mlynq/screens/qr/qr_display_screen.dart`
- `mlynq/screens/splash/splash_screen.dart`
- `mlynq/shared/mlynq_illustrations.dart`
- `mlynq/shared/utils/certificate_pdf_generator.dart`
- `mlynq/shared/utils/dynamic_certificate_pdf_engine.dart`
- `mlynq/shared/utils/dynamic_template_parser.dart`
- `models/audit_log.dart`
- `models/broadcast_notification.dart`
- `models/content.dart`
- `models/downloaded_content.dart`
- `models/downloaded_content.g.dart`
- `models/marketplace_listing.dart`
- `models/marketplace_listing_view.dart`
- `models/marketplace_order.dart`
- `platform/file_headers.dart`
- `platform/platform_config.dart`
- `platform/product_access.dart`
- `platform/product_analytics.dart`
- `platform/product_host.dart`
- `platform/product_switcher.dart`
- `screens/my_downloads_screen.dart`
- `screens/video_player_screen.dart`
- `services/api_security_service.dart`
- `services/audit_logging_service.dart`
- `services/auth_security_service.dart`
- `services/buyers_service.dart`
- `services/content_protection_service.dart`
- `services/device_security_service.dart`
- `services/fcm_service.dart`
- `services/gate_service.dart`
- `services/marketplace_service.dart`
- `services/notification_manager_service.dart`
- `services/offline_storage_service.dart`
- `shared/widgets/bouncing_balls_loader.dart`
- `shared/widgets/byju_stat_card.dart`
- `shared/widgets/exec_glass_container.dart`
- `shared/widgets/exec_liquid_background.dart`
- `shared/widgets/glass_container.dart`
- `shared/widgets/glass_container_old.dart`
- `shared/widgets/illustration_card.dart`
- `shared/widgets/liquid_background.dart`
- `shared/widgets/liquid_background_old.dart`
- `shared/widgets/pressable_scale.dart`
- `shared/widgets/skeleton_shimmer.dart`
- `shared/widgets/subject_chip.dart`
- `utils/constants.dart`
- `utils/validators.dart`
- `widgets/download_progress_widget.dart`
- `widgets/execom/notification_status_badge.dart`
- `widgets/home/event_banner_bottom_sheet.dart`
- `widgets/secure_video_player_widget.dart`

## Mentron website reference routes

Reference only; existing website is not the implementation destination.

- `app/forgot-password/page.tsx`
- `app/join/page.tsx`
- `app/login/page.tsx`
- `app/mentron/admin/insights/page.tsx`
- `app/mentron/admin/page.tsx`
- `app/mentron/admin/permissions/page.tsx`
- `app/mentron/admin/projects/page.tsx`
- `app/mentron/analytics/live/page.tsx`
- `app/mentron/analytics/page.tsx`
- `app/mentron/core/members/page.tsx`
- `app/mentron/dashboard/page.tsx`
- `app/mentron/events/[id]/page.tsx`
- `app/mentron/events/page.tsx`
- `app/mentron/gate/[deptKey]/folder/[folderId]/page.tsx`
- `app/mentron/gate/[deptKey]/page.tsx`
- `app/mentron/gate/page.tsx`
- `app/mentron/leaderboard/page.tsx`
- `app/mentron/marketplace/new/page.tsx`
- `app/mentron/marketplace/orders/page.tsx`
- `app/mentron/marketplace/page.tsx`
- `app/mentron/notes/[id]/analytics/page.tsx`
- `app/mentron/notes/page.tsx`
- `app/mentron/notes/upload/page.tsx`
- `app/mentron/notes/year/1/group/[group]/[sem]/[subject]/folder/[folderId]/page.tsx`
- `app/mentron/notes/year/1/group/[group]/[sem]/[subject]/page.tsx`
- `app/mentron/notes/year/1/group/[group]/[sem]/page.tsx`
- `app/mentron/notes/year/1/semester/[sem]/page.tsx`
- `app/mentron/notes/year/[year]/dept/[dept]/[sem]/[subject]/folder/[folderId]/page.tsx`
- `app/mentron/notes/year/[year]/dept/[dept]/[sem]/[subject]/page.tsx`
- `app/mentron/notes/year/[year]/dept/[dept]/[sem]/page.tsx`
- `app/mentron/notes/year/[year]/page.tsx`
- `app/mentron/notes/year/[year]/semester/[sem]/page.tsx`
- `app/mentron/page.tsx`
- `app/mentron/privacy/page.tsx`
- `app/mentron/projects/[id]/page.tsx`
- `app/mentron/projects/contributions/page.tsx`
- `app/mentron/projects/page.tsx`
- `app/mentron/settings/page.tsx`
- `app/mentron/societies/page.tsx`
- `app/mentron/team/page.tsx`
- `app/mlynq/[[...path]]/page.tsx`
- `app/page.tsx`
- `app/reset-password/page.tsx`
- `app/signup/page.tsx`
