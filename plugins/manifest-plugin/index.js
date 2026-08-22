const fs = require('fs');
const path = require('path');

/**
 * Writes `manifest.webmanifest` into the build from wiki.config.json, so the
 * app name and theme colour can never drift from the rest of the site.
 *
 * Two things this exists to prevent.
 *
 * A manifest is the only share/metadata file whose contents are a set of
 * REFERENCES, which makes its breakage invisible from an asset check: every
 * icon it names can return a clean 200 while nothing on earth requests them,
 * because the file that would is missing or gated. So this plugin declares only
 * icons that actually exist on disk, and says loudly at build time when they do
 * not, rather than shipping a manifest pointing at 404s.
 *
 * And the file is served at `.webmanifest`, which is NOT `.json`. Every
 * extension-keyed allowlist misses it unless it is named. See middleware.ts.
 */
module.exports = function manifestPlugin(context) {
  const wikiPath = path.join(context.siteDir, 'wiki.config.json');
  const wiki = fs.existsSync(wikiPath) ? JSON.parse(fs.readFileSync(wikiPath, 'utf8')) : {};
  const title = context.siteConfig.title;
  const og = wiki.og ?? {};
  const bg = og.bg || '#ffffff';

  return {
    name: 'manifest-plugin',
    async postBuild({ outDir }) {
      const declared = [
        { file: 'img/icon-192.png', sizes: '192x192', purpose: 'any' },
        { file: 'img/icon-512.png', sizes: '512x512', purpose: 'any' },
        { file: 'img/icon-512.png', sizes: '512x512', purpose: 'maskable' },
      ];
      const icons = declared
        .filter((i) => fs.existsSync(path.join(outDir, i.file)))
        .map((i) => ({ src: '/' + i.file, sizes: i.sizes, type: 'image/png', purpose: i.purpose }));

      if (icons.length === 0) {
        console.warn(
          '[manifest-plugin] no PWA icons found. Run `python3 scripts/build-icons.py` to ' +
            'generate static/img/icon-192.png, icon-512.png and apple-touch-icon.png. ' +
            'Shipping a manifest with no icons until then.',
        );
      }

      const manifest = {
        name: title,
        short_name: title.length > 12 ? title.split(/[\s:]/)[0] : title,
        start_url: '/',
        display: 'standalone',
        background_color: bg,
        theme_color: bg,
        icons,
      };
      fs.writeFileSync(
        path.join(outDir, 'manifest.webmanifest'),
        JSON.stringify(manifest, null, 2) + '\n',
      );
      console.log(`[manifest-plugin] wrote manifest.webmanifest with ${icons.length} icon entries`);
    },
  };
};
