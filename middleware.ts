// Vercel Routing Middleware for an OPEN wiki: the family bot-block and the one-page
// share layer, no gate. Both come from the preset, so the ordering that has to be
// right (403 first, share second) is never copied again.
//
// A GATED wiki replaces the re-export with its own verdict:
//
//   import { createMiddleware, type GateVerdict } from '@supersuit/docusaurus-preset-wiki/middleware';
//   export { config } from '@supersuit/docusaurus-preset-wiki/middleware';
//   async function gate(request: Request): Promise<GateVerdict> { ... }
//   export default createMiddleware({ gate });
//
// where gate() returns { authorized: true } for a valid cookie, and otherwise
// { authorized: false, response } with the login page (401) or, for a `?key=`
// prefilled link, a 303 that sets the cookie. Live copies: supersuit-wiki (password
// only), agenticbusiness-wiki (password + Google identity).
export { default, config } from '@supersuit/docusaurus-preset-wiki/middleware';
