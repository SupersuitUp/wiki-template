#!/usr/bin/env bash
# Register every hosted skill in static/skills/ as a global discovery stub,
# namespaced by this wiki's prefix (skill_prefix in wiki.config.json, or
# projectName minus a trailing -wiki). Each stub is written into the primary
# registry and symlinked into whichever satellite registries exist.
#
# Overrides (mainly for testing):
#   AGENT_SKILLS_DIR     primary registry dir (default ~/.agents/skills)
#   SKILL_REGISTRY_DIRS  colon-separated satellite dirs (default the standard three)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

node - "$ROOT" <<'NODE'
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = process.argv[2];
const cfgPath = path.join(ROOT, 'wiki.config.json');
if (!fs.existsSync(cfgPath)) { console.error("No wiki.config.json. Run 'npm run init' first."); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

const url = (cfg.url || '').replace(/\/$/, '');
const prefix = ((cfg.skill_prefix || (cfg.projectName || '').replace(/-wiki$/, '') || 'wiki')).trim();

const skillsDir = path.join(ROOT, 'static', 'skills');
if (!fs.existsSync(skillsDir)) { console.error('No static/skills/ yet. Run `npm run init` (or init:intake-skill) first.'); process.exit(1); }

const HOME = os.homedir();
const PRIMARY = process.env.AGENT_SKILLS_DIR || path.join(HOME, '.agents', 'skills');
const SATELLITES = (process.env.SKILL_REGISTRY_DIRS && process.env.SKILL_REGISTRY_DIRS.trim())
  ? process.env.SKILL_REGISTRY_DIRS.split(':').filter(Boolean)
  : [
      path.join(HOME, '.claude', 'skills'),
      path.join(HOME, '.openclaw', 'workspace', 'skills'),
      path.join(HOME, '.hermes', 'skills', 'personal'),
    ];

fs.mkdirSync(PRIMARY, { recursive: true });

const dirs = fs.readdirSync(skillsDir, { withFileTypes: true }).filter((d) => d.isDirectory());
let n = 0;
for (const d of dirs) {
  const localname = d.name;
  const skillFile = path.join(skillsDir, localname, 'SKILL.md');
  if (!fs.existsSync(skillFile)) continue;

  const text = fs.readFileSync(skillFile, 'utf8');
  const front = text.split(/^---\s*$/m)[1] || '';
  const descM = front.match(/^\s*description:\s*(.+?)\s*$/m);
  const desc = descM ? descM[1] : `Hosted skill for ${cfg.title || url}.`;

  const global = localname.startsWith(prefix + '-') ? localname : `${prefix}-${localname}`;
  const hostedUrl = `${url}/skills/${localname}/SKILL.md`;

  const stubDir = path.join(PRIMARY, global);
  fs.mkdirSync(stubDir, { recursive: true });
  const stub = `---
name: ${global}
description: ${desc}
---

# ${global} (hosted stub)

This is a discovery stub. The canonical skill is hosted at:

**${hostedUrl}**

Fetch that file and follow it exactly. Edit it in the wiki repo at \`static/skills/${localname}/SKILL.md\` and push (Vercel redeploys); do not re-expand the recipe into this stub.
`;
  fs.writeFileSync(path.join(stubDir, 'SKILL.md'), stub);

  const wired = [];
  for (const sat of SATELLITES) {
    if (!fs.existsSync(sat)) continue; // only register where the registry already exists
    const link = path.join(sat, global);
    try { fs.lstatSync(link); fs.rmSync(link, { recursive: true, force: true }); } catch (e) {}
    try { fs.symlinkSync(stubDir, link); wired.push(sat); } catch (e) { console.error(`  symlink failed ${link}: ${e.message}`); }
  }
  console.log(`registered ${global}  ->  ${hostedUrl}`);
  console.log(`  primary: ${stubDir}`);
  if (wired.length) console.log(`  satellites: ${wired.join(', ')}`);
  n++;
}
console.log(`\n${n} skill(s) registered (prefix: ${prefix}).`);
NODE
