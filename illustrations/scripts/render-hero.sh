#!/usr/bin/env bash
# The ONE door for this wiki's article heroes.
#
#   ./illustrations/scripts/render-hero.sh <slug> "<scene, beat by beat>"
#   ./illustrations/scripts/render-hero.sh --panels 4 <slug> "<scene>"
#   ./illustrations/scripts/render-hero.sh --single <slug> "<scene>"
#   ./illustrations/scripts/render-hero.sh --dry-run <slug> "<scene>"
#
# The register, the panel law and the no-text law live HERE, not in the caller, so
# every page gets them without the author remembering. That is the whole point of a
# generator owning them.
#
# Emits the five-artifact contract:
#   static/img/illustrations/<slug>.webp              the deploy asset
#   illustrations/<slug>.png                          the source archive
#   static/img/illustrations/<slug>.webp.recipe.json  provenance, beside the SHIPPED file
#   plus the MDX alt-text line and the frontmatter line, printed for you to paste.
#
# Start with --dry-run. It assembles and prints the whole prompt, calls nothing, and
# costs nothing, so a register you dislike costs zero images instead of one.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

MODE="multipanel"
PANELS=""
DRY_RUN=false
TITLE=""
LABELS=""
NO_TEXT=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --single)  MODE="single"; shift ;;
    --panels)  PANELS="${2:-}"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    --title)   TITLE="${2:-}"; shift 2 ;;
    --labels)  LABELS="${2:-}"; shift 2 ;;
    --no-text) NO_TEXT=true; shift ;;
    --) shift; break ;;
    -*) echo "Unknown flag: $1" >&2; exit 1 ;;
    *) break ;;
  esac
done

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 --title \"<TITLE>\" [--labels \"A|B|C\"] [--panels N|--single] [--dry-run] <slug> \"<scene>\""
  echo "  slug:   page slug, no extension (e.g. the-context-floor)"
  echo "  scene:  the argument, written AS BEATS"
  echo "  --title: the words printed across the top of the hero. REQUIRED unless --no-text."
  echo "  --labels: one short label per panel, pipe-separated, e.g. \"BEFORE|THE MOVE|AFTER\""
  echo "  --no-text: opt out of lettering (for wikis whose register forbids it)"
  echo ""
  echo "  Multipanel at 3 beats is the default. --single is the exception, for when"
  echo "  the idea genuinely is one image."
  echo ""
  echo "  A hero must be legible ON ITS OWN. Someone who only looks at the picture"
  echo "  should get the gist without reading the page."
  exit 1
fi

SLUG="${1%.png}"
SLUG="${SLUG%.webp}"
SCENE="$2"

# --- Config -----------------------------------------------------------------
CONFIG="$REPO_ROOT/wiki.config.json"
[[ -f "$CONFIG" ]] || { echo "ERROR: no wiki.config.json at $CONFIG" >&2; exit 1; }

# One python call, shell-quoted output, rather than one call per key. Interpolating
# a python expression per lookup is how a config read starts silently returning
# fallbacks when a key name drifts.
eval "$(python3 - "$CONFIG" <<'PY'
import json, shlex, sys
try:
    c = json.load(open(sys.argv[1]))
except Exception as e:
    print(f"echo 'ERROR: cannot parse wiki.config.json: {e}' >&2; exit 1")
    sys.exit(0)
h = c.get("hero_register") or {}
def emit(k, v):
    print(f"CFG_{k}={shlex.quote(str(v))}")
emit("MODE",     h.get("mode", "abu"))
emit("OUTDIR",   h.get("outputDir", "static/img/illustrations"))
emit("PANELS",   h.get("defaultPanels", 3))
emit("LAYOUT",   h.get("layout", "multipanel"))
emit("REGISTER", h.get("register", "") or "")
PY
)"

OUTDIR="$CFG_OUTDIR"
[[ -n "$PANELS" ]] || PANELS="$CFG_PANELS"
# Config can set single as this wiki's default; an explicit --panels still wins.
if [[ "$CFG_LAYOUT" == "single" && "$MODE" == "multipanel" ]]; then MODE="single"; fi

if [[ "$CFG_MODE" != "local" ]]; then
  echo "ERROR: hero_register.mode is '$CFG_MODE', not 'local'." >&2
  echo "" >&2
  echo "  This door drives the local engine only. For mode 'abu', the hero is a work:" >&2
  echo "    abu:make-a-work <universe> wiki-article-hero" >&2
  echo "" >&2
  echo "  Both engines emit the same five artifacts, so pages never need rewriting" >&2
  echo "  when a wiki graduates from one to the other." >&2
  exit 1
fi

