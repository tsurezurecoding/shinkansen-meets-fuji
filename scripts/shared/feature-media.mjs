import { assetVersion } from './asset-version.mjs';
import { xVideoRatio, xVideoThumbnail } from './x-video-thumbnails.mjs';

const mediaCopy = {
  ja: ['Xの動画を開く', 'Xで見る', 'YouTubeで動画を再生', '読み込み中…', '読み込めませんでした。もう一度お試しください。'],
  en: ['Open X video', 'Watch on X', 'Play YouTube video', 'Loading…', 'Could not load the video. Try again.'],
  'zh-Hant': ['開啟 X 影片', '在 X 上觀看', '播放 YouTube 影片', '載入中…', '無法載入影片，請再試一次。'],
  'zh-Hans': ['打开 X 视频', '在 X 上观看', '播放 YouTube 视频', '正在加载…', '无法加载视频，请重试。'],
  fr: ['Ouvrir la vidéo X', 'Voir sur X', 'Lire la vidéo YouTube', 'Chargement…', 'Impossible de charger la vidéo. Réessayez.'],
  de: ['X-Video öffnen', 'Auf X ansehen', 'YouTube-Video abspielen', 'Wird geladen…', 'Das Video konnte nicht geladen werden. Bitte erneut versuchen.'],
  es: ['Abrir el vídeo de X', 'Ver en X', 'Reproducir el vídeo de YouTube', 'Cargando…', 'No se pudo cargar el vídeo. Inténtalo de nuevo.'],
  it: ['Apri il video di X', 'Guarda su X', 'Riproduci il video di YouTube', 'Caricamento…', 'Impossibile caricare il video. Riprova.'],
  ko: ['X 동영상 열기', 'X에서 보기', 'YouTube 동영상 재생', '불러오는 중…', '동영상을 불러오지 못했습니다. 다시 시도해 주세요.'],
  th: ['เปิดวิดีโอบน X', 'ดูบน X', 'เล่นวิดีโอ YouTube', 'กำลังโหลด…', 'โหลดวิดีโอไม่ได้ โปรดลองอีกครั้ง'],
};

function attribute(text) {
  return text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function youtubeThumbnail(id) {
  return '<img class="feature-video-poster" src="https://i.ytimg.com/vi/' + id +
    '/mqdefault.jpg" width="320" height="180" loading="lazy" decoding="async" alt="">';
}

// srcdoc keeps the official embed URL in the article HTML. The small preview
// also works without JavaScript. Only its play link navigates to the player.
function youtubePreview(tag, lang, label) {
  const source = tag.match(/\bsrc="(https:\/\/www\.youtube-nocookie\.com\/embed\/([\w-]{11})(?:\?[^"]*)?)"/);
  if (!source) return tag;
  const [, src, id] = source;
  tag = tag.replace(/\s+srcdoc="[^"]*"/, '');
  const target = new URL(src.replaceAll('&amp;', '&'));
  target.searchParams.set('autoplay', '1');
  target.searchParams.set('playsinline', '1');
  const preview = '<!doctype html><html lang="' + lang + '"><meta charset="utf-8"><meta name="referrer" content="strict-origin-when-cross-origin">' +
    '<style>*{box-sizing:border-box}html,body,a{width:100%;height:100%;margin:0}a{position:relative;display:grid;place-items:center;background:#101d2c;color:white;text-decoration:none;font:20px system-ui}img{position:absolute;width:100%;height:100%;object-fit:cover}span{position:relative;display:grid;place-items:center;width:48px;height:48px;border-radius:50%;background:#102030cf}a:focus-visible span{outline:3px solid white;outline-offset:3px}</style>' +
    '<a aria-label="' + attribute(label) + '" href="' + attribute(target.href) + '">' +
    '<img src="https://i.ytimg.com/vi/' + id + '/mqdefault.jpg" loading="lazy" alt="">' +
    '<span aria-hidden="true">▶</span></a></html>';
  return tag.slice(0, -1) + ' srcdoc="' + attribute(preview) + '">';
}

