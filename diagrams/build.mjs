#!/usr/bin/env node
// Code-drawn diagrams for this wiki. One node script, no image model, no API key, no cost.
//
//   node diagrams/build.mjs              # render every diagram
//   node diagrams/build.mjs sample-flow  # render one (or several) by name
//   node diagrams/build.mjs --list       # names only
//   node diagrams/build.mjs --no-png     # skip the previews
//
// WHAT IT WRITES. One `.svg` per diagram into `static/img/diagrams/`, which is the shipped
// asset a page embeds, plus a 2x `.png` into `diagrams/preview/`, which is gitignored and
// exists only so a human or an agent can LOOK at the render before embedding it.
//
// WHY SVG SHIPS AND PNG DOES NOT. An SVG is a few KB, stays sharp at any width, and is not
// subject to the image-weight gate (`wiki check image-weight`), which exists because raster
// illustrations quietly reach gigabytes. A PNG in `static/` would fail that gate on format.
// So: embed the SVG, check the PNG.
//
//   ![What the diagram argues, in a sentence.](/img/diagrams/<name>.svg)
//
// WHY THIS EXISTS AT ALL. `wiki check ascii-diagrams` already refuses a diagram typed out of
// dashes and pipes, on the grounds that deterministic graphics belong in code. This is the
// code. A rendered illustration (`illustrations/scripts/render-hero.sh`) costs money and is
// the right tool for a scene with people in it; a diagram is a structure, and a structure
// should be computed: exact, diffable, re-renderable, and free.
//
// THE REFUSAL. Every label drawn inside a box is measured against the space it has, and the
// build THROWS when it does not fit rather than shipping a diagram with text hanging over an
// edge. Overflow is the one defect nobody reports, because the build is green and the page
// renders. Never widen the box by deleting the check.
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");

