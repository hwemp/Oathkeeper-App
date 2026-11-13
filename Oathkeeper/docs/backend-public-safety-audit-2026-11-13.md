# Oathkeeper backend: public community pre-release blockers
**Read-only source inspection on 2026-11-13. No production server, live accounts or deployed API endpoints were tested.**

Companion repository: `hwemp/oathkeeper`, default `main`. The mobile repository `hwemp/Oathkeeper-App` uses a community UI contract with optional external HTTPS backend; the app has no verified live community when the `oathkeeper-community-safety-verified` gate is disabled.

## Specific findings on backend `main`
- `docs/community.md` says password recovery and email verification are **not available**, and account suspension and appeals are **not implemented**.
- `apps/backend/src/community/router.ts` includes username/password `register` and `login` routes, moderation reports and blocking, but its inspected registration flow did **not** demonstrate age verification/guardian consent or an account deletion route. This observation applies to default `main`; a separate `age-contact-safety` development branch has been discussed, but it is not evidence of production deployment.
- A moderator can review reports, but the code explicitly rejects user-report removal when suspension is not available. Report existence is not evidence of timely response or a staffed moderation team.
- `docs/community.md` warns that uploads on its local disk adapter are not production-durable unless separately configured. Oversized files, backend storage and privacy handling require independent review.
- Do not enable the mobile community switch or claim online account functionality safe until an operational backend has been deployed and tested. A self-reported birthdate does not establish lawful guardian consent, nor is a claimed family relationship an automatic legal exception.

## Required end-to-end tests before public social release
1. Verify signup restrictions and proof-of-age/guardian processes under applicable local laws. Every endpoint must enforce eligibility; test bypass attempts without teaching users bypass techniques.
2. Implement login recovery and full account deletion (all relevant posts, comments, friendships, messages, files, sessions, and backups subject to lawful retention rules); verify in-app and externally requested deletion.
3. Implement moderation tools: abuse reporting, user suspension and reinstatement/appeals, filtering, staff escalation, evidence retention, child-safety contacts and takedown.
4. Test auth and authorization server-side for all community resources, attachments, messages, and groups. Confirm encrypted transport, rate limits, password/session protection, backups, malware protection and data minimization.
5. Publish accurate policy and support URLs and establish staffed response capacity. Do not overpromise response times without evidence.
6. Full native cross-platform integration testing using a deployed staging backend; verify age tiers, no cross-age communication without approved legal processes, file download revocation and data deletion.
7. Have relevant specialist counsel assess US/other target markets and app store disclosures before opening public communication.

## Store references
https://developer.apple.com/app-store/review/guidelines/
https://developer.apple.com/support/offering-account-deletion-in-your-app/
https://support.google.com/googleplay/android-developer/answer/13327111
https://support.google.com/googleplay/android-developer/answer/14747720

**Recommendation:** launch standalone offline character/DM/dice features first only after core app and asset/legal QA, while keeping all public community and paid checkout switched off until separately cleared.
