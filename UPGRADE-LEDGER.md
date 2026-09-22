# wiki-template upgrade ledger

One entry per version, oldest first, newest last. Each entry says what changed, how an
INSTANCE can tell whether it already has it (the DETECTOR), and what to copy or edit if it
does not (the REMEDY). A sweep across the fleet is those two columns run in order.

**Append. Never prepend, never reorder.** `scripts/check-template-version.mjs` takes the last
heading as the newest version, and so will any instance asking whether it is behind.

**Every release needs a heading here before `scripts/bump.sh` will cut it.** A version with no
upgrade notes is indistinguishable from a working one until somebody tries to upgrade through it.

The version an instance is at lives in its own `TEMPLATE-VERSION`. It means: this repo carries
every entry below up to and including that one. Stamp it only after the detectors for every
entry between the old value and the new one pass, or the number is a memory of a wish.

## Versions

### → v1.0.0 (baseline)

Everything the template shipped before it had a version: the family bot-block middleware, the
`?key=` prefill contract for gated wikis, search, the changelog collector and the article meta
row (Created / Updated / copy link), per-page og cards, the manifest, the icon builder, the
image-weight gate, the provenance gate, hosted skills and generators, `llms.txt`, and the
`pnpm share` unlock-link CLI that answers OPEN / UNLOCKED / BLOCKED / MINTABLE.

- **Detector:** `test -f scripts/unlock-link.mjs && test -f scripts/check-image-provenance.mjs`.
  Both landed in the 2026-09-10 fleet sweep, the last one before versioning existed.
- **Remedy:** copy the file the detector names from the template; each has its own test.

### → v1.1.0 (one-page shares out of a gated wiki, and the version machinery itself)

A gated wiki had one door, the password, and it opened the whole wiki. Sending someone a page
meant sending them that door. Now an authorized reader's copy-link button hands out
`/s/<sig>/<route>`: one page, served chrome-less (no navbar, sidebar, TOC, footer, scripts, or
links into the rest), to a reader who has no password and needs none. Deterministic HMAC over
the route, keyed by `WIKI_SHARE_SECRET` or `WIKI_GATE_SECRET`; revocation is rotating the secret.

New: `src/share/` (signing, the middleware layer, the mobile-safe clipboard), `plugins/share-view-plugin/`
(the mirror, built at postBuild), `src/components/ShareButton.tsx` (asks `/s/mint`, falls back to
the page URL), `TEMPLATE-VERSION`, this ledger, `scripts/bump.sh`, `scripts/check-template-version.mjs`.
Changed: `middleware.ts` calls `handleShare` after the bot-block and before any gate; `scripts/unlock-link.mjs`
prefers the focused link on a gated wiki (`--whole-wiki` for the old `?key=` link); `tsconfig.json`
gains `allowImportingTsExtensions`; `docusaurus.config.ts` registers the plugin.

- **Detector:** `test -f src/share/handleShare.ts && grep -q handleShare middleware.ts && grep -q share-view-plugin docusaurus.config.ts`.
  On a LIVE gated wiki, also: `curl -s -o /dev/null -w '%{http_code}' https://<wiki>/s/mint?path=/` answers
  401 (the layer is there and refusing an anonymous mint), not 401-with-the-gate-page or 404.
- **Remedy:** copy `src/share/`, `plugins/share-view-plugin/`, the tsconfig flag and the plugin
  registration verbatim. **Edit, never overwrite,** `middleware.ts` and `ShareButton.tsx`: every
  gated wiki's middleware is its own, so wire `handleShare({ url, authorized, secret, gated })` in
  with that gate's verdict, and keep any local behaviour the button grew (buildonanthropic strips
  the query string; reallife falls back to `?password=`). Run `pnpm test:share`, build, and check
  one emitted `build/share-view/<route>/index.html` has zero `<script>` tags.
- **Open wikis** get the code and no behaviour: the address redirects to the page, `/s/mint`
  answers with the page URL. Stamp them v1.1.0 once the detector passes.