# --- Banned vocabulary pre-flight -------------------------------------------
# These either trip OpenAI moderation (named living or recent artists) or violate
# the locked register in illustrations/SPEC.md.
BANNED='\b(Sendak|Quentin[[:space:]]+Blake|Tomi[[:space:]]+Ungerer|Pixar|Disney|anime|manga|chibi|3D|render|photorealistic|hyper-?detailed|HDR|cyberpunk|neon|futuristic|glossy|plastic|smartphone|brand[[:space:]]+logo|watermark)\b'
if echo "$SCENE" | grep -iE "$BANNED" >/dev/null; then
  echo "ERROR: scene contains banned vocabulary." >&2
  echo "Matched: $(echo "$SCENE" | grep -iEo "$BANNED" | head -1)" >&2
  echo "" >&2
  echo "This wiki has a locked visual register in illustrations/SPEC.md. Describe the" >&2
  echo "register generically. Naming a living or recent illustrator is hard-blocked by" >&2
  echo "OpenAI moderation, so describe the tradition instead. To change the register," >&2
  echo "edit SPEC.md first." >&2
  exit 1
fi

# --- The laws ---------------------------------------------------------------
REGISTER="$CFG_REGISTER"
[[ -n "$REGISTER" ]] || REGISTER="An editorial illustration on a warm cream ground: soft painterly line, gentle shading, a muted natural palette, grounded and human."

if [[ "$MODE" == "multipanel" ]]; then
  LAYOUT="ONE single image divided into ${PANELS} CLEAR PANELS of equal size, arranged left to right in a horizontal row, separated by generous clean cream gutters with NO drawn borders and NO frame lines. Each panel is one BEAT of the same argument and they read in order as a sequence. Beat two shows the CONSEQUENCE of beat one rather than restating it. Keep ONE consistent world and ONE consistent cast across every panel, so the strip reads as a progression rather than ${PANELS} unrelated pictures."
else
  LAYOUT="ONE single elegant editorial plate: no panels, no grid, no dividing lines."
fi

# --- The lettering law -------------------------------------------------------
# Reversed 2026-08-03 for this template and hyperagency.wiki (Gary: "you should
# only have to read the hero image to be able to get a sense of the gist"). The
# five sibling org wikis keep the no-lettering register; their heroes are made by
# a different pipeline and are not affected.
#
# A hero is a piece of EXPLANATION, not decoration. If a reader has to open the
# article to find out what the picture is about, the picture did nothing.
if [[ "$NO_TEXT" == true ]]; then
  TEXTLAW="ABSOLUTELY NO TEXT ANYWHERE: no words, no letters, no numbers, no captions, no speech bubbles, no labels, no UI chrome. Every beat must be legible from image alone."
else
  [[ -n "$TITLE" ]] || {
    echo "ERROR: --title is required." >&2
    echo "" >&2
    echo "  A hero has to be readable on its own. Give it the words that go across" >&2
    echo "  the top, in a few strong words:" >&2
    echo "    $0 --title \"CAPEX AS A VERB\" $SLUG \"<beats>\"" >&2
    echo "" >&2
    echo "  If this wiki's register genuinely forbids lettering, pass --no-text." >&2
    exit 1; }

  LABEL_LAW=""
  if [[ -n "$LABELS" ]]; then
    n=$(awk -F'|' '{print NF}' <<< "$LABELS")
    if [[ "$MODE" == "multipanel" && "$n" != "$PANELS" ]]; then
      echo "ERROR: --labels has $n entries but there are $PANELS panels." >&2
      echo "  Give one label per panel, pipe-separated." >&2
      exit 1
    fi
    pretty=$(sed 's/|/", "/g' <<< "$LABELS")
    LABEL_LAW=" Label the panels, in order, with these exact words: \"${pretty}\". Each label sits in a small clean band at the top of its own panel."
  fi

  TEXTLAW="TEXT, and it must be SPELLED EXACTLY AS WRITTEN HERE, with no invented words and no extra sentences anywhere in the image: a TITLE BAR across the very top of the whole image reading \"${TITLE}\" in bold, chunky, hand-inked capitals.${LABEL_LAW} That title and those labels are the ONLY text permitted. No body copy, no paragraphs, no sentences, no speech bubbles, no captions under the panels, no UI chrome, no menus, no watermarks, no signature. Any lettering must be large, high contrast and effortlessly legible at a glance; a reader who sees only this image should understand the point without reading anything else."
fi

PROMPT="${REGISTER}

${LAYOUT}

The scene, beat by beat: ${SCENE}

${TEXTLAW}"

