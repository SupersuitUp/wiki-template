---
title: "Graphic Style"
slug: /reference/graphic-style
description: "The visual register for every illustration on this wiki, and the one sanctioned command that produces them."
---

# Graphic Style

*The visual register for every illustration on this wiki, and the one sanctioned command that produces them.*

---

> **TEMPLATE NOTE.** Replace the register paragraph below with this wiki's own, then
> delete this note. Everything else on the page is true of every wiki forked from this
> template and should be left alone.

## The register

CUSTOMIZE: one paragraph describing this wiki's visual register, then a sentence naming what it is not.

The register sentence of record lives in `wiki.config.json` under `hero_register.register`, and the reasoning behind it lives in `illustrations/SPEC.md` at the repo root. Those two are the source of truth. This page is the reader-facing summary and defers to them.

**The register sentence is the only thing that reaches the model.** The door assembles each prompt from `hero_register.register`, not from `SPEC.md`. A one-line register therefore leaves the palette, the line vocabulary, and the rejected poles unstated at render time. Write the sentence long enough to carry all three, and keep it in agreement with `SPEC.md`.

Two rules every wiki's register carries:

- **No named living or recent illustrators, ever.** Describe the tradition instead. Moderation blocks the names, and the wrapper refuses them before spending anything.
- **No power-armor, arc-reactor, or HUD-visor vocabulary.** That is the SupersuitUp family's retired neo-comic look, deprecated in 2026-07 and now an explicit rejected pole. Prompting it renders the wrong wiki.

## Heroes are multipanel

An article hero is a strip of beats, defaulting to three panels in a horizontal row separated by cream gutters with no drawn borders. Each panel is one beat of the same argument, with one consistent world and cast across all of them. Beat two shows the consequence of beat one; a middle panel that only restates beat one is a single plate with extra steps.

Write the scene as beats. A scene handed to the generator as one paragraph renders as one plate whatever the layout instruction says, which is why the pipeline checks the returned image and refuses a plate.

A single plate is the exception, reached for deliberately with `--single`, and used only when the idea genuinely is one image.

## How to generate one

The wrapper at `illustrations/scripts/render-hero.sh` is the only sanctioned interface. It applies the register, enforces the panel law, passes every blessed style reference, refuses banned vocabulary before spending anything, converts to WebP, and writes the provenance recipe next to the shipped asset.

```bash
./illustrations/scripts/render-hero.sh --dry-run --title "<TITLE>" <slug> "<beat one>. <beat two>. <beat three>."
./illustrations/scripts/render-hero.sh --title "<TITLE>" <slug> "<beat one>. <beat two>. <beat three>."
```

Dry-run first. It assembles and prints the full prompt and calls nothing, so a register you dislike costs zero images instead of one.

Everything the pipeline needs is vendored inside this repo. It does not reach into any private skills folder on any one machine, and it must stay that way. `grep -rln "\.agents/skills" illustrations/` should return nothing.

Calling `illustrations/scripts/generate.py` directly skips every one of those protections: drifted register, PNGs in `static/` at roughly ten times the size, provenance in the wrong place, and nothing checking that a strip arrived. Do not.

## Style references

Two to four blessed non-character images in `illustrations/refs/` lock the look, and the wrapper passes all of them on every later render. Render them with `--single --no-text`, since a style reference is not a hero. Move the approved PNGs into `illustrations/refs/`, list them in `hero_register.refs`, and delete the `.webp` and `.recipe.json` the wrapper wrote into `static/img/illustrations/` for them: a style reference is not a page asset and leaving it there ships a stray image.

**Default to style-only, with no recurring character.** The master-first character workflow in `SPEC.md` is correct and hard-won, and it is also the most drift-prone part of the system. Opt into it deliberately or not at all.

## Embedding rules

- Output is always `.webp`. A `.png` path in a page means someone bypassed the wrapper. Check with `grep -r "/img/illustrations/[a-zA-Z0-9_-]*\.png" docs/`.
- The frontmatter `image:` field and the body `![...](...)` embed point at the same file, so the page's social-share card is its own hero.
- Alt text is the verbatim generation prompt. It makes the image reproducible and serves as the accessibility text at the same time.

## Further Reading

- `illustrations/SPEC.md` at the repo root: the full spec, including the opt-in character workflow.
- [Voice Rules](/reference/voice-rules): the writing counterpart to this page.