// ── the wiki's own colours ───────────────────────────────────────────────────────────────
// Read, never hardcoded, so a diagram looks like THIS wiki. Two sources, in order:
//
//   1. `diagrams` in wiki.config.json, when the wiki wants to say it explicitly.
//   2. the brand tokens in src/css/custom.css, which every wiki already sets.
//
// Everything else (the soft fills, the hairlines, the frame edge) is derived by mixing, so a
// wiki that sets one accent colour gets a whole coherent palette.
const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
const parseHex = (h) => {
  const s = String(h).trim().replace(/^#/, "");
  const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const toHex = (rgb) => "#" + rgb.map((n) => clamp(n).toString(16).padStart(2, "0")).join("");
/** Mix two colours. t=0 is all of `a`, t=1 is all of `b`. */
export const mix = (a, b, t) => {
  const A = parseHex(a) || [0, 0, 0], B = parseHex(b) || [255, 255, 255];
  return toHex(A.map((v, i) => v + (B[i] - v) * t));
};

function readCssTokens() {
  const css = join(ROOT, "src", "css", "custom.css");
  if (!existsSync(css)) return {};
  const src = readFileSync(css, "utf8");
  // Light mode only: the dark-mode block redefines the same names, and a diagram draws its
  // own paper rather than following the reader's theme.
  const start = Math.max(0, src.indexOf(":root"));
  const darkAt = src.indexOf("[data-theme='dark']");
  const root = src.slice(start, darkAt > start ? darkAt : undefined);
  const grab = (...names) => {
    for (const name of names) {
      const m = new RegExp(`${name}\\s*:\\s*([^;]+);`).exec(root);
      if (m) return m[1].trim();
    }
    return null;
  };
  return {
    primary: grab("--ifm-color-primary"),
    background: grab("--ifm-background-color", "--ifm-background-surface-color"),
    ink: grab("--ifm-font-color-base"),
    muted: grab("--ifm-font-color-secondary"),
    headingFont: grab("--ifm-heading-font-family"),
    baseFont: grab("--ifm-font-family-base"),
  };
}

function readWikiConfig() {
  const f = join(ROOT, "wiki.config.json");
  if (!existsSync(f)) return {};
  try { return JSON.parse(readFileSync(f, "utf8")); } catch { return {}; }
}

// A CSS token may be `#555`, `#5a5a5a`, or something this kit cannot draw with (a named
// colour, an rgb() call, a var()). Normalize what is usable to six digits and fall back to a
// declared default for anything else, so a diagram never inherits a value it cannot mix.
const hexOr = (value, fallback) => {
  const rgb = value ? parseHex(value) : null;
  return rgb ? toHex(rgb) : fallback;
};

export function resolveTheme() {
  const css = readCssTokens();
  const declared = readWikiConfig().diagrams || {};
  const paper = hexOr(declared.paper || css.background, "#FFFFFF");
  const ink = hexOr(declared.ink || css.ink, "#1A1A1A");
  const muted = hexOr(declared.muted || css.muted, mix(ink, paper, 0.45));
  // The accent is the one colour that carries meaning. A wiki whose primary is the same
  // near-black as its body text would draw a diagram with no colour in it at all, so fall
  // back to a restrained blue rather than to black on black.
  let accent = hexOr(declared.accent || css.primary, "");
  if (!accent || contrastPoor(accent, ink)) accent = "#2D4A7C";
  // A second colour, for the thing the diagram contrasts with the first. Derived by pulling
  // the accent toward a warm ochre, so it is always distinguishable from the accent and never
  // an arbitrary hue that fights the brand.
  const second = hexOr(declared.second, mix(accent, "#B07C24", 0.78));
  const C = {
    paper,
    ink,
    muted,
    accent,
    second,
    accentSoft: hexOr(declared.accentSoft, mix(accent, paper, 0.88)),
    accentMid: mix(accent, paper, 0.55),
    secondSoft: hexOr(declared.secondSoft, mix(second, paper, 0.86)),
    edge: hexOr(declared.edge, mix(ink, paper, 0.84)),
    hair: mix(ink, paper, 0.74),
    white: "#FFFFFF",
  };
  const stack = (f, fallback) => (f && f.length > 2 ? f : fallback);
  const T = {
    title: stack(declared.titleFont || css.headingFont, "Georgia, 'Times New Roman', serif"),
    body: stack(declared.bodyFont || css.baseFont, "'Helvetica Neue', Helvetica, Arial, sans-serif"),
  };
  return { C, T };
}
// True when two colours are so close that one drawn on the other would be invisible.
function contrastPoor(a, b) {
  const A = parseHex(a), B = parseHex(b);
  if (!A || !B) return true;
  return A.reduce((n, v, i) => n + Math.abs(v - B[i]), 0) < 90;
}

export const { C, T } = resolveTheme();

// ── primitives ───────────────────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const attrs = (o) => Object.entries(o)
  .filter(([, v]) => v !== undefined && v !== null && v !== "")
  .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}="${v}"`).join(" ");

// Width of a string at font-size 1, estimated per character. Approximate on purpose: it is a
// guard rail, not a typesetter, and it only has to be right enough to catch a label that
// visibly overruns its box. Tuned to run slightly WIDE, so it refuses before a reader sees it.
// A MONOSPACE STACK IS MEASURED AS MONOSPACE. Every glyph in one is the same width, so the
// per-character estimate below (which assumes a proportional face, where `i` is narrow) runs
// far UNDER the truth for a title set in a mono brand font, and a line that measured fine ran
// clean off the card. Caught by looking at a preview, which is why the preview exists.
const NARROW = new Set("ijltfrI.,;:'!|()[]{}/\\ ".split(""));
const WIDE = new Set("mwMW@%".split(""));
export function measure(str, { size = 20, weight = 500, family = "" } = {}) {
  if (/mono|courier|consolas|menlo/i.test(family)) return String(str).length * size * 0.605;
  let u = 0;
  for (const ch of String(str)) {
    if (ch === " ") u += 0.3;
    else if (NARROW.has(ch)) u += 0.34;
    else if (WIDE.has(ch)) u += 0.92;
    else if (ch >= "A" && ch <= "Z") u += 0.7;
    else if (ch >= "0" && ch <= "9") u += 0.58;
    else u += 0.55;
  }
  return u * size * (weight >= 600 ? 1.06 : 1);
}

/**
 * Refuse at build time when a label does not fit the space it was given.
 * This is the whole reason the kit is trustworthy: a diagram either fits or it fails loudly.
 */
export function fit(lines, { size, weight = 500, family = "", maxWidth, where = "a label" }) {
  if (!maxWidth) return;
  for (const line of Array.isArray(lines) ? lines : [lines]) {
    const w = measure(line, { size, weight, family });
    if (w > maxWidth) {
      throw new Error(
        `[diagrams] "${line}" does not fit ${where}: needs about ${Math.ceil(w)}px at ${size}px, has ${Math.floor(maxWidth)}px.\n` +
        `           Shorten the label, split it across lines, or widen the box. Never delete this check.`,
      );
    }
  }
}

/** Text, one line or an array of lines. Centred on x unless `anchor` says otherwise. */
export function text(x, y, lines, opts = {}) {
  const {
    size = 20, family = T.body, weight = 500, fill = C.ink, anchor = "middle",
    lead = 1.28, italic = false, tracking = 0, maxWidth, where,
  } = opts;
  const ls = (Array.isArray(lines) ? lines : [lines]).filter((l) => l !== undefined && l !== null && l !== "");
  if (!ls.length) return "";
  fit(ls, { size, weight, family, maxWidth, where: where || `its ${Math.floor(maxWidth || 0)}px slot` });
  const spans = ls.map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : (size * lead).toFixed(1)}">${esc(l)}</tspan>`).join("");
  return `<text ${attrs({
    x, y, fontFamily: family, fontSize: size, fontWeight: weight, fill,
    textAnchor: anchor, letterSpacing: tracking || null, fontStyle: italic ? "italic" : null,
  })}>${spans}</text>`;
}

