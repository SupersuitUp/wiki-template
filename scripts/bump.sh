#!/usr/bin/env bash
# Cut a template version. The ONE edit point for "wiki-template is now vX.Y.Z".
#
# TEMPLATE-VERSION is the source of truth; package.json's version is DERIVED here and never
# typed, so the two cannot drift (the freedom-dev template learned that the hard way: two
# hand-edited copies, three guards catching them drifting, and a release refused mid-flight).
# Refuses unless UPGRADE-LEDGER.md already carries a "### → vX.Y.Z" heading, because a version
# with no upgrade notes is one no instance can upgrade through.
#
# Order of a release:
#   1. append the ledger entry for the new version (what changed, DETECTOR, REMEDY)
#   2. scripts/bump.sh vX.Y.Z
#   3. commit TEMPLATE-VERSION package.json UPGRADE-LEDGER.md with the feature
#   4. git tag -a vX.Y.Z -m "<the ledger heading>" && git push && git push --tags
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

[ $# -eq 1 ] || { echo "usage: scripts/bump.sh vX.Y.Z" >&2; exit 2; }
NEW="${1#v}"
[[ "$NEW" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "refusing: '$1' is not vX.Y.Z" >&2; exit 1; }

CUR="$(tr -d ' \n' < "$ROOT/TEMPLATE-VERSION")"; CUR="${CUR#v}"
# Strictly increasing: a version that goes backwards or sideways republishes an old payload
# under a name instances have already compared against, so their behind-check goes quiet.
if [ "$(printf '%s\n%s\n' "$CUR" "$NEW" | sort -V | tail -1)" != "$NEW" ] || [ "$CUR" = "$NEW" ]; then
  echo "refusing: v$NEW is not above the current v$CUR" >&2; exit 1
fi
grep -Eq "^### → v$NEW( |$)" "$ROOT/UPGRADE-LEDGER.md" || {
  echo "refusing: UPGRADE-LEDGER.md has no '### → v$NEW' entry. Write what changed, its detector and its remedy first." >&2
  exit 1
}

printf 'v%s\n' "$NEW" > "$ROOT/TEMPLATE-VERSION"
node -e '
  const fs = require("fs"); const p = process.argv[1]; const v = process.argv[2];
  const pkg = JSON.parse(fs.readFileSync(p, "utf8")); pkg.version = v;
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2) + "\n");
' "$ROOT/package.json" "$NEW"
echo "wiki-template is now v$NEW (TEMPLATE-VERSION + package.json). Commit both with the feature, then:"
echo "  git tag -a v$NEW -m \"\$(grep -E '^### → v$NEW' UPGRADE-LEDGER.md | sed 's/^### → //')\" && git push && git push --tags"
