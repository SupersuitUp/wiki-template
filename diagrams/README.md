# Diagrams, drawn in code

*Every page on this wiki ships with a graphic. A rendered illustration costs money and is optional. A code-drawn diagram costs nothing and is the default.*

---

## The rule

**A page without a graphic is not finished**, with one exception: the pure reference pages (a glossary, a voice-rules page, a changelog) carry none, because a lookup page has no argument to draw. Two ways to give every other page one:

| | What it is | Cost | When |
|---|---|---|---|
| **Illustration** | `illustrations/scripts/render-hero.sh`, an image model, a scene with people in it | paid, per image | a hero for a page that argues something human |
| **Diagram** | this folder, a node script, pure SVG | free | any page whose idea has a STRUCTURE: parts, an order, a loop, a contrast, a hierarchy |

Reach for the diagram first. Most pages argue a structure, and a structure drawn in code is exact, diffable, re-renderable after a wording change, and readable by a screen reader through its alt text.

**Draw what the page argues, never decoration.** If you cannot say in one sentence what the reader now knows that they did not know before, the diagram is not worth its space. That sentence is the alt text.

## Adding one

1. Open `build.mjs` and copy `sampleFlow()`. Rename it after the thing it argues.
2. Draw with the helpers: `frame`, `card`, `arrow`, `text`, `eyebrow`, `rule`, `drawIcon`, `arc`. Colours come from `C`, fonts from `T`, both read from this wiki's own `src/css/custom.css` and `wiki.config.json`.
3. Register it in `DIAGRAMS` at the bottom. The key is the filename and the URL.
4. Render and LOOK at it:

   ```bash
   node diagrams/build.mjs my-diagram     # one
   node diagrams/build.mjs                # all
   node --test diagrams/build.test.mjs    # the kit's own tests
   ```

5. Open `diagrams/preview/my-diagram.png` with your eyes (or an agent's Read tool) before embedding. Look for overflow, overlap, clipping, and a label sitting on a line.
6. Embed it in the page:

   ```md
   ![One sentence saying what the diagram argues.](/img/diagrams/my-diagram.svg)
   ```

## What it writes, and why

- **`static/img/diagrams/<name>.svg`** is the shipped asset. It is a few KB, stays sharp at any width, and is exempt from `wiki check image-weight`, which only gates rasters. Commit it.
- **`diagrams/preview/<name>.png`** is a 2x render for looking at. Gitignored, because it is a checking aid rather than an artifact. Needs `rsvg-convert` (`brew install librsvg`); without it the SVGs still render and the previews are skipped with a warning.

**Never set frontmatter `image:` to a diagram SVG.** Several link-preview consumers do not render SVG, and the og-image plugin already generates a branded share card for any page that has no `image:`. That field belongs to a rendered illustration. (A small SVG embedded in markdown may also be inlined as a data URI by the bundler, which is fine and changes nothing about the source.)

## The refusal, which is the point

Every label drawn inside a box is measured against the space it has, and the build **throws** when it does not fit:

```
[diagrams] "Something happens" does not fit the "Something happens" card:
           needs about 205px at 21px, has 200px.
```

Overflow is the one defect nobody ever reports: the build is green, the page renders, and the text simply hangs over the edge for every reader. So the check runs at build time and fails loudly. **Shorten the label, split it across lines, or widen the box. Never delete the check**, and never pass a box its own width as `maxWidth` to get around it.

**The second refusal is the phone floor.** A diagram is shown scaled to the reader's column, which on a phone is about 360px, so every size is multiplied by 360 / canvas width before anyone sees it. `frame()` reads the finished SVG and throws when any text would land under 12px there:

```
[diagrams] "commits by the hour" in "There is no workday" is 17px on a 720px canvas,
           which a 360px phone column shows at 8.5px. The floor is 12px, so this
           canvas needs at least 24px.
```

`minSize(w)` gives the smallest legal size for a canvas (24px at 720). It reads the emitted markup, so a hand-written `<text>` is held to it too. Raise the size, stack instead of squeezing a column in, or say less. Never delete the check; a comment promising "no text under 21px" sat above 17px eyebrows for a whole wiki, and a phone showed them at 8px.

The estimate knows about monospace: a mono stack is measured at a flat width per glyph, because the proportional estimate treats `i` and `l` as narrow and runs about thirty percent under the truth for a title set in a mono brand font. A line that measured fine ran off a card that way, on a real wiki, and the preview is what caught it.

## Style

- **Portrait or square, 720px wide, no text under 24px.** The first reader is on a phone, where 720 shows at half size, so type is large and lines are short. A wider canvas needs proportionally larger type (`minSize(w)`), which is why wider is rarely better.
- **Colour carries meaning, consistently across a wiki.** Pick a job for `C.accent` and a job for `C.second` and keep them. Say what the jobs are in a comment at the top of `build.mjs`.
- **No more than about seven boxes.** A diagram that needs more is two diagrams.
- **The diagram draws its own paper**, so it reads the same in light and dark mode.
- **No text an image model would have written.** Everything here is typed by a person and rendered exactly.

## Setting the palette explicitly

By default the kit reads `--ifm-color-primary`, `--ifm-background-color`, `--ifm-font-color-base`, `--ifm-font-color-secondary` and the two font stacks from `src/css/custom.css`, and derives the soft fills, hairlines and second colour from those. A wiki that wants to say it outright adds a `diagrams` block to `wiki.config.json`:

```json
"diagrams": {
  "paper": "#FBF8F1",
  "ink": "#1D1C1A",
  "muted": "#6E685D",
  "accent": "#2D3B6B",
  "second": "#B9832A"
}
```

Any key may be omitted, and what is omitted is derived.