/** A small tracked-out uppercase label. Use it to say what a group of shapes IS. */
export const eyebrow = (x, y, s, { fill = C.muted, anchor = "middle", size = 15, maxWidth, where } = {}) =>
  text(x, y, String(s).toUpperCase(), { size, weight: 700, fill, anchor, tracking: 1.9, maxWidth, where });

/** The page a diagram is drawn on: rounded card, title, optional subtitle. */
export function frame(w, h, title, subtitle, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
<defs>
  <marker id="arrow" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="${C.accent}"/></marker>
  <marker id="arrow-second" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="${C.second}"/></marker>
  <marker id="arrow-muted" viewBox="0 0 10 10" refX="7.5" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M1,1 L9,5 L1,9 Z" fill="${C.muted}"/></marker>
</defs>
<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="26" fill="${C.paper}" stroke="${C.edge}" stroke-width="3"/>
${title ? text(w / 2, 78, title, { size: 38, family: T.title, weight: 700, maxWidth: w - 120, where: "the diagram title" }) : ""}
${subtitle ? text(w / 2, 116, subtitle, { size: 21, fill: C.muted, maxWidth: w - 140, where: "the diagram subtitle" }) : ""}
${body}
</svg>
`;
}

/**
 * A box with a heading and optional lines under it. Every label is measured against the
 * box's own width, so a card that cannot hold its text fails the build.
 */
export function card(x, y, w, h, heading, lines = [], opts = {}) {
  const {
    fill = C.white, stroke = C.accent, strokeWidth = 3, dash = false, radius = 18,
    headingSize = 22, headingFill = C.ink, lineSize = 17, lineFill = C.muted,
    pad = 22, align = "middle", eyebrowText = null, eyebrowFill = C.muted,
  } = opts;
  const inner = w - pad * 2;
  const tx = align === "start" ? x + pad : x + w / 2;
  const ls = Array.isArray(lines) ? lines : [lines];
  const where = `the "${heading}" card`;
  const blockH = (eyebrowText ? 26 : 0) + headingSize * 1.05 + (ls.length ? 10 + ls.length * lineSize * 1.28 : 0);
  if (blockH > h - 16) {
    throw new Error(`[diagrams] ${where} needs about ${Math.ceil(blockH + 16)}px of height and has ${h}px. Make the card taller or drop a line.`);
  }
  let top = y + (h - blockH) / 2 + headingSize * 0.82;
  let s = `<rect ${attrs({ x, y, width: w, height: h, rx: radius, fill, stroke, strokeWidth, strokeDasharray: dash ? "9 7" : null })}/>`;
  if (eyebrowText) {
    s += eyebrow(tx, top - headingSize * 0.75, eyebrowText, { fill: eyebrowFill, anchor: align, maxWidth: inner, where });
    top += 26;
  }
  s += text(tx, top, heading, { size: headingSize, weight: 700, fill: headingFill, anchor: align, maxWidth: inner, where });
  if (ls.length) {
    s += text(tx, top + 10 + lineSize, ls, { size: lineSize, fill: lineFill, anchor: align, maxWidth: inner, where });
  }
  return s;
}

/** A straight arrow. `dash` for a relationship that is optional or swappable. */
export function arrow(x1, y1, x2, y2, { color = C.accent, width = 4, dash = false, head = "arrow" } = {}) {
  const marker = color === C.second ? "arrow-second" : color === C.muted ? "arrow-muted" : head;
  return `<path ${attrs({
    d: `M${x1},${y1} L${x2},${y2}`, fill: "none", stroke: color, strokeWidth: width,
    strokeLinecap: "round", strokeDasharray: dash ? "10 8" : null, markerEnd: `url(#${marker})`,
  })}/>`;
}

export const polar = (cx, cy, r, deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
export const arc = (cx, cy, r, a0, a1) => {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${r},${r} 0 ${Math.abs(a1 - a0) > 180 ? 1 : 0} ${a1 > a0 ? 1 : 0} ${x1.toFixed(1)},${y1.toFixed(1)}`;
};

