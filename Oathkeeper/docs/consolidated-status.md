# Oathkeeper — consolidated task record

**Latest update:** [reference-and-safety-update.md](reference-and-safety-update.md) records the newly approved reference design and server-side age-safety changes, published separately on `reference-safety-update` to preserve the earlier session.

Updated November 10, 2026. This file brings the app requirements and progress from the prior Oathkeeper sessions into one place. It consolidates project work; the ChatGPT conversation threads themselves remain separate.

## Current source

- Repository: https://github.com/hwemp/Oathkeeper-App
- Local integration branch: `consolidated-work`, based on dice source `b96bc271df15fd370c2763de67382aa5dd87230e`.
- Integrated the existing main-branch navigation/theme/notification changes, PR #5 dice work, and the Support/statistics/DM source from the other session's `support-dm-tools` checkout.
- Selected one repair backend (`Oathkeeper/repair-service`) for the combined package; the other session's draft backend remains untouched in its checkout. The combined package has no duplicate backend to configure.
- Both earlier checkouts and remote branches remain intact. No character database, personal journal or DM save file was copied into this source package.
- **Approved and uploaded November 10, 2026.** User explicitly approved the combined payload and destination. Published source commit: `36745a204e27209de4297a0130dce70f9d2eb22d` on `consolidated-work`; consolidated PR: https://github.com/hwemp/Oathkeeper-App/pull/7. Main and existing work branches remain untouched.

## One task ledger

| Requested work | Combined source status | Validation / remaining dependency |
|---|---|---|
| Arcane Chronicle logo, Moonlit Citadel background, metallic gold/amethyst theme and Chronicle fonts | Preserved from existing source | Rendered screen checks passed at 320, 393 and 430px; native phone review remains pending |
| Profile → Account; Community → Groups / Posts | Preserved; no duplicate child entries in the dropdown | Existing community tests pass |
| Edit Journal followed by Edit Equipment; Messages; Friends; Settings; red Login/Logout at bottom | Preserved | Present in combined menu |
| Journal and equipment editing through menu dialogs | Preserved | Existing character data retained |
| Community content only on its selected pages, in-app experience | Preserved | Live backend must be hosted/configured before real accounts and sharing work |
| Help and About inside Settings; Import & backup inside Profile | Preserved | Full backup now explains inclusion of DM secrets and roll history |
| Golden fantasy notification bell and preferences | Preserved | Local pop-up/in-app tests are available; email/SMS delivery needs providers; this package does not activate them |
| Official/unofficial dice, D3 prism, D100 percentile, D50 unofficial, quantity and modifier | Included from PR #5 | Existing exact-mapping, range and probability tests pass |
| Dice statistics | Implemented | Last 500 batches; per-mode and die face counts, averages, variance, min/max, natural ones/maxima, recent history and clear control; survives reload/full backup |
| Support with ecclesyus@gmail.com | Implemented | Email draft, local diagnostics, redacted ChatGPT copy prompt; does not send an email itself |
| Automatically capture errors for diagnosis | Implemented for JavaScript exceptions, promise rejections and save-error notifications | Manual report covers silent logic/visual problems and native issues; automated diagnosis requires configured service |
| ChatGPT / AI repair with permission before fixing | App and server implementation complete; local mocked integration tests pass | Separate owner credential plus exact proposal digest, unchanged source and expiration checks gate a draft repair PR. No automatic merge, installation or release. Live HTTPS service, API model/key and repository credential are not configured |
| DM research | Consolidated in `dm-research.md` and searchable in-app reference library | Official play, glossary, toolbox, books, tracking sheets and SRD sources linked; no claim to reproduce every published supplement |
| DM Session desk | Implemented | Before/during/after checklist, campaign title, environment, light, pace, hazards and manual scene clock |
| DM Encounter desk | Implemented | Party-level XP budgets, initiative/ties/rounds, players/monsters, current/max/temp HP, damage/healing, AC, death-save counts, exhaustion, conditions, concentration and resource markers |
| DM Campaign desk | Implemented | Persistent notebooks for recaps, NPCs, quests, maps/locations, rewards, resources, downtime, calendar, house rules and expectations |
| DM tab placement | Implemented, configurable | Dropdown is the default recommendation; DM → Session → DM location enables a main tab after Dice |
| Preserve profile, equipment, journal and existing custom powers | Preserved | Full-app tests verify new features do not overwrite character data; no inventory quantity was invented |
| Merge all sessions' app work into one source and record | Published on isolated `consolidated-work` branch in PR #7 | This ledger is the single resume point; older PRs stay open until the combined changes are approved/published |
| New combined APK | Build workflow and Android source prepared as version `1.3-consolidated` / code 4 | Build 27 succeeded; signature/package verified. APK: https://github.com/hwemp/Oathkeeper-App/releases/download/android-test-27-1/Oathkeeper-Android-Test.apk |
| Execute APK on Android | Not verified | No physical Android device or emulator is attached |
| Store publication | Not completed | Release signing, store account/forms/assets, privacy/support URLs, live service setup and device testing remain publisher requirements |

