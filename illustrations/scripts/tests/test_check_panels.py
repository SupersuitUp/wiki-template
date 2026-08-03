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
