#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow"]
# ///
"""Count the panels in a rendered hero.

A gutter is a full-height run of columns that is uniformly light. So: reduce the
image to one number per column (how much variation that column contains), mark the
flat-and-light columns, and count the interior runs of them. Panels = interior runs
plus one.

Outer margins are walked past, because a strip is normally drawn with breathing room
at both edges and counting those as gutters would report N+2 panels forever.

This exists because a layout law with nothing checking it is not a law. The template
shipped "Single focal scene per illustration" for weeks after that rule was reversed,
and nothing anywhere would have noticed a plate arriving where a strip was asked for.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image


def _column_profile(img):
    """(stddev, mean) per column, computed once from the pixel buffer.

    Done by hand rather than with one ImageStat call per column: that version made
    1536 crops for a normal hero and took about a second and a half. This is the
    same arithmetic in one pass.
    """
    w, h = img.size
    px = img.load()
    out = []
    for x in range(w):
        total = 0
        total_sq = 0
        for y in range(h):
            v = px[x, y]
            total += v
            total_sq += v * v
        mean = total / h
        var = max(0.0, total_sq / h - mean * mean)
        out.append((var ** 0.5, mean))
    return out


def count_panels(path, *, min_gutter_px: int = 8, flat_max: float = 6.0,
                 light_min: float = 200.0) -> int:
    img = Image.open(path).convert("L")
    profile = _column_profile(img)
    flags = [sd <= flat_max and mn >= light_min for sd, mn in profile]
    w = len(flags)

    # Walk in from both edges: leading and trailing gutter-ish columns are margins.
    start = 0
    while start < w and flags[start]:
        start += 1
    end = w - 1
    while end > start and flags[end]:
        end -= 1

    if start >= end:
        # The whole frame is flat and light. That is a blank canvas, not a strip.
        return 1

    runs, run = 0, 0
    for x in range(start, end + 1):
        if flags[x]:
            run += 1
        else:
            if run >= min_gutter_px:
                runs += 1
            run = 0
    if run >= min_gutter_px:
        runs += 1

    return runs + 1


def main() -> int:
    ap = argparse.ArgumentParser(description="Count panels in a rendered hero.")
    ap.add_argument("image")
    ap.add_argument("--expect", type=int, help="Exit 1 unless the count matches.")
    a = ap.parse_args()

    if not Path(a.image).exists():
        print(f"check_panels: no such file: {a.image}", file=sys.stderr)
        return 1

    n = count_panels(a.image)
    print(f"panels: {n}")
    if a.expect is not None and n != a.expect:
        print(
            f"check_panels: expected {a.expect} panels, found {n}.\n"
            f"  A hero is a STRIP OF BEATS. If this came back as one plate, the layout\n"
            f"  law did not reach the model, usually because the scene was written as one\n"
            f"  paragraph rather than as beats. Re-render; do not edit the image.",
            file=sys.stderr,
        )
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
