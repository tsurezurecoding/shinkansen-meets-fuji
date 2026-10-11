# Android invitation: release contract

Approved scope: Japanese/English TOP (`index.html`) and Fuji guide (`guide.html`),
latest main 969b62b1450827d98914473f8c42dc24b6b41352. PR62 is untouched.
The scoped floating invitation retains the approved app icon and official localized
Play badges. The canonical generator injects the same implementation into all four
pages. No other language or app page receives the invitation.

Only existing eligible Android browser UAs pass; PC, iPhone, WebView/in-app browsers,
standalone/PWA, native wrappers and `from=android-app` remain excluded. Unknown API
results (`not-detected`, `unsupported`, `error`) are eligible, per final approval.
Only a positive `play` + exact package match suppresses; no permanent install state
is saved. Detection waits up to 1500ms without flashing the card first. This is a soft
UI deadline: a later positive response from the current detection immediately
hides the card. Re-detection and page departure invalidate older responses. `[]` is not
proof of absence. Android association changes and Play release belong to the
separate Android task. Manifest association follows Web handoff commit
281866a74b2260fa7ec8351eebf40445fe6b372c; guides additionally link that manifest.

The new production key `mado-android-app-invite-v2` stores only `{v:2,dismissedAt}`
on explicit × dismissal. It derives a **14-day** expiry from that timestamp across
all four pages/tabs. First display and Play clicks do not suppress. Legacy PR62
seen/30-day/Play-click keys and the separate preview 30-day key are not imported.
Corrupt/unavailable storage hides the invitation; a failed dismissal write still
closes it in this page. No preview force/reset/expiry UI or query override ships.

Events: `android_app_invite_view`, `android_app_invite_dismiss`,
`android_app_invite_play_click`. Existing `MADO_ANALYTICS_DISABLED === false` and
`gtag` availability are required; this component loads no analytics SDK and changes
no consent policy. View fires once per document only after >=50% actual visible
intersection in a foreground tab; dismiss/click remain separate actions.
Parameters are bounded fixed values: entry_source, language, page_context, variant,
cta_id, and install_status. Unknown states retain their distinct API status and are
never called uninstalled. **Play click is not installation.** No URL/query/PII,
install success event, or permanent click suppression is added.

The card avoids visible existing controls, navigation and header; if no safe slot
exists it temporarily becomes invisible/inert. It responds to scrolling, visual
viewport changes and safe-area insets. Keyboard text input also hides/inerts it;
close returns focus and announces the 14-day duration through a polite status.
The close target is 44×44. Local badges have accessible link labels and fallback
text if loading fails. Browser tests use real static pages with Android UA on
Chromium, without production query hooks.

Validation commands: `npm ci`, `npm run build`, `npm run verify`, repeat build with
unchanged generated output; invitation tests are part of `npm test` and CI.
Native Android installed-app association on a real device and TalkBack/VoiceOver
are not claimed as verified by desktop emulation. Parent independent review is
required before merge; deployment uses the exact reviewed main SHA workflow.

Optional browser verification (Python Playwright + `/usr/bin/chromium`):
`python3 scripts/test-android-app-invite-browser.py`. It writes screenshots/results
under `/tmp/android-invite-production-evidence` and does not write source files.
External HTTPS is blocked in this test to keep existing outbound resources local;
first-party pages/assets and browser storage events are real HTTP requests.