/** A hairline rule, for separating bands inside one diagram. */
export const rule = (x1, y, x2, { color = C.hair, width = 2, dash = false } = {}) =>
  `<path ${attrs({ d: `M${x1},${y} H${x2}`, stroke: color, strokeWidth: width, strokeLinecap: "round", strokeDasharray: dash ? "3 8" : null })}/>`;

// ── line icons ───────────────────────────────────────────────────────────────────────────
// Each is drawn around (0,0) in a roughly 64px box, stroked not filled, so one icon reads at
// any size and in any colour. Add one here rather than inlining a path in a diagram.
export const icons = {
  person: (s) => `<circle cx="0" cy="-13" r="9" ${s}/><path d="M-18,21 a18,18 0 0 1 36,0" ${s}/>`,
  file: (s) => `<path d="M-16,-24 H6 L18,-12 V24 H-16 Z" ${s}/><path d="M6,-24 V-12 H18" ${s}/><path d="M-8,2 H10 M-8,12 H10" ${s}/>`,
  folder: (s) => `<path d="M-24,-16 H-6 L0,-9 H24 V20 H-24 Z" ${s}/>`,
  laptop: (s) => `<rect x="-24" y="-19" width="48" height="32" rx="4" ${s}/><path d="M-32,19 H32 L28,24 H-28 Z" ${s}/>`,
  terminal: (s) => `<rect x="-26" y="-20" width="52" height="40" rx="6" ${s}/><path d="M-14,-4 L-5,3 L-14,10 M0,12 H12" ${s}/>`,
  chat: (s) => `<path d="M-22,-18 H22 a6,6 0 0 1 6,6 V6 a6,6 0 0 1 -6,6 H-4 L-14,22 V12 H-22 a6,6 0 0 1 -6,-6 V-12 a6,6 0 0 1 6,-6 Z" ${s}/>`,
  loop: (s) => `<path d="M17,-13 A21,21 0 1 0 21,6" ${s}/><path d="M9,-19 L19,-13 L11,-3" ${s}/>`,
  gear: (s) => `<circle cx="0" cy="0" r="9" ${s}/><path d="M0,-22 V-14 M0,14 V22 M-22,0 H-14 M14,0 H22 M-15.5,-15.5 L-10,-10 M10,10 L15.5,15.5 M15.5,-15.5 L10,-10 M-10,10 L-15.5,15.5" ${s}/>`,
  clock: (s) => `<circle cx="0" cy="0" r="20" ${s}/><path d="M0,-12 V1 L9,7" ${s}/>`,
  check: (s) => `<circle cx="0" cy="0" r="20" ${s}/><path d="M-9,1 L-2,8 L10,-7" ${s}/>`,
  cross: (s) => `<circle cx="0" cy="0" r="20" ${s}/><path d="M-8,-8 L8,8 M8,-8 L-8,8" ${s}/>`,
  lock: (s) => `<rect x="-15" y="-4" width="30" height="24" rx="4" ${s}/><path d="M-9,-4 V-11 a9,9 0 0 1 18,0 V-4" ${s}/>`,
  chart: (s) => `<path d="M-22,18 V-18 M-22,18 H22" ${s}/><path d="M-14,10 V-2 M-2,10 V-10 M10,10 V-16" ${s}/>`,
  stack: (s) => `<path d="M0,-20 L22,-9 L0,2 L-22,-9 Z" ${s}/><path d="M-22,1 L0,12 L22,1" ${s}/><path d="M-22,11 L0,22 L22,11" ${s}/>`,
  spark: (s) => `<path d="M0,-22 L6,-6 L22,0 L6,6 L0,22 L-6,6 L-22,0 L-6,-6 Z" ${s}/>`,
  pen: (s) => `<path d="M-18,18 L-14,4 L6,-16 L14,-8 L-6,12 Z" ${s}/><path d="M6,-16 L14,-8" ${s}/>`,
  box: (s) => `<rect x="-20" y="-16" width="40" height="32" rx="5" ${s}/><path d="M-20,-4 H20" ${s}/>`,
};
export function drawIcon(name, x, y, { color = C.accent, scale = 1, width = 3.1 } = {}) {
  if (!icons[name]) throw new Error(`[diagrams] no icon named "${name}". Have: ${Object.keys(icons).join(", ")}`);
  const s = `fill="none" stroke="${color}" stroke-width="${(width / scale).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"`;
  return `<g transform="translate(${x},${y}) scale(${scale})">${icons[name](s)}</g>`;
}

