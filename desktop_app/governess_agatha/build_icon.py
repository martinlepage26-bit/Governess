from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
PNG_PATH = ASSETS / "governess_agatha_icon.png"
ICO_PATH = ASSETS / "governess_agatha_icon.ico"
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"


def load_font(size: int) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype(FONT_PATH, size=size)
    except OSError:
        return ImageFont.load_default()


def main() -> None:
    size = 1024
    image = Image.new("RGBA", (size, size), "#10233f")
    draw = ImageDraw.Draw(image)

    for offset, color in [
        (0, "#0f2340"),
        (50, "#17325a"),
        (110, "#25467c"),
        (180, "#44669a"),
    ]:
        draw.rounded_rectangle(
            (offset, offset, size - offset, size - offset),
            radius=220,
            fill=color,
        )

    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse((140, 170, 884, 824), fill=(212, 226, 255, 64))
    glow = glow.filter(ImageFilter.GaussianBlur(40))
    image.alpha_composite(glow)

    diamond = [(512, 150), (842, 480), (512, 810), (182, 480)]
    draw.polygon(diamond, fill=(236, 244, 255, 38), outline="#d1dcf0")
    draw.line(diamond + [diamond[0]], fill="#d8b16a", width=18, joint="curve")

    draw.ellipse((250, 360, 774, 602), fill="#eef5ff", outline="#d1dcf0", width=10)
    draw.ellipse((360, 398, 664, 566), fill="#6c8cc2")
    draw.ellipse((438, 430, 586, 536), fill="#132746")
    draw.ellipse((480, 446, 544, 510), fill="#0b1526")
    draw.ellipse((452, 424, 486, 458), fill=(255, 255, 255, 180))
    draw.arc((250, 356, 774, 606), start=205, end=335, fill="#8ea7cf", width=10)
    draw.arc((250, 356, 774, 606), start=25, end=155, fill="#8ea7cf", width=10)

    draw.rounded_rectangle((322, 704, 702, 830), radius=60, fill=(10, 18, 34, 110))
    font = load_font(128)
    draw.text((512, 765), "GA", anchor="mm", font=font, fill="#f4efe6")

    image.save(PNG_PATH)
    image.save(ICO_PATH, sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])


if __name__ == "__main__":
    main()
