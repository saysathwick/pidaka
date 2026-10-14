#!/usr/bin/env python3
"""Regenerate every Pidaka logo asset from the official vector kit in brand/.

Reads the "Unfinished Tile" mark and lockup SVGs, then writes the web icons and
social image (client/public), the path data used by the React mark
(shared/brand-mark.ts), and the launcher icons and splash screens for both
Android projects.

    python3 script/brand-assets.py
"""

import json
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
KIT = ROOT / "brand/instagram-launch/svg"

CHARCOAL = "#252525"
CORAL = "#EF735B"
IVORY = "#FAF6ED"
PAGE = "#070709"


def path_by_id(svg, element_id):
    match = re.search(rf'<path id="{element_id}"[^>]* d="([^"]+)"', svg)
    if not match:
        raise SystemExit(f"{element_id} not found in the brand kit")
    return match.group(1)


MARK_SVG = (KIT / "pidaka-mark-light.svg").read_text()
LOCKUP_SVG = (KIT / "pidaka-lockup-light.svg").read_text()
TILE_D = path_by_id(MARK_SVG, "tile")
FRAGMENT_DS = [path_by_id(MARK_SVG, f"fragment-{i}") for i in (1, 2, 3)]
BURN_SVG = (KIT / "burn-anonymous-comment.svg").read_text()


def _tokens(d):
    return re.findall(r"[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?", d)


def _arc_points(x1, y1, rx, ry, phi, large, sweep, x2, y2, steps=48):
    phi = math.radians(phi)
    cos_p, sin_p = math.cos(phi), math.sin(phi)
    dx, dy = (x1 - x2) / 2, (y1 - y2) / 2
    x1p = cos_p * dx + sin_p * dy
    y1p = -sin_p * dx + cos_p * dy
    lam = (x1p ** 2) / (rx ** 2) + (y1p ** 2) / (ry ** 2)
    if lam > 1:
        rx, ry = rx * math.sqrt(lam), ry * math.sqrt(lam)
    num = rx ** 2 * ry ** 2 - rx ** 2 * y1p ** 2 - ry ** 2 * x1p ** 2
    den = rx ** 2 * y1p ** 2 + ry ** 2 * x1p ** 2
    coef = math.sqrt(max(0.0, num / den)) * (-1 if large == sweep else 1)
    cxp, cyp = coef * rx * y1p / ry, -coef * ry * x1p / rx
    cx = cos_p * cxp - sin_p * cyp + (x1 + x2) / 2
    cy = sin_p * cxp + cos_p * cyp + (y1 + y2) / 2

    def angle(ux, uy, vx, vy):
        return math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)

    t1 = angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
    dt = angle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
    if not sweep and dt > 0:
        dt -= 2 * math.pi
    elif sweep and dt < 0:
        dt += 2 * math.pi
    pts = []
    for i in range(1, steps + 1):
        t = t1 + dt * i / steps
        pts.append((
            cx + rx * math.cos(t) * cos_p - ry * math.sin(t) * sin_p,
            cy + rx * math.cos(t) * sin_p + ry * math.sin(t) * cos_p,
        ))
    return pts


def subpaths(d, steps=12):
    """Flatten an SVG path (M L V H Q A Z, absolute) into lists of points."""
    toks = _tokens(d)
    out, cur = [], []
    x = y = 0.0
    i = 0
    cmd = None
    while i < len(toks):
        if toks[i].isalpha():
            cmd = toks[i]
            i += 1
            if cmd in "Zz":
                if cur:
                    out.append(cur)
                cur = []
                continue
        nums = lambda n: [float(v) for v in toks[i:i + n]]
        if cmd == "M":
            x, y = nums(2)
            i += 2
            if cur:
                out.append(cur)
            cur = [(x, y)]
            cmd = "L"
        elif cmd == "L":
            x, y = nums(2)
            i += 2
            cur.append((x, y))
        elif cmd == "V":
            (y,) = nums(1)
            i += 1
            cur.append((x, y))
        elif cmd == "H":
            (x,) = nums(1)
            i += 1
            cur.append((x, y))
        elif cmd == "Q":
            cx, cy, nx, ny = nums(4)
            i += 4
            for s in range(1, steps + 1):
                t = s / steps
                cur.append((
                    (1 - t) ** 2 * x + 2 * (1 - t) * t * cx + t ** 2 * nx,
                    (1 - t) ** 2 * y + 2 * (1 - t) * t * cy + t ** 2 * ny,
                ))
            x, y = nx, ny
        elif cmd == "A":
            rx, ry, phi, large, sweep, nx, ny = nums(7)
            i += 7
            cur.extend(_arc_points(x, y, rx, ry, phi, int(large), int(sweep), nx, ny))
            x, y = nx, ny
        else:
            raise SystemExit(f"unsupported path command {cmd}")
    if cur:
        out.append(cur)
    return out


