// Site-wide quality audit: the cross-page checks `npm run check` does not cover —
// sitemap/filesystem agreement, canonical + OGP + hreflang completeness, internal link and
// asset resolution, JSON-LD validity, alt text, data.js asset references, same-context CSS
// override layers, and English pages that leak to their Japanese counterparts.
//
// Deliberately NOT part of `npm run check`. This is a periodic sweep, not a release gate:
// it reasons about the site as a whole rather than about one changed file, and a few of its
// categories are judgement calls (an intentional canonical, a verification-token page) that
// would otherwise turn every release into a triage session. Run it when the structure of the
// site changes -- new language tree, new page family, a sitemap or routing rework.
//
// Read-only. Usage: npm run audit:site   (or: node scripts/audit-site.mjs [appRoot])
// Env: LIMIT=n caps how many findings print per category (default 12).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const ORIGIN = 'https://www.michikusa-travel.com';
const findings = [];
const add = (kind, file, detail) => findings.push({ kind, file, detail });

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return out; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const allFiles = walk(ROOT);
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const fileSet = new Set(allFiles.map(rel));
const htmlFiles = allFiles.filter((p) => p.endsWith('.html')).map(rel).sort();

// ---------- parse helpers ----------
const readSrc = (r) => fs.readFileSync(path.join(ROOT, r), 'utf8');
const headOf = (s) => (s.match(/<head[\s\S]*?<\/head>/i) || [''])[0];
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, 'i')) ||
            tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, 'i'));
  return m ? m[1] : null;
};
const tags = (s, name) => s.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];

function metaContent(head, kind, key) {
  for (const t of tags(head, 'meta')) {
    if ((attr(t, kind) || '').toLowerCase() === key.toLowerCase()) return attr(t, 'content');
  }
  return null;
}
function linkHref(head, relVal) {
  for (const t of tags(head, 'link')) {
    if ((attr(t, 'rel') || '').toLowerCase() === relVal) return attr(t, 'href');
  }
  return null;
}

