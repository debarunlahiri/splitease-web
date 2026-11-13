# SplitEase website

A Next.js (App Router, TypeScript) site with two jobs:

1. **Landing page** at `/`: what SplitEase is, features, how it works, pricing note and FAQ.
2. **Links from outside the app** (emails, shared messages): pages that detect the visitor's
   device and send them into the Android app.

## Run

Requires Node.js 20+.

```bash
cp .env.example .env.local
```

```bash
npm install
```

```bash
npm run dev
```

The dev server listens on all interfaces, port 3000, so you can open it from a phone on the same
Wi-Fi (`http://<your-computer-ip>:3000`).

## Pages

| Path | Purpose |
| --- | --- |
| `/` | Landing page |
| `/join#TOKEN` | Group invite link (from the app's share sheet). Opens the app with `splitease://join?token=...` |
| `/invite` | Target of the "you were invited" email. Opens the app |
| `/open` | General "open the app" link |
| `/verify-email?token=...` | Target of the verification email. Verifies the address, then offers to open the app |
| `/p/<code>` | Short pay link made by the app. Loads the split from the backend. A plain link (no group or expense) has no live "I've paid" state; `?p=<n>` opens straight to person `n` |
| `/pay#...` | Old long pay link with the whole split in the URL. Still opens, but the app only creates it when the backend could not be reached |
| `/get-app` | Where visitors without the app land; links to the download page (`NEXT_PUBLIC_APK_URL`, default the Appverse page) |
| `/api/verify-email` | Server route that passes the token to the SplitEase backend |
| `/.well-known/assetlinks.json` | Android app-link verification (empty until fingerprints are set) |
| `/admin` | Admin dashboard (sign-in at `/admin/login`); see [Admin dashboard](#admin-dashboard) |
| `/api/admin/*` | Server routes the dashboard uses to talk to the backend (login, logout, proxy) |

## How the mobile redirect works

- **Android:** the page opens the app by itself and also shows an "Open SplitEase" button. It uses
  an Android intent link (`src/lib/links.ts`) that opens the app through its `splitease://` scheme
  when it is installed. When it is not, Chrome continues to the download page,
  `https://appverse.bitknob.com/android/splitease` (or `NEXT_PUBLIC_APK_URL` if set). SplitEase is
  not on the Play Store, so the link has no `package=` part: naming a package makes Chrome look
  the app up in the Play Store when it is missing. Do not add it back. It tries once per visit,
  so coming back from the app does not bounce you into it again. Inside in-app browsers (Facebook,
  Instagram, ...) automatic opening is often blocked; the page says to open it in the browser.
- **iPhone / iPad:** SplitEase is Android-only, so the page says so.
- **Desktop:** asks the visitor to open the link on their Android phone and offers "Copy link".

The invite token is read from the URL fragment (`#TOKEN`) in the browser. It is never sent to this
server or the backend, and the site sends `Referrer-Policy: no-referrer`.

## Connecting the backend

In the backend `.env` (splitease-backend):

```
APP_URL=https://splitease.lambrk.com,http://localhost:3000
INVITE_LANDING_URL=https://splitease.lambrk.com/join
```

- Emails link to the first `APP_URL` origin. In production, put the public website first so
  Android can verify the `/invite` and `/open` email links.
- `INVITE_LANDING_URL` makes the backend's old `GET /join` redirect here. The browser keeps the
  `#TOKEN` fragment through the redirect, so invite links already shared by the app keep working.

On this site, set `API_URL` to the backend's address. The website uses it server-side for
email verification and iOS launch signups. Signups require backend migration
`007_ios_update_subscriptions.sql` and SMTP. Only rows with a `confirmed_at` value have
opted in to the launch email.

## Admin dashboard

A private dashboard for running SplitEase, at `/admin`. It talks to the backend's admin API
(`/api/v1/admin`, see the backend README for the full list and the safety rules).

| Page | What you can do |
| --- | --- |
| Overview | Totals, new users per day, spend by currency, subscription sales, items needing attention |
| Users | Search; edit name; notify or email; resend or mark verification; sign out of all devices; suspend or restore; delete |
| Groups | Search; rename; delete; list a group's expenses (with a "Show deleted" switch) |
| Expenses | View the split, history and attachments (images open in a viewer, PDFs in a new tab, other files download); delete; remove an attachment |
| Subscriptions | Grant a plan, extend, cancel or reactivate; create, edit, hide or delete plans |
| Announcements | Send an in-app notification (optional push) to everyone, verified or premium users |
| Send email | Formal templates (promotion, warning, suspension, security, policy, maintenance, and more), audience picker, live preview, "send a test to me" |
| Email queue | Delivery state; retry or discard |
| iOS waitlist | Search, remove, export CSV |
| App releases | Publish, withdraw, delete; the download address defaults to the Appverse page |
| Activity log | Every admin change, filterable |
| Admins | Add or disable admins, change your own password |

It works on phones: the menu becomes a slide-out drawer, tables turn into cards, and dialogs
become bottom sheets.

### How it is wired

- The browser never talks to the backend. Pages call `/api/admin/proxy/...` on this site, and
  those server routes add the admin token and forward to the backend. Files such as attachments
  pass through untouched.
- Signing in (`/api/admin/login`) stores the access token in an `httpOnly`, `SameSite=Strict`
  cookie named `se_admin`, so scripts on the page cannot read it. Signing out clears it.
- Anything that changes data must send the `x-splitease-admin: 1` header (a simple CSRF guard);
  plain reads do not, so `<img>` tags can load attachments.
- `src/middleware.ts` sends visitors without the cookie to `/admin/login`. This is only a
  convenience: the backend checks the token on every request.
- The public header and footer are hidden on `/admin` (`SiteShell.tsx`), and admin pages are
  marked `noindex`.

### Set it up

1. In the backend, set `ADMIN_JWT_SECRET`, run the migrations and create an admin
   (`npm run admin -- --email you@example.com --name "Your Name"`). See the backend README,
   section "Admin dashboard".
2. Here, make sure `API_URL` points at the backend. That is the only setting the dashboard needs.
3. Rebuild and restart the website, then open `/admin`.

### Sign-in problems

The login page says what is wrong:

| Message | Cause |
| --- | --- |
| Invalid email or password | The backend answered that the credentials are wrong. Use `--reset` (backend README) to set a new password |
| The server does not support admin sign-in yet | The backend is an old build without the admin routes: `npm run build` and restart it |
| The admin API is not configured on the server | `ADMIN_JWT_SECRET` is missing in the backend `.env` |
| Too many attempts | Five failures in 15 minutes; wait and try again |
| The server is unreachable | `API_URL` is wrong, or the backend is down |

`API_URL` is the backend's address, for example `https://api.example.com`. A trailing `/api/v1` is
accepted and ignored (the site adds `/api/v1/...` itself). If the backend log shows a path like
`/api/v1/api/v1/admin/...`, the site is an old build from before that was handled: redeploy it.

### Developing it

- Do not run `next build` while `npm run dev` is running in the same folder: the build overwrites
  the dev server's `.next` cache and the dev server then fails with errors like
  `Cannot find module './611.js'`. Use `npm run typecheck` while the dev server runs. If it
  already happened, stop the dev server, delete `.next` and start it again.
- Admin styles are in `src/app/admin/admin.css`; shared pieces (dialogs, toasts, API helpers)
  are in `src/components/admin/`.

## Opening the app

The Android app handles `splitease://join` and `splitease://open`. The `open` address was added
for this site, so rebuild the app after pulling that change.

The Android manifest registers `https://splitease.lambrk.com/invite`, `/open`, and `/friend` as Android App
Links. Before building and deploying the website, set `ANDROID_SHA256_CERT_FINGERPRINTS` to the
SHA-256 fingerprint of the certificate that signs the distributed APK. Android verifies it
using `https://splitease.lambrk.com/.well-known/assetlinks.json`. The website provides an
**Open SplitEase** button when the link opens in a browser.

## Publishing an app update (no Google Play)

Releases can also be published from the dashboard (App releases). The app downloads whatever
address the release holds and installs it, so that address must be a direct link to the APK file.
The Appverse page is a web page, fine for "Get the app" buttons but not as an update address.

The app checks the backend for a newer version, and offers to download and install it.

1. Bump `versionCode` (and `versionName`) in the app's `build.gradle.kts`, build a **release APK
   signed with the same key as the installed app** (Android refuses updates signed differently).
2. Save it as `public/downloads/splitease.apk` and deploy this site.
3. In the backend folder, publish it in the database (this computes the checksum too):

   ```bash
   npm run app-version -- --code 2 --name 1.1 --min 1 \
     --url https://splitease.lambrk.com/downloads/splitease.apk \
     --apk /path/to/splitease.apk --notes "Faster balances\nBug fixes"
   ```

Phones with an older version then show an "Update available" dialog (checked when the app opens,
at most every 30 minutes). Use a higher `--min` to force an update: those phones
get a dialog they cannot dismiss. The app refuses an APK whose checksum does not match, or that is
not SplitEase at the announced version.
