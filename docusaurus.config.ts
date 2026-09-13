import wiki from './wiki.config.json';
import { defineWikiConfig } from '@supersuit/docusaurus-preset-wiki';

// Everything a family wiki shares (search, changelog dates, og cards, manifest,
// share mirror, the theme and its CSS, the head tags and classic-preset options)
// lives in the preset. Per-wiki additions go in the second argument:
//   defineWikiConfig(wiki, { themeConfig: { navbar: { items: [...] } } })
// themeConfig deep-merges onto the defaults; any other key replaces its default.
export default defineWikiConfig(wiki);
