// Vercel Routing Middleware (platform-level, runs before the cache).
// Blocks known LLM training and AI-search crawlers by User-Agent.
// Compliant crawlers that do not honor robots.txt still get hard-stopped here.
// Bot-block only — no auth, no password logic.

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
// beautifully. Reference implementation: buildonanthropic-wiki/middleware.ts.
const UNFURL_BOT_PATTERN =
  /\b(facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Slack-ImgProxy|Discordbot|WhatsApp|TelegramBot|Applebot|redditbot|Pinterest|SkypeUriPreview|Iframely|embedly|Mastodon|Bluesky|Cardyb|vkShare)\b/i;

const BLOCKED_BOT_PATTERN =
  /\b(GPTBot|OAI-SearchBot|ChatGPT-User|ClaudeBot|Claude-Web|anthropic-ai|CCBot|Google-Extended|GoogleOther|Applebot-Extended|FacebookBot|Meta-ExternalAgent|meta-externalagent|Bytespider|PerplexityBot|Perplexity-User|Amazonbot|AI2Bot|cohere-ai|Diffbot|Omgili|ImagesiftBot|YouBot|DuckAssistBot|peer39_crawler|TimpiBot|Webzio-Extended|Kangaroo|Cotoyogi)\b/i;

export default function middleware(request: Request): Response | undefined {
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
  matcher: [
    '/((?!assets/|img/|skills/|generators/|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:js|css|png|jpe?g|gif|svg|webp|ico|woff2?|ttf|map|json|xml)$).*)',
  ],
  runtime: 'edge',
};
