# Support, roll statistics and DM checkpoint

Approved dice APK: https://github.com/hwemp/Oathkeeper-App/releases/tag/android-test-24-1 (version 1.2-dice-approved).

Branch: support-dm-tools, based on the saved dice branch. Main-branch merge was blocked by automatic approval review and has not been retried.

Completed: themed Support page, ecclesyus@gmail.com email composer, local JavaScript error capture, service connection and exact-proposal approval UI; persistent observed dice statistics; DM Session/Encounter/Campaign/Rules & Books sections, selectable placement, initiative, HP/temp HP, death-save and condition records, 2024 encounter budgets, campaign notebooks, source library, backup validation.

Checks: 20 unit tests pass, including approval-before-write, stale source, expiration, concurrent approval, constrained paths, health, encounter budgets and roll statistics. Syntax, TypeScript and production build pass. Initial expanded DM/Support browser checks passed in run 42869636978; final approval UI checks are being run.

Completed backend: authenticated, rate-limited server-side AI diagnosis and digest-bound owner approval before creating a draft repair PR. No merge/release/install code. Research and deployment notes are in dm-research.md and support-service.md.

Remaining: inspect final browser screenshots and feature APK build. No live OpenAI key or hosted repair service is configured. No claim of live automatic repair or Android-device execution.
