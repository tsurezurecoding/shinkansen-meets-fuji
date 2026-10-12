"""Cut the self-hosted font subsets used by window-film.html / en/window-film.html.

The film is set in Shippori Mincho B1 (500, 700) and DotGothic16 (400), both SIL OFL 1.1.
Only the glyphs the film and its page can show are kept: the copy in window-film.js, the
generated cast in window-film-data.js, both generated pages, and printable ASCII.

This is a maintenance step, not part of `npm run build`. Rerun it when
scripts/generate-window-film-page.mjs warns that glyphs fall back to system fonts.

Requires: pip install fonttools brotli
Fonts:    https://github.com/google/fonts/tree/main/ofl/shipporiminchob1
          https://github.com/google/fonts/tree/main/ofl/dotgothic16
Usage:    python3 scripts/subset-window-film-fonts.py <ShipporiMinchoB1-Medium.ttf> <ShipporiMinchoB1-Bold.ttf> <DotGothic16-Regular.ttf>
"""
import os
import sys

from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "fonts", "window-film")
SOURCES = ["window-film.js", "window-film-data.js", "window-film.html", os.path.join("en", "window-film.html")]


def glyphs():
    text = "".join(chr(c) for c in range(0x20, 0x7F))
    text += "　、。，．・：；？！ー―–—‐…〜~（）「」『』【】→←↑↓⇄½×／％＋＆＃＠"
    for name in SOURCES:
        with open(os.path.join(ROOT, name), encoding="utf-8") as f:
            text += f.read()
    return "".join(sorted({ch for ch in text if ch >= " " and not ("\ud800" <= ch <= "\udfff")}))


def cut(src, dest, text):
    options = subset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_languages = ["*"]
    options.notdef_outline = True
    options.hinting = False
    font = subset.load_font(src, options)
    subsetter = subset.Subsetter(options)
    subsetter.populate(text=text)
    subsetter.subset(font)
    subset.save_font(font, dest, options)
    print(f"{os.path.relpath(dest, ROOT)}: {os.path.getsize(dest)} bytes")


def main(argv):
    if len(argv) != 4:
        sys.exit(__doc__)
    os.makedirs(OUT, exist_ok=True)
    text = glyphs()
    cut(argv[1], os.path.join(OUT, "wf-mincho-500.woff2"), text)
    cut(argv[2], os.path.join(OUT, "wf-mincho-700.woff2"), text)
    cut(argv[3], os.path.join(OUT, "wf-dot-400.woff2"), text)
    with open(os.path.join(OUT, "glyphs.txt"), "w", encoding="utf-8") as f:
        f.write(text + "\n")
    print(f"{len(text)} glyphs")


if __name__ == "__main__":
    main(sys.argv)
