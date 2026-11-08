// Ambient wildlife, built with pxl (https://github.com/crsolver/claude-pxl).
// One shared sheet across every zone (like characters) — client/main.js picks
// which species wanders a given zone by its theme. These are decorative only:
// positions are simulated locally per-client (a small deterministic wander
// loop around a seeded spawn point), not server-synced, so different players
// see different animals in different spots — there's no gameplay tied to them.
//
// Build: npm run art:animals (from the repo root).

pal({
  k: "#241f1a",                          // outline
  w: "#f2ece0", x: "#ddd5c5",            // sheep wool light/shade
  f: "#2e2721",                          // legs/face/horns/eyes, shared
  c: "#c9a06a", e: "#b58d54",            // camel coat light/shade
  g: "#a89a86", h: "#8f8270",            // goat coat light/shade
  d: "#8a6a4a", j: "#6f5238",            // dog coat light/shade
  r: "#1c1a22", b: "#e8a33c",            // crow feather, beak
})
ramps("kxw", "kec", "khg", "kjd")

// Side profile, facing right — client/main.js flips the billboard for a
// left-facing instant rather than needing a mirrored frame.

sprite("sheep", { w: 36, h: 26, outline: "k" },
  rect(6, 18, 3, 7, "f"), rect(14, 18, 3, 7, "f"), rect(20, 18, 3, 7, "f"), rect(27, 18, 3, 7, "f"),
  ellipse(18, 14, 15, 9, "w"),
  circ(9, 11, 3, "w"), circ(29, 11, 3, "w"), circ(13, 7, 4, "w"), circ(23, 7, 4, "w"),
  shade([3, 6, 30, 16], 1, 0.35),
  circ(32, 13, 5, "f"))

sprite("camel", { w: 44, h: 34, outline: "k" },
  rect(8, 24, 3, 8, "f"), rect(16, 24, 3, 8, "f"), rect(26, 24, 3, 8, "f"), rect(34, 24, 3, 8, "f"),
  ellipse(22, 18, 16, 8, "c"),
  circ(14, 10, 8, "c"),
  rect(33, 4, 4, 18, "c"),
  circ(37, 4, 4, "c"),
  shade([6, 10, 30, 14], 1, 0.35))

sprite("goat", { w: 30, h: 22, outline: "k" },
  rect(5, 15, 3, 6, "f"), rect(11, 15, 3, 6, "f"), rect(17, 15, 3, 6, "f"), rect(23, 15, 3, 6, "f"),
  ellipse(15, 11, 12, 7, "g"),
  circ(25, 8, 5, "g"),
  line(26, 4, 29, 0, "f"), line(23, 4, 21, 0, "f"),
  shade([3, 5, 24, 12], 1, 0.4))

sprite("dog", { w: 26, h: 18, outline: "k" },
  rect(4, 12, 2, 5, "j"), rect(9, 12, 2, 5, "j"), rect(14, 12, 2, 5, "j"), rect(19, 12, 2, 5, "j"),
  ellipse(13, 9, 10, 5, "d"),
  circ(21, 7, 4, "d"),
  poly([24, 4, 26, 1, 25, 6], "j"),
  shade([3, 5, 18, 8], 1, 0.4))

sprite("crow", { w: 20, h: 16, outline: "k" },
  ellipse(10, 9, 7, 5, "r"),
  circ(16, 6, 3, "r"),
  poly([18, 5, 20, 6, 18, 7], "b"),
  rect(8, 13, 1, 3, "f"), rect(12, 13, 1, 3, "f"))

sheet("animals", ["sheep", "camel", "goat", "dog", "crow"], { pad: 1 })
