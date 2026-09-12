// Vercel Routing Middleware (platform-level, runs before the cache).
// Two layers, in a load-bearing order:
//   1. Bot-block: known LLM training and AI-search crawlers get a hard 403 by
//      User-Agent. Compliant crawlers that ignore robots.txt still stop here.
//   2. One-page shares: /s/<sig>/<route> and /s/mint (src/share/handleShare.ts).
//      DORMANT on this open template, since a share address only redirects to a
//      page anyone can already read. A GATED wiki wires the same call in with its
//      own gate's verdict, and then the address serves the chrome-less mirror the
//      share-view plugin builds, to a reader who has no password and needs none.
// No auth or password logic here; a gated wiki adds its gate BELOW the share layer.

import { handleShare } from './src/share/handleShare.ts';

// Minimal ambient declaration: this repo has no @types/node, but the Vercel
// edge runtime provides process.env at runtime. Keeps the file type-clean.
declare const process: { env: Record<string, string | undefined> };

// Unfurl scrapers ALWAYS pass, and this is evaluated FIRST, before any block
// or gate below. These are the bots that build link-preview cards in iMessage,
// Slack, X, WhatsApp, Discord, LinkedIn, etc. A wiki that blocks or gates them
// unfurls as a blank card everywhere a link is pasted, and nothing in the page
// source explains why. This allowlist exists so no future edit to the blocked
// pattern (Facebot, Applebot variants) can break previews by accident.
//
// GATED WIKIS: keep this same early return ahead of the password check, and
// support prefilled links (`?key=<password>` -> set cookie, 303 to the clean
// URL) so a shared link lands the reader ON the page while still unfurling
// beautifully. Live copies: supersuit-wiki/middleware.ts (password only),
// agenticbusiness-wiki/middleware.ts (password + Google identity).
const UNFURL_BOT_PATTERN =
  /\b(facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Slack-ImgProxy|Discordbot|WhatsApp|TelegramBot|Applebot|redditbot|Pinterest|SkypeUriPreview|Iframely|embedly|Mastodon|Bluesky|Cardyb|vkShare)\b/i;

const BLOCKED_BOT_PATTERN =
  /\b(GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|anthropic-ai|CCBot|Google-Extended|GoogleOther|Applebot-Extended|FacebookBot|Meta-ExternalAgent|meta-externalagent|Bytespider|PerplexityBot|Perplexity-User|Amazonbot|AI2Bot|cohere-ai|Diffbot|Omgili|ImagesiftBot|YouBot|DuckAssistBot|peer39_crawler|TimpiBot|Webzio-Extended|Kangaroo|Cotoyogi)\b/i;

export default async function middleware(request: Request): Promise<Response | undefined> {
  const ua = request.headers.get('user-agent') ?? '';
  if (UNFURL_BOT_PATTERN.test(ua)) return undefined;
  if (BLOCKED_BOT_PATTERN.test(ua)) {
    return new Response(
      'Forbidden: automated training and AI-search crawlers are not permitted on this site.',
      {
        status: 403,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      },
    );
  }

  // 2. One-page shares. After the bot-block 403, so a crawler never reaches a
  // share address; before any gate, so a share recipient never meets the door.
  // On a gated wiki, `authorized` is the gate's own verdict on this request and
  // `gated` is whether the gate is live; here there is no gate, so every share
  // address redirects to its page and /s/mint answers with the page's own URL.
  const secret = process.env.WIKI_SHARE_SECRET || process.env.WIKI_GATE_SECRET || '';
  const share = await handleShare({
    url: new URL(request.url),
    authorized: true,
    secret,
    gated: false,
  });
  if (share) return share;

  // Implicit undefined return lets the request continue to the static site.
}

export const config = {
  // Run on HTML routes only. Skip static assets so we do not pay function
  // invocations on every CSS, JS, image, or font fetch.
  //
  // `skills/` and `generators/` are intentionally excluded too: this wiki hosts
  // canonical agent SKILL.md and GENERATE.md files under static/skills/<name>/SKILL.md
  // and static/generators/<name>/GENERATE.md, served openly so agents (including
  // blocked-UA crawlers like ClaudeBot) can fetch and run them. The rest stays bot-blocked.
  // `webmanifest` is listed separately because it is NOT covered by `json`, and
  // that omission is the trap: every icon a manifest declares can serve a clean
  // 200 while the manifest itself is gated, so nothing on earth requests them
  // and the breakage is invisible from an asset check. Found live on a gated
  // wiki 2026-08-22. Any allowlist keyed on file extension has this hole.
  matcher: [
    '/((?!assets/|img/|skills/|generators/|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|map|json|webmanifest|xml)$).*)',
  ],
  runtime: 'edge',
};