### → v1.1.1 (edge-safe imports for the share layer)

v1.1.0 imported `./src/share/handleShare.ts` with the extension, which Node's test runner
needs and Vercel's edge bundler refuses: the first gated instance to deploy it failed with
"The Edge Function middleware is referencing unsupported modules". Every import under
`src/share/`, `plugins/share-view-plugin/` and `middleware.ts` is now extensionless; the tests
run through `scripts/ts-resolve-hooks.mjs`, a resolver hook that tries the TypeScript
extensions only under `node --test`. `tsconfig.json` no longer needs `allowImportingTsExtensions`.

- **Detector:** `! grep -rq "from '\./.*\.ts'" src/share plugins/share-view-plugin/src middleware.ts`
  and `test -f scripts/ts-resolve-hooks.mjs`.
- **Remedy:** copy `src/share/`, `plugins/share-view-plugin/src/`, `scripts/ts-resolve-hooks.mjs`,
  `scripts/ts-resolve-loader.mjs`; drop the `.ts` from the import in `middleware.ts`; point
  `test:share` in package.json at the hook; remove `allowImportingTsExtensions` from tsconfig.

### → v1.1.2 (unfurl bots reach the share layer)

The family middleware waved link-preview bots through before anything else ran, which was
right when the only things below it were a block and a gate. A share address exists only as
a rewrite, so a bot sent straight to the static site got a 404 and the shared link unfurled
as nothing. The unfurl exemption now skips the block and the gate and NOT the share layer.

- **Detector:** on a live gated wiki, `curl -s -o /dev/null -w '%{http_code}' -A Twitterbot/1.0 <a share url>`
  answers 200. In source: the unfurl early-return sits AFTER the `handleShare` call.
- **Remedy:** in `middleware.ts`, compute `isUnfurlBot` once, make the bot-block `!isUnfurlBot && BLOCKED`,
  and move `if (isUnfurlBot) return undefined;` to after `handleShare`.

### → v1.1.3 (the schema knows the gate block)

`scripts/unlock-link.mjs` has read `gate.unlockParam` from `wiki.config.json` since v1.0.0, but
`wiki.config.schema.json` (`additionalProperties: false`) never declared it, so an editor flagged
the one line a deviating wiki needs and nobody wrote it: reallife's CLI was quietly trying
`?key=` on a `?password=` gate until 2026-09-12. The schema now carries `gate.unlockParam`.

- **Detector:** `grep -q '"gate"' wiki.config.schema.json`.
- **Remedy:** copy `wiki.config.schema.json` from the template (it only grew). A wiki whose
  gate uses a parameter other than `key` sets `"gate": { "unlockParam": "password" }` in its
  `wiki.config.json`; the others change nothing.

### → v2.0.0 (the framework is a package)

Everything the ledger above told you to copy now arrives by dependency. `@supersuit/docusaurus-preset-wiki`
carries the five plugins, the theme components and swizzles, the share layer, the framework CSS,
the edge middleware and the build checks; the template is an ordinary instance of it.
`TEMPLATE-VERSION`, `scripts/bump.sh` and `scripts/check-template-version.mjs` are retired: the
package version is the template version and `pnpm outdated` is the checker. **This is the last
entry.** From here the record is the package's `CHANGELOG.md`, and an upgrade is a version bump.

