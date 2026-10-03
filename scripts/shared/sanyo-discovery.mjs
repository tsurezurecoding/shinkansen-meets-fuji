import { SANYO_CASTLES } from './sanyo-castles.mjs';
import { thumbnailSrc } from './geo.mjs';
const esc = text => String(text).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function sanyoGallery(lang) {
 const en=lang==='en', local=en?'en/':'';
 return `<!-- SANYO-GALLERY:START -->
    <section class="section" id="sanyo" aria-labelledby="sanyoTitle">
      <div class="section-head"><p class="eyebrow">MORE TO SEE</p><h2 id="sanyoTitle">${en?'Osaka–Hakata window views':'大阪〜博多間の車窓'}</h2></div>
      <div class="gallery sanyo-gallery">
${SANYO_CASTLES.map(castle=>`        <article class="gal-card sanyo-card">
          <div class="gal-media-wrap"><figure class="photo-figure"><a class="sanyo-card-link" href="${local}spots/${castle.id}.html"><img class="gal-photo" src="${thumbnailSrc(castle.photo)}" alt="${esc(castle.alt[lang])}" loading="lazy" decoding="async"></a><figcaption class="photo-credit">${en?'Photo: ':'写真：'}<a href="${esc(castle.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(castle.credit[lang])}</a></figcaption></figure></div>
          <a class="gal-body sanyo-card-link" href="${local}spots/${castle.id}.html"><div class="gal-top"><div class="gal-top-left"><span class="tl-icon" aria-hidden="true">🏯</span><span class="gal-name">${esc(castle.name[lang])}</span></div></div><p class="gal-area">${esc(castle.station[lang])}</p><div class="spot-card-footer"><div class="tl-meta gal-tags"><span class="badge gal-tag gal-tag-seat-${castle.side.toLowerCase()}">${en?'Seat '+castle.side:castle.side+'席'}</span><span class="badge gal-tag gal-tag-history">${en?'History':'歴史'}</span></div></div></a>
        </article>`).join('\n')}
      </div>
    </section>
<!-- SANYO-GALLERY:END -->`;
}
