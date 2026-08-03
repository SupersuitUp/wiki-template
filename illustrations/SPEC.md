# Illustration Spec (TEMPLATE)

The single canonical document for this wiki's visual identity. Every illustration generated for any page passes through this spec.

A future agent picking up an illustration job should be able to read this file plus the two canonical reference images in `refs/` and produce a coherent new page hero without any other context.

> **Discipline note.** Per [agentic-brand-os](https://www.appliedai.wiki/concepts/agentic-brand-os): "References carry the recurring anchors. The prompt carries the variable per-render content." Do not improvise the character, palette, or line vocabulary. Do not skip passing the canonical references on every render.

## Character creation workflow (LOCKED)

**Never generate a multi-pose model sheet in a single image.** When you ask for several poses in one generation, the model redraws the character slightly in every pose and the body composition drifts. Build every recurring character in this order instead:

1. **MASTER FIRST.** Generate ONE canonical hero pose only: a single figure, front view, standing calmly at rest, centered on a clean neutral ground, nothing else in the frame. Iterate until it is exactly right, then LOCK it as `refs/character-master.png`. This is the character's identity of record.
2. **DERIVE EVERY OTHER POSE FROM THE MASTER.** Generate each additional pose / state / expression as its OWN separate render, passing the locked MASTER as the FIRST `--input-image` on every one. One pose per generation, never many. This is what keeps the exact same body composition across all poses.
3. **Composite the sheet last.** Once the individual poses are locked and mutually consistent, assemble them into a multi-view `refs/character-sheet.png`. The sheet is both a presentation artifact and a rendering reminder (see below); the per-pose renders are the real references.

**On every scene render, pass BOTH `character-master` AND `character-sheet` as references** (the wrapper does this automatically whenever both files exist). The master locks the clean identity; the multi-view sheet gives the model many reminders of the body, arms, and proportions from several angles at once. Passing only a single portrait is how a character drifts — especially in a scene containing OTHER characters, where the model averages their proportions into it.

**For a character with a unified or non-humanoid body** (one solid form with no separate head/neck/torso; a mascot; an object-creature): state that explicitly in EVERY scene prompt ("its head and body are one single form", "not humanoid", limbs described literally as short/absent), AND pass that character's reference FIRST. A reference alone will not hold it — when humans share the frame, the model anthropomorphizes the non-human character (growing it a neck, a torso, longer arms) unless the prompt forbids it and its reference leads. Earned 2026-07-16: a blocky mascot kept sprouting a human head-on-torso beside two human characters until it was passed first and described as one box.

A pose that disagrees with the master is a defective render; regenerate it from the master rather than accepting the drift. Applies to every recurring character.

**When a defect survives repeated prompt rewrites, AUDIT THE REFERENCES — the references are teaching it.** No prompt language beats a reference image that literally depicts the defect. The fix order: (1) crop-zoom every reference being passed and find which one shows the defect; (2) regenerate that reference from the master in ISOLATION (plain ground, single figure) until it is right; (3) re-lock, THEN return to scene composites. Never iterate a character defect inside a complex scene — fix the reference first and the composites inherit it for free. Corollary: composite the multi-view sheet from the locked pose files (PIL/ImageMagick), never by generation — a generated sheet re-draws the character and can invent anatomy that then propagates into every render that passes the sheet.

> **TEMPLATE NOTE.** Everything below this line is a placeholder customized per wiki.
> Replace the placeholders with your wiki's actual visual identity, then delete this
> template note.
>
> The minimum to be productive is smaller than it looks: write one sentence into
> `hero_register.register` in `wiki.config.json`, put 2 to 4 blessed style images in
> `refs/`, and you are done. Everything about recurring characters is opt-in, and most
> wikis should skip it.

---

## Visual lineage (CUSTOMIZE)

Describe the visual register your wiki uses, in 2-4 sentences. Reference a recognizable tradition (e.g. "vintage 1960s-70s illustrated children's books", "mid-century editorial illustration", "woodcut prints", "neo-comic action-zine"). Avoid naming living or recent named artists in prompts: OpenAI's moderation hard-blocks them. Describe the register generically.

State explicitly what the register is NOT (e.g. "Not photorealistic. Not 3D. Not anime. Not Pixar. Not glossy digital art.").

## Recurring character (OPT-IN, off by default)

**The default visual identity is style-only: 2 to 4 blessed reference images in
`refs/`, all passed on every render, and no recurring person.** That is enough to lock
a look, and it skips the master-first character workflow, which is the most
failure-prone part of this system and the step most likely to burn a first hour and a
first ten dollars.

Add a recurring character only if you actually want one. If you do, the master-first
workflow above is not optional; it is the thing that keeps the character from drifting.

If you opt in, describe them here in detail: age, ethnicity, hair, face, build,
clothing register, posture. Be specific enough that a render based on this description
alone produces a recognizable figure.

If your wiki has no recurring character, which is the default, delete this section.

## Canonical pairings (OPTIONAL — customize or remove)

If your wiki depicts a canonical family, partnership, or relationship pairing (e.g. the recurring character's eventual spouse, children, or close collaborators), describe those figures here too with the same specificity. Include any racial / ethnic / generational details.

## Palette (CUSTOMIZE)

Strict palette, applied as watercolor washes over hand-drawn ink line (or whatever your line vocabulary is).

| Role | Hex | When to use |
|---|---|---|
| Paper | `#FFFAEC` | Background. Customize. |
| Primary | `#000000` | Customize. |
| Accent 1 | `#000000` | Customize. |
| Accent 2 | `#000000` | Customize. |
| Ink | `#1a1a1a` | The line itself. |

## Line vocabulary (CUSTOMIZE)

Describe the line style. Hand-drawn vs vector-clean. Varied weight vs uniform. Watercolor wash showing through vs flat fill. Paper texture present or not.

## Composition rules

- **A hero is a STRIP OF BEATS, not a plate.** The default is 3 panels of equal size
  in a horizontal row, separated by clean cream gutters with no drawn borders. One
  consistent world and cast across every panel.
- **Beat two shows the CONSEQUENCE of beat one.** A middle panel that only restates
  the first is a plate with extra steps.
- **Write the scene AS BEATS.** A scene handed over as one paragraph renders as one
  plate whatever the layout instruction says. This is the single most common failure,
  and it is what `check_panels.py` catches.
- **One elegant plate is the EXCEPTION**, used only when the idea genuinely is a
  single image. Reach for it with `--single`, deliberately.
- **Generous white space.** At least 30% of the canvas untouched paper.
- **No text in the image.** Page titles and captions live in the surrounding MDX.

Add any wiki-specific composition rules here.

> **Reversed 2026-07-26, family-wide.** This section said "Single focal scene per
> illustration. One thing is happening." until 2026-08-03, long after the reversal, so
> every wiki forked from this template was born carrying the law that had already been
> overturned. These pages argue a before and an after, and one frame flattens that into
> decoration. Existing single-plate heroes age out; they are not backfilled.

## Banned visual vocabulary (CUSTOMIZE)

Reject the prompt and rewrite if any of these appear:

- Photorealistic, hyper-detailed, 8K, HDR
- 3D, render, Pixar, CGI
- Anime, manga, chibi
- Cyberpunk, neon, futuristic (unless that IS your register)
- Glossy, plastic, polished
- Brand logos, current-fashion clothing, smartphones
- Text overlays, captions, watermarks
- Named living or recent illustrators (OpenAI moderation hard-blocks these)

## When the scene calls for excellence, render excellence

The default register should be grounded, not glamorous. That works for still lifes, workshop scenes, solo figures.

When a page makes a claim about excellence (a model figure, an aspirational partner, a paragon of the wiki's subject) and the illustration shows average-grade subjects, the image undercuts the text. In those scenes, describe the figure as **visibly excellent** in the scene prompt: clearly beautiful, capable, radiant, well-presented. The visual register stays locked; the figure is rendered as the children's-book version of clearly excellent.

## Per-render prompt template

The door assembles every prompt from four blocks, in this order:

1. **The register**, from `hero_register.register` in `wiki.config.json`.
2. **The layout law**, the panel law or the single-plate line, owned by the door.
3. **The scene**, your beats.
4. **The no-text law**, owned by the door.

**The register lives in `wiki.config.json`, not in this file and not in the script.**
Earlier versions of this template asked you to keep `PREFIX` and `SUFFIX` strings inside
the render script in sync with prose here, which is two copies of one fact and they
drifted. This file is the fuller reasoning for humans and agents; the one sentence in
`hero_register.register` is what actually reaches the model.

To see exactly what will be sent, without spending anything:

```bash
./illustrations/scripts/render-hero.sh --dry-run <slug> "<your beats>"
```

## Canonical reference images

Located in `refs/`:

- **`character-sheet.webp`** (or `.png`) — the recurring character in three poses or expressions. Locked appearance reference. Pass as `--input-image` on every render that includes the character. (Skip if your wiki has no recurring character.)
- **`style-swatch.webp`** — a non-character scene demonstrating the line, wash, palette, and paper texture. Pass as a secondary reference when the character is not in the scene or when the register is drifting.

Regenerate either reference only when the visual identity is explicitly changing.

## Workflow for generating a new page illustration

There is one canonical interface: `illustrations/scripts/render-hero.sh`. Do not call the generator directly. The door applies the register, owns the panel law, passes every blessed reference, pre-flight-checks for banned vocabulary, converts the PNG to WebP, copies provenance next to the shipped asset, and refuses a render that came back as a plate.

1. Read this file.
2. Identify the page and write the argument AS BEATS, not as one paragraph.
3. Dry-run it first. This costs nothing:

   ```bash
   ./illustrations/scripts/render-hero.sh --dry-run <slug> "<beat one>. <beat two>. <beat three>."
   ```

4. When the prompt reads right, render:

   ```bash
   ./illustrations/scripts/render-hero.sh <slug> "<beat one>. <beat two>. <beat three>."
   ```

4. The wrapper writes the source PNG to `illustrations/<filename>.png` and the deploy WebP to `static/img/illustrations/<filename>.webp` (or wherever your wiki serves static assets).
5. Embed the WebP in the MDX:

   ```mdx
   ![<the exact scene prompt you passed to the renderer, verbatim>](/img/illustrations/<filename>.webp)
   ```

6. Always embed `.webp` paths. Never `.png`. The static folder only carries WebPs.
7. **The alt text MUST be the exact prompt you used to generate the image, verbatim** (the scene string passed to the renderer). It is the prompt archive: a future regeneration reads the alt text plus this SPEC and reproduces the image. Do not write a separate, nicer description and do not paraphrase; paste the literal prompt. This is a hard convention for every wiki forked from this template, whatever image system the fork uses.

See `scripts/README.md` for more.

## When to update this spec

- A new recurring character is added.
- A palette decision changes. Edit the palette table and regenerate `refs/style-swatch.webp`.
- The visual register shifts. Re-render both canonical references and update the lineage section.

Do not edit the spec to fix one bad render. Re-prompt instead.
