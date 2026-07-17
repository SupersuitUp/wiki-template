#!/usr/bin/env bash
# Render a single illustration or comic using a brand OS.
#
# Usage:
#   ./scripts/render-graphic.sh [--comic] <output-filename> "<scene>" [gabr-slug ...]
#
# --comic: comic-strip mode — caption boxes + speech bubbles allowed,
#          auto-passes the comic layout GABR (gabr-20 by default, or override
#          with COMIC_GABR env var).
#
# Extra GABR slugs are filenames of GABRs listed in brand.txt.
# They are downloaded on-demand from the hosted brand OS and cached locally.
#
# Config: set brand_os_url in wiki.config.json (or set BRAND_OS_URL env var).
#         The script reads the preamble and graphic-type suffixes directly from
#         the brand OS's brand.txt — no hardcoded brand values in this file.
#
# Output: static/img/illustrations/<name>.webp (ready to embed in MDX)
# Embed:  ![Literal scene description.](/img/illustrations/<name>.webp)

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# ---------------------------------------------------------------------------
# Brand OS URL — read from wiki.config.json (override with BRAND_OS_URL env var)
# ---------------------------------------------------------------------------
_CONFIG_FILE="$REPO_ROOT/wiki.config.json"
_CONFIG_BRAND_OS_URL=""
if [[ -f "$_CONFIG_FILE" ]] && command -v node >/dev/null 2>&1; then
  _CONFIG_BRAND_OS_URL=$(node -e "const c=require('$_CONFIG_FILE');process.stdout.write(c.brand_os_url||'')" 2>/dev/null || true)
fi
BRAND_OS_URL="${BRAND_OS_URL:-${_CONFIG_BRAND_OS_URL}}"
if [[ -z "${BRAND_OS_URL:-}" ]]; then
  echo "ERROR: brand_os_url not configured."
  echo "Add it to wiki.config.json or set the BRAND_OS_URL environment variable."
  exit 1
fi
BRAND_OS_URL="${BRAND_OS_URL%/}"

BRAND_TXT_URL="${BRAND_OS_URL}/brand.txt"
GABR_BASE_URL="${BRAND_OS_URL}/brand/generation-layer/golden-atomic-brand-references"
CACHE_KEY=$(echo "$BRAND_OS_URL" | sed -E 's|^https?://||; s|/.*||')
CACHE_DIR="$HOME/.agents/agentic_brand_oses/${CACHE_KEY}/gabrs"
BRAND_TXT_CACHE="$HOME/.agents/agentic_brand_oses/${CACHE_KEY}/brand.txt"

# ---------------------------------------------------------------------------
# Parse flags
# ---------------------------------------------------------------------------
COMIC_MODE=false
if [[ "${1:-}" == "--comic" ]]; then
  COMIC_MODE=true
  shift
fi

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 [--comic] <filename> \"<scene>\" [gabr-slug ...]"
  echo "  --comic:    comic-strip mode (allows captions/speech bubbles)"
  echo "  filename:   output name (e.g. page-name.png)"
  echo "  scene:      scene description"
  echo "  gabr-slug:  optional additional GABR filenames to pass as references"
  exit 1
fi

FILENAME="$1"
SCENE="$2"
shift 2
EXTRA_SLUGS=("$@")

# ---------------------------------------------------------------------------
# Banned vocabulary (update for your brand OS)
# ---------------------------------------------------------------------------
BANNED='\b(Sendak|Quentin[[:space:]]+Blake|Tomi[[:space:]]+Ungerer|Pixar|Disney|anime|manga|chibi|3D[[:space:]]render|photorealistic|hyper-?detailed|HDR|cyberpunk|neon|futuristic|glossy|plastic|brand[[:space:]]+logo|watermark)\b'
if echo "$SCENE" | grep -iE "$BANNED" > /dev/null; then
  echo "ERROR: scene contains banned vocabulary."
  echo "Matched: $(echo "$SCENE" | grep -iEo "$BANNED" | head -1)"
  exit 1
fi

cd "$REPO_ROOT"
mkdir -p "$CACHE_DIR"

# ---------------------------------------------------------------------------
# Download a GABR from the brand OS (cached locally)
# ---------------------------------------------------------------------------
download_gabr() {
  local slug="$1"
  local dest="$CACHE_DIR/$slug"
  if [[ ! -f "$dest" ]]; then
    echo "==> downloading $slug from brand OS..." >&2
    curl -fsSL "$GABR_BASE_URL/$slug" -o "$dest"
  fi
  echo "$dest"
}

