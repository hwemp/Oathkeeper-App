# In-app community
The React community/social components were adapted from
https://github.com/hwemp/oathkeeper at commit daefc0c31e616d86141904068eee68f465638179.
The API and authorization rules remain in that repository. This change bundles
the screens in the mobile app; it does not deploy or replace the backend.

## Publisher setup
Deploy the existing service with MongoDB and a stable HTTPS origin. No new
spending is authorized. Set the GitHub Actions repository variable
OATHKEEPER_COMMUNITY_URL to that origin and rebuild. A local command-line build
uses VITE_COMMUNITY_URL. Credentials, query strings and path segments are
rejected in the origin. No address is collected from app members.

The API remains /api/community. Native builds enable CapacitorHttp to make
credentialed requests without opening a browser. Sessions use the platform cookie
store and the server's existing HTTP-only cookie, never a password or token in a
character export. Browser-only development needs a same-site setup or explicitly
configured credentialed CORS on the backend; no permissive CORS change is made.

## Current state
The service has not been deployed. Without its build-time address, bundled
Community sections open normally with a not-launched status. Network-dependent
actions are disabled. There are no seeded users or simulated successful actions.

Connected builds use the existing registration, login/logout, public posts,
comments, private groups/invitations/chat, friends, direct messages, blocks,
reports, and attachment API. Files are selected through the app and fetched with
the session; received files use native Save/share controls. No website window
or URL form is used. Uploads follow server permissions/storage readiness.
The default APK does not automatically upload a character or imported sheet.

## Validation
npm run check
npm run typecheck
npm test
npm run build
npx cap sync android

Tests cover the unconfigured in-app experience, configured API calls and logout
using a mocked service, error states, origin validation, and absence of website
launch/address collection. Device tests of cookies, account creation/sign-in,
background/restore, file selection, large uploads/downloads, cancellation, and
native Save/share remain necessary with a real service and durable file storage.
Capacitor's current upload/file path may buffer data; advertised server file
limits are not a guarantee that a low-memory phone can transfer a 1 GB file.
