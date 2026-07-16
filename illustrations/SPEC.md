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

**When a defect survives repeated prompt rewrites, AUDIT THE REFERENCES — the references are teaching it.** Earned 2026-07-16 (hyperagentic-age Chief of Agents): a mascot kept rendering long tube-arms with finger-nubs through a dozen prompt variations ("SHORT stubs, NO fingers") because the locked pose reference AND the sheet's delivery panel both *showed* long bar-arms the master never had. No prompt language beats a reference that literally depicts the defect. The fix order: (1) crop-zoom every reference being passed and find which one shows the defect; (2) regenerate that reference from the master in ISOLATION (plain ground, single figure) until the anatomy is right; (3) re-lock, THEN return to scene composites. Never iterate an anatomy defect inside a complex scene — fix the character reference first and the composites inherit it for free.

**Composite the multi-view sheet from the locked pose files (PIL/ImageMagick), never by generation.** A generated sheet re-draws the character and can invent anatomy (that is how the bar-arms entered canon). A pasted grid of the actual locked pose PNGs is provably the same art.

**Object hand-off grammar:** a character handing something to the viewer/recipient reads best as a TRAY — object held nearly parallel to the ground, supported only at the FAR edge, so the NEAR edge is open for the receiver. And place the source (screen/portal/giver) CLOSE to the receiver: a gap between giver and receiver forces the model to bridge it with a stretched limb.

**Human hands are the model's worst case; design them out.** Minimize the count of visible hands, put bystanders' hands in pockets, and show receiving hands from the BACK with fingers wrapped around an edge — never splayed open toward the camera. Four converging splayed hands is a guaranteed mangle.

> **TEMPLATE NOTE.** Everything below this line is a placeholder customized per wiki. Replace the placeholders with your wiki's actual visual identity, then delete this template note. After customization, lock `refs/character-master.png` and `refs/character-sheet.png` (if your wiki has a recurring character, master-first per the workflow above) and `refs/style-swatch.webp`, and update the `PREFIX` / `SUFFIX` strings in `scripts/render-page.sh` to match.

---

## Visual lineage (CUSTOMIZE)

Describe the visual register your wiki uses, in 2-4 sentences. Reference a recognizable tradition (e.g. "vintage 1960s-70s illustrated children's books", "mid-century editorial illustration", "woodcut prints", "neo-comic action-zine"). Avoid naming living or recent named artists in prompts: OpenAI's moderation hard-blocks them. Describe the register generically.

State explicitly what the register is NOT (e.g. "Not photorealistic. Not 3D. Not anime. Not Pixar. Not glossy digital art.").

## Recurring character (OPTIONAL — customize or remove)

If your wiki has a recurring narrator-protagonist who appears on most pages, describe them here in detail: age, ethnicity, hair, face, build, clothing register, posture. Be specific enough that a render based on this description alone produces a recognizable figure.

If your wiki has NO recurring character, delete this section.

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

## Composition rules (CUSTOMIZE)

- **Single focal scene per illustration.** One thing is happening.
- **Generous white space.** At least 30% of the canvas untouched paper.
- **No text in the image.** Page titles and captions live in the surrounding MDX.

Add any wiki-specific composition rules here.

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

## Per-render prompt template (CUSTOMIZE)

This is the template the wrapper script applies. The wrapper takes a scene from the operator and substitutes it into `[PAGE SCENE]`:

> An illustration for [your-wiki-name]. The scene: [PAGE SCENE]. Drawn in [your-visual-register-description]. [Your line vocabulary]. Palette: [your-palette]. [Composition rules]. [Banned vocabulary as negative space]. [Recurring character details if applicable]. [Canonical pairing details if applicable].

Edit the `PREFIX` and `SUFFIX` in `scripts/render-page.sh` to match.

## Canonical reference images

Located in `refs/`:

- **`character-sheet.webp`** (or `.png`) — the recurring character in three poses or expressions. Locked appearance reference. Pass as `--input-image` on every render that includes the character. (Skip if your wiki has no recurring character.)
- **`style-swatch.webp`** — a non-character scene demonstrating the line, wash, palette, and paper texture. Pass as a secondary reference when the character is not in the scene or when the register is drifting.

Regenerate either reference only when the visual identity is explicitly changing.

## Workflow for generating a new page illustration

There is one canonical interface: `illustrations/scripts/render-page.sh`. Do not call `chatgpt-images` directly. The wrapper applies this SPEC, passes the locked character reference, pre-flight-checks for banned vocabulary, and auto-converts the PNG output to WebP for deploy.

1. Read this file.
2. Identify the page being illustrated and write a one-sentence scene description.
3. From the repo root, run:

   ```bash
   ./illustrations/scripts/render-page.sh <output-filename> "<scene>"
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
