"""The WebP sidecar must satisfy the preset's provenance gate, whose rules are mirrored here.

Gate rules (lib/cli/check-image-provenance.mjs): when `asset` is present its FILE NAME must
equal the file the sidecar sits beside; mode "derive" needs `derivedFrom` and `generator`;
every recipe needs a timestamp.
"""
import pathlib, sys, unittest
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
from write_webp_recipe import derive_recipe  # noqa: E402


class WebpRecipe(unittest.TestCase):
    def setUp(self):
        self.r = derive_recipe("moving-on", "static/img/illustrations", "2026-09-16T00:00:00+00:00")

    def test_asset_names_the_webp_it_sits_beside(self):
        # The defect: a copied PNG recipe claimed moving-on.png beside moving-on.webp.
        self.assertEqual(self.r["asset"].split("/")[-1], "moving-on.webp")

    def test_it_is_a_derive_that_names_its_source_and_transform(self):
        self.assertEqual(self.r["mode"], "derive")
        self.assertEqual(self.r["derivedFrom"], "illustrations/moving-on.png")
        self.assertTrue(self.r["generator"])

    def test_it_carries_a_timestamp(self):
        self.assertTrue(self.r["generatedAt"])


if __name__ == "__main__":
    unittest.main()
