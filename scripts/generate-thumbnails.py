from pathlib import Path
from PIL import Image, ImageOps


APP_DIR = Path(__file__).resolve().parents[1]
IMAGE_DIR = APP_DIR / "images"
THUMB_DIR = IMAGE_DIR / "thumbs"
MAX_WIDTH = 960
QUALITY = 72
SOURCE_EXTENSIONS = {".jpg", ".jpeg", ".png"}


def thumbnail_path(source: Path) -> Path:
    return THUMB_DIR / f"{source.stem}.webp"


def resize_size(width: int, height: int) -> tuple[int, int]:
    if width <= MAX_WIDTH:
        return width, height
    next_height = round(height * (MAX_WIDTH / width))
    return MAX_WIDTH, next_height


def generate_thumbnail(source: Path) -> tuple[int, int]:
    target = thumbnail_path(source)
    before = source.stat().st_size

    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail(resize_size(*image.size), Image.Resampling.LANCZOS)
        if image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
        if image.mode == "RGBA":
            background = Image.new("RGB", image.size, (255, 255, 255))
            background.paste(image, mask=image.getchannel("A"))
            image = background
        image.save(target, "WEBP", quality=QUALITY, method=6)

    after = target.stat().st_size
    return before, after


def main() -> None:
    THUMB_DIR.mkdir(parents=True, exist_ok=True)
    sources = sorted(
        path for path in IMAGE_DIR.iterdir()
        if path.is_file() and path.suffix.lower() in SOURCE_EXTENSIONS
    )

    total_before = 0
    total_after = 0
    for source in sources:
        before, after = generate_thumbnail(source)
        total_before += before
        total_after += after
        saved = before - after
        print(f"{source.name}: {before // 1024} KiB -> {after // 1024} KiB ({saved // 1024} KiB saved)")

    print(
        f"Generated {len(sources)} thumbnails: "
        f"{total_before / 1024 / 1024:.1f} MiB -> {total_after / 1024 / 1024:.1f} MiB"
    )


if __name__ == "__main__":
    main()