function postPreview(original, frame, quote) {
  // The attribution at the end of an official blockquote identifies its own post.
  const source = [...quote.matchAll(/https:\/\/(?:x|twitter)\.com\/(\w+)\/status\/\d+/gi)].at(-1);
  if (!source) return original;
  const thumbnail = xVideoThumbnail(source[0]);
  const ratio = xVideoRatio(source[0]);
  if (ratio && !/\bdata-media-max-width=/.test(quote)) {
    quote = quote.replace('<blockquote ', '<blockquote data-media-max-width="560" ');
  }
  const poster = thumbnail ? '<img class="feature-video-poster" src="' + attribute(thumbnail) +
    '" loading="lazy" decoding="async" alt="">' : '';
  const openFrame = ratio ? frame.slice(0, -1) + ' data-feature-x-video style="--feature-clip-ratio: ' + ratio + ';">' : frame;
  return openFrame + '<a class="feature-post-open" href="' + source[0] + '" aria-label="X">' +
    poster + '<span>X</span></a><template>' + quote + '</template></div>';
}

export function withFeatureMedia(html, file) {
  const parts = file.split('/');
  const lang = Object.hasOwn(mediaCopy, parts[0]) ? parts[0] : 'ja';
  const route = lang === 'ja' ? file : parts.slice(1).join('/');
  if (route.includes('/') && !route.startsWith('stories/')) return html;
  const prefix = /<base\s+href="\.\.\//.test(html) ? '' : '../'.repeat(parts.length - 1);
  const [openX, watchX, youtube, loading, failure] = mediaCopy[lang];
  html = html.replace(/(<div class="(?:hb-media-frame|wm-x|sd-media-frame sd-x-frame)" data-placeholder="[^"]*">)\s*(?:<template>)?\s*(<blockquote class="twitter-tweet"[\s\S]*?<\/blockquote>)\s*(?:<\/template>)?\s*<\/div>/g, postPreview);
  html = html.replace(/(<a class="feature-post-open" href="([^"]+)" aria-label=")[^"]*(">\s*(?:<img\b[^>]*>)?\s*<span>)[^<]*(<\/span>)/g,
    (_, head, href, image, tail) => {
      const label = xVideoRatio(href) ? openX : watchX;
      const author = new URL(href).pathname.split('/')[1];
      return head + attribute(label + ' (@' + author + ')') + image + attribute(label) + tail;
    });
  html = html.replace(/<iframe\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/g, tag => youtubePreview(tag, lang, youtube));
  html = html.replace(/(data-video-id="([a-zA-Z0-9_-]{11})"[^>]*>\s*<div class="hb-media-frame"[^>]*>\s*<button\b[^>]*\bclass="hb-facade"[^>]*>)(?!<img\b)/g,
    (_, button, id) => button + youtubeThumbnail(id));
  // Keep the original poster and crop but let offscreen images use native lazy loading.
  html = html.replace(/<div class="wm-facade" style="--wm-thumb: url\('(https:\/\/i\.ytimg\.com\/vi\/[^']+)'\)">/g,
    '<div class="wm-facade"><img class="feature-video-poster" src="$1" loading="lazy" decoding="async" alt="">');
  if (!/class="(?:feature-post-open|hb-facade|wm-facade)"|\bsrcdoc=/.test(html)) return html;
  const runtime = /<script\b[^>]*\bsrc="(?:\.\.\/)*(?:feature-media|hanabi|window-moments)\.js\?v=[^"]+"[^>]*><\/script>/;
  const script = '<script defer src="' + prefix + 'feature-media.js?v=' + assetVersion('feature-media.js') + '"></script>';
  html = runtime.test(html) ? html.replace(runtime, script) : html.replace('</body>', script + '</body>');
  const styles = /<link rel="stylesheet" href="(?:\.\.\/)*feature-media\.css\?v=[^"]+">/;
  const css = '<link rel="stylesheet" href="' + prefix + 'feature-media.css?v=' + assetVersion('feature-media.css') + '">';
  html = styles.test(html) ? html.replace(styles, css) : html.replace('</head>', css + '</head>');
  const config = '<script type="application/json" id="mado-feature-media-copy">' +
    JSON.stringify({loading, failure, youtube}) + '</script>';
  const prior = /<script type="application\/json" id="mado-feature-media-copy">[^<]*<\/script>/;
  html = prior.test(html) ? html.replace(prior, config) : html.replace(script, config + script);
  return html;
}
