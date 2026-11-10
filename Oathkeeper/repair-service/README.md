# Oathkeeper Repair Review service

This optional server connects Support to the OpenAI Responses API. A ChatGPT Plus subscription alone does not configure this server. Until a server and credentials are configured, local error capture, support email drafts, and copying a report to ChatGPT work without it.

## Run

Use Node 22 or newer. Set these server-only environment variables, then run `npm run repair-service` from `Oathkeeper/`, or build this directory's Dockerfile. Serve behind HTTPS and use a persistent volume for `/data` in Docker.

| Variable | Value |
|---|---|
| `GITHUB_REPOSITORY` | `hwemp/Oathkeeper-App` |
| `REPAIR_BASE_BRANCH` | Approved source branch, normally `main` after consolidation |
| `GITHUB_TOKEN` | Repository-scoped token with contents and pull-request write access; no administration or workflow scope needed |
| `OPENAI_API_KEY` | Your server-side API credential |
| `OPENAI_MODEL` | A model available to your API account supporting Responses and strict JSON Schema |
| `REPAIR_ACCESS_TOKEN` | Random client access secret, at least 32 characters |
| `REPAIR_OWNER_TOKEN` | Different random approval secret, at least 32 characters; give only to Harrison |
| `REPAIR_ORIGINS` | Comma-separated exact app origins (Android default `https://localhost`); add an exact preview origin only when needed |
| `REPAIR_DATA_DIR` | Persistent private directory for proposals and approval status |
| `PORT` | Optional; defaults to 8787 |

Enter the HTTPS server URL and access credential in Support. Enable automatic diagnosis only if wanted. Credentials entered in the app remain in memory for that session; no OpenAI or GitHub keys belong in the APK. Keep tokens out of Git. This directory has no committed secrets.

## Approval contract

1. `POST /reports` with the access token sends a redacted report and bounded repository source to OpenAI; it writes no GitHub files.
2. The service saves a proposal with an immutable source SHA, full replacement file contents, digest, risks, and validation plan. No model tools or shell execution are enabled.
3. Harrison reviews the complete proposal in the app, checks approval, and supplies the separate owner credential.
4. `POST /repairs/:id/approve` must match the proposal digest, be within 24 hours, and still match the base branch SHA. The service then creates a new branch and **draft** PR containing exactly the reviewed files.
5. Tests, review, merging and release installation remain separate. The service never merges, deploys or installs repairs. A failed/interrupted approval stays locked; request a new diagnosis rather than blindly repeating writes. Run one service instance per proposal volume; multi-instance locking requires an external database.

A global limit of 10 authorized requests/minute and 2 concurrent operations bounds requests. Put the private owner service behind your normal HTTPS access controls. API availability, costs and quota depend on your own OpenAI account. Automatic diagnosis cannot detect every visual glitch, logic mistake or native crash; use the manual report when necessary.

## Verification

`npm test` includes mocked HTTP integration coverage for diagnosis without writes, separate owner approval, exact digest, changed-source rejection, one-time PR creation, path restrictions and CORS. No paid API request or live GitHub repair is needed for these tests. Live OpenAI/hosting verification remains pending configuration.

Official API reference reviewed November 10, 2026: https://developers.openai.com/api/docs/guides/structured-outputs
