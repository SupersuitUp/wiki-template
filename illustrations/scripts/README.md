# Illustration scripts

One canonical script: **`render-page.sh`**. It is the only sanctioned way to render an illustration for this wiki.

## Quick start

From the repo root:

```bash
./illustrations/scripts/render-page.sh "<output-filename>" "<scene description>"
```

The wrapper writes two files:

- `illustrations/<filename>.png` — the source archive (PNG, native chatgpt-images output)
- `static/img/illustrations/<filename>.webp` — the deploy asset (auto-converted at q=85, ~90% smaller than PNG)

Embed the WebP path in the MDX page after the italic def and before the `---` divider:

```mdx
![Literal scene description.](/img/illustrations/<filename>.webp)
```

Always embed `.webp` paths in MDX. Never embed `.png`. The static folder only carries WebPs.

## Setup (one-time)

Install `cwebp` once: `brew install webp`. Without it, the wrapper falls back to copying the PNG into static, which still works but ships ~10x larger assets to Vercel.

If you have not yet generated the canonical references for your wiki:

1. Customize `illustrations/SPEC.md` for this wiki's visual identity (lineage, character, palette, banned vocabulary).
2. Customize the `PREFIX` and `SUFFIX` strings in `render-page.sh` to match.
3. Render `refs/character-sheet.png` if your wiki has a recurring character. Render `refs/style-swatch.png` to lock the visual register on a non-character scene. Both should be in `illustrations/refs/`.
4. Once locked, those references get passed on every subsequent render (the wrapper auto-detects `refs/character-sheet.{webp,png}`).

## What the script does

- Reads the locked palette, character, register, and banned vocabulary from `illustrations/SPEC.md`.
- Pre-flight greps the scene description for banned terms (named artists, photorealistic, 3D, anime, etc.) and refuses to render if any are present.
- Wraps the scene in the canonical prompt PREFIX and SUFFIX (which must track SPEC.md verbatim).
- Passes `illustrations/refs/character-sheet.{webp,png}` as the visual identity anchor for the recurring character, if one exists.
- Calls `chatgpt-images` (gpt-image-2) at 1536x1024, high quality.
- Converts the PNG output to WebP at q=85 and writes it to `static/img/illustrations/`. Requires `cwebp`; falls back to copying the PNG if missing.

## Why one script

Per the [design-systems-for-ai-generated-visuals](https://www.appliedai.wiki/concepts/design-systems-for-ai-generated-visuals) discipline: bundle the spec, refs, prompt template, and banned-term list into a single callable that becomes the only way to generate corpus artifacts. Without this bundling, each operator interprets the spec a little differently, and the visual register drifts.

## Changing the visual register

Do not edit this script to change the look of a single render. Re-prompt the scene instead.

If the entire visual register is changing (new palette, new character, new lineage), do all of:

1. Edit `illustrations/SPEC.md` to reflect the new register.
2. Regenerate `illustrations/refs/character-sheet.webp` (or `.png`) and `illustrations/refs/style-swatch.webp`.
3. Update the `PREFIX` and `SUFFIX` strings in this script to match the new SPEC.
4. Re-render every existing page hero. They will drift if you only do new ones.

That last step is real work, which is the point: locking the register in this many places means changing it is deliberate, not accidental.