// ---------- A. sitemap <-> filesystem ----------
const sitemapSrc = readSrc('sitemap.xml');
const locs = [...sitemapSrc.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
const locPaths = new Set();

function urlToFile(u) {
  if (!u.startsWith(ORIGIN)) return null;
  let p = u.slice(ORIGIN.length).replace(/^\//, '').split(/[?#]/)[0];
  if (p === '' || p.endsWith('/')) p += 'index.html';
  return p;
}

for (const loc of locs) {
  const f = urlToFile(loc);
  if (f === null) { add('sitemap-foreign-origin', 'sitemap.xml', loc); continue; }
  locPaths.add(f);
  if (!fileSet.has(f)) add('sitemap-404', 'sitemap.xml', `${loc} -> ${f} (no such file)`);
}
const dupLocs = locs.filter((l, i) => locs.indexOf(l) !== i);
for (const d of new Set(dupLocs)) add('sitemap-duplicate', 'sitemap.xml', d);

// ---------- per-page head audit + link graph ----------
const EXCLUDE_FROM_SITEMAP = /^(google[0-9a-f]+\.html|naver[0-9a-f]+\.html|v0\/|v1\/|vendor\/|prototype\/)/;
const pageInfo = new Map();

for (const f of htmlFiles) {
  const src = readSrc(f);
  const head = headOf(src);
  if (!head) { add('no-head', f, 'no <head> block found'); continue; }

  const base = (() => {
    const t = tags(head, 'base')[0];
    return t ? attr(t, 'href') : null;
  })();
  const info = {
    base,
    canonical: linkHref(head, 'canonical'),
    title: (src.match(/<title>([\s\S]*?)<\/title>/i) || [, null])[1],
    description: metaContent(head, 'name', 'description'),
    ogImage: metaContent(head, 'property', 'og:image'),
    ogUrl: metaContent(head, 'property', 'og:url'),
    robots: metaContent(head, 'name', 'robots'),
    lang: (src.match(/<html[^>]*\blang\s*=\s*"([^"]*)"/i) || [, null])[1],
    hreflang: [...head.matchAll(/<link[^>]*rel\s*=\s*"alternate"[^>]*>/gi)].map((m) => ({
      lang: attr(m[0], 'hreflang'), href: attr(m[0], 'href'),
    })).filter((h) => h.lang),
  };
  pageInfo.set(f, info);

  const noindex = /noindex/i.test(info.robots || '');

  if (!info.title || !info.title.trim()) add('meta-missing-title', f, '');
  if (!info.description) add('meta-missing-description', f, '');
  if (!info.lang) add('meta-missing-html-lang', f, '');
  if (!noindex) {
    if (!info.canonical) add('meta-missing-canonical', f, '');
    if (!info.ogImage) add('meta-missing-og-image', f, '');
  }

  // canonical must point at this file
  if (info.canonical) {
    const cf = urlToFile(info.canonical);
    if (cf === null) add('canonical-foreign-origin', f, info.canonical);
    else if (cf !== f) add('canonical-mismatch', f, `canonical=${info.canonical} -> ${cf}`);
  }
  if (info.ogUrl && info.canonical && info.ogUrl !== info.canonical) {
    add('og-url-canonical-disagree', f, `og:url=${info.ogUrl} canonical=${info.canonical}`);
  }

  // og:image must resolve to a real asset
  if (info.ogImage) {
    const of_ = urlToFile(info.ogImage);
    if (of_ && !fileSet.has(of_)) add('og-image-404', f, `${info.ogImage} -> ${of_}`);
  }

  // hreflang targets must resolve
  for (const h of info.hreflang) {
    if (!h.href) continue;
    const hf = urlToFile(h.href);
    if (hf && !fileSet.has(hf)) add('hreflang-404', f, `${h.lang}: ${h.href} -> ${hf}`);
  }

  // sitemap coverage
  if (!noindex && !EXCLUDE_FROM_SITEMAP.test(f)) {
    const canonicalSelf = info.canonical ? urlToFile(info.canonical) : f;
    if (!locPaths.has(f) && !(canonicalSelf && locPaths.has(canonicalSelf))) {
      add('sitemap-missing', f, 'indexable page absent from sitemap.xml');
    }
  }

  // ---- internal link/asset resolution ----
  const dirOf = path.posix.dirname(f);
  const baseDir = info.base
    ? path.posix.normalize(path.posix.join(dirOf, info.base))
    : dirOf;

  const refs = [];
  for (const t of [...tags(src, 'a'), ...tags(src, 'link')]) {
    const h = attr(t, 'href');
    if (h) refs.push({ url: h, kind: 'href', tag: t });
  }
  for (const t of [...tags(src, 'script'), ...tags(src, 'img'), ...tags(src, 'source'), ...tags(src, 'video'), ...tags(src, 'iframe')]) {
    const s = attr(t, 'src');
    if (s) refs.push({ url: s, kind: 'src', tag: t });
  }

  info.linksTo = [];
  for (const r of refs) {
    const u = r.url.trim();
    if (!u || /^(https?:|mailto:|tel:|data:|javascript:|#|\/\/)/i.test(u)) continue;
    const clean = u.split(/[?#]/)[0];
    if (!clean || clean.includes('${') || clean.includes('{{')) continue; // JS/template placeholders
    let target;
    if (clean.startsWith('/')) target = clean.slice(1);
    else target = path.posix.normalize(path.posix.join(baseDir, clean));
    if (target.startsWith('..')) { add('link-escapes-root', f, u); continue; }
    let resolved = target.replace(/^\.\//, '');
    if (resolved === '.' || resolved === '') resolved = 'index.html';
    if (resolved.endsWith('/')) resolved += 'index.html';
    if (!fileSet.has(resolved)) {
      // a bare directory reference?
      if (fileSet.has(resolved + '/index.html')) continue;
      add(r.kind === 'src' ? 'asset-404' : 'link-404', f, `${u} -> ${resolved}`);
      continue;
    }
    if (r.kind === 'href' && resolved.endsWith('.html')) {
      info.linksTo.push({ url: u, target: resolved, liveKey: attr(r.tag, 'data-live-link') });
    }
  }

  // ---- <html lang> must agree with the language directory ----
  const dirLang = f.startsWith('en/') ? 'en'
    : f.startsWith('ar/') ? 'ar' : f.startsWith('fr/') ? 'fr' : f.startsWith('ko/') ? 'ko'
    : f.startsWith('zh-Hans/') ? 'zh' : f.startsWith('zh-Hant/') ? 'zh' : 'ja';
  if (info.lang && !info.lang.toLowerCase().startsWith(dirLang)) {
    add('lang-dir-mismatch', f, `<html lang="${info.lang}"> in ${dirLang}/ tree`);
  }

  // ---- images must carry alt text ----
  for (const t of tags(src, 'img')) {
    const a = attr(t, 'alt');
    if (a === null) add('img-missing-alt', f, (attr(t, 'src') || t).slice(0, 90));
  }

  // ---- JSON-LD validity ----
  const lds = [...src.matchAll(/<script[^>]*type\s*=\s*"application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  lds.forEach((m, i) => {
    try { JSON.parse(m[1]); }
    catch (e) { add('jsonld-parse-error', f, `block #${i + 1}: ${e.message}`); }
  });
}

// ---------- language leak on /en/ pages ----------
// app.js rewrites JA hrefs to their EN twin, but only on an EXACT literal href match
// against englishRoutes, and only on pages that actually load app.js. Anything else leaks.
const appJs = readSrc('app.js');
const routesBlock = (appJs.match(/const englishRoutes\s*=\s*\{([\s\S]*?)\n\s*\};/) || [, ''])[1];
const routeKeys = new Set([...routesBlock.matchAll(/"([^"]+)"\s*:/g)].map((m) => m[1]));

// live.js rewrites [data-live-link] hrefs from its own EN map at runtime.
const liveJs = fileSet.has('live/live.js') ? readSrc('live/live.js') : '';
const liveEnBlock = (liveJs.match(/var links = state\.lang === "en" \? \{([\s\S]*?)\n\s*\} : \{/) || [, ''])[1];
const liveKeys = new Set([...liveEnBlock.matchAll(/(\w+)\s*:/g)].map((m) => m[1]));

for (const [f, info] of pageInfo) {
  if (!f.startsWith('en/')) continue;
  const src = readSrc(f);
  const loadsAppJs = /<script[^>]+src\s*=\s*["'][^"']*\bapp\.js/i.test(src);
  for (const l of info.linksTo || []) {
    if (l.target.startsWith('en/')) continue;
    if (!fileSet.has('en/' + l.target)) continue;          // no English twin — nothing to leak to
    if (/[?&]lang=ja\b/.test(l.url)) continue;             // deliberate language switcher
    if (loadsAppJs && routeKeys.has(l.url)) continue;              // rewritten by app.js
    if (l.liveKey && liveKeys.has(l.liveKey)) {
      add('en-ja-link-js-only', f, `href="${l.url}" -> ${l.target} (fixed at runtime via data-live-link="${l.liveKey}"; static HTML ships the JA path)`);
      continue;
    }
    add('en-page-links-to-ja', f,
      `href="${l.url}" -> ${l.target} (twin exists; ${loadsAppJs ? 'not in englishRoutes' : 'page does not load app.js'})`);
  }
}

// ---------- hreflang reciprocity ----------
for (const [f, info] of pageInfo) {
  if (/noindex/i.test(info.robots || '')) continue;
  if (!info.hreflang.length) continue;
  const selfUrl = info.canonical;
  const declaresSelf = info.hreflang.some((h) => h.href === selfUrl);
  if (selfUrl && !declaresSelf) add('hreflang-no-self', f, `canonical ${selfUrl} not among alternates`);
  for (const h of info.hreflang) {
    if (h.lang === 'x-default') continue;
    const tf = urlToFile(h.href || '');
    if (!tf || !pageInfo.has(tf)) continue;
    const back = pageInfo.get(tf).hreflang;
    if (!back.length) { add('hreflang-not-reciprocal', f, `${tf} declares no alternates`); continue; }
    if (selfUrl && !back.some((b) => b.href === selfUrl)) {
      add('hreflang-not-reciprocal', f, `${tf} does not point back to ${selfUrl}`);
    }
  }
}

// ---------- CSS duplicate-selector append layers ----------
// Blank out comments while preserving byte offsets and line numbers, so a comment
// sitting just before an at-rule can't be swallowed into its prelude.
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
}
// Walk the stylesheet tracking at-rule nesting, so a rule inside @media is keyed
// by its context — otherwise legitimate responsive overrides look like append layers.
function cssBlocks(src) {
  const out = [];
  const stack = [];
  let i = 0, preludeStart = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === '{') {
      const prelude = src.slice(preludeStart, i).split('\n').map((s) => s.trim()).filter(Boolean).join(' ').trim();
      if (prelude.startsWith('@')) {
        stack.push(prelude);
        i++; preludeStart = i; continue;
      }
      // declaration block: find its matching close (no nesting expected in plain CSS)
      const end = src.indexOf('}', i);
      const body = src.slice(i + 1, end === -1 ? src.length : end);
      if (prelude) {
        const raw = src.slice(preludeStart, i);
        out.push({ sel: prelude, ctx: stack.join(' >> '), body, index: preludeStart + (raw.length - raw.trimStart().length) });
      }
      i = (end === -1 ? src.length : end + 1); preludeStart = i; continue;
    }
    if (ch === '}') { stack.pop(); i++; preludeStart = i; continue; }
    i++;
  }
  return out;
}
const normSel = (s) => s.split(',').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean).sort().join(', ');
for (const cssFile of ['style.css', 'spot-media-gallery.css']) {
  if (!fileSet.has(cssFile)) continue;
  const src = readSrc(cssFile);
  const lineAt = (i) => src.slice(0, i).split('\n').length;
  const seen = new Map();
  for (const b of cssBlocks(stripComments(src))) {
    const key = `${b.ctx}||${normSel(b.sel)}`;
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key).push(b);
  }
  for (const [key, list] of seen) {
    if (list.length < 2) continue;
    const sel = key.split('||')[1];
    const ctx = key.split('||')[0];
    // report only when the same property is redeclared in a later block (true override layer)
    const props = (body) => new Set([...body.matchAll(/(^|;)\s*([a-z-]+)\s*:/gi)].map((m) => m[2].toLowerCase()));
    for (let i = 1; i < list.length; i++) {
      const overlap = [...props(list[i].body)].filter((p) => props(list[i - 1].body).has(p));
      if (overlap.length) {
        add('css-override-layer', cssFile,
          `${ctx ? '[' + ctx.slice(0, 40) + '] ' : ''}"${sel.slice(0, 60)}" redeclares [${overlap.slice(0, 5).join(', ')}] at L${lineAt(list[i].index)} (earlier at L${lineAt(list[i - 1].index)})`);
      }
    }
  }
}

// ---------- data.js / spot-page-shared-data.js image references ----------
for (const dataFile of ['data.js', 'spot-page-shared-data.js']) {
  if (!fileSet.has(dataFile)) continue;
  const src = readSrc(dataFile);
  const paths = new Set(
    [...src.matchAll(/["'`]((?:\.\/)?(?:images|myphoto|spots)\/[^"'`\s)]+\.(?:png|jpg|jpeg|webp|avif|svg|mp4))["'`]/gi)]
      .map((m) => m[1].replace(/^\.\//, ''))
  );
  for (const p of paths) {
    if (!fileSet.has(p)) add('data-asset-404', dataFile, p);
  }
}

// ---------- report ----------
const byKind = new Map();
for (const f of findings) {
  if (!byKind.has(f.kind)) byKind.set(f.kind, []);
  byKind.get(f.kind).push(f);
}
console.log(`Audited ${htmlFiles.length} HTML pages, ${fileSet.size} files, ${locs.length} sitemap URLs.\n`);
const kinds = [...byKind.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [kind, list] of kinds) {
  console.log(`## ${kind} (${list.length})`);
  const limit = Number(process.env.LIMIT || 12);
  for (const f of list.slice(0, limit)) console.log(`  ${f.file}${f.detail ? ' :: ' + f.detail : ''}`);
  if (list.length > limit) console.log(`  ... +${list.length - limit} more`);
  console.log('');
}
if (!findings.length) console.log('No findings.');
