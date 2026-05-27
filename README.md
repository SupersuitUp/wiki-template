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
- **Changelog built in.** Git-derived creation/update dates surface as a `<RecentlyAdded />` widget on the homepage and a full `/changelog` page. No frontmatter dates required.
- **Bot-blocked at the edge.** `middleware.ts` returns 403 for known LLM training and AI-search user agents.
- **Noindex by default.** `robots.txt: Disallow: /` + `<meta name="robots" content="noindex, nofollow">`. Toggle via `wiki.config.json`.
- **`llms.txt` + `llms-full.txt` at build time.** Auto-generated from your docs so well-behaved AI agents can read the wiki without crawling it.
- **Page templates in `templates/`.** Copy-and-rename scaffolds for `concept.mdx`, `tool.mdx`, `playbook.mdx`, `case-study.mdx`.

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
  components/RecentlyAdded Homepage widget: top-N most-recent doc updates
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
- **Homepage is the Start Here landing.** The file at `docs/start-here/index.mdx` carries `slug: /` and is both the wiki's homepage AND the Start Here category landing in the sidebar. Do NOT create a separate `docs/index.mdx` for the homepage. A standalone root index lives outside every sidebar group, so the homepage renders without a sidebar. Keep the canonical pattern: one file, two roles.

## AI-native illustration system (built in)

Every wiki forked from this template ships with a locked illustration pipeline at `illustrations/`. The shape, per the [design-systems-for-ai-generated-visuals](https://www.appliedai.wiki/concepts/design-systems-for-ai-generated-visuals) discipline:

- **`illustrations/SPEC.md`** — the canonical visual identity for this wiki. Visual lineage, recurring character (optional), palette, banned vocabulary, per-render prompt template. One source of truth.
- **`illustrations/refs/`** — locked reference images (`character-sheet.webp` if your wiki has a recurring character, `style-swatch.webp` for the visual register). Passed as `--input-image` on every render so identity stays coherent across many pages.
- **`illustrations/scripts/render-page.sh`** — the canonical wrapper. Takes `<filename>` + `<scene>`, applies SPEC prompt template, passes the locked character ref, pre-flight greps for banned vocabulary, and auto-converts PNG → WebP (~90% smaller) into `static/img/illustrations/` for deploy.

To use it:

```bash
./illustrations/scripts/render-page.sh "page-name.png" "<one-sentence scene>"
```

Embed the WebP path in MDX (always `.webp`, never `.png` in deployed content):

```mdx
![Literal scene description for accessibility and prompt archive.](/img/illustrations/page-name.webp)
```

**Fork-time setup.** After scaffolding a wiki from this template:

1. Customize `illustrations/SPEC.md` for your wiki's visual identity. Customize the `PREFIX` and `SUFFIX` in `illustrations/scripts/render-page.sh` to match.
2. Generate `illustrations/refs/character-sheet.webp` (if your wiki has a recurring character) and `illustrations/refs/style-swatch.webp` via the wrapper. These become the canonical references for every future render.
3. Install `cwebp` once: `brew install webp`. Without it, the wrapper falls back to copying the PNG.

The discipline is the whole point: locking the visual identity in this many places means changing it later is deliberate, not accidental. The wrapper is the only sanctioned way to call `chatgpt-images` for wiki illustrations; never call the image generator directly or the register will drift.

See `illustrations/SPEC.md` and `illustrations/scripts/README.md` for the full discipline.

## Changelog (built in)

Every wiki forked from this template ships with the `wiki-changelog` feature pre-wired:

- **`/changelog`** is a full month-grouped log of every doc in the wiki, newest first. Lives at `docs/changelog.mdx` and pulls data from the `creation-date-plugin`.
- **`<RecentlyAdded limit={8} />`** is embedded near the bottom of the homepage (`docs/start-here/index.mdx`). It surfaces the most recently created or updated docs as a compact list.
- Dates are derived from git history (first commit per file = creation, last commit = update; renames followed). No frontmatter `creation_date` field required.
- `vercel.json` includes `git fetch --unshallow` in the build command so deployed dates reflect actual file creation, not the deploy commit.

**Fork-time tuning.** Both `src/components/RecentlyAdded.tsx` and `src/components/Changelog.tsx` carry a `SECTION_LABELS` map at the top of the file. The template ships with labels for the default sections (`start-here`, `concepts`, `reference`). If you add or rename top-level folders under `docs/`, update both `SECTION_LABELS` maps to match — otherwise the changelog will fall back to a title-cased version of the folder slug.

For the recipe in full, see `curated-wiki-integrations/integrations/wiki-changelog/INTEGRATE.md` in the parent `supersuit-repos/` workspace.

## License

Use it however you like. No attribution required.