# --- References: style-only by default --------------------------------------
# Every blessed ref is passed on every render. That is what locks the look without
# a recurring character, which is the drift-prone part this wiki does not need.
REF_ARGS=()
for f in illustrations/refs/*.png illustrations/refs/*.webp; do
  [[ -f "$f" ]] || continue
  REF_ARGS+=(--input-image "$f")
done

# --- Dry run ----------------------------------------------------------------
if [[ "$DRY_RUN" == true ]]; then
  echo "=== DRY RUN: no API call, nothing spent ==="
  echo "mode:   $MODE   panels: $PANELS"
  echo "out:    $OUTDIR/$SLUG.webp"
  if [[ ${#REF_ARGS[@]} -eq 0 ]]; then
    echo "refs:   (none yet; add 2 to 4 blessed images to illustrations/refs/)"
  else
    echo "refs:   ${REF_ARGS[*]}"
  fi
  echo "--- prompt ---"
  echo "$PROMPT"
  exit 0
fi

# --- Preflight --------------------------------------------------------------
command -v uv >/dev/null 2>&1 || {
  echo "ERROR: uv is not installed. Install it with:" >&2
  echo "  curl -LsSf https://astral.sh/uv/install.sh | sh" >&2
  exit 1; }
command -v cwebp >/dev/null 2>&1 || {
  echo "ERROR: cwebp is not installed. Install it with:" >&2
  echo "  brew install webp" >&2
  exit 1; }
# Check the key HERE, not only inside the generator. The generator checks it too, but
# by then the door has already printed "rendering" and uv has spun up an environment,
# so a missing key reads as "it started and then broke" rather than "it refused."
[[ -n "${OPENAI_API_KEY:-}" ]] || {
  echo "ERROR: OPENAI_API_KEY is not set." >&2
  echo "" >&2
  echo "  1. Get a key at https://platform.openai.com/api-keys" >&2
  echo "  2. export OPENAI_API_KEY='sk-...'" >&2
  echo "  3. Add that same line to ~/.zshrc so it survives a new terminal." >&2
  echo "" >&2
  echo "Images are billed to your own OpenAI account, so the key is yours. It lives" >&2
  echo "in your shell, never in this repo." >&2
  exit 1; }

mkdir -p illustrations "$OUTDIR"

echo "==> rendering $OUTDIR/$SLUG.webp  [$MODE, $PANELS beats]"

# bash 3.2 (the macOS default) errors on "${arr[@]}" when the array is empty under
# set -u, so expand it only when it has entries.
uv run illustrations/scripts/generate.py \
  --prompt "$PROMPT" \
  --filename "illustrations/$SLUG.png" \
  ${REF_ARGS[@]+"${REF_ARGS[@]}"} \
  --size 1536x1024 \
  --quality high

[[ -f "illustrations/$SLUG.png" ]] || { echo "ERROR: generator produced no file." >&2; exit 1; }

# --- Enforce the panel law BEFORE anything shippable is written -------------
# Order matters. This check used to run last, after the WebP and its provenance were
# already sitting in static/, so a REFUSED render still left a deployable file behind
# for someone to commit. The gate comes first now: nothing reaches the deploy folder
# until it has passed. The rejected PNG stays in illustrations/ as the record that the
# attempt happened.
if [[ "$MODE" == "multipanel" ]]; then
  uv run illustrations/scripts/check_panels.py "illustrations/$SLUG.png" --expect "$PANELS" || {
    echo "" >&2
    echo "The render did not come back as a ${PANELS}-panel strip." >&2
    echo "Re-render. Do not edit the image, and do not stack a second pass on it." >&2
    echo "The usual cause is a scene written as one paragraph instead of as beats." >&2
    echo "" >&2
    echo "Nothing was written to $OUTDIR. The attempt is kept at illustrations/$SLUG.png." >&2
    exit 1; }
fi

# --- Contract artifact 1: the deploy WebP -----------------------------------
cwebp -quiet -q 85 "illustrations/$SLUG.png" -o "$OUTDIR/$SLUG.webp"

# --- Contract artifact 3: provenance beside the SHIPPED asset ---------------
# The generator writes the recipe next to the PNG it made. The shipped asset is the
# WebP, so an auditor looking at what actually deployed has to find it there too.
if [[ -f "illustrations/$SLUG.png.recipe.json" ]]; then
  cp "illustrations/$SLUG.png.recipe.json" "$OUTDIR/$SLUG.webp.recipe.json"
fi

# --- Contract artifacts 4 and 5, printed to paste ---------------------------
cat <<EOF

Done. Two lines to paste into the page:

Frontmatter:
  image: "/img/illustrations/${SLUG}.webp"

Body, immediately after the italic definition line (the alt text IS the prompt,
verbatim, because it is the prompt archive a future regeneration reads):
  ![${SCENE}](/img/illustrations/${SLUG}.webp)
EOF
