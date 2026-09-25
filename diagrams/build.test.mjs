// Tests for the diagram kit. `node --test diagrams/` (or `pnpm test:diagrams`).
//
// What is worth testing here is not that shapes appear. It is that the kit REFUSES: a label
// that overruns its box, a card that cannot hold its lines, a diagram that renders NaN into a
// coordinate. Every one of those ships a broken picture behind a green build, which is the
// exact failure the build-time refusal exists to prevent, so the refusals get the tests.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { C, T, DIAGRAMS, card, fit, frame, legible, measure, minSize, mix, render, resolveTheme, text, drawIcon, PHONE_COLUMN, PHONE_MIN_PX } from "./build.mjs";

test("measure grows with both length and size", () => {
  assert.ok(measure("aaaa", { size: 20 }) > measure("aa", { size: 20 }));
  assert.ok(measure("hello", { size: 40 }) > measure("hello", { size: 20 }));
  assert.ok(measure("MMMM", { size: 20 }) > measure("iiii", { size: 20 }));
});

test("fit refuses a label wider than its slot, and names it", () => {
  assert.throws(
    () => fit("a label that is far too long for the space it was given", { size: 24, maxWidth: 120, where: "the test box" }),
    /does not fit the test box/,
  );
  // and passes the same label when the slot is genuinely wide enough
  assert.doesNotThrow(() => fit("short", { size: 24, maxWidth: 400 }));
});

test("a monospace stack is measured as monospace", () => {
  // The bug this pins: the proportional estimate treats `i` and `l` as narrow, which is true
  // of a sans face and false of a mono one, so a title in a mono brand font measured ~30%
  // under and ran off the card while the build stayed green.
  const mono = "'Geist Mono', ui-monospace, monospace";
  const line = "illuminating, in a title, in a mono face";
  assert.ok(measure(line, { size: 20, family: mono }) > measure(line, { size: 20 }));
  assert.equal(Math.round(measure("abcd", { size: 10, family: mono })), 24);
  assert.throws(() => text(0, 0, line, { size: 20, family: mono, maxWidth: 420 }), /does not fit/);
});

test("fit is not vacuous: it fails when the guard is removed", () => {
  // Mutation check. If `text` ever stops calling `fit`, this test is the thing that notices.
  assert.throws(() => text(0, 0, "an unmistakably over-long single line of label text", { size: 30, maxWidth: 80 }), /does not fit/);
});

test("card refuses content taller than the box", () => {
  assert.throws(
    () => card(0, 0, 300, 40, "A heading", ["one line", "two lines", "three lines"]),
    /needs about \d+px of height/,
  );
});

// An icon on a card used to be a second, separate call at a y the author guessed from the
// card's top, while the heading moved with the centred block. On a short card they crossed.
// These three pin the fix so it cannot be undone by someone tidying the signature.
test("a card's icon never overlaps its own heading", () => {
  // THIS IS THE CARD THAT ACTUALLY BROKE, to the pixel: 232x186, a 20px heading over two
  // 16px lines, a check icon at 0.8. Drawn the old way (a fixed offset from the card top,
  // with the card reserving no room for it) the icon's bottom landed 6px INSIDE the
  // heading. A comfortable card proves nothing here, because the bug only appears when the
  // block is tall enough relative to the card to rise into the icon.
  const scale = 0.8, r = 24;
  const svg = card(0, 0, 232, 186, "Kept healthy", ["outages are fixed", "the feed keeps working"], {
    headingSize: 20, lineSize: 16, pad: 18, icon: "check", iconScale: scale,
  });
  const iconY = Number(/translate\(\s*[\d.]+\s*,\s*([\d.]+)\s*\)/.exec(svg)[1]);
  const headingY = Number(/<text[^>]*y="([\d.]+)"/.exec(svg)[1]);
  const iconBottom = iconY + r * scale;
  const headingTop = headingY - 20; // baseline minus cap height at headingSize 20
  assert.ok(
    iconBottom <= headingTop,
    `icon bottom ${iconBottom} overlaps heading top ${headingTop}`,
  );
});

test("the height refusal counts the icon, and names it", () => {
  // Without the icon these lines fit. With it they do not, and the message has to say which
  // icon ate the room, or the author shrinks the wrong thing.
  assert.doesNotThrow(() => card(0, 0, 232, 120, "Heading", ["one line", "two lines"], { headingSize: 20, lineSize: 16 }));
  assert.throws(
    () => card(0, 0, 232, 120, "Heading", ["one line", "two lines"], { headingSize: 20, lineSize: 16, icon: "check" }),
    /the "check" icon is \d+px of that/,
  );
});

