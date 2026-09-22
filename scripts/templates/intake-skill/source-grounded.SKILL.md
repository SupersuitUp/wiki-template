---
name: {{SKILL_NAME}}
description: Intake new material into {{TITLE}}, a source-grounded wiki ({{DESCRIPTION}}). Source-grounded mode means you fold in external sources faithfully and with citation; you do not author original opinions here. Use when someone says "add this to {{TITLE}}", "add a source to {{TITLE}}", "{{SKILL_NAME}}", or "/{{SKILL_NAME}}", or hands over a book, transcript, or long-form source for this wiki. NOT for net-new authored philosophy (that is authored-canon mode).
---

# {{SKILL_NAME}}

The personalized intake skill for **{{TITLE}}** ({{URL}}). Hosted at `static/skills/{{SKILL_NAME}}/SKILL.md`, served openly at `{{URL}}/skills/{{SKILL_NAME}}/SKILL.md`, and discoverable via a thin local stub.

## The wiki

- **URL:** {{URL}}
- **Purpose:** {{DESCRIPTION}}
- **Intake mode:** `source-grounded`. You grow this wiki by folding in external sources with citation, not by adding original opinions.

## The first law: the citation contract

Every claim traces to a source. Name the source in the sentence, blockquote quotes with a tight locator, end every page with a `**Sources:**` line, and keep the root `SOURCES.md` bibliography current. Match the fidelity of the pages already here, and respect this wiki's posture (heavy verbatim quoting is defensible only while the wiki is noindex and bot-blocked).

## The second law: a page without a graphic is not finished

Every page ships with a graphic, and there are two ways to give it one.

- **A code-drawn diagram is the default, and it is free.** `diagrams/build.mjs` draws SVG from code in this wiki's own colours: copy a function, register it, run `node diagrams/build.mjs <name>`, LOOK at the 2x preview it writes to `diagrams/preview/<name>.png`, fix any overflow or overlap, then embed `![one sentence saying what the diagram argues](/img/diagrams/<name>.svg)`. Read `diagrams/README.md` first.
- **A rendered illustration is the paid alternative**, via `illustrations/scripts/render-hero.sh`, for a hero with people in it. Set frontmatter `image:` to the same path.

**Draw what the SOURCE argues, never decoration**, and a diagram of a source's model is a claim about that source, so it obeys the citation contract like any other: attribute the structure in the caption or in the sentence next to it. Never type a diagram out of dashes and pipes inside a code fence; `wiki check ascii-diagrams` fails the build on it.

## How to intake

This wiki grows source by source. Run the canonical source-grounded engine against THIS repo by fetching and following:

**https://www.truthmanagement.wiki/skills/add-source-to-source-bootstrapped-wiki/SKILL.md**

It normalizes the raw source into gitignored `sources-raw/`, extracts a structural map into `.ingest/`, writes the faithful `docs/sources/<slug>.md`, merges into the existing canon (enrich the pages that already exist, add only genuinely-new ones), harvests glossary terms, appends the `SOURCES.md` row, wires the sidebar, and builds. Honor this wiki's own `docs/how-to-update.md` for house style and posture.

## When NOT to use

- Net-new authored philosophy (this wiki is source-grounded, not authored-canon).
