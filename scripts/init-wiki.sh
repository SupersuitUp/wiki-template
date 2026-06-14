#!/usr/bin/env bash
# Interactive scaffold for a new wiki built from this template.
# Prompts for branding values, writes wiki.config.json, optionally updates package.json name.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CONFIG="$ROOT/wiki.config.json"
PKG="$ROOT/package.json"

echo ""
echo "=== Wiki initialization ==="
echo ""

read -r -p "Wiki title (e.g. supersuit.wiki): " TITLE
read -r -p "Tagline (one line): " TAGLINE
read -r -p "Production URL (e.g. https://example.wiki): " URL
read -r -p "GitHub org (e.g. SupersuitUp): " ORG
read -r -p "GitHub repo name (e.g. my-wiki): " PROJECT
read -r -p "Description (used in llms.txt header): " DESCRIPTION
read -r -p "Brand OS base URL (e.g. https://my-brand-os.vercel.app — leave blank if none): " BRAND_OS_URL
read -r -p "Block search engine indexing? [Y/n]: " NOINDEX_INPUT
read -r -p "Intake mode [source-grounded/authored-canon] (default source-grounded): " INTAKE_MODE_INPUT

# Default Y
if [[ -z "$NOINDEX_INPUT" || "$NOINDEX_INPUT" =~ ^[Yy]$ ]]; then
  NOINDEX="true"
else
  NOINDEX="false"
fi

# Intake mode: default source-grounded; anything starting with a/A means authored-canon
if [[ "$INTAKE_MODE_INPUT" =~ ^[Aa] ]]; then
  INTAKE_MODE="authored-canon"
else
  INTAKE_MODE="source-grounded"
fi

# Footer copyright defaults to title
COPYRIGHT="$TITLE"

cat > "$CONFIG" << EOF
{
  "\$schema": "./wiki.config.schema.json",
  "title": "$TITLE",
  "tagline": "$TAGLINE",
  "url": "$URL",
  "organizationName": "$ORG",
  "projectName": "$PROJECT",
  "copyright": "$COPYRIGHT",
  "noindex": $NOINDEX,
  "description": "$DESCRIPTION",
  "brand_os_url": "$BRAND_OS_URL",
  "intake_mode": "$INTAKE_MODE"
}
EOF

# Update package.json name field
if command -v node >/dev/null 2>&1; then
  node -e "
    const fs = require('fs');
    const p = JSON.parse(fs.readFileSync('$PKG', 'utf8'));
    p.name = '$PROJECT';
    fs.writeFileSync('$PKG', JSON.stringify(p, null, 2) + '\n');
  "
fi

echo ""
echo "Wrote $CONFIG"
echo "Updated $PKG (name -> $PROJECT)"
echo ""

# Optional integrations
echo "=== Optional integrations ==="
echo ""
read -r -p "Enable the field-note-sharers attribution section (mentors / people-to-follow / etc.)? [Y/n]: " ENABLE_FNS
if [[ -z "$ENABLE_FNS" || "$ENABLE_FNS" =~ ^[Yy]$ ]]; then
  bash "$ROOT/scripts/init-field-note-sharers.sh"
fi

# Scaffold this wiki's personalized intake skill (hosted under static/skills/)
echo ""
echo "=== Intake skill ==="
bash "$ROOT/scripts/init-intake-skill.sh"

echo ""
read -r -p "Register this wiki's hosted skills into your global registry now? [Y/n]: " REG_INPUT
if [[ -z "$REG_INPUT" || "$REG_INPUT" =~ ^[Yy]$ ]]; then
  bash "$ROOT/scripts/register-skills.sh"
fi

echo ""
echo "=== Next steps ==="
echo "  1. Edit src/css/custom.css to set brand colors (the --ifm-color-primary-* group)."
echo "  2. Replace static/img/favicon.png and static/img/docusaurus-social-card.jpg."
echo "  3. Replace docs/start-here/index.md with the canonical entry point for this wiki."
echo "  4. If you enabled field-note-sharers, paste the sidebar snippet printed above into sidebars.ts."
echo "  5. If you skipped registration above, run 'npm run register-skills' to wire the hosted skills into global discovery."
echo "  6. Run 'npm install' then 'npm start' to preview."
echo ""
