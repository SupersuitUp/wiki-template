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

## Where this wiki's intake skill comes from

This folder is empty in the bare template on purpose: the intake skill is **personalized** (its name, triggers, URL, and flow all come from `wiki.config.json`), so it is generated at init rather than shipped with placeholder values.

`npm run init` (or `npm run init:intake-skill` on its own) reads `intake_mode` from `wiki.config.json` and scaffolds `static/skills/<projectName-minus-wiki>-intake/SKILL.md` from the matching mode-template:

- `scripts/templates/intake-skill/source-grounded.SKILL.md` — fold in external sources faithfully with citation (delegates to the canonical hosted `add-source` engine).
- `scripts/templates/intake-skill/authored-canon.SKILL.md` — author net-new original philosophy that coheres with the canon.

After init, the personalized skill lives here and is served at `<url>/skills/<name>/SKILL.md`. Register the local discovery stub globally per the init output.

## Format

A hosted skill is a normal `SKILL.md`: YAML frontmatter (`name`, `description`) then the instructions. Same shape as a local skill. No special variant.
