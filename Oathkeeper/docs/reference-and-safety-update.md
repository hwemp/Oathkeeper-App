# Requested reference, notices, Store, contact and age-safety update

November 10, 2026. Source changes are local and have not been published or installed in an APK.

## Visual reference

The official/unofficial two-phone reference supplied with this request is the source for `web/public/art/dice-reference.png`. The file is unchanged. CSS crops display its actual dice artwork, including the two percentile faces, rather than approximating those faces with flat overlays. Labels, die selection, quantities, modifiers, results and secure dice calculations remain live app controls.

The dice panel now uses the compact reference proportions, three-column main dice grid, separate 3:2 percentile/D3 row in Official mode, smaller mode buttons, bordered controls/result panel, centered result and the bundled Chronicle Gothic font for labels, notes and numbers. Unofficial mode retains the requested 3×3 die order. Probability and saved-statistics sections remain accessible below the panel. Header minimum height was reduced from 228px to 132–166px, with less top padding and gap, bringing the menu/bell and character name closer together. Navigation remains three plaques wide, with Dice scrolled into view after Inventory.

A pixel-perfect on-device match is **not verified**: the browser policy denied access to the local preview, and no Android phone/emulator is attached. The prepared preview workflow includes the new reference asset and can provide rendered screenshots after publication is approved. Do not describe a generated mockup or a source edit as a verified installed-app screenshot.

## Requested wording and navigation

- Removed the artwork/randomness/modifier notice from Dice and removed the personal-homebrew/local-save notice from the recurring footer.
- Both notices now appear in About and immediately after successful account creation. An acknowledgement dismisses the welcome notice; it is not shown on every page or every login.
- Added **Store immediately after Friends**. The page contains only its heading. No items, promotional copy, prices, checkout or purchase processing were added.
- Replaced the no-in-app-purchases statement with wording that Store is planned for future purchases and is currently empty, without checkout.
- Restyled the privacy page with the app's Gothic font, Moonlit Citadel background and dark/gold card design.
- Contact consistently uses **ecclesyus@gmail.com**. Support can compose an email for information, reports, bugs or safety concerns and can copy a report for ChatGPT.
- A ChatGPT button opens ChatGPT, but cannot deliver messages into this existing private conversation. The interface says so. No private-chat ID or shared inbox was invented. Ordinary reports do not grant contact approval.

## Age and contact safety

The matching backend source (local commit `a50ec2e`) is in the separate `hwemp/oathkeeper` repository, local branch `age-contact-safety`. The mobile integration remains in `hwemp/Oathkeeper-App`, local branch `consolidated-work`. The combined source package includes both projects.

Registration requires a private birthdate; existing accounts must submit one. Dates are validated server-side. Community contact remains locked until a safety moderator completes age review. Date entry itself is not identity proof. A reviewer must actually verify the private evidence through a functioning review process.

Cross-age under-18/adult contact is denied in both directions unless a family/existing-friend exception has both independent account requests, two independently received support contacts verified by the moderator, explicit approval and a current expiry. A friend request, pre-existing friendship, shared group, email draft, claimed relationship or AI response cannot bypass this. Approval does not automatically add a friend or send a message.

The API enforces this on search/friendships, direct messages, group membership/invitations/chat/posts, public posts/comments and files. Anonymous member-content reading is disabled to avoid a sign-out bypass. Groups must satisfy the rule for every member pair. Revocation and expiry are rechecked on requests; blocking overrides approval. Safety reporting remains available for previous direct/group messages even when normal contact is now locked.

Safety-review authority is assigned through the backend environment's `SAFETY_MODERATOR_USER_ID`, matching a trusted account's immutable ID. Registering a username cannot claim that authority. Private birthdates are not returned in public search/profile/member objects or saved in character backups. Detailed behavior, setup and tests are in the backend's `docs/age-contact-safety.md`.

## Checks and limits

- Mobile app: 26 automated tests pass, including birthdate signup, post-signup notices, pending-account contact locks, notice placement, empty Store placement, existing character/DM preservation, dice mapping and repair approval checks. Syntax, TypeScript, production build and Capacitor Android sync pass.
- Community source: 7 backend tests and 4 character/save tests pass. The new API test executes the real Express routes against an in-memory Mongo interface. Both frontend and backend type checks and builds pass.
- The real-Mongo integration fixtures were updated for reviewed test accounts and authenticated reading. A MongoDB service is unavailable here, so the full database integration suite has not run for this update.
- No live age-evidence vendor, email inbox integration, ChatGPT submission inbox, safety-moderator account or community deployment was configured. These restrictions are not active in an old APK or old hosted backend until the matching source is deployed and configured.
- No new APK was generated, no real age/relationship decision was made, and no support message or identity document was sent.
- Prior automatic approval review blocked GitHub publication. No retry or alternate publication method was attempted in this update. Both source projects are preserved in local commits and the review package.