// ── the worked sample ────────────────────────────────────────────────────────────────────
// Copy this function, rename it, register it below, and draw what YOUR page argues. It shows
// every part of the kit: the frame, an eyebrow, cards whose labels are measured, icons,
// arrows, a dashed optional path, and a closing line.
export function sampleFlow() {
  const W = 900;
  const pad = 56, colW = 232, gap = (W - pad * 2 - colW * 3) / 2;
  const top = 200, cardH = 196;
  const steps = [
    ["chat", "Something happens", ["a call, a decision,", "a draft, a message"]],
    ["folder", "It lands in a file", ["plain text you own,", "in version control"]],
    ["terminal", "A machine reads it", ["before it acts,", "on every later run"]],
  ];
  let b = eyebrow(W / 2, 160, "the sample diagram, drawn in code", { fill: C.muted });
  steps.forEach(([ic, heading, lines], i) => {
    const x = pad + i * (colW + gap);
    b += card(x, top, colW, cardH, heading, lines, {
      stroke: i === 2 ? C.second : C.accent,
      fill: i === 2 ? C.secondSoft : C.white,
      headingSize: 20, lineSize: 16, pad: 18,
    });
    b += drawIcon(ic, x + colW / 2, top + 46, { color: i === 2 ? C.second : C.accent, scale: 0.82 });
    if (i < steps.length - 1) {
      b += arrow(x + colW + 12, top + cardH / 2, x + colW + gap - 12, top + cardH / 2, { color: C.accent });
    }
  });
  // the return path: what the machine reads shapes what gets captured next
  const loopY = top + cardH + 86;
  b += `<path ${attrs({
    d: `M${pad + 2 * (colW + gap) + colW / 2},${top + cardH + 8} V${loopY} H${pad + colW / 2} V${top + cardH + 16}`,
    fill: "none", stroke: C.second, strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round",
    strokeDasharray: "10 8", markerEnd: "url(#arrow-second)",
  })}/>`;
  b += text(W / 2, loopY - 14, "and what it reads decides what is worth capturing next", { size: 17, fill: C.second });
  const y = loopY + 66;
  b += rule(pad, y, W - pad);
  b += text(W / 2, y + 44, "Every diagram here is drawn in diagrams/build.mjs.", {
    size: 20, family: T.title, italic: true, weight: 600, maxWidth: W - pad * 2, where: "the closing line",
  });
  return frame(W, y + 84, "How to read a diagram here", "Three boxes, one argument, no image model", b);
}

