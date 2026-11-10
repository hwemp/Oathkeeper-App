# Approval-gated AI support service

## What works in the app

Support uses ecclesyus@gmail.com. It composes an email for the user to send, captures up to 20 local JavaScript error messages, and offers a copied ChatGPT diagnostic prompt. Character data, player rosters, journal text and DM notes are not automatically attached. Common bearer tokens, OpenAI-style keys and email addresses are redacted; users should still review reports.

Native crashes, visual defects and silent game-logic mistakes are not all observable as JavaScript errors. Users can add reproduction steps manually. No software can promise to automatically detect or repair every problem.

The app supports a configured HTTPS repair service and a session-only service credential. Automatic diagnosis is optional and off by default. It sends redacted error reports while that session is connected. No repair executes on the phone.

## Server behavior

Run the dependency-free Node service from Oathkeeper with `node support-server/server.mjs` using Node 22 or newer. Deploy behind an HTTPS reverse proxy; its default listener is loopback. Provide durable private storage for proposals. Required environment variables:

| Variable | Purpose |
|---|---|
| OPENAI_API_KEY | Server-only OpenAI API credential |
| OPENAI_MODEL | Explicit model ID supporting Responses structured output |
| SUPPORT_GITHUB_TOKEN | Fine-grained token with Contents and Pull requests write on hwemp/Oathkeeper-App |
| SUPPORT_GITHUB_REPOSITORY | Defaults to hwemp/Oathkeeper-App |
| SUPPORT_GITHUB_BRANCH | Defaults to support-dm-tools; set to the deployed source branch |
| SUPPORT_OWNER_TOKEN | Distinct random owner credential of at least 32 characters |
| SUPPORT_CLIENT_TOKEN | Distinct random report-submission credential of at least 32 characters |
| SUPPORT_DATA_FILE | Durable proposal JSON path; defaults to /var/lib/oathkeeper/proposals.json |
| SUPPORT_ALLOWED_ORIGINS | Explicit comma-separated allowed app/web origins |
| HOST / PORT | Listener; defaults to 127.0.0.1:8787 |

Use a deployment secret manager. Never commit credentials or place an OpenAI key, GitHub token or owner credential in the APK. The owner credential is entered only when reviewing a repair; it is not persisted by the app. A production multi-user service should replace the shared client credential with per-user authenticated access and quotas. Default quotas limit the instance to 20 diagnoses and 30 approval attempts per hour. Operate one service process per proposal database; use a transactional database/lock for multiple workers. Protect and back up the proposal file and review retention.

POST /reports authenticates the client, fetches a bounded source snapshot from the configured branch, requests an OpenAI structured proposal, validates the allowed paths and saves it as awaiting-owner-approval. No repository writes occur at this stage. The model cannot invoke tools.

The response includes a unique ID, source commit, full proposed replacement contents, risk, test plan and digest. The app shows these for review. An owner must select approval and submit the exact digest to POST /repairs/{id}/approve with the separate owner credential. The server rejects expired, changed, already-handled or stale-source proposals. Serialized processing prevents duplicate concurrent approvals. Approval is recorded before the first repository write.

After approval, the service creates a repair branch, commit and draft pull request. It never merges, publishes or installs an APK. CI checks and release review remain separate. If a repository write fails, the proposal is marked failed; inspect any partial repair branch before generating and approving a new proposal. The service does not blindly retry partial writes.

## What is not activated

The repository includes the backend and mocked tests, but this session has no hosted repair-service URL, OpenAI credential/model configuration or GitHub service credential. Therefore the shipped app clearly says the live repair service is not connected. No paid API calls have been made. Email, copied ChatGPT prompts, local diagnostics, dice statistics and the local DM desk work without that backend.

## Official technical sources

- [OpenAI authentication](https://developers.openai.com/api/reference/overview): keep secrets on the server.
- [Responses quickstart](https://developers.openai.com/api/docs/quickstart): server-side model requests.
- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs): constrained proposal JSON. Server validation and explicit authorization remain required.

The repair service uses the OpenAI API; it does not reuse a ChatGPT app session or claim that a ChatGPT subscription automatically configures a backend.
