# Portal Update Report — 26 November 2026

## Firestore rules — PUBLISHED ✅
- Published 26 Nov 2026, 2:27:45 AM (Asia/Dhaka) via the Firebase Rules API.
- Project: `tactile-bolt-291ww`
- Database: `ai-studio-ulteriorengineer-61203b94-d1d2-48af-b1c3-77d0f5714b0b` (the `(default)` database was not touched)
- Ruleset: `projects/tactile-bolt-291ww/rulesets/40f87675-f39e-4b86-825d-057e6cabc8d0`
- Source: `firestore.rules` on `main` (988 lines) — includes the announcements
  collection, public email/semester + signed-in phone visibility, and the
  `config/recruitment` block.
- Effect: announcement posting, the bell panel, and saving the recruitment
  form link now have the permissions they need.

## Merged to main (25–26 Nov 2026)
- PR #8 — Download page platform cards + assetlinks.json (APK full-screen)
- PR #9 — Developer accounts hidden from Chair/Secretary in Manage Members
- PR #10 — Profile photos via Cloudinary (Firebase Storage needs Blaze)
- PR #11 — Announcements (bell panel + EmailJS) and public email/semester,
  phone visible to signed-in members only
- PR #12 — Announcement panel fits mobile screens
- PR #13 — Google Form link inside the application modal, editable by
  Chair / Secretary / Developer from Manage Members
- PR #14 — Dynamic UI pack: count-up stats, live workshop countdown,
  announcement ticker, pulsing bell badge, Leaderboard Top-3 podium,
  page transitions, hover motion (design layer only)

## Verified live
- Announcement panel renders full-width on mobile (PR #12).
- EmailJS test email delivered (service_yd7ngs4 / template_qgly69h).
- Cloudinary unsigned upload preset `ue-profile-photos` verified.

## Still to do
- Studio Pull + Deploy of PR #14 (Dynamic UI) — owner action.
- Post a test announcement to confirm the new rules end-to-end.
- Live profile photo upload test (Cloudinary) — not yet confirmed.
- Google account password was changed during recovery on 26 Nov 2026;
  the login saved in the vault is stale and should be re-saved.
