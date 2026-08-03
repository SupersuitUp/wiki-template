# Illustration scripts

One canonical script: **`render-hero.sh`**. It is the only sanctioned way to render an article hero for this wiki.

## Quick start

Dry-run first. It assembles and prints the whole prompt, calls nothing, and costs nothing:

```bash
./illustrations/scripts/render-hero.sh --dry-run \
  --title "THE PAGE TITLE" --labels "BEFORE|THE MOVE|AFTER" \
  <slug> "<beat one>. <beat two>. <beat three>."
```

When the prompt reads right, render:

```bash
./illustrations/scripts/render-hero.sh \
  --title "THE PAGE TITLE" --labels "BEFORE|THE MOVE|AFTER" \
  <slug> "<beat one>. <beat two>. <beat three>."
```

**The hero carries text.** `--title` is required (pass `--no-text` to opt out).
The title and the per-panel labels are spelled into the prompt verbatim, so a
reader who only looks at the picture gets the gist.

**Write the scene AS BEATS, not as one paragraph.** A hero is a strip of beats, and a
scene handed over as one paragraph renders as one plate whatever the layout instruction
says. That is the single most common failure here.

Flags: `--panels N` for a different beat count, `--single` for the one-plate exception,
`--dry-run` to see the prompt without spending.

## What you get: the five-artifact contract

| Artifact | Path |
|---|---|
| Deploy asset, what the MDX embeds | `static/img/illustrations/<slug>.webp` |
| Source archive, never deleted | `illustrations/<slug>.png` |
| Provenance, beside the SHIPPED asset | `static/img/illustrations/<slug>.webp.recipe.json` |
| Alt text, the verbatim prompt | printed for you to paste |
| Frontmatter `image:` | printed for you to paste |

Always embed `.webp` in MDX. Never `.png`. The static folder only carries WebPs.

The alt text must be the exact prompt you passed, verbatim. It is the prompt archive: a
future regeneration reads the alt text plus SPEC.md and reproduces the image. Do not
write a nicer description and do not paraphrase.

## Setup (one-time)

| Need | Install |
|---|---|
| `uv` | `curl -LsSf https://astral.sh/uv/install.sh \| sh` |
| `cwebp` | `brew install webp` |
| An OpenAI key | https://platform.openai.com/api-keys, then `export OPENAI_API_KEY='sk-...'` and add that line to `~/.zshrc` |

The key is yours and images are billed to your own account. It lives in your shell,
never in this repo. Python dependencies install themselves; `uv run` reads the PEP 723
block at the top of `generate.py`.

Then, to make the look yours:

1. Write one sentence into `hero_register.register` in `wiki.config.json`.
2. Render 2 to 4 style references and keep the ones you like in `illustrations/refs/`.
   Every blessed ref is passed on every subsequent render, which is what locks the look.
3. That is enough. Recurring characters are opt-in and most wikis should skip them; see
   `illustrations/SPEC.md`.

## The scripts

| Script | Job |
|---|---|
| `render-hero.sh` | The one door. Owns the register, the panel law and the no-text law. |
| `generate.py` | Vendored OpenAI adapter. Prompt in, PNG plus recipe out. Knows nothing about wikis. |
| `prompt_guards.py` | Standing guards, applied automatically. |
| `check_panels.py` | Counts panels in a render. The door runs it and refuses a plate. |
| `tests/` | Free. No API calls. Run them after any change. |

```bash
uv run illustrations/scripts/tests/test_check_panels.py
./illustrations/scripts/tests/test_render_hero.sh
```

## What the door does

- Reads `hero_register` from `wiki.config.json` and refuses if this wiki is on the `abu`
  engine instead.
- Pre-flight greps the scene for banned terms (named artists, photorealistic, 3D, anime)
  and refuses rather than rendering something the register forbids. Naming a living or
  recent illustrator is hard-blocked by OpenAI moderation, so describe the tradition.
- Assembles the prompt from four blocks: register, layout law, your beats, no-text law.
- Passes every blessed reference in `refs/`.
- Renders at 1536x1024, high quality, through the vendored generator.
- Converts to WebP at q=85 and copies provenance next to the shipped file.
- Runs `check_panels.py` and REFUSES a render that came back as a plate.

## Why one door

Per the [agentic-brand-os](https://www.appliedai.wiki/concepts/agentic-brand-os)
discipline: bundle the spec, the refs, the prompt template and the banned-term list into
a single callable that becomes the only way to generate corpus artifacts. Without that
bundling, each operator interprets the spec a little differently and the register drifts.

The register itself lives in `wiki.config.json`, not in strings inside this script. An
earlier version of this template asked you to keep `PREFIX` and `SUFFIX` here in sync
with prose in `SPEC.md`, which is two copies of one fact, and they drifted.

## Changing the visual register

Do not edit the script to change the look of a single render. Re-prompt the scene.

If the whole register is changing:

1. Edit `hero_register.register` in `wiki.config.json`.
2. Edit `illustrations/SPEC.md` so the reasoning matches.
3. Re-render the style references in `illustrations/refs/`.
4. Re-render every existing page hero. They drift if you only do the new ones.

That last step is real work, which is the point: changing the register should be
deliberate, not accidental.
