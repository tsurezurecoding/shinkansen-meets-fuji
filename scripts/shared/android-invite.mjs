import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('./android-invite-runtime.js', import.meta.url), 'utf8');
// Fixed public campaign labels, recognised by Play Console. No per-user referrer or SDK.
const playUrl = 'https://play.google.com/store/apps/details?id=com.michikusatravel.shinkansenwindow&utm_source=shinkansen_window_web&utm_medium=android_browser_inline&utm_campaign=android_app_invite';
const css = `.android-invite{display:none;max-width:860px;margin:24px auto;padding:18px 20px;border:1px solid var(--line,rgba(18,35,52,.14));border-radius:12px;background:var(--paper,#f6f2e9);color:var(--ink,#122334);font:inherit;text-align:left;box-sizing:border-box}.android-invite-eligible .android-invite,.android-invite.android-invite-reserved{display:block}.android-invite:not(.android-invite-reserved){visibility:hidden}.android-invite-eligible .android-invite{visibility:visible}.android-invite strong{font-size:1rem;line-height:1.6}.android-invite p{margin:6px 0 12px;font-size:.875rem;line-height:1.7}.android-invite-actions{display:flex;align-items:center;flex-wrap:wrap;gap:12px}.android-invite a,.android-invite button{min-height:44px;display:inline-flex;align-items:center;justify-content:center;padding:8px 12px;font:inherit;font-size:.875rem;border-radius:6px;box-sizing:border-box}.android-invite a{background:var(--ink,#122334);color:var(--paper,#f6f2e9);text-decoration:none}.android-invite button{border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer}.android-invite a:focus-visible,.android-invite button:focus-visible{outline:3px solid #bf4d31;outline-offset:3px}@media(max-width:900px){.android-invite{margin:24px 18px}}@media print{.android-invite{display:none!important}}`;

export function withAndroidInvite(html, lang) {
  const head = `<!-- ANDROID_INVITE_HEAD_START -->\n<style>${css}</style>\n<script>${runtime}</script>\n<!-- ANDROID_INVITE_HEAD_END -->`;
  const en = lang === 'en';
  const card = `<!-- ANDROID_INVITE_BODY_START -->
  <aside class="android-invite hide-in-app" aria-label="${en ? 'Android app' : 'Androidアプリ'}">
    <strong>${en ? 'Audio guide, screen off' : '画面を消して、車窓を楽しむ'}</strong>
    <p>${en ? 'The Android app keeps ride audio running with the screen off. Free, no sign-up.' : 'Androidアプリなら、乗車中は画面を消しても音声案内が続きます。無料・登録不要。'}</p>
    <div class="android-invite-actions">
      <a href="${playUrl.replaceAll('&', '&amp;')}">${en ? 'Google Play' : 'Google Playで見る'}</a>
      <button type="button" aria-label="${en ? 'Dismiss app invitation; do not show again' : 'アプリの案内を閉じて、今後表示しない'}">${en ? 'Dismiss' : '閉じる'}</button>
    </div>
  </aside>
<!-- ANDROID_INVITE_BODY_END -->`;
  for (const [part, block] of [['HEAD', head], ['BODY', card]]) {
    const pattern = new RegExp(`<!-- ANDROID_INVITE_${part}_START -->[\\s\\S]*?<!-- ANDROID_INVITE_${part}_END -->`);
    if (pattern.test(html)) html = html.replace(pattern, () => block);
    else html = part === 'HEAD' ? html.replace('</head>', `${block}\n</head>`) : html.replace('</main>', `</main>\n${block}`);
  }
  return html;
}
