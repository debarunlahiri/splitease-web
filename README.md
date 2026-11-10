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
| `/get-app` | Where visitors without the app land; offers the APK download once `NEXT_PUBLIC_APK_URL` is set |
| `/api/verify-email` | Server route that passes the token to the SplitEase backend |
| `/.well-known/assetlinks.json` | Android app-link verification (empty until fingerprints are set) |

## How the mobile redirect works

- **Android:** the page opens the app by itself and also shows an "Open SplitEase" button. It uses
  an Android intent link, which opens the app when it is installed and otherwise goes to
  `/get-app`, which offers the APK download. It tries once per visit,
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

## Opening the app

The Android app handles `splitease://join` and `splitease://open`. The `open` address was added
for this site, so rebuild the app after pulling that change.

The Android manifest registers `https://splitease.lambrk.com/invite`, `/open`, and `/friend` as Android App
Links. Before building and deploying the website, set `ANDROID_SHA256_CERT_FINGERPRINTS` to the
SHA-256 fingerprint of the certificate that signs the distributed APK. Android verifies it
using `https://splitease.lambrk.com/.well-known/assetlinks.json`. The website provides an
**Open SplitEase** button when the link opens in a browser.

## Publishing an app update (no Google Play)

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