- **Detector:** `grep -q '"@supersuit/docusaurus-preset-wiki"' package.json && wiki check owned-files`.
- **Remedy:**
  1. `pnpm add @supersuit/docusaurus-preset-wiki` and
     `pnpm remove minisearch satori @resvg/resvg-js gray-matter glob remark strip-markdown` (now the package's).
  2. `git rm -r plugins src/components src/theme src/share TEMPLATE-VERSION wiki.config.schema.json scripts/bump.sh scripts/check-template-version*.mjs scripts/check-*.mjs scripts/unlock-link*.mjs scripts/generate-llms-txt.sh scripts/llms-txt-env.mjs scripts/test-image-provenance.mjs scripts/ts-resolve-*.mjs scripts/build-icons.py scripts/optimize-images.py`.
     Keep `scripts/image-exempt-cases.json`, `scripts/image-provenance-baseline.json` and the `init*`/`register-skills` scripts.
  3. Replace `docusaurus.config.ts` with the template's (three lines; per-wiki navbar/footer additions go in
     `defineWikiConfig`'s second argument). Replace `package.json` scripts with the template's
     (`prebuild: wiki check`, `share: wiki share`, `icons`, `optimize:images`). Point `wiki.config.json`'s
     `$schema` at `./node_modules/@supersuit/docusaurus-preset-wiki/wiki.config.schema.json`.
  4. `middleware.ts`: take the template's file. It re-exports the default and DECLARES `export const config`
     with the matcher literal itself, because Vercel reads `config` statically and cannot see a re-export
     (a re-exported config ran the middleware on every path and a gated wiki 401'd its own og cards and
     manifest, 2026-09-13); `wiki check middleware` refuses a drifted literal. A wiki gated by the family
     password gate is `createMiddleware({ gate: createPasswordGate() })`, driven by `WIKI_PASSWORD` and
     `WIKI_GATE_SECRET`; set those with `wiki gate set --password "<word>"`, never by hand. A wiki with its
     OWN gate (Google identity, a member list) moves its gate body into
     `async function gate(request): Promise<GateVerdict>` and exports `createMiddleware({ gate })`. The
     bot-block, unfurl allowlist and share layer are no longer its code.
  5. `src/css/custom.css`: keep ONLY the `:root` token block and the dark-mode block (`[data-theme='dark']`
     and its overrides); delete the layout sections between them, the package ships those.
  6. In `docs/`, `@site/src/components/ChangelogWidget` → `@theme/ChangelogWidget`, same for `Changelog`,
     `ShareButton`, `PageDates`.
  7. Build before and after, and diff `build/` outside `assets/` (a token diff that normalizes the eight-hex
     asset hashes and the CSS-module class suffixes should be zero; the template's own retarget was).
     `wiki check`, deploy a preview, run the live checks (search opens, `/changelog` populates, an og card
     URL is 200, `/manifest.webmanifest` 200, `curl -A GPTBot` 403, `curl -A Twitterbot` 200, `/s/mint?path=/`
     answers), then production.


### → v2.0.1 (the definition line is readable in dark mode again)

The package owns the italic definition line under every H1, and since preset 1.8.0 it has
styled it with `:is(h1, header, .doc-meta-slot) + p`, because the Created / copy-link meta row
now sits between the title and the line. Every instance's `custom.css` dark block still said
`h1 + p`, which matches nothing once the row is there. Nothing errored: the package's rule kept
applying, so the line rendered the package's light `#555` on a near-black page. **2.5:1, against
a 4.5:1 floor**, on every wiki in the family for about a month.

Preset **1.11.0** ends the split: every text colour in the package reads a `--wiki-*` token that
declares its dark value in the same file, so a rule and the dark half of that rule can no longer
be separated. This template drops its own definition-line override rather than repairing the
selector, because two places declaring one colour is how this happened.

- **Detector** (reads the rendered page, not the source, so it is blind to how the defect was
  written): load any doc page, `document.documentElement.setAttribute('data-theme','dark')`, then
  compute the WCAG contrast of the definition line's computed `color` against its effective
  background. Below 4.5 is the defect. Source greps miss the instances whose override drifted.
- **Remedy:** `pnpm update @supersuit/docusaurus-preset-wiki` (every instance's range is a caret,
  so `package.json` needs no edit), rebuild, deploy. Then delete the
  `[data-theme='dark'] .markdown h1 + p …` block from the instance's `src/css/custom.css`: it is
  dead code either way, and leaving it is what makes the next selector change silent again. A
  wiki that wants its own definition-line colour sets `--wiki-text-lede` in its dark token block.
