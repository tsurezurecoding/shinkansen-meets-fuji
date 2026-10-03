// 城の関連記事カードの共通正本。個別ページから城特集へ渡す。
export const CASTLE_COLLECTION = {
      route: "castles.html", title: ["ほかにもある、", "新幹線から見える城"],
      description: "小田原城や掛川城も、車窓から。天守5城・櫓1か所と城跡2か所を、写真・席側・見つける目印つきで紹介します。",
      label: "新幹線から見える城を探す", note: "清洲城を含む8か所。",
      photos: [
        { src: "images/thumbs/20260820_odawara_castle_michikusa.webp", alt: "車窓から見える小田原城", caption: "小田原城" },
        { src: "images/thumbs/20260712_kakegawa_castle_michikusa.webp", alt: "車窓から見える掛川城", caption: "掛川城" }
      ],
      credit: "写真：新幹線の窓"
    };
export function castleCollectionFor(lang, photos = CASTLE_COLLECTION.photos) {
  if (lang === "ja") return { ...CASTLE_COLLECTION, photos, description: "東海道・山陽新幹線から見える城を、写真・席側・見つける目印つきで紹介します。", note: "新幹線から見える城を一覧で。" };
  const captions = ["Odawara Castle", "Kakegawa Castle", "Kiyosu Castle"];
  const sources = [...CASTLE_COLLECTION.photos.map(p => p.src), "images/thumbs/20260704_kiyosu_castle_michikusa.webp"];
  return { route: "en/castles.html", title: ["More castles", "from the Shinkansen"], description: "Discover castles along the Tokaido and Sanyo Shinkansen, with photos, seat sides and landmarks to look for.", label: "Explore the castle guide", note: "Keep an eye out for your next castle.", photos: photos.map(p => { const caption = captions[sources.indexOf(p.src)]; if (!caption) throw Error("Unknown castle collection photo"); return {...p, caption, alt: caption + " from the train"}; }), credit: "Photos: Shinkansen Window" };
}
