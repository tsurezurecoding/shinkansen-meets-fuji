"""Build the 727 hero from Michikusa's existing window photographs.

Run manually with Pillow when the composition changes. Committed WebP files
are served directly; browsers do no compositing or colour filtering.
Centres and crop widths below are fractions of the original photograph.
"""
from pathlib import Path
from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parent.parent
# Clockwise variety of signs, with the large readable boards in the first row.
PHOTOS = [
    ("20260629_727_board_2_2x_michikusa.jpg", .50, .49, .65),
    ("20260629_727_board_1_4x_michikusa.jpg", .43, .45, .65),
    ("20260704_putiputi_sign_1_michikusa.jpg", .61, .61, .48),
    ("20260704_727_board_fuse_michikusa.jpg", .47, .43, .46),
    ("20260704_727_board_kuzuhara_1_michikusa.jpg", .43, .63, .32),
    ("20260704_727_board_miyashiro_a_michikusa.jpg", .59, .61, .36),
    ("20260704_727_board_osawa_michikusa.jpg", .77, .55, .35),
    ("20260803_727_board_torikaihachicho_michikusa.jpg", .55, .55, .40),
]

for name, columns, rows, cell in [
    ("wide", 4, 2, (360, 320)),
    ("mobile", 2, 4, (360, 360)),
]:
    canvas = Image.new("RGB", (columns * cell[0], rows * cell[1]))
    for i, (source, cx, cy, fraction) in enumerate(PHOTOS):
        with Image.open(ROOT / "images" / source) as original:
            image = ImageOps.exif_transpose(original).convert("RGB")
            width = round(image.width * fraction)
            height = min(image.height, round(width * cell[1] / cell[0]))
            left = max(0, min(image.width - width, round(image.width * cx - width / 2)))
            top = max(0, min(image.height - height, round(image.height * cy - height / 2)))
            tile = image.crop((left, top, left + width, top + height))
            tile = ImageOps.fit(tile, cell, Image.Resampling.LANCZOS)
            tile = ImageEnhance.Color(tile).enhance(.76)
            tile = ImageEnhance.Contrast(tile).enhance(1.06)
            canvas.paste(tile, ((i % columns) * cell[0], (i // columns) * cell[1]))
    target = ROOT / "images" / f"727-hero-{name}.webp"
    canvas.save(target, "WEBP", quality=72, method=6)
    print(f"{target.name}: {canvas.size}, {target.stat().st_size} bytes")
