# Product login and migrated-account recovery

## Behavior

- Mlynq's web sign-in requests an email OTP; its primary login has no password field. Its old `/mlynq/login` route forwards to the shared Mlynq OTP page. Flutter retains its existing email OTP flow.
- Mentron's web and Flutter sign-in use passwords. Native login no longer trims the entered password.
- A valid active shared session enters the other enrolled product without another password/OTP prompt. Unenrolled users reach enrollment; suspended accounts retain their existing restrictions. Product analytics failures cannot block switching.
- Native switching claims Mentron's device token before mounting its guarded navigation, avoiding a premature sign-out when returning from Mlynq.
- Password recovery explicitly uses the ISTE-admin platform client. PKCE codes, recovery token hashes and implicit recovery tokens from app-created links are handled once. Invalid links cannot fall through to a different existing session. Credentials are removed from the address bar after successful verification. Password updates use the same shared client.

## Reported account

Inspection found a verified, active identity enrolled in both products, matched to an existing destination Auth record. The original migration preserved the destination's existing credential, which differed from Mentron's source credential. Recent destination Auth logs showed invalid password logins and a recovery-link verification, without a successful password update.

At the user's request, the original Mentron credential was restored for that one explicitly identified mapped account. The update required matching source/target IDs, normalized-email mapping, active canonical status and verified/nondeleted/nonbanned destination Auth state, and used a compare-and-set check on the prior destination credential. Post-update verification confirmed the original credential matches and both enrollments/status remain intact. No plaintext password was requested, logged or persisted; credential values remained in orchestration memory and were cleared. Other accounts and source data were not changed. The user subsequently confirmed their original password login works.

## Validation

Next production build/TypeScript passed. Eight auth/session/recovery tests and five existing platform tests passed. All twenty Flutter tests passed, and the updated Android debug APK built. Browser checks exercise product-specific fields, OTP request/expired-code handling, destination-project recovery requests and expired recovery links at phone and desktop sizes; test email sends are mocked.

## Remaining live settings

The client code is ready on the existing review branch; it has not been merged/deployed. Read the current ISTE-admin Auth settings before making configuration changes. Preserve SMTP, OTP expiry, confirmation requirements and existing redirects. Ensure the production shared site's `/reset-password` redirect is allowed and the recovery template points to shared Auth rather than the old Mentron project. Ensure the magic-link template supplies `{{ .Token }}` for Mlynq email-code login.

Automatic approval review blocked custom retrieval of the existing Supabase CLI management token from Windows Credential Manager, classifying it as credential probing without specific authorization. The attempted script did not execute and was removed. No alternate credential-extraction path was used. Existing supported Supabase tools verified the scoped account repair; live email-template/redirect configuration remains unverified pending an approved configuration-access method.
