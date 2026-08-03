#!/usr/bin/env python3
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow"]
# ///
"""Panel counting is pure geometry, so it is testable with synthetic images and
costs nothing. The failure that matters is a single plate passing as a strip."""
import importlib.util, pathlib, tempfile, unittest
from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("cp", HERE.parent / "check_panels.py")
cp = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(cp)

CREAM = (255, 250, 236)


def strip(path, panels, w=1536, h=1024, gutter=40):
    """A synthetic strip: N dark blocks on cream, separated by cream gutters."""
    img = Image.new("RGB", (w, h), CREAM)
    d = ImageDraw.Draw(img)
    total_gutter = gutter * (panels - 1)
    pw = (w - total_gutter) // panels
    for i in range(panels):
        x0 = i * (pw + gutter)
        d.rectangle([x0, 0, x0 + pw, h], fill=(40, 40, 60))
    img.save(path)
    return path


def plate(path, w=1536, h=1024):
    """A single plate: one continuous image, no gutters."""
    img = Image.new("RGB", (w, h), CREAM)
    d = ImageDraw.Draw(img)
    d.rectangle([0, 0, w, h], fill=(40, 40, 60))
    img.save(path)
    return path


def margined_strip(path, panels, w=1536, h=1024, gutter=40, margin=60):
    """A strip drawn with breathing room at both edges. Counting the margins as
    gutters is the obvious bug, and it reports N+2 forever."""
    img = Image.new("RGB", (w, h), CREAM)
    d = ImageDraw.Draw(img)
    inner = w - 2 * margin
    pw = (inner - gutter * (panels - 1)) // panels
    for i in range(panels):
        x0 = margin + i * (pw + gutter)
        d.rectangle([x0, 0, x0 + pw, h], fill=(40, 40, 60))
    img.save(path)
    return path


def textured_strip(path, panels, w=1536, h=1024, gutter=40, noise=14, arrow=True):
    """The strip a real model actually returns.

    Two things the synthetic fixtures above do not have, both of which broke the
    first version of the detector on its very first real render (2026-08-03):

    1. PAPER TEXTURE. A genuine cream gutter measures stddev 9 to 18, not 0. The
       original flat_max of 6.0 was calibrated on texture-free rectangles and
       rejected every real gutter.
    2. GLYPHS IN THE GUTTER. The model likes to put a connecting arrow between
       beats, so a gutter column is not light over its FULL height.

    Both are why the detector counts LIGHT FRACTION per column instead of demanding
    uniformity.
    """
    import random
    rnd = random.Random(7)
    # A slightly darker cream than the flat fixtures use, so the grain below is not
    # clipped at 255. Clipped grain lands at stddev 6 and only just trips the old
    # threshold; unclipped it reaches 9 to 12, which is what a real render measures.
    img = Image.new("RGB", (w, h), (243, 238, 224))
    d = ImageDraw.Draw(img)
    pw = (w - gutter * (panels - 1)) // panels
    for i in range(panels):
        x0 = i * (pw + gutter)
        d.rectangle([x0, 0, x0 + pw, h], fill=(70, 65, 60))
    # Paper grain on EVERY pixel, including the gutters. Applying it to every other
    # pixel leaves half the column pristine and lands around stddev 5, which is below
    # the threshold that actually failed. The measured value on a real cream gutter is
    # 9 to 18, so the fixture has to reach that or it does not reproduce the bug.
    px = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            n = rnd.randint(-noise, noise)
            px[x, y] = (max(0, min(255, r + n)), max(0, min(255, g + n)), max(0, min(255, b + n)))
    if arrow:
        # A dark connecting arrow sitting in each gutter, mid-height.
        for i in range(panels - 1):
            cx = (i + 1) * pw + i * gutter + gutter // 2
            d.polygon([(cx - 14, h // 2 - 12), (cx + 14, h // 2), (cx - 14, h // 2 + 12)],
                      fill=(40, 40, 40))
    img.save(path)
    return path


class TestRealRenderShapes(unittest.TestCase):
    """Earned from the first real render. The detector refused a correct 3-beat
    strip, and looking at the image is what caught it rather than trusting the
    number."""

    def test_textured_gutters_still_count(self):
        with tempfile.TemporaryDirectory() as t:
            p = textured_strip(pathlib.Path(t) / "tex.png", 3, arrow=False)
            self.assertEqual(cp.count_panels(p), 3)

    def test_an_arrow_in_the_gutter_does_not_hide_it(self):
        with tempfile.TemporaryDirectory() as t:
            p = textured_strip(pathlib.Path(t) / "arrow.png", 3, arrow=True)
            self.assertEqual(cp.count_panels(p), 3)

    def test_textured_plate_is_still_one(self):
        with tempfile.TemporaryDirectory() as t:
            p = textured_strip(pathlib.Path(t) / "one.png", 1, arrow=False)
            self.assertEqual(cp.count_panels(p), 1)


class TestCountPanels(unittest.TestCase):
    def test_three_panel_strip_counts_three(self):
        with tempfile.TemporaryDirectory() as t:
            p = strip(pathlib.Path(t) / "a.png", 3)
            self.assertEqual(cp.count_panels(p), 3)

    def test_four_panel_strip_counts_four(self):
        with tempfile.TemporaryDirectory() as t:
            p = strip(pathlib.Path(t) / "b.png", 4)
            self.assertEqual(cp.count_panels(p), 4)

    def test_single_plate_counts_one(self):
        with tempfile.TemporaryDirectory() as t:
            p = plate(pathlib.Path(t) / "c.png")
            self.assertEqual(cp.count_panels(p), 1)

    def test_a_plate_does_not_pass_as_a_strip(self):
        """The regression this file exists for."""
        with tempfile.TemporaryDirectory() as t:
            p = plate(pathlib.Path(t) / "d.png")
            self.assertNotEqual(cp.count_panels(p), 3)

    def test_outer_margins_are_not_counted_as_gutters(self):
        with tempfile.TemporaryDirectory() as t:
            p = margined_strip(pathlib.Path(t) / "e.png", 3)
            self.assertEqual(cp.count_panels(p), 3)


if __name__ == "__main__":
    unittest.main(verbosity=2)
