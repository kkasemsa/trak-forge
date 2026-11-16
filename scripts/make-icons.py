#!/usr/bin/env python3
"""App icon and launch image: a 4x4 step grid on charcoal with an amber pattern lit.
Writes icons/ and, if present, the iOS asset catalog images."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
BG = (23, 20, 15)
OFF = (58, 50, 38)
AMBER = (240, 164, 58)
LIT = {0, 3, 5, 6, 10, 12, 15}


def grid(size: int, span: float) -> Image.Image:
    """A square image of `size` px with the grid occupying `span` of its width."""
    im = Image.new("RGB", (size, size), BG)
    d = ImageDraw.Draw(im)
    area = size * span
    origin = (size - area) / 2
    cell = area / 4
    gap = cell * 0.16
    radius = cell * 0.2
    for i in range(16):
        x = origin + (i % 4) * cell + gap / 2
        y = origin + (i // 4) * cell + gap / 2
        d.rounded_rectangle([x, y, x + cell - gap, y + cell - gap], radius=radius, fill=AMBER if i in LIT else OFF)
    return im


def main() -> None:
    icons = ROOT / "icons"
    icons.mkdir(exist_ok=True)
    master = grid(1024, 0.64)
    master.resize((512, 512), Image.LANCZOS).save(icons / "icon-512.png")
    master.resize((180, 180), Image.LANCZOS).save(icons / "apple-touch-icon.png")
    assets = ROOT / "ios/App/App/Assets.xcassets"
    if assets.exists():
        master.save(assets / "AppIcon.appiconset/AppIcon-512@2x.png")
        splash = grid(2732, 0.16)
        for name in ("splash-2732x2732.png", "splash-2732x2732-1.png", "splash-2732x2732-2.png"):
            splash.save(assets / "Splash.imageset" / name)
    print("icons written")


if __name__ == "__main__":
    main()