// ── the registry ─────────────────────────────────────────────────────────────────────────
// name -> function. The name is the filename and the URL: /img/diagrams/<name>.svg
export const DIAGRAMS = {
  "sample-flow": sampleFlow,
};

// ── render ───────────────────────────────────────────────────────────────────────────────
// Provenance rides along, because `wiki check provenance` holds every generated image in the
// repo to it and because six months from now the questions are the same ones it answers: what
// made this, from what, with which palette. Two honest origins here, both from the ABU rule:
//
//   the SVG  a GENERATOR drew it   -> generator + params (no model, no prompt, no timestamp,
//                                     because the output is deterministic and a clock in the
//                                     file would churn the diff on every rebuild)
//   the PNG  a TRANSFORM derived it -> mode "derive" + derivedFrom + generator
//
// Paths in a recipe are repo-relative. An absolute path leaks a username onto a public site.
const recipeFor = (obj) => JSON.stringify(obj, null, 2) + "\n";

export function render(names = Object.keys(DIAGRAMS), { png = true, outDir = join(ROOT, "static", "img", "diagrams"), previewDir = join(HERE, "preview") } = {}) {
  mkdirSync(outDir, { recursive: true });
  if (png) mkdirSync(previewDir, { recursive: true });
  const written = [];
  let rsvg = png;
  for (const name of names) {
    const fn = DIAGRAMS[name];
    if (!fn) throw new Error(`[diagrams] no diagram named "${name}". Have: ${Object.keys(DIAGRAMS).join(", ")}`);
    const svg = fn();
    const file = join(outDir, `${name}.svg`);
    const dims = /width="(\d+)" height="(\d+)"/.exec(svg);
    const width = Number(dims?.[1]) || 900, height = Number(dims?.[2]) || 0;
    writeFileSync(file, svg);
    writeFileSync(`${file}.recipe.json`, recipeFor({
      asset: `static/img/diagrams/${name}.svg`,
      generator: "diagrams/build.mjs",
      params: { diagram: name, width, height, palette: C, fonts: T },
    }));
    written.push(file);
    if (rsvg) {
      const preview = join(previewDir, `${name}.png`);
      try {
        execFileSync("rsvg-convert", ["-w", String(width * 2), "-o", preview, file]);
        writeFileSync(`${preview}.recipe.json`, recipeFor({
          asset: `${name}.png`,
          mode: "derive",
          derivedFrom: `static/img/diagrams/${name}.svg`,
          generator: "rsvg-convert, via diagrams/build.mjs",
          params: { width: width * 2 },
          // The gate requires a timestamp, and it costs nothing here because the preview is
          // gitignored. The SVG's recipe deliberately has none: it is committed, and a clock
          // in a committed file churns the diff on every rebuild of an identical picture.
          generatedAt: new Date().toISOString(),
        }));
      } catch (e) {
        if (e.code === "ENOENT") { rsvg = false; console.warn("[diagrams] rsvg-convert not on PATH, skipping previews (brew install librsvg)"); }
        else throw e;
      }
    }
  }
  return written;
}

function main(argv) {
  const flags = argv.filter((a) => a.startsWith("--"));
  const names = argv.filter((a) => !a.startsWith("--"));
  if (flags.includes("--list")) { console.log(Object.keys(DIAGRAMS).join("\n")); return; }
  const out = render(names.length ? names : Object.keys(DIAGRAMS), { png: !flags.includes("--no-png") });
  for (const f of out) console.log(f);
  console.log(`[diagrams] ${out.length} rendered. Previews in diagrams/preview/ (gitignored). Look at them before embedding.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { main(process.argv.slice(2)); }
  catch (e) { console.error(e.message); process.exit(1); }
}
