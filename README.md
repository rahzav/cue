# CUE waitlist

A small Cloudflare Worker for CUE's Rutgers–New Brunswick pilot waitlist. The marketplace is a separate application; this public repository contains no marketplace data, OAuth credentials, or email list.

## What it does

- Public landing page with a Rutgers pilot waitlist card.
- Google OAuth sign-in with state, nonce, PKCE and server-side ID token signature verification.
- Requires a verified Rutgers-managed Google Workspace account (`hd` claim) with a Rutgers or ScarletMail address. The email address is private and is used for waitlist updates.
- Stores one record per Google account in D1. Users select whether they want to find services, offer services, or both.
- Signed, secure, HttpOnly session cookie; no Google access token is stored.

**Eligibility limit:** A Rutgers-managed Google account verifies an institutional account, but does not prove current enrollment or New Brunswick campus. Rutgers alumni and some faculty/staff can retain ScarletMail access. For a strict current-student-only launch, add an approved enrollment verification method before opening the marketplace.

## Cloudflare setup

1. Connect this GitHub repository (`rahzav/cue`) in **Workers & Pages → Create → Import a repository**. Set Worker name to `cue-waitlist` (matching `wrangler.jsonc`), production branch `main`, root `/`, build command empty, deploy command `npx wrangler deploy`. Cloudflare will assign a `workers.dev` URL. The first deployment shows "Waitlist opens soon" until OAuth and D1 are configured.
2. In **Storage & databases → D1**, create a database named `cue-waitlist`. Open its **Console** and run the SQL in `migrations/0001_waitlist.sql` once.
3. In the Worker **Settings → Bindings**, add a D1 binding with variable name `DB` pointing to `cue-waitlist`. The binding is configured in Cloudflare, so no database UUID is committed to GitHub.
4. In Google Cloud Console, configure the OAuth consent screen for an **External** web app. While in Testing, add pilot test users; for broad public use, publish the app and complete any Google requirements. Create a **Web application** OAuth client. Add the exact `https://<worker>.<account>.workers.dev/auth/callback` as an authorized redirect URI and the origin `https://<worker>.<account>.workers.dev` as an authorized JavaScript origin if requested.
5. In Worker **Settings → Variables and Secrets**, add these as **secrets** (not plain text variables): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `SESSION_SECRET` (a random 32+ byte value). Redeploy if the dashboard requests it. Never put them in this repository or Cloudflare build variables. Use runtime secrets for the Worker.
6. Open the `workers.dev` URL, sign in with a Rutgers-managed Google account, select an interest, and verify the confirmation. Test an unrelated Gmail account as well; it must be rejected.

If the project later moves to a purchased domain, add its exact callback URL to Google's authorized redirect URIs before routing the domain to the Worker.

## Local development

Run `npm install` then `npm run dev`. Create `.dev.vars` locally with the three secrets. A local D1 binding is needed for end-to-end sign-in, so the simplest first test is the deployed Worker after dashboard setup. `.dev.vars` is ignored by Git.

## Privacy

The D1 table contains Google account ID, email, name, university label, interest and join date. Do not publish database exports. Limit database dashboard access to operators who need it. The app does not request Gmail access or send email yet; launch updates require a separate email delivery workflow.
