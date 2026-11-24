# Join by QR — competitions & shared goals

Implementation plan for joining a competition ("reto") or a shared goal ("meta") by scanning a QR code **from inside the app**.
Each phase is self-contained and independently verifiable — pick up at the first `[ ]` in a fresh session.
Status: `[ ]` todo · `[~]` in progress · `[x]` done

## Context

Today an invite is a link (`/learn-hiragana/compete/CODE`, `/learn-hiragana/meta/CODE`) shared through `navigator.share`.
When the app is installed to the home screen this breaks:

- **iOS** never routes links into a home-screen web app — they always open in Safari, and Safari does **not** share storage with the installed app, so the invitee lands logged out in a different context.
- **Android** may capture in-scope links for an installed WebAPK, but it's inconsistent.

This can't be fixed from our side. Instead, the inviter shows a QR and the invitee scans it **with the in-app scanner**, which feeds the code into the existing join flow (`stashInviteCode` / `stashGoalCode` → `competeJoin` / `goalJoin`). That flow already handles login, expired / full competitions, etc. — **no backend changes**.

### Decisions

- **The QR encodes the full invite URL**, not just the code. Scanned with the in-app scanner → we extract the code. Scanned with the phone's native camera → it still opens the web link (same as today), so nothing regresses.
- **The scanner accepts** a competition URL, a goal URL, the GitHub Pages 404-redirect form (`/?/compete/CODE`) or a bare code. A goal QR scanned from the Competition screen (or vice versa) routes to the right join view; a bare code uses the screen it was scanned from.
- **Link / Copy / Share buttons stay** as a secondary option.
- **Libraries** (both small, no network at runtime):
  - [`uqr`](https://github.com/unjs/uqr) to render the QR as SVG on the share screens.
  - [`jsqr`](https://github.com/cozmo/jsQR) as the decoder fallback, **lazy-loaded** only when the scanner opens. Native `BarcodeDetector` is used when available (Chrome Android); iOS Safari doesn't ship it.
- **Scanner UI is a modal** (`QrScannerModal`), not a new `ViewName`, so no routing changes.
- **Photo fallback**: if live camera fails (denied, no `getUserMedia`), the modal offers "Tomar foto del QR" (`<input type="file" accept="image/*" capture="environment">`) and decodes the still image.

### Platform notes / risks

| Topic | Notes |
|---|---|
| Camera in iOS standalone PWA | `getUserMedia` works since iOS 13.4; requires HTTPS (GitHub Pages ✓). |
| iOS permission | Standalone PWAs may re-prompt for camera on each launch. Annoying, not blocking. |
| iOS `<video>` | Needs `playsInline` + `muted` + `autoPlay`, or it goes fullscreen / doesn't play. |
| Stream cleanup | Always stop all tracks on close/unmount, or the camera indicator stays on. |
| Testing | Needs a real phone with the app installed; desktop has no rear camera (photo fallback can be tested with a QR image). |

---

## Phase A — Invite parser `[x]`

- `src/qrInvite.ts`: `parseScannedInvite(text, fallbackKind)` → `{ kind: "compete" | "goal"; code } | null`.
  - URL with path ending in `compete/CODE` or `meta/CODE` (any origin, trailing slash ok).
  - 404-redirect form `?/compete/CODE`.
  - Bare alphanumeric code (4–32 chars) → `fallbackKind`.
  - Codes are lower-cased (DB codes are 8 hex chars).
- `inviteUrl(kind, code)` helper shared by both share views (replaces the two local copies).
- `src/qrInvite.test.ts` covering all of the above + garbage input.

**Done when:** `npm test` passes.

## Phase B — Show the QR on share screens `[x]`

- `src/components/InviteQr.tsx`: renders `uqr`'s SVG for a URL (white quiet zone, ~200px, `aria-label`).
- `CompetitionShareView` and `GoalShareView`: QR on top of the share card with the hint "Escanéalo desde かな道 → Competir/Metas → Escanear QR". Code, link, Share and Copy stay below.

**Done when:** both share screens show a QR that a phone camera reads as the invite URL.

## Phase C — In-app scanner `[x]`

- `src/components/QrScannerModal.tsx`:
  - Opens rear camera (`facingMode: "environment"`), `<video playsInline muted autoPlay>`.
  - Decode loop (~every 250 ms): `BarcodeDetector` if it supports `qr_code`, else draw frame to a canvas and run lazily-imported `jsqr`.
  - On a successful `parseScannedInvite` → stop camera, call `onResult(invite)`. Non-invite QR → inline hint "Ese QR no es una invitación de かな道", keep scanning.
  - Error states (no camera API, permission denied) → message + photo fallback button.
  - Stops tracks on close and unmount.
- `CompetitionHomeView` / `GoalHomeView`: "Escanear QR" button next to the code input, opens the modal.
- Wiring: `App.tsx` exposes `joinScannedInvite(invite)` (stash + setView for either kind), passed through the module views to both home views.

**Done when:** scanning a competition QR from Metas (and vice versa) lands on the right join screen; build + lint + tests pass.

### Verified so far (2026-11-24, desktop browser pane, no camera)

- `npm test` includes a round-trip test: a QR encoded with the same options as `InviteQr` decodes (jsQR) back to the invite.
- Scanner modal mounted in the dev server: camera blocked → "sin permiso" state + photo fallback; a photo of a **goal** QR opened from **Competir** returns `{ kind: "goal" }` via both `BarcodeDetector` and the jsQR path (detector removed); a non-invite QR shows the hint and keeps the modal open; close button unmounts it.
- Share and Competir home screens rendered with mock data: QR, hint and "Escanear QR" button look right.
- **Not verified yet:** live camera scanning, and the logged-in end-to-end path through `App.joinScannedInvite` → join view (needs OTP login) — covered by Phase D.

## Phase D — Device QA `[ ]`

- [ ] iPhone, app installed to home screen: scan competition QR → join; scan goal QR → join.
- [ ] iPhone: deny camera → photo fallback works.
- [ ] Android Chrome installed app: same as above (`BarcodeDetector` path).
- [ ] Logged-out user scans → join view asks to log in, invite survives OTP round-trip.
- [ ] Camera indicator turns off after closing the scanner.