TILE = subpaths(TILE_D)[0]
FRAGMENTS = [subpaths(d)[0] for d in FRAGMENT_DS]
_ALL = TILE + [p for f in FRAGMENTS for p in f]
BOX = (
    min(p[0] for p in _ALL), min(p[1] for p in _ALL),
    max(p[0] for p in _ALL), max(p[1] for p in _ALL),
)


def _draw_mark(draw, cx, cy, width, tile_fill):
    scale = width / (BOX[2] - BOX[0])
    ox = cx - (BOX[0] + BOX[2]) / 2 * scale
    oy = cy - (BOX[1] + BOX[3]) / 2 * scale
    tx = lambda pts: [(ox + px * scale, oy + py * scale) for px, py in pts]
    draw.polygon(tx(TILE), fill=tile_fill)
    for frag in FRAGMENTS:
        draw.polygon(tx(frag), fill=CORAL)


def render(size, *, plate=None, plate_scale=1.0, mark=0.63, background=None, tile=IVORY, supersample=4):
    """Mark on a size×size canvas.

    plate: None, "circle" or "square" charcoal behind the mark, plate_scale of the canvas.
    mark: the mark's width as a share of the plate (or of the canvas when there is no plate).
    """
    big = size * supersample
    img = Image.new("RGBA", (big, big), background or (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    plate_px = big * plate_scale
    inset = (big - plate_px) / 2
    if plate == "circle":
        draw.ellipse([inset, inset, inset + plate_px, inset + plate_px], fill=CHARCOAL)
    elif plate == "square":
        draw.rectangle([inset, inset, inset + plate_px, inset + plate_px], fill=CHARCOAL)
    _draw_mark(draw, big / 2, big / 2, (plate_px if plate else big) * mark, tile)
    return img.resize((size, size), Image.LANCZOS)


def _lockup_wordmark():
    group = re.search(r'<g id="wordmark"[^>]*>(.*?)</g>', LOCKUP_SVG, re.S).group(1)
    tx, ty = map(float, re.search(r'translate\(([-\d.]+) ([-\d.]+)\)', LOCKUP_SVG).groups())
    stroke = float(re.search(r'stroke-width="([\d.]+)"', LOCKUP_SVG).group(1))
    lines = []
    for d in re.findall(r'd="([^"]+)"', group):
        for sub in subpaths(d):
            lines.append([(px + tx, py + ty) for px, py in sub])
    dots = [
        (float(cx) + tx, float(cy) + ty, float(r))
        for cx, cy, r in re.findall(r'<circle[^>]*cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"', LOCKUP_SVG)
    ]
    return lines, dots, stroke


def og_image():
    w, h, ss = 1200, 630, 3
    img = Image.new("RGBA", (w * ss, h * ss), CHARCOAL)
    draw = ImageDraw.Draw(img)
    lines, dots, stroke = _lockup_wordmark()
    view_w, view_h = map(float, re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', LOCKUP_SVG).groups())
    scale = 0.78 * h * ss / view_h
    ox = (w * ss - view_w * scale) / 2
    oy = (h * ss - view_h * scale) / 2
    t = lambda pts: [(ox + px * scale, oy + py * scale) for px, py in pts]
    tile_pts = t(TILE)
    draw.polygon(tile_pts, fill=IVORY)
    for frag in FRAGMENTS:
        draw.polygon(t(frag), fill=CORAL)
    for line in lines:
        draw.line(t(line), fill=IVORY, width=round(stroke * scale), joint="curve")
    for cx, cy, r in dots:
        (px, py), = t([(cx, cy)])
        draw.ellipse([px - r * scale, py - r * scale, px + r * scale, py + r * scale], fill=IVORY)
    return img.resize((w, h), Image.LANCZOS).convert("RGB")


def _centered(base, overlay):
    base.alpha_composite(overlay, ((base.width - overlay.width) // 2, (base.height - overlay.height) // 2))
    return base.convert("RGB")


def save(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, optimize=True)
    print("wrote", path.relative_to(ROOT))


def _fmt(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def profile_svg():
    """Charcoal disc with the ivory mark, matching the profile icon."""
    size = 640
    mark_w = size * 0.63
    scale = mark_w / (BOX[2] - BOX[0])
    ox = size / 2 - (BOX[0] + BOX[2]) / 2 * scale
    oy = size / 2 - (BOX[1] + BOX[3]) / 2 * scale
    frags = "".join(f'<path fill="{CORAL}" d="{d}"/>' for d in FRAGMENT_DS)
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">'
        f'<circle cx="{size / 2:g}" cy="{size / 2:g}" r="{size / 2:g}" fill="{CHARCOAL}"/>'
        f'<g transform="translate({_fmt(ox)} {_fmt(oy)}) scale({_fmt(scale)})">'
        f'<path fill="{IVORY}" d="{TILE_D}"/>{frags}</g></svg>\n'
    )


def web():
    pub = ROOT / "client/public"
    (pub / "favicon.svg").write_text(profile_svg())
    (pub / "logo.svg").write_text(profile_svg())
    print("wrote client/public/favicon.svg, client/public/logo.svg")

    save(render(32, plate="circle"), pub / "favicon.png")
    render(256, plate="circle").save(pub / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("wrote client/public/favicon.ico")
    save(render(180, plate="square"), pub / "apple-touch-icon.png")
    save(render(192, plate="circle"), pub / "icon-192.png")
    save(render(512, plate="circle"), pub / "icon-512.png")
    save(render(512, plate="square", mark=0.55), pub / "icon-maskable-512.png")
    save(render(512, plate="square"), pub / "logo.png")
    save(render(512, plate="circle"), pub / "logo-mark.png")
    save(og_image(), pub / "og.png")

    pad = 8
    view = f"{_fmt(BOX[0] - pad)} {_fmt(BOX[1] - pad)} {_fmt(BOX[2] - BOX[0] + 2 * pad)} {_fmt(BOX[3] - BOX[1] + 2 * pad)}"

    group = re.search(r'<g id="wordmark"[^>]*>(.*?)</g>', LOCKUP_SVG, re.S).group(1)
    word_ds = re.findall(r'd="([^"]+)"', group)
    stroke = float(re.search(r'stroke-width="([\d.]+)"', LOCKUP_SVG).group(1))
    dot = [float(v) for v in re.search(r'<circle[^>]*cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)"', LOCKUP_SVG).groups()]
    word_pts = [p for d in word_ds for sub in subpaths(d) for p in sub]
    wx0 = min(p[0] for p in word_pts) - stroke / 2
    wx1 = max(p[0] for p in word_pts) + stroke / 2
    wy0 = min(min(p[1] for p in word_pts), dot[1] - dot[2])
    wy1 = max(p[1] for p in word_pts)
    burn_outline, burn_face = re.findall(r'<path d="([^"]+)"', BURN_SVG)
    (ROOT / "shared/brand-mark.ts").write_text(
        "// Generated by script/brand-assets.py from brand/instagram-launch/svg. Re-run it after the kit changes.\n"
        "export const BRAND_MARK = "
        + json.dumps(
            {
                "viewBox": view,
                "charcoal": CHARCOAL,
                "coral": CORAL,
                "ivory": IVORY,
                "tilePath": TILE_D,
                "fragmentsPath": " ".join(FRAGMENT_DS),
                "wordmark": {
                    "viewBox": f"{_fmt(wx0)} {_fmt(wy0)} {_fmt(wx1 - wx0)} {_fmt(wy1 - wy0)}",
                    "strokeWidth": stroke,
                    "path": " ".join(" ".join(d.split()) for d in word_ds),
                    "dot": {"cx": dot[0], "cy": dot[1], "r": dot[2]},
                },
                "burn": {
                    "viewBox": re.search(r'viewBox="([^"]+)"', BURN_SVG).group(1),
                    "strokeWidth": float(re.search(r'stroke-width="([\d.]+)"', BURN_SVG).group(1)),
                    "outlinePath": burn_outline,
                    "facePath": burn_face,
                },
            },
            indent=2,
        )
        + " as const;\n"
    )
    print("wrote shared/brand-mark.ts")


LAUNCHER = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}


def android(project):
    res = ROOT / project / "app/src/main/res"
    if not res.exists():
        return
    for density, size in LAUNCHER.items():
        save(render(size, plate="circle", plate_scale=0.92), res / f"mipmap-{density}/ic_launcher.png")
        save(render(size, plate="circle", plate_scale=0.92), res / f"mipmap-{density}/ic_launcher_round.png")
        fg = res / f"mipmap-{density}/ic_launcher_foreground.png"
        fg_size = Image.open(fg).size[0] if fg.exists() else size * 2
        save(render(fg_size, mark=0.44), fg)
    (res / "values/ic_launcher_background.xml").write_text(
        '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n'
        f'    <color name="ic_launcher_background">{CHARCOAL}</color>\n</resources>\n'
    )
    for f in sorted(res.glob("drawable*/splash.png")):
        w, h = Image.open(f).size
        save(_centered(Image.new("RGBA", (w, h), PAGE), render(min(w, h), mark=0.3)), f)


if __name__ == "__main__":
    web()
    android("android")
    android("android-hearth")
