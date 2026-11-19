import { assetVersion } from './asset-version.mjs';

function attribute(text) {
  return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

// srcdoc keeps the official embed URL in the article HTML. The small preview
// also works without JavaScript. Only its play link navigates to the player.
function youtubePreview(tag, src, id, showPoster) {
  if (tag.includes(' srcdoc=')) return tag;
  const target = new URL(src.replaceAll('&amp;', '&'));
  target.searchParams.set('autoplay', '1');
  target.searchParams.set('playsinline', '1');
  const preview = '<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="referrer" content="strict-origin-when-cross-origin">' +
    '<style>*{box-sizing:border-box}html,body,a{width:100%;height:100%;margin:0}a{position:relative;display:grid;place-items:center;background:#101d2c;color:white;text-decoration:none;font:20px system-ui}img{position:absolute;width:100%;height:100%;object-fit:cover}span{position:relative;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#102030cf}a:focus-visible span{outline:3px solid white;outline-offset:3px}</style>' +
    '<a aria-label="YouTubeで動画を再生" href="' + attribute(target.href) + '">' +
    (showPoster ? '<img src="https://i.ytimg.com/vi/' + id + '/mqdefault.jpg" loading="lazy" alt="">' : '') +
    '<span aria-hidden="true">▶</span></a></html>';
  return tag.slice(0, -1) + ' srcdoc="' + attribute(preview) + '">';
}

function postPreview(original, frame, quote) {
  const source = quote.match(/https:\/\/(?:x|twitter)\.com\/([\w]+)\/status\/\d+/i);
  if (!source) return original;
  return frame + '<a class="feature-post-open" href="' + source[0] + '" aria-label="@' + source[1] +
    'の投稿をXで表示">Xの投稿を表示</a><template>' + quote + '</template></div>';
}

export function withFeatureMedia(html, file) {
  if (file.includes('/') && !file.startsWith('stories/')) return html;
  const prefix = file.startsWith('stories/') ? '../' : '';
  html = html.replace(/(<div class="(?:hb-media-frame|wm-x|sd-media-frame sd-x-frame)" data-placeholder="[^"]*">)\s*(?:<template>)?\s*(<blockquote class="twitter-tweet"[\s\S]*?<\/blockquote>)\s*(?:<\/template>)?\s*<\/div>/g, postPreview);
  html = html.replace(/<iframe\b[^>]*?\bsrc="(https:\/\/www\.youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?[^"]*)?)"[^>]*>/g,
    (tag, src, id) => youtubePreview(tag, src, id, file !== 'sparkling-dreams.html'));
  // Keep the original poster and crop but let offscreen images use native lazy loading.
  html = html.replace(/<div class="wm-facade" style="--wm-thumb: url\('(https:\/\/i\.ytimg\.com\/vi\/[^']+)'\)">/g,
    '<div class="wm-facade"><img class="feature-video-poster" src="$1" loading="lazy" decoding="async" alt="">');
  if (!html.includes('class="feature-post-open"') && !html.includes(' srcdoc=')) return html;
  const script = '<script defer src="' + prefix + 'feature-media.js?v=' + assetVersion('feature-media.js') + '"></script>';
  if (!html.includes(prefix + 'feature-media.js?v=')) {
    const legacy = /<script src="(?:hanabi|window-moments)\.js\?v=[^"]+"><\/script>/;
    html = legacy.test(html) ? html.replace(legacy, script) : html.replace('</body>', script + '</body>');
  }
  if (html.includes('class="feature-post-open"') && !html.includes('feature-media.css?v=')) {
    html = html.replace('</head>', '<link rel="stylesheet" href="' + prefix + 'feature-media.css?v=' +
      assetVersion('feature-media.css') + '"></head>');
  }
  return html;
}
