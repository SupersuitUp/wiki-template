// Vercel Routing Middleware for an OPEN wiki: the family bot-block and the one-page
// share layer, no gate. Both come from the preset, so the ordering that has to be
// right (403 first, share second) is never copied again.
//
// A GATED wiki replaces the re-export with its own verdict:
//
//   import { createMiddleware, createPasswordGate } from '@supersuit/docusaurus-preset-wiki/middleware';
//   export default createMiddleware({ gate: createPasswordGate() });
//   (and the same `export const config` literal below)
//
// The family password gate is dark until WIKI_PASSWORD and WIKI_GATE_SECRET are set. A wiki
// with its own gate (Google identity, a member list) passes a GateFn of its own instead.
//
// where gate() returns { authorized: true } for a valid cookie, and otherwise
// { authorized: false, response } with the login page (401) or, for a `?key=`
// prefilled link, a 303 that sets the cookie. Live copies: supersuit-wiki (password
// only), agenticbusiness-wiki (password + Google identity).
export { default } from '@supersuit/docusaurus-preset-wiki/middleware';

// Vercel reads `config` STATICALLY from this file, so it cannot come from the package: a
// re-export is invisible to it and the middleware runs on every path, which on a gated wiki
// 401s its own og cards and manifest (found live 2026-09-13). The literal is the package's;
// `wiki check middleware` refuses a build where it drifts.
export const config = {
  // Run on HTML routes only. Skip static assets so we do not pay function invocations on
  // every CSS, JS, image or font fetch. `skills/` and `generators/` host agent-readable
  // files served openly; `webmanifest` is named because `json` does not cover it.
  matcher: [
    '/((?!assets/|img/|skills/|generators/|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|map|json|webmanifest|xml)$).*)',
  ],
  runtime: 'edge',
};
