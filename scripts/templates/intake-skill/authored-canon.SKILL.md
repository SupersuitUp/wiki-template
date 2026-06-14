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

## The one law: coherence with the canon

Before authoring, scan the existing pages for prior framings of the idea. Enrich or sharpen what already exists before adding a new page. New thinking must cohere with the canon, not silently contradict it. Match the wiki's voice rules.

## How to intake

1. **Scan** `docs/` for prior framings of the idea. Decide: enrich an existing page, or author a new one.
2. **Author** the page against the wiki's page anatomy (frontmatter, H1, one italic definition line, named H2 sections, Further Reading). Write in the wiki's voice; read its voice-rules page first.
3. **Cross-link** related concepts. Never re-explain a concept that has a canonical home; link it.
4. **Voice-check** the draft against the wiki's voice rules.
5. **Wire the sidebar** for any new page.
6. **Build** (`pnpm run build`, which enforces `onBrokenLinks: throw`) and fix every broken link.
7. **Commit and push** (Vercel auto-deploys).

## When NOT to use

- Faithfully mapping an external source (that is source-grounded mode).
