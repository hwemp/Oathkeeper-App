# Support, roll statistics and DM handoff — November 10, 2026

## Saved deliverables
- Approved dice APK: https://github.com/hwemp/Oathkeeper-App/releases/tag/android-test-24-1 (1.2-dice-approved).
- Feature APK: https://github.com/hwemp/Oathkeeper-App/releases/tag/android-test-25-1 (1.3-support-dm-preview, version code 4).
- Feature APK source: 6bb6f1fd957c13d20bf6b1a8a7fad8ad40e05da2. Later changes affect tests, screenshots, workflow filtering and documentation; the app bundle is unchanged.
- Feature APK SHA256: 21dae3f21ddb9a18572e7506998b2ce86b2393540612f3e3dd92cb4ad7a3a0a8.
- Final phone previews: https://github.com/hwemp/Oathkeeper-App/actions/runs/42871505629/artifacts/13790166428.
- Feature PR: https://github.com/hwemp/Oathkeeper-App/pull/6.

## Completed
Themed Support with ecclesyus@gmail.com email drafts, local JavaScript error capture, copied ChatGPT reports and an optional repair-service connection. Server-side OpenAI diagnosis makes no repository writes. Separate owner credentials and an exact proposal digest are required before creating a draft repair PR. Stale, expired, duplicate or unapproved requests cannot proceed. No automatic merge, release or APK installation is implemented.

Observed roll statistics save the latest 500 batches, separated by die and mode. Face statistics exclude modifiers; batch totals include them. Saved data is included in validated full backups.

DM provides Session, Encounter, Campaign and Rules & Books, selectable menu/main-tab placement, initiative and tie order, HP/temp HP, death-save counters, conditions/concentration/resource notes, a scene clock, 2024 mixed-level encounter budgets, campaign notebooks and official source links. Original DM research, scope, book references and attribution are in dm-research.md.

## Validation
All 22 tests pass locally and in CI (run 42871519078). Syntax, TypeScript and production build pass. Browser run 42871505629 passed dice conversions, five viewport widths, saved statistics, DM health and campaign persistence, topic search, Support diagnostics and unchecked/checked approval behavior. Reviewed actual themed phone screenshots.

Build 25 passed Android signature/package verification. Its checksum was verified and packaged web bundle matched the tested production build byte for byte. Backend code and server credentials are not bundled. Physical Android-device execution is unavailable in this workspace.

## Activation and approvals
Live diagnosis needs a hosted HTTPS repair service and server-only OpenAI/GitHub credentials. No live service, paid AI calls or automatic repair was activated. See support-service.md. Export character/DM backups before installing; debug signing keys can differ.

The automatic approval review blocked merging PR #5 into main because “execute the APK” was not considered explicit default-branch merge authorization. No workaround or alternate main write was attempted. PR #6 remains based on the saved dice branch. Ask for explicit merge authorization before changing main.

A later workflow-only/test checkpoint may produce an equivalent APK build; build 25 contains the verified feature implementation.