# ---------------------------------------------------------------------------
# Fetch brand.txt (cached locally — delete to refresh)
# ---------------------------------------------------------------------------
if [[ ! -f "$BRAND_TXT_CACHE" ]]; then
  echo "==> fetching brand.txt from brand OS..."
  mkdir -p "$(dirname "$BRAND_TXT_CACHE")"
  curl -fsSL "$BRAND_TXT_URL" -o "$BRAND_TXT_CACHE"
fi

PREFIX=$(awk '/^```text/{found=1; next} found && /^```/{exit} found' "$BRAND_TXT_CACHE")
if [[ -z "$PREFIX" ]]; then
  echo "ERROR: could not extract preamble from brand.txt cache."
  echo "Delete $BRAND_TXT_CACHE and re-run to refresh."
  exit 1
fi

# ---------------------------------------------------------------------------
# Suffix — read from brand.txt graphic_types section
# ---------------------------------------------------------------------------
if [[ "$COMIC_MODE" == true ]]; then
  TYPE_SLUG="comic"
else
  TYPE_SLUG="illustration"
fi

SUFFIX=$(awk -v slug="$TYPE_SLUG" '
  /^\- \*\*/ { in_section = (index($0, "**" slug "**") > 0) }
  in_section && /^  suffix: "/ {
    gsub(/^  suffix: "|"$/, "")
    print
    exit
  }
' "$BRAND_TXT_CACHE")

if [[ -z "$SUFFIX" ]]; then
  echo "ERROR: could not extract suffix for type '$TYPE_SLUG' from brand.txt cache."
  echo "Delete $BRAND_TXT_CACHE and re-run to refresh."
  exit 1
fi

# ---------------------------------------------------------------------------
# Resolve GABR paths
# ---------------------------------------------------------------------------
# Default protagonist GABR — override with DEFAULT_PROTAGONIST_GABR env var
DEFAULT_PROTAGONIST_GABR="${DEFAULT_PROTAGONIST_GABR:-gabr-18-default-client.png}"
REF_PATH=$(download_gabr "$DEFAULT_PROTAGONIST_GABR")

EXTRA_PATHS=()
if [[ "$COMIC_MODE" == true ]]; then
  COMIC_GABR="${COMIC_GABR:-gabr-20-perspectives-comic.png}"
  EXTRA_PATHS+=("$(download_gabr "$COMIC_GABR")")
fi
for slug in ${EXTRA_SLUGS[@]+"${EXTRA_SLUGS[@]}"}; do
  EXTRA_PATHS+=("$(download_gabr "$slug")")
done

# ---------------------------------------------------------------------------
# Build REFERENCE IMAGES block
# ---------------------------------------------------------------------------
REFS_BLOCK=$'\n\nREFERENCE IMAGES PASSED — match each exactly:'
IDX=1
REFS_BLOCK="${REFS_BLOCK}"$'\n'"- Image ${IDX}: $(basename "$REF_PATH") — canonical default protagonist. Match exactly."
IDX=$((IDX+1))

for extra in ${EXTRA_PATHS[@]+"${EXTRA_PATHS[@]}"}; do
  REFS_BLOCK="${REFS_BLOCK}"$'\n'"- Image ${IDX}: $(basename "$extra")"
  IDX=$((IDX+1))
done

REF_COUNT=$((IDX-1))
PROMPT="${PREFIX}${REFS_BLOCK}

The scene: ${SCENE}${SUFFIX}"

# ---------------------------------------------------------------------------
# Render to /tmp, convert to WebP, clean up
# ---------------------------------------------------------------------------
TMP_PNG="/tmp/$FILENAME"
WEBP_NAME="${FILENAME%.png}.webp"
WEBP_OUT="static/img/illustrations/$WEBP_NAME"

CMD_ARGS=(
  --prompt "$PROMPT"
  --filename "$TMP_PNG"
  --size 1536x1024
  --quality high
  --input-image "$REF_PATH"
)
for extra in ${EXTRA_PATHS[@]+"${EXTRA_PATHS[@]}"}; do
  CMD_ARGS+=(--input-image "$extra")
done

mkdir -p static/img/illustrations
echo "==> rendering $WEBP_OUT (${REF_COUNT} reference image(s))"

uv run ~/.agents/skills/chatgpt-images/scripts/generate_image.py "${CMD_ARGS[@]}"

if command -v cwebp >/dev/null 2>&1; then
  cwebp -quiet -q 85 "$TMP_PNG" -o "$WEBP_OUT"
else
  echo "WARN: cwebp not installed. Install with: brew install webp"
  cp "$TMP_PNG" "${WEBP_OUT%.webp}.png"
fi

rm -f "$TMP_PNG"

echo ""
echo "Embed in MDX:"
echo "  ![Scene description.](/img/illustrations/$WEBP_NAME)"
