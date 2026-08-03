#!/usr/bin/env bash
# Dry-run tests for the hero door. No API calls, no cost.
#
# --dry-run exists FOR this file as much as for the operator: every law the door
# owns (the register, the panel law, the no-text law, the refusals) is assertable
# without spending a cent, which is why this suite can run on every change.
set -uo pipefail
cd "$(dirname "$0")/../../.." || exit 1
DOOR=./illustrations/scripts/render-hero.sh
pass=0; fail=0

check() { # check <label> <expected-substring> <actual>
  if printf '%s' "$3" | grep -qF "$2"; then
    echo "ok   - $1"; pass=$((pass+1))
  else
    echo "FAIL - $1"; echo "       wanted: $2"; fail=$((fail+1))
  fi
}

refute() { # refute <label> <forbidden-substring> <actual>
  # A refutation over EMPTY output passes vacuously, so a missing or crashed door
  # would report green. Demand the run actually produced a prompt first. (Caught
  # 2026-08-03: two refute checks passed before render-hero.sh existed at all.)
  if ! printf '%s' "$3" | grep -qF "DRY RUN"; then
    echo "FAIL - $1"; echo "       no dry-run output to refute against"; fail=$((fail+1))
    return
  fi
  if printf '%s' "$3" | grep -qF "$2"; then
    echo "FAIL - $1"; echo "       forbidden: $2"; fail=$((fail+1))
  else
    echo "ok   - $1"; pass=$((pass+1))
  fi
}

out=$($DOOR --dry-run hero-test "a scene" 2>&1)
check  "multipanel is the default"     "3 CLEAR PANELS"           "$out"
check  "panel law names beats"         "one BEAT of the same"     "$out"
check  "beat two is a consequence"     "CONSEQUENCE of beat one"  "$out"
check  "no-text law present"           "NO TEXT ANYWHERE"         "$out"
check  "scene reaches the prompt"      "a scene"                  "$out"
check  "dry run says it spent nothing" "no API call"              "$out"

out=$($DOOR --dry-run --panels 4 hero-test "a scene" 2>&1)
check  "--panels 4 honored"            "4 CLEAR PANELS"           "$out"
refute "--panels 4 drops the 3"        "3 CLEAR PANELS"           "$out"

out=$($DOOR --dry-run --single hero-test "a scene" 2>&1)
check  "--single drops the panel law"  "single elegant editorial" "$out"
refute "--single has no panel law"     "CLEAR PANELS"             "$out"

out=$($DOOR --dry-run hero-test "a glossy 3D photorealistic scene" 2>&1)
check  "banned vocabulary refused"     "banned vocabulary"        "$out"

out=$($DOOR 2>&1)
check  "usage on no args"              "Usage:"                   "$out"

echo
echo "passed: $pass  failed: $fail"
[ "$fail" -eq 0 ]
