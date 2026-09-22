# Diagrams, drawn in code

*Every page on this wiki ships with a graphic. A rendered illustration costs money and is optional. A code-drawn diagram costs nothing and is the default.*

---

## The rule

**A page without a graphic is not finished.** Two ways to give it one:

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

## The refusal, which is the point

Every label drawn inside a box is measured against the space it has, and the build **throws** when it does not fit:

```
[diagrams] "Something happens" does not fit the "Something happens" card:
           needs about 205px at 21px, has 200px.
```

Overflow is the one defect nobody ever reports: the build is green, the page renders, and the text simply hangs over the edge for every reader. So the check runs at build time and fails loudly. **Shorten the label, split it across lines, or widen the box. Never delete the check**, and never pass a box its own width as `maxWidth` to get around it.

## Style

- **Portrait or square, 900px wide.** The first reader is on a phone, so type is large and lines are short.
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
