---
title: Voice Rules
slug: /reference/voice-rules
description: "Writing constraints every page is held to. Edit per wiki."
---

# Voice Rules

*Writing constraints every page is held to. Edit per wiki to match the operator's house style.*

---

Voice rules keep the wiki coherent across contributors. Replace the defaults below with your wiki's specific constraints.

## Page anatomy (non-negotiable)

- Frontmatter with `title`, `slug`, `description`, `sidebar_position` (where applicable).
- H1 matches the title.
- Italic one-line definition directly under the H1.
- `---` divider before the body.
- 3-5 named H2 sections in the body.
- "Further Reading" section at the bottom with cross-links.

## Voice (edit per wiki)

- Direct, economical. Every word earns its place.
- Concrete over abstract. Specifics over categories.
- No em dashes. Use periods, commas, or colons instead.
- No motivational poster language. No clichés.
- Define every coined term in [Concepts](/concepts). Cross-link, do not redefine.

## Admonitions

Docusaurus 3 runs MDX 3, and a directive title goes **in brackets**:

```
:::note[About the sources]
Body text.
:::
```

**The old space-separated form (`:::note About the sources`) renders as literal
text on the page**, `:::note` and all. It does not error, and `pnpm build` still
exits 0, so nothing catches it. The only detector is looking at the page or
grepping for the pattern:

```bash
grep -rnE '^:::(note|tip|info|warning|danger|caution)[[:space:]]+[^[[:space:]]' docs/
```

A bare `:::note` with no title is fine and needs no brackets.

## Cross-linking

- Use Docusaurus-style absolute paths: `/concepts/term-name`, not relative.
- Every page should link to at least two other pages in the Further Reading section.
- Concepts link to each other. The lexicon is a graph.
