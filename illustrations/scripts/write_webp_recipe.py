#!/usr/bin/env python3
"""Write the provenance sidecar beside a hero's deploy WebP.

The WebP is a TRANSFORM of the PNG the model made, so its sidecar is a derive recipe that
names the PNG and the transform. The door used to copy the PNG's own recipe here, which
claims `<slug>.png` while sitting beside `<slug>.webp`, and the preset's provenance gate
refuses exactly that (a recipe naming a file it does not sit beside is how a copied recipe
is caught). Every hero this door rendered failed the build on it (found 2026-09-16 on
aphantasia.wiki).

usage: write_webp_recipe.py <slug> <outdir>
"""
import datetime
import json
import sys


def derive_recipe(slug: str, outdir: str, now: str) -> dict:
    return {
        "asset": f"{outdir}/{slug}.webp",
        "mode": "derive",
        "derivedFrom": f"illustrations/{slug}.png",
        "sourceRecipe": f"illustrations/{slug}.png.recipe.json",
        "generator": "cwebp -quiet -q 85",
        "generatedAt": now,
    }


if __name__ == "__main__":
    slug, outdir = sys.argv[1], sys.argv[2].rstrip("/")
    now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
    with open(f"{outdir}/{slug}.webp.recipe.json", "w") as f:
        json.dump(derive_recipe(slug, outdir, now), f, indent=2)
        f.write("\n")
