import fs from 'node:fs';

const runtime = fs.readFileSync(new URL('./android-invite-runtime.js', import.meta.url), 'utf8');
// Fixed public campaign labels, recognised by Play Console. No per-user referrer or SDK.
const playUrl = 'https://play.google.com/store/apps/details?id=com.michikusatravel.shinkansenwindow&utm_source=shinkansen_window_web&utm_medium=android_browser_inline&utm_campaign=android_app_invite';
const css = `.android-invite{display:none;position:relative;max-width:700px;margin:16px auto;padding:12px 48px 12px 16px;border:1px solid #d7e5ef;border-radius:14px;background:linear-gradient(120deg,#fff 0%,#f0f7fc 100%);box-shadow:0 5px 18px rgba(21,55,82,.09);color:#193c52;font:inherit;text-align:left;box-sizing:border-box;grid-template-columns:40px minmax(0,1fr) 160px;gap:8px 12px;align-items:center}.android-invite-eligible .android-invite,.android-invite.android-invite-reserved{display:grid}.android-invite:not(.android-invite-reserved){visibility:hidden}.android-invite-eligible .android-invite{visibility:visible}.android-invite-icon{display:block;width:40px;height:40px;border-radius:9px}.android-invite-copy{min-width:0}.android-invite-label{display:block;color:#42647c;font-size:.6875rem;line-height:1.5;letter-spacing:.04em}.android-invite strong{display:block;margin-top:3px;font-size:.9375rem;line-height:1.5;font-weight:600}.android-invite p{margin:4px 0 0;font-size:.8125rem;line-height:1.6;color:#36586e}.android-invite-actions{display:flex;align-items:center}.android-invite a{position:relative;display:block;width:160px;min-height:61.92px;text-decoration:none}.android-invite-badge{display:block;width:160px;height:auto;visibility:hidden}.android-invite-play-fallback{position:absolute;inset:9px 8px;display:flex;align-items:center;justify-content:center;border-radius:6px;background:#193c52;color:#fff;font-size:.8125rem}.android-invite-badge-loaded .android-invite-badge{visibility:visible}.android-invite-badge-loaded .android-invite-play-fallback{display:none}.android-invite button{position:absolute;top:2px;right:2px;width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;margin:0;padding:0;border:0;border-radius:50%;background:transparent;color:#526f83;font:inherit;font-size:1.375rem;line-height:1;cursor:pointer}.android-invite button:hover{background:#e5f0f8}.android-invite a:focus-visible,.android-invite button:focus-visible{outline:3px solid #27678e;outline-offset:2px}@media(max-width:700px){.android-invite{margin:16px 18px;padding:12px 16px;grid-template-columns:40px minmax(0,1fr);align-items:start}.android-invite-icon{margin-top:8px}.android-invite-label,.android-invite strong{padding-right:24px}.android-invite-actions{grid-column:2}}@media print{.android-invite{display:none!important}}`;

export function withAndroidInvite(html, lang) {
  const head = `<!-- ANDROID_INVITE_HEAD_START -->\n<style>${css}</style>\n<script>${runtime}</script>\n<!-- ANDROID_INVITE_HEAD_END -->`;
  const en = lang === 'en';
  const card = `<!-- ANDROID_INVITE_BODY_START -->
  <aside class="android-invite hide-in-app" aria-label="${en ? 'Android app' : 'Androidアプリ'}">
    <button type="button" aria-label="${en ? 'Dismiss app invitation for 30 days' : 'アプリの案内を閉じて、30日間表示しない'}" title="${en ? 'Hide for 30 days' : '30日間表示しない'}"><span aria-hidden="true">×</span></button>
    <img class="android-invite-icon" data-invite-src="${en && !html.includes('<base') ? '../' : ''}images/android/app-icon-192.webp" width="40" height="40" alt="" decoding="async" fetchpriority="low">
    <div class="android-invite-copy">
    <span class="android-invite-label">${en ? 'A note for Android' : 'Androidアプリのご案内'}</span>
    <strong>${en ? 'Screen off. Listen on.' : '画面を消して、車窓へ'}</strong>
    <p>${en ? 'Ride audio keeps going with the screen off. <span style="white-space:nowrap">Free, no sign-up.</span>' : '乗車中は画面を消しても音声案内。<span style="white-space:nowrap">無料・登録不要。</span>'}</p>
    </div>
    <div class="android-invite-actions">
      <a href="${playUrl.replaceAll('&', '&amp;')}" aria-label="${en ? 'View on Google Play' : 'Google Playで見る'}"><img class="android-invite-badge" data-invite-src="${en && !html.includes('<base') ? '../' : ''}images/google-play/${en ? 'en' : 'ja'}-badge.png" width="646" height="250" alt="" decoding="async" fetchpriority="low"><span class="android-invite-play-fallback">${en ? 'Google Play' : 'Google Playで見る'}</span></a>

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