## Verification in this session

- All 24 tests pass: existing community and exact dice tests, DM/statistics model tests, full-app DOM interaction tests and mocked repair-service HTTP integration tests.
- JavaScript syntax (including new modules/server) and TypeScript checks pass.
- Production web build passes; Capacitor Android sync passes.
- Full-app integration covers persistence across reload, DM initiative/damage/round workflow, editable DM placement, character/journal preservation, invalid roll-history recovery and credential redaction.
- Repair tests verify no repository writes on diagnosis, separate owner authentication, exact digest approval, stale-source rejection, draft PR creation once, restricted paths and CORS.
- Local Chromium cannot launch because this execution environment denies its required socket operation. DOM interaction tests are not rendered browser screenshots or native-device testing. The prepared CI preview workflow supplies the rendered validation once upload is authorized.
- No live OpenAI request, repair PR, support email, paid service setup or store release was performed.

## Earlier review/build links

- Dice PR #5: https://github.com/hwemp/Oathkeeper-App/pull/5
- Support/DM PR #6 from the other session: https://github.com/hwemp/Oathkeeper-App/pull/6
- Previously successful dice build 24 (does not contain the new combined features): https://github.com/hwemp/Oathkeeper-App/actions/runs/42868145146
- Dice build 24 release: https://github.com/hwemp/Oathkeeper-App/releases/tag/android-test-24-1
- Existing rendered dice preview: https://github.com/hwemp/Oathkeeper-App/actions/runs/42867521637

## Resume from this record

1. Upload permission received and publication completed. Keep prior chat tasks and checkouts intact; do not overwrite ongoing design, signup/age verification, Store or other follow-up work. ChatGPT threads cannot be merged or messaged directly from this environment. This record is the shared handoff.
2. PR #7 is open; preserve existing PRs #5 and #6 and all other work branches.
3. Android build 27 succeeded: https://github.com/hwemp/Oathkeeper-App/actions/runs/42872422408. Corrected rendered preview succeeded: https://github.com/hwemp/Oathkeeper-App/actions/runs/42872756290. APK release: https://github.com/hwemp/Oathkeeper-App/releases/tag/android-test-27-1.
4. Review previews and install/run the new APK on Android, preserving a character backup first. Merge only within the user's approved scope.
5. To activate optional live repair, use `repair-service/README.md` and configure HTTPS hosting plus server-side credentials. To activate community, use `in-app-community.md` and the existing `hwemp/oathkeeper` backend. No new spending is authorized.
6. Keep this record current with the final commit, workflow, release and verified device results. Never mark a configured interface as a live service without verifying the connection.

## Approved publication outcome

- Published isolated branch and PR #7; no merge, force push, task cancellation or edits to other sessions/checkouts.
- APK build 27 passed code checks, Android compilation, signature/package verification and release publication; APK size 5,869,608 bytes. Its source is commit `36745a204e27209de4297a0130dce70f9d2eb22d`.
- Follow-up commits only update this record and fix the preview script to select Dice from main navigation. App payload is unchanged.
- Corrected rendered UI checks passed: font/safe areas, dice, statistics, Support, DM sections, DM placement and overflow at phone sizes. Screenshots are in the `actual-app-preview` artifact of run `42872756290`. Screenshots have been generated; no physical-device execution is claimed.
- User requested changes be brought to the previous chat without disturbing its task. Direct cross-thread messaging is unavailable; use this shared record and PR #7 as the handoff.
