// Only the two available editions receive this entry. Other language snapshots
// remove data-edition-only before applying their existing dictionaries.
export function omamoriStoryCard(lang='en',root='../') {
  const ja=lang==='ja';
  return `<a class="everyday-story-card" href="omamori.html" data-edition-only="${lang}" data-cta-track="everyday_related_click" data-cta-id="omamori"><span class="everyday-story-photo"><img src="${root}images/omamori/omamori-various.jpg" alt="" width="640" height="480" loading="lazy" decoding="async"></span><span class="everyday-story-copy"><small>A WISH TO CARRY</small><strong>${ja?'お守りって、なんだろう':'Omamori: a wish to carry'}</strong><span>${ja?'小さな袋の意味、文字の読み方、旅の後の扱い。':'Meet Japan’s small charms, read their words and learn how to carry one.'}</span><b>${ja?'記事を読む':'Read the story'} <span aria-hidden="true">→</span></b></span></a>`;
}
export function omamoriPhotoCredit(lang='en') {
  return `<p class="everyday-related-credits" data-edition-only="${lang}">${lang==='ja'?'お守りの写真':'Omamori photograph'}: <a href="https://commons.wikimedia.org/wiki/File:Variousomamori.jpg">Leongboy1</a> · Public domain. ${lang==='ja'?'日本と米国の神社の授与品、2008年撮影。':'Items from shrines in Japan and the United States, photographed in 2008.'}</p>`;
}
export function omamoriEverydaySection() {
  return `<section class="everyday-section" id="small-wishes" aria-labelledby="small-wishes-title" data-edition-only="en"><p class="eyebrow">03 · SMALL WISHES</p><h2 id="small-wishes-title">A small thing, a personal wish.</h2><p class="everyday-section-lead">At a shrine or temple, look a little closer at the colorful pouches.</p><div class="everyday-grid country-grid"><a class="journey-intent-card journey-intent-cloudy everyday-card" href="omamori.html" data-article="omamori"><img src="../images/omamori/omamori-various.jpg" alt="Colorful omamori pouches with different inscriptions" width="960" height="640" loading="lazy" decoding="async"><span class="journey-intent-copy"><small>A WISH TO CARRY</small><strong>Omamori: a wish to carry</strong><span>Meet Japan’s small charms, read their words and learn how to carry one.</span><b class="everyday-read">Read the story <span aria-hidden="true">→</span></b></span></a></div>${omamoriPhotoCredit()}</section>`;
}
