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
