import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('./android-invite-runtime.js', import.meta.url), 'utf8');
// Fixed public campaign labels, recognised by Play Console. No per-user referrer or SDK.
const playUrl = 'https://play.google.com/store/apps/details?id=com.michikusatravel.shinkansenwindow&utm_source=shinkansen_window_web&utm_medium=android_browser_inline&utm_campaign=android_app_invite';
const css = `.android-invite{display:none;max-width:860px;margin:20px auto;padding:16px;border:1px solid var(--line,rgba(18,35,52,.14));border-radius:12px;background:var(--paper,#f6f2e9);color:var(--ink,#122334);font:inherit;text-align:left;box-sizing:border-box;grid-template-columns:48px minmax(0,1fr) auto;gap:12px;align-items:center}.android-invite-eligible .android-invite,.android-invite.android-invite-reserved{display:grid}.android-invite:not(.android-invite-reserved){visibility:hidden}.android-invite-eligible .android-invite{visibility:visible}.android-invite-icon{display:block;width:48px;height:48px;border-radius:10px}.android-invite-copy{min-width:0}.android-invite strong{font-size:1rem;line-height:1.6}.android-invite p{margin:4px 0 0;font-size:.875rem;line-height:1.7}.android-invite-actions{display:flex;align-items:center;flex-wrap:wrap;gap:8px}.android-invite a{position:relative;display:block;width:176px;min-height:68.12px;text-decoration:none}.android-invite-badge{display:block;width:176px;height:auto;visibility:hidden}.android-invite-play-fallback{position:absolute;inset:12px 10px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:var(--ink,#122334);color:var(--paper,#f6f2e9);font-size:.875rem}.android-invite-badge-loaded .android-invite-badge{visibility:visible}.android-invite-badge-loaded .android-invite-play-fallback{display:none}.android-invite button{min-height:44px;width:64px;display:inline-flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 4px;font:inherit;font-size:.8125rem;border-radius:6px;box-sizing:border-box;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer}.android-invite button small{font-size:.6875rem;line-height:1.5}.android-invite a:focus-visible,.android-invite button:focus-visible{outline:3px solid #bf4d31;outline-offset:3px}@media(max-width:900px){.android-invite{margin:20px 18px;grid-template-columns:48px minmax(0,1fr)}.android-invite-actions{grid-column:1/-1;justify-content:space-between}}@media print{.android-invite{display:none!important}}`;

export function withAndroidInvite(html, lang) {
  const head = `<!-- ANDROID_INVITE_HEAD_START -->\n<style>${css}</style>\n<script>${runtime}</script>\n<!-- ANDROID_INVITE_HEAD_END -->`;
  const en = lang === 'en';
  const card = `<!-- ANDROID_INVITE_BODY_START -->
  <aside class="android-invite hide-in-app" aria-label="${en ? 'Android app' : 'Androidアプリ'}">
    <img class="android-invite-icon" data-invite-src="${en && !html.includes('<base') ? '../' : ''}images/android/app-icon-192.webp" width="48" height="48" alt="" decoding="async" fetchpriority="low">
    <div class="android-invite-copy">
    <strong>${en ? 'Audio guide, screen off' : '画面を消して、車窓を楽しむ'}</strong>
    <p>${en ? 'The Android app keeps ride audio running with the screen off. Free, no sign-up.' : 'Androidアプリなら、乗車中は画面を消しても音声案内が続きます。無料・登録不要。'}</p>
    </div>
    <div class="android-invite-actions">
      <a href="${playUrl.replaceAll('&', '&amp;')}" aria-label="${en ? 'View on Google Play' : 'Google Playで見る'}"><img class="android-invite-badge" data-invite-src="${en && !html.includes('<base') ? '../' : ''}images/google-play/${en ? 'en' : 'ja'}-badge.png" width="646" height="250" alt="" decoding="async" fetchpriority="low"><span class="android-invite-play-fallback">${en ? 'Google Play' : 'Google Playで見る'}</span></a>
      <button type="button" aria-label="${en ? 'Dismiss app invitation for 30 days' : 'アプリの案内を閉じて、30日間表示しない'}"><span>${en ? 'Later' : '閉じる'}</span><small>${en ? '30 days' : '30日間'}</small></button>
    </div>
  </aside>
<!-- ANDROID_INVITE_BODY_END -->`;
  const headPattern = /<!-- ANDROID_INVITE_HEAD_START -->[\s\S]*?<!-- ANDROID_INVITE_HEAD_END -->/;
  html = headPattern.test(html) ? html.replace(headPattern, () => head) : html.replace('</head>', `${head}\n</head>`);
  const bodyPattern = /[ \t]*<!-- ANDROID_INVITE_BODY_START -->[\s\S]*?<!-- ANDROID_INVITE_BODY_END -->\r?\n?/;
  // Static placement before first paint, immediately after the existing hero.
  const heroPattern = /(<section\b[^>]*class="[^"]*\b(?:hero|guide-fuji-hero)\b[^"]*"[^>]*>[\s\S]*?<\/section>)\s*/;
  if (heroPattern.test(html)) {
    html = html.replace(bodyPattern, '');
    html = html.replace(heroPattern, (_, hero) => `${hero}\n${card}\n\n    `);
  } else {
    html = bodyPattern.test(html) ? html.replace(bodyPattern, match => card + (match.endsWith('\n') ? '\n' : '')) : html.replace('</main>', `</main>\n${card}`);
  }
  return html;
}
