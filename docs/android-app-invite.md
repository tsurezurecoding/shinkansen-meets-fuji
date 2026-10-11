# Android invitation: release contract

Approved scope: Japanese/English TOP (`index.html`) and Fuji guide (`guide.html`),
base main 82a8f01365cc56df7c4e169e6112c12396dc2e1f (PR83 integrated). PR62 is untouched.
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

## GA-excluded one-time reset for testing

On an eligible Android browser, open one of these URLs:

- https://www.michikusa-travel.com/?ga=off&android_invite_reset=1
- https://www.michikusa-travel.com/en/?ga=off&android_invite_reset=1
- https://www.michikusa-travel.com/guide.html?ga=off&android_invite_reset=1
- https://www.michikusa-travel.com/en/guide.html?ga=off&android_invite_reset=1

This consumes `android_invite_reset=1` before the existing GA initializer and
removes only `mado-android-app-invite-v2`. The address retains `ga=off` and all
other query parameters, pathname and fragment. Subsequent reloads preserve a new
× dismissal. To test again, explicitly reopen the original reset URL.

This does not force display: PC/iPhone, WebView/native/PWA exclusions and positive
installed-app suppression still apply. Stamp, language and legacy invitation
storage are unchanged. Duplicate/invalid reset or ga values, missing `ga=off`,
and conflicting `ga_optout=0` cannot reset the invitation. If history replacement
fails, no dismissal is reset. If storage is unavailable, normal storage safety
still hides the invitation; the current valid test page stays excluded from GA.

Existing GA opt-out persists in this browser/origin after the reset parameter
has disappeared. Finish testing and open the corresponding page with `?ga=on`
(for example https://www.michikusa-travel.com/?ga=on) to clear that existing opt-out;
normal analytics then resumes. `ga_optout=0` remains the existing alternative.
Removing `ga=off` alone does not clear the stored opt-out. Storage failure may
prevent persistence, so use the explicit test URL on every page in that case.
The original GA behavior outside this valid reset path is unchanged.

Validation uses actual generated head scripts before the invitation runtime:
no GA script insertion, initial pageview/config, or invitation event on test URLs;
reload after ×, eligibility exclusions, storage/history failures, and original
persistent off/on behavior are covered. This does not claim actual GA receipt.
