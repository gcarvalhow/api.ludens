# Execution ledger — plan: 2026-10-22-local-api-vercel.md

Pre-flight: Task 1 cookie override is consumed by Task 2 Compose; Task 3 proxy origin is configured by Task 4. Prefix /api and existing refresh Path are consistent.

Ruling: work on dedicated feat/local-api-vercel branches in the existing clones to keep IDE paths and Docker context stable; master is not edited. Cost: no additional filesystem isolation.

Ruling: scripts bundled with the skill assume a Unix workspace and a single repository. Track the multi-repository Windows execution here instead. Cost: manual task bookkeeping.

Task 3: proxy tests failed before implementation (missing rewrite and validation); after implementation Node tests passed 3/3.

Initial blockers: Docker Desktop engine stopped; Python and npm dependencies incomplete after interrupted execution. Restarted installation and Docker Desktop.

Task 1: complete locally. Cookie override tests failed on development+Secure and production+non-Secure before implementation; full API suite now passes 61/61 with dedicated staging PostgreSQL.

Task 2: Compose validates, image builds, migrations 0001 through 0004 applied on first startup. API and Postgres healthy, Mailpit loopback only, public tunnel connected. Existing volume successfully reused after Docker restart. Migration-failure fault injection was not performed; dependency gate is declared service_completed_successfully.

Task 3: complete locally. Node proxy tests pass 3/3; Jest passes 34/34; production build passes. Lint has zero errors and three existing img warnings. Next reports an existing parent-directory lockfile warning locally.

Final review: independent agent identified two Important findings, both addressed. Trailing slash redirect reproduced as HTTP 307; added explicit slash rewrite and skipTrailingSlashRedirect; Node regression failed then passed. Production Next server smoke test now verifies POST /api/catalog/sessions/ returns no redirect. Renamed standalone Node file to api-proxy-check.mjs to avoid Jest collection and added npm run test:proxy to CI; full Jest suite is green.

Ruling: ignore Next-generated next-env.d.ts in ESLint; generation introduced a triple-slash lint error unrelated to authored source. Cost: generated declarations are checked by TypeScript, not ESLint.

Final: minor (deferred): proxy tests inherit NEXT_PUBLIC_API_URL from caller; run them without this variable in the test environment. Existing tests pass in current environment and CI.

Final: minor (deferred): no separate logout unit assertion was added. Runtime smoke verifies logout clears the refresh cookie by Max-Age=0.

Runtime: tests/smoke_demo.py passes against HTTPS Quick Tunnel and against production Next proxy on loopback port 3001. Creates only synthetic example.com users and prints no tokens/passwords. Covers registration, login, HttpOnly/Secure/Path, refresh, logout, catalogue and trailing slash. Actual deployed Vercel browser/cookie verification remains pending publication and API_PROXY_URL configuration.

Task 4: usage guide written. No Azure resources, commits, pushes or Vercel changes made in this implementation. Integration into master and publication await user's final direction; changes are on feat/local-api-vercel in API, web and docs clones.