test("a card with no icon is byte-identical to before the icon option existed", () => {
  // The fix must not move any existing diagram. Every card in every wiki forked from this
  // template passes no icon, so this is the regression that would be widest and quietest.
  const y = 20, h = 196, headingSize = 20, lineSize = 16;
  const svg = card(10, y, 232, h, "Heading", ["one line"], { headingSize, lineSize, pad: 18 });
  assert.doesNotMatch(svg, /<g transform="translate/, "a card given no icon must draw none");

  // The ORIGINAL formula, written out, so this asserts the invariant rather than a number
  // somebody would later "correct" to whatever the code currently emits.
  const blockH = headingSize * 1.05 + (10 + 1 * lineSize * 1.28);
  const wasTop = y + (h - blockH) / 2 + headingSize * 0.82;
  const headingY = Number(/<text[^>]*y="([\d.]+)"/.exec(svg)[1]);
  assert.equal(Math.round(headingY * 100), Math.round(wasTop * 100));
});

test("text escapes markup rather than emitting it raw", () => {
  const s = text(0, 0, "files & folders <here>");
  assert.match(s, /files &amp; folders &lt;here&gt;/);
  assert.doesNotMatch(s, /<here>/);
});

test("the theme is read from the wiki's own files, not hardcoded", () => {
  const { C: c, T: t } = resolveTheme();
  for (const key of ["paper", "ink", "muted", "accent", "second", "edge"]) {
    assert.match(c[key], /^#[0-9a-fA-F]{6}$/, `${key} is not a hex colour`);
  }
  assert.notEqual(c.accent, c.ink, "the accent must be distinguishable from the body ink");
  assert.ok(t.title.length > 2 && t.body.length > 2, "both font stacks resolve");
  assert.equal(mix("#000000", "#ffffff", 0.5), "#808080");
});

test("drawIcon refuses an icon that does not exist", () => {
  assert.throws(() => drawIcon("no-such-icon", 0, 0), /no icon named/);
});

test("every registered diagram renders, and renders clean", () => {
  const out = mkdtempSync(join(tmpdir(), "diagrams-"));
  try {
    const names = Object.keys(DIAGRAMS);
    assert.ok(names.length > 0, "at least one diagram is registered");
    const files = render(names, { png: false, outDir: out, previewDir: out });
    assert.equal(files.length, names.length);
    for (const f of files) {
      const svg = readFileSync(f, "utf8");
      assert.match(svg, /^<svg [^>]*width="\d+" height="\d+"/m, `${f} is not a well-formed svg root`);
      assert.doesNotMatch(svg, /NaN|undefined|null"/, `${f} contains a broken coordinate or attribute`);
      assert.equal((svg.match(/<svg/g) || []).length, 1, `${f} has more than one svg root`);
      assert.ok(svg.trimEnd().endsWith("</svg>"), `${f} is truncated`);
    }
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("every rendered svg carries a provenance recipe the gate accepts", () => {
  const out = mkdtempSync(join(tmpdir(), "diagrams-"));
  try {
    const [file] = render([Object.keys(DIAGRAMS)[0]], { png: false, outDir: out, previewDir: out });
    const recipe = JSON.parse(readFileSync(`${file}.recipe.json`, "utf8"));
    assert.equal(recipe.generator, "diagrams/build.mjs");
    assert.ok(recipe.params.width > 0 && recipe.params.height > 0);
    assert.ok(recipe.params.palette.accent, "the recipe records the palette the diagram was drawn in");
    // Repo-relative, never absolute: a recipe under static/ is served publicly, and an
    // absolute path would publish a username.
    assert.doesNotMatch(JSON.stringify(recipe), /\/Users\/|\/home\//);
    assert.match(recipe.asset, /^static\/img\/diagrams\//);
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
});

test("render refuses a name that is not registered", () => {
  assert.throws(() => render(["not-a-diagram"], { png: false }), /no diagram named/);
});

test("the palette and fonts are exported for diagrams to use", () => {
  assert.ok(C.paper && C.accent && T.title && T.body);
});

// ── the phone floor ──────────────────────────────────────────────────────────────────────
// A diagram is shown scaled to the reader's column, and on a phone that is about 360px. Text
// that is legible in the source can reach the reader at 8px: it did, across a whole wiki, under
// a comment claiming nothing was smaller than 21px. These pin the refusal that replaced the
// comment.

test("minSize is the source size that reaches a 360px column at 12px", () => {
  assert.equal(PHONE_COLUMN, 360);
  assert.equal(PHONE_MIN_PX, 12);
  assert.equal(minSize(720), 24);
  assert.equal(minSize(900), 30);
  assert.equal(minSize(360), 12);
});

test("legible refuses text under the phone floor, and says what it shows at", () => {
  const svg = `<svg>${text(10, 10, "a seventeen pixel eyebrow", { size: 17 })}</svg>`;
  assert.throws(() => legible(svg, 720), /"a seventeen pixel eyebrow" in the diagram is 17px on a 720px canvas, which a 360px phone column shows at 8\.5px/);
  assert.doesNotThrow(() => legible(`<svg>${text(10, 10, "at the floor", { size: 24 })}</svg>`, 720));
});

test("legible holds hand-written text to the same floor, including text with no size at all", () => {
  // A <text> written by hand bypasses text(), so the check reads the emitted markup.
  assert.throws(() => legible('<svg><text x="0" y="0" font-size="20">axis</text></svg>', 720), /"axis"/);
  // SVG's default is 16px, which is under the floor on any canvas wider than 480.
  assert.throws(() => legible('<svg><text x="0" y="0">unsized</text></svg>', 720), /"unsized" in the diagram is 16px/);
});

test("frame refuses a diagram with illegible text: the guard is wired, not just defined", () => {
  // Mutation check. If frame() ever stops calling legible(), this is the test that notices.
  assert.throws(() => frame(720, 300, "A title", null, text(360, 200, "tiny", { size: 17 })), /"tiny" in "A title"/);
  assert.doesNotThrow(() => frame(720, 300, "A title", null, text(360, 200, "fine", { size: 24 })));
});

test("every registered diagram clears the phone floor", () => {
  for (const [name, fn] of Object.entries(DIAGRAMS)) {
    const svg = fn();
    const width = Number(/width="(\d+)"/.exec(svg)[1]);
    const sizes = [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
    assert.ok(sizes.length > 0, `${name} has no text`);
    const smallest = Math.min(...sizes);
    assert.ok(smallest * (PHONE_COLUMN / width) >= PHONE_MIN_PX, `${name}: smallest text is ${smallest}px on ${width}, ${(smallest * PHONE_COLUMN / width).toFixed(1)}px on a phone`);
  }
});
