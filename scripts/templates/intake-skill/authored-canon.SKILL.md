---
name: {{SKILL_NAME}}
description: Intake new thinking into {{TITLE}}, an authored-canon wiki ({{DESCRIPTION}}). Authored-canon mode means you author net-new original philosophy that must cohere with the existing canon, in the wiki's own voice. Use when someone says "add this to {{TITLE}}", "concept for {{TITLE}}", "{{SKILL_NAME}}", or "/{{SKILL_NAME}}", or hands over a braindump, transcript, or idea for this wiki. NOT for faithfully mapping external sources (that is source-grounded mode).
---

# {{SKILL_NAME}}

The personalized intake skill for **{{TITLE}}** ({{URL}}). Hosted at `static/skills/{{SKILL_NAME}}/SKILL.md`, served openly at `{{URL}}/skills/{{SKILL_NAME}}/SKILL.md`, and discoverable via a thin local stub.

## The wiki

- **URL:** {{URL}}
- **Purpose:** {{DESCRIPTION}}
- **Intake mode:** `authored-canon`. You grow this wiki by authoring original, coherent thinking in its voice, not by mapping external sources.

## The first law: coherence with the canon

Before authoring, scan the existing pages for prior framings of the idea. Enrich or sharpen what already exists before adding a new page. New thinking must cohere with the canon, not silently contradict it. Match the wiki's voice rules.

## The second law: a page without a graphic is not finished

Every page ships with a graphic, and there are two ways to give it one. The exception is the pure reference pages (a glossary, a voice-rules page, a changelog), which carry none, because a lookup page has no argument to draw.

- **A code-drawn diagram is the default, and it is free.** `diagrams/build.mjs` draws SVG from code in this wiki's own colours: copy a function, register it, run `node diagrams/build.mjs <name>`, LOOK at the 2x preview it writes to `diagrams/preview/<name>.png`, fix any overflow or overlap, then embed `![one sentence saying what the diagram argues](/img/diagrams/<name>.svg)`. Read `diagrams/README.md` first.
- **A rendered illustration is the paid alternative**, via `illustrations/scripts/render-hero.sh`, for a hero with people in it. Set frontmatter `image:` to the same path. Never point `image:` at a diagram SVG: several unfurl consumers do not render SVG, and the build already makes a card for a page without one.

**Draw what the page argues, never decoration.** If you cannot say in one sentence what the reader now knows, the graphic is not earning its space. That sentence is the alt text. Never type a diagram out of dashes and pipes inside a code fence: `wiki check ascii-diagrams` fails the build on it, because that picture breaks on a narrow screen and says nothing to a screen reader.

## How to intake

1. **Scan** `docs/` for prior framings of the idea. Decide: enrich an existing page, or author a new one.
2. **Author** the page against the wiki's page anatomy (frontmatter, H1, one italic definition line, named H2 sections, Further Reading). Write in the wiki's voice; read its voice-rules page first.
3. **Cross-link** related concepts. Never re-explain a concept that has a canonical home; link it.
4. **Voice-check** the draft against the wiki's voice rules.
5. **Draw the page's graphic** and embed it. Look at the preview before embedding; a diagram with a label hanging over a box edge ships behind a green build.
6. **Wire the sidebar** for any new page.
7. **Build** (`pnpm run build`, which enforces `onBrokenLinks: throw`) and fix every broken link.
8. **Commit and push** (Vercel auto-deploys).

## When NOT to use

- Faithfully mapping an external source (that is source-grounded mode).
