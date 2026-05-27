#!/usr/bin/env bash
# Render a single page illustration for this wiki.
#
# Reads the locked SPEC (palette, character, register, banned vocabulary)
# at illustrations/SPEC.md and the locked character reference at
# illustrations/refs/character-sheet.png (or .webp). Operator supplies
# filename + scene. Output: PNG source archive at illustrations/<name>.png
# AND deploy WebP at static/img/illustrations/<name>.webp (auto-converted).
#
# Usage:
#   ./illustrations/scripts/render-page.sh <output-filename> "<scene description>"
#
# Example:
#   ./illustrations/scripts/render-page.sh "yourself-mirror.png" \
#     "<a one-sentence scene description for this wiki's register>"
#
# After the render, embed the WebP in the MDX page with literal alt text:
#
#   ![Literal scene description.](/img/illustrations/<name>.webp)
#
# Then git add and commit.

set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <filename> \"<scene>\""
  echo "  filename: relative to illustrations/ (e.g. page-name.png)"
  echo "  scene:    one-sentence scene description"
  exit 1
fi

FILENAME="$1"
SCENE="$2"

# -----------------------------------------------------------------------------
# CUSTOMIZE: Banned vocabulary for your wiki.
# These either trip OpenAI moderation (named living/recent artists) or
# violate the locked register. Add/remove based on your wiki's SPEC.md.
# -----------------------------------------------------------------------------
BANNED='\b(Sendak|Quentin[[:space:]]+Blake|Tomi[[:space:]]+Ungerer|Pixar|Disney|anime|manga|chibi|3D|render|photorealistic|hyper-?detailed|HDR|cyberpunk|neon|futuristic|glossy|plastic|smartphone|brand[[:space:]]+logo|watermark)\b'

if echo "$SCENE" | grep -iE "$BANNED" > /dev/null; then
  echo "ERROR: scene contains banned vocabulary."
  echo "Matched: $(echo "$SCENE" | grep -iEo "$BANNED" | head -1)"
  echo ""
  echo "This wiki uses a locked visual register documented in illustrations/SPEC.md."
  echo "Describe the register generically. If you really need to change the register,"
  echo "edit SPEC.md first and regenerate the canonical references."
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

# -----------------------------------------------------------------------------
# CUSTOMIZE: PREFIX and SUFFIX. These track illustrations/SPEC.md verbatim.
# Edit them when your SPEC changes; regenerate the canonical references
# (refs/character-sheet.webp and refs/style-swatch.webp) after any change.
# -----------------------------------------------------------------------------
PREFIX="An illustration for this wiki. The scene: "
SUFFIX=". Drawn in <your-visual-register-description>. <your line vocabulary>. Palette: <your palette>. Generous white space, at least 30 percent of the canvas left as untouched paper. No text, no labels, no captions inside the image. Not photorealistic. Not 3D. Not anime or manga. Not Pixar. Not glossy digital art. <recurring character details if applicable>."

# -----------------------------------------------------------------------------
# Reference image. Skip this section if your wiki has no recurring character.
# -----------------------------------------------------------------------------
REF=""
for candidate in illustrations/refs/character-sheet.webp illustrations/refs/character-sheet.png; do
  if [[ -f "$candidate" ]]; then
    REF="$candidate"
    break
  fi
done

PROMPT="${PREFIX}${SCENE}${SUFFIX}"

mkdir -p illustrations static/img/illustrations
echo "==> rendering illustrations/$FILENAME"

if [[ -n "$REF" ]]; then
  uv run ~/.agents/skills/chatgpt-images/scripts/generate_image.py \
    --prompt "$PROMPT" \
    --filename "illustrations/$FILENAME" \
    --input-image "$REF" \
    --size 1536x1024 \
    --quality high
else
  echo "(no canonical character reference found at illustrations/refs/character-sheet.{webp,png}; rendering without --input-image)"
  uv run ~/.agents/skills/chatgpt-images/scripts/generate_image.py \
    --prompt "$PROMPT" \
    --filename "illustrations/$FILENAME" \
    --size 1536x1024 \
    --quality high
fi

# Convert PNG → WebP for deploy. The PNG stays in illustrations/ as the source
# archive; the WebP in static/img/illustrations/ is what the MDX references
# and what Vercel serves. ~90% smaller than the PNG at near-identical visual
# quality for illustration content at q=85.
WEBP_NAME="${FILENAME%.png}.webp"
if command -v cwebp >/dev/null 2>&1; then
  cwebp -quiet -q 85 "illustrations/$FILENAME" -o "static/img/illustrations/$WEBP_NAME"
  echo "==> static/img/illustrations/$WEBP_NAME"
else
  echo "WARN: cwebp not installed. Falling back to copying the PNG to static."
  echo "      Install with: brew install webp"
  cp "illustrations/$FILENAME" "static/img/illustrations/$FILENAME"
fi

echo ""
echo "Next steps:"
echo "  1. Open illustrations/$FILENAME and inspect the render."
echo "  2. Embed in the MDX page using /img/illustrations/$WEBP_NAME with literal alt text."
echo "  3. git add and commit."
