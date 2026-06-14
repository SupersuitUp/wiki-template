# Hosted skills

This folder hosts canonical agent skills as plain `SKILL.md` files. Anything here is copied verbatim into the build and served at the site root:

```
static/skills/<name>/SKILL.md   ->   https://<this-wiki>/skills/<name>/SKILL.md
```

## Why host a skill

A hosted `SKILL.md` is a single source of truth that any agent on any machine can fetch and follow, without having the skill installed locally. Update the hosted file once and every consumer gets it. This is the same pattern as a hosted brand OS `brand.txt`, applied to skills.

Use it for:

- **A wiki's own intake skill** (scaffolded here by `npm run init`), so the wiki ships with the skill that maintains it.
- **Canonical shared engines** that many wikis or operators delegate to (for example, a source-grounded intake engine hosted on the canonical wiki-building wiki).

## How agents reach it

`middleware.ts` excludes `/skills/` from the bot-block, so these files are fetchable by any agent (including blocked-UA crawlers) while the rest of the wiki stays sealed. Do not remove that exclusion.

The local skill registry holds a thin discovery **stub** (frontmatter `name` + `description` so the harness can discover and trigger it; body = "fetch and follow `https://<this-wiki>/skills/<name>/SKILL.md`"). The stub is the shim; the hosted file is the content.

## Format

A hosted skill is a normal `SKILL.md`: YAML frontmatter (`name`, `description`) then the instructions. Same shape as a local skill. No special variant.
