#!/usr/bin/env bash
# Scaffold this wiki's personalized intake skill into static/skills/<name>/SKILL.md,
# served openly at <url>/skills/<name>/SKILL.md. The flow is chosen by `intake_mode`
# in wiki.config.json (source-grounded | authored-canon).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

node - "$ROOT" <<'NODE'
const fs = require('fs');
const path = require('path');
const ROOT = process.argv[2];

const cfgPath = path.join(ROOT, 'wiki.config.json');
if (!fs.existsSync(cfgPath)) {
  console.error("No wiki.config.json found. Run 'npm run init' first.");
  process.exit(1);
}
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));

const mode = (cfg.intake_mode || 'source-grounded').trim();
const tplPath = path.join(ROOT, 'scripts', 'templates', 'intake-skill', mode + '.SKILL.md');
if (!fs.existsSync(tplPath)) {
  console.error(`Unknown intake_mode '${mode}'. Expected 'source-grounded' or 'authored-canon'.`);
  process.exit(1);
}

const slug = (cfg.projectName || 'wiki').replace(/-wiki$/, '');
const name = slug + '-intake';
const url = (cfg.url || '').replace(/\/$/, '');

const out = fs.readFileSync(tplPath, 'utf8')
  .replace(/{{SKILL_NAME}}/g, name)
  .replace(/{{TITLE}}/g, cfg.title || '')
  .replace(/{{URL}}/g, url)
  .replace(/{{DESCRIPTION}}/g, cfg.description || '');

const dir = path.join(ROOT, 'static', 'skills', name);
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, 'SKILL.md'), out);

const hostedUrl = `${url}/skills/${name}/SKILL.md`;
console.log('');
console.log(`Wrote static/skills/${name}/SKILL.md  (intake_mode: ${mode})`);
console.log(`Will be served at: ${hostedUrl}  (after first deploy)`);
console.log('');
console.log('=== Register it globally (discovery stub) ===');
console.log('Create a thin local stub skill so your agent can discover and trigger it:');
console.log(`  - name: ${name}`);
console.log(`  - description: copy the description from the hosted SKILL.md frontmatter (that is what triggers it)`);
console.log(`  - body: "fetch and follow ${hostedUrl}"`);
console.log('Then symlink the stub into your global skill registries.');
console.log('(Gary: run /create-global-skill on the stub folder.)');
console.log('');
NODE
