# wiki-template

*Docusaurus 3 starter for opinionated reference wikis. The bones of every wiki in this ecosystem, extracted once so the next one ships in an hour.*

---

## Start here: the playbook

The full end-to-end recipe for using this template — the audience-posture interview, integration layering, branding, and Vercel deploy — lives at:

**[truthmanagement.wiki/playbooks/starting-your-own-wiki](https://www.truthmanagement.wiki/playbooks/starting-your-own-wiki)**

If you are scaffolding a fresh wiki, run the GENERATE recipe at the bottom of that page ([the-generate-recipe anchor](https://www.truthmanagement.wiki/playbooks/starting-your-own-wiki#the-generate-recipe)) and follow its four phases. This README is the quick reference once you know the shape.

---

## What this is

A GitHub template repo for spinning up a new Docusaurus reference wiki with the conventions already baked in:

- **Page anatomy enforced.** Frontmatter, H1 + italic one-line definition, divider, named H2 sections, Further Reading. The sample docs in `docs/` demonstrate the shape.
- **Per-wiki branding via `wiki.config.json`.** Title, tagline, URL, GitHub org/repo, noindex toggle. The Docusaurus config and prebuild scripts read from this single source of truth.
- **Search built in.** Custom MiniSearch plugin (Cmd+K / `/` trigger, in-memory index, no third-party service).
- **Changelog built in.** Git-derived creation/update dates surface as a `<ChangelogWidget />` widget on the homepage and a full `/changelog` page. No frontmatter dates required.
- **Per-page social share cards built in.** `plugins/og-image-plugin` runs post-build: every page whose head has no `og:image` (no frontmatter `image:` hero) gets a branded 1200x630 card rendered from its own title + description and injected into its head. A shared link to any page unfurls with page-specific art, never a generic site card. Pages with an `image:` hero keep the hero. Brand the cards via the optional `og` block in `wiki.config.json` (`bg`, `accent`, `text`, `muted`).
- **Bot-blocked at the edge.** `middleware.ts` returns 403 for known LLM training and AI-search user agents.
- **Noindex by default.** `robots.txt: Disallow: /` + `<meta name="robots" content="noindex, nofollow">`. Toggle via `wiki.config.json`.
- **`llms.txt` + `llms-full.txt` at build time.** Auto-generated from your docs so well-behaved AI agents can read the wiki without crawling it.
- **Page templates in `templates/`.** Copy-and-rename scaffolds for `concept.mdx`, `tool.mdx`, `playbook.mdx`, `case-study.mdx`.
- **Hosted skills.** `static/skills/<name>/SKILL.md` is served openly at `/skills/<name>/SKILL.md` (the `skills/` path is excluded from the bot-block in `middleware.ts`) so agents can fetch and follow canonical skills as a single source of truth. See `static/skills/README.md`.
- **Hosted generators.** `static/generators/<name>/GENERATE.md` is served openly at `/generators/<name>/GENERATE.md` (the `generators/` path is also excluded from the bot-block) so a playbook links its GENERATE recipe instead of embedding it. See `static/generators/README.md`.

## How to use this template

### 1. Create a new repo from the template

On GitHub: click **Use this template** > **Create a new repository**. Pick your org and name.

Or from the CLI:

```bash
gh repo create your-org/your-wiki --template SupersuitUp/wiki-template --private
gh repo clone your-org/your-wiki
cd your-wiki
```

### 2. Initialize

```bash
npm install
npm run init
```

`npm run init` prompts for title, tagline, URL, GitHub org/repo, description, and noindex preference, then writes `wiki.config.json` and updates `package.json`.

At the end of init, you'll be offered the **field-note-sharers** integration (default ON). Pick a section folder name (`mentors`, `people-to-follow`, `sources`, `field-note-sharers`, or custom) and the script scaffolds `docs/<section>/index.md` and prints a sidebar snippet for you to paste. To enable it later instead, run `npm run init:field-note-sharers` standalone. The canonical recipe lives at `supersuit-repos/curated-wiki-integrations/integrations/field-note-sharers/`; the templates inside `scripts/templates/field-note-sharers/` are an intentional copy so the template is self-contained at bootstrap time.

### 3. Customize

- **Brand colors:** edit `src/css/custom.css` (the `--ifm-color-primary-*` group).
- **Favicon and social card:** replace `static/img/favicon.png` and `static/img/docusaurus-social-card.jpg`.
- **Sidebar:** edit `sidebars.ts` as content grows. The template ships with three top-level categories (`Start Here`, `Concepts`, `Reference`).
- **Voice rules:** edit `docs/reference/voice-rules.md` to encode your wiki's writing constraints.

### 4. Run locally

```bash
npm start -- --port 4444
```

Opens at `http://localhost:4444`. Hot-reload on content changes.

### 5. Deploy

The repo ships with `vercel.json` and is ready for Vercel auto-deploy from `main`.

```bash
vercel link
vercel --prod
```

## Repo layout

```
wiki.config.json           Per-wiki branding (single source of truth)
wiki.config.schema.json    JSON schema for editor autocompletion
docusaurus.config.ts       Reads wiki.config.json; rarely edited directly
sidebars.ts                Sidebar structure; edited per wiki
docs/                      Wiki content
  start-here/              Entry point
  concepts/                Flat A-Z lexicon
  reference/               Tools, glossary, voice rules
templates/                 Copy-and-rename MDX scaffolds
src/
  css/custom.css           Brand colors + typography
  components/ShareButton   Reusable copy-link button
  components/ChangelogWidget Homepage widget: top-N most-recent doc updates
  components/Changelog     Full month-grouped log for /changelog
  theme/                   Docusaurus swizzles
plugins/search-plugin/     Custom MiniSearch
plugins/creation-date-plugin/  Walks docs/ and extracts git first/last commit dates per file
scripts/
  init-wiki.sh                    `npm run init` — interactive setup
  init-field-note-sharers.sh      `npm run init:field-note-sharers` — scaffold the attribution section
  generate-llms-txt.sh            Generates llms.txt at build
  llms-txt-env.mjs                Bridges wiki.config.json -> env vars
  templates/
    field-note-sharers/           Section-index + source-page templates (mirror of curated-wiki-integrations recipe)
middleware.ts              Edge bot-block
static/
  img/                     Favicon, social card
  robots.txt               Disallow all (toggle by removing if noindex=false)
```

## Adding pages

```bash
cp templates/concept.mdx docs/concepts/my-new-term.md
cp templates/tool.mdx docs/reference/tools/my-new-tool.md
```

Then edit the new file. The frontmatter and page anatomy are already in place.

## Conventions enforced by this template

- **One coined term = one concept page.** Never redefine a term in two places. Cross-link.
- **Italic one-line definition under every H1.** Quotable, scannable.
- **Further Reading at the bottom.** Internal links first, outside sources second.
- **Absolute paths for cross-links.** `/concepts/term-name`, not relative paths.
- **`onBrokenLinks: 'throw'`.** A broken cross-link fails the build.
- **Article hero = social-share image.** If a page embeds an image (hero comic, strip, illustration), also set `image: "<site-absolute path>"` in its frontmatter (e.g. `image: "/img/illustrations/<slug>.webp"`). Docusaurus renders it as the page's `og:image`/`twitter:image`. Add or update the field in the same edit as the hero embed. Docusaurus validates the file exists at build time, so never point it at a placeholder path.
- **Homepage is the Start Here landing.** The file at `docs/start-here/index.mdx` carries `slug: /` and is both the wiki's homepage AND the Start Here category landing in the sidebar. Do NOT create a separate `docs/index.mdx` for the homepage. A standalone root index lives outside every sidebar group, so the homepage renders without a sidebar. Keep the canonical pattern: one file, two roles.

## AI-native illustration system (built in)

Every wiki forked from this template ships with a locked illustration pipeline at `illustrations/`. The shape, per the [agentic-brand-os](https://www.appliedai.wiki/concepts/agentic-brand-os) discipline:

- **`wiki.config.json` -> `hero_register`** — the operative settings. `register` is the one sentence that reaches the model; `mode` picks the engine.
- **`illustrations/SPEC.md`** — the fuller visual identity for humans and agents. Lineage, composition law, banned vocabulary, opt-in recurring character.
- **`illustrations/refs/`** — 2 to 4 blessed style images, all passed on every render so the look stays coherent across pages.
- **`illustrations/scripts/render-hero.sh`** — the one door. Owns the register, the panel law and the no-text law, refuses banned vocabulary, converts to WebP, writes provenance next to the shipped asset, and refuses a render that came back as a plate.
- **`illustrations/scripts/generate.py`** — the vendored OpenAI adapter. Self-contained: no ABU, no external skills folder, dependencies install themselves via `uv`.

To use it, dry-run first (costs nothing), then render:

```bash
./illustrations/scripts/render-hero.sh --dry-run <slug> "<beat one>. <beat two>. <beat three>."
./illustrations/scripts/render-hero.sh <slug> "<beat one>. <beat two>. <beat three>."
```

**A hero is a STRIP OF BEATS, 3 by default, not a single plate.** Write the scene as
beats; one paragraph renders as one plate whatever the layout instruction says.

The door prints the two lines to paste. Always `.webp` in MDX, never `.png`, and the alt
text is the verbatim prompt because it is the prompt archive:

```mdx
![The exact scene prompt you passed, verbatim.](/img/illustrations/<slug>.webp)
```

**Fork-time setup.** After scaffolding a wiki from this template:

1. Install `uv` and `cwebp` (`brew install webp`), and set `OPENAI_API_KEY` in your shell. Images are billed to your own OpenAI account.
2. Write one sentence into `hero_register.register` in `wiki.config.json`, and edit `illustrations/SPEC.md` to match.
3. Render 2 to 4 style references through the door and keep the ones you like in `illustrations/refs/`. That is enough; recurring characters are opt-in and most wikis should skip them.

The discipline is the point: the door is the only sanctioned way to render a hero. Call the generator directly and the register drifts, provenance lands in the wrong place, and nothing checks that a strip came back.

Run the free tests after any change to the pipeline:

```bash
uv run illustrations/scripts/tests/test_check_panels.py
./illustrations/scripts/tests/test_render_hero.sh
```

See `illustrations/SPEC.md` and `illustrations/scripts/README.md` for the full discipline.

## Changelog (built in)

Every wiki forked from this template ships with the `wiki-changelog` feature pre-wired:

- **`/changelog`** is a full month-grouped log of every doc in the wiki, newest first. Lives at `docs/changelog.mdx` and pulls data from the `creation-date-plugin`.
- **`<ChangelogWidget limit={8} />`** is embedded near the bottom of the homepage (`docs/start-here/index.mdx`). It surfaces the most recently created or updated docs as a compact list.
- Dates are derived from git history (first commit per file = creation, last commit = update; renames followed). No frontmatter `creation_date` field required.

**Commit `src/data/changelog-events.json`.** Vercel's build container clones the repo shallow AND strips the git remote, so the build can neither see older history nor fetch it. `git fetch --unshallow` in a build command exits 0 having done nothing; earlier versions of this README told you to do exactly that, and it never worked. History has to ride along in the repo instead.

So the plugin keeps a snapshot: on a full clone (your laptop) a build rewrites `src/data/changelog-events.json` from git, and on a shallow clone it leaves that file alone and merges it with whatever recent history it can see. Run a local build and commit the JSON when it changes, or production quietly shows only the last few weeks. Two related traps the plugin handles for you: paths from `git log --name-status` are repo-root-relative (so a site in a subdirectory needs its prefix stripped), and the commit where a shallow clone is cut off looks like a root commit, which would otherwise invent a "New" event for every file that merely existed at that point.

**Fork-time tuning.** Both `src/components/ChangelogWidget.tsx` and `src/components/Changelog.tsx` carry a `SECTION_LABELS` map at the top of the file. The template ships with labels for the default sections (`start-here`, `concepts`, `reference`). If you add or rename top-level folders under `docs/`, update both `SECTION_LABELS` maps to match — otherwise the changelog will fall back to a title-cased version of the folder slug.

For the recipe in full, see `curated-wiki-integrations/integrations/wiki-changelog/INTEGRATE.md` in the parent `supersuit-repos/` workspace.

## License

Use it however you like. No attribution required.
