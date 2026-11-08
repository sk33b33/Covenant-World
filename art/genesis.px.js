// Genesis (light/Eden) tile set + one character, built with pxl
// (https://github.com/crsolver/claude-pxl — see SKILL.md there for the DSL).
//
// Replaces the hand-coded canvas-vector decorations in the client with real
// pixel art, in the SAME top-down tile-grid layout the game already uses:
// ground tiles flat on the grid, "standing" objects (tree/rock/tent/cave)
// drawn as silhouettes anchored at their tile's bottom edge and sorted by y
// for depth — see client/main.js collectTallTerrain.
//
// Object/character sprites are transparent with no baked-in ground shadow —
// the client already draws that (groundShadow()) before placing the sprite.
//
// Build: npm run art:genesis (from the repo root). Only this one zone's
// theme so far — see docs/ARCHITECTURE.md for the rest of the plan.

pal({
  k: "#16240f",                                           // outline
  a: "#5a8f49", b: "#4e8040", c: "#6a9d56", d: "#3d6b36",  // grass 1/2/3, blade
  e: "#c9ad78", f: "#b89760", g: "#ad8a56",                // path
  h: "#e3d3a0", i: "#d8c68c",                              // sand
  j: "#4aa0da", l: "#3f8fd0", m: "#2f6fa8", n: "#8fd4f4",  // water light/mid/dark/highlight
  o: "#f0dd6e", p: "#ea88ac", q: "#e8e8f2", r: "#f2a94e",  // flowers
  s: "#6b4a2f", t: "#4e3420",                              // bark
  u: "#467a3f", v: "#356630", w: "#2b5526",                // leaf light/mid/dark
  y: "#9aa0a3", z: "#7d8285", A: "#5c6164",                // rock light/mid/dark
  C: "#d8c48a", D: "#b8a26a", E: "#6b5a38",                // tent fabric light/shade/entrance
  G: "#5c5650", H: "#2a2622", I: "#0c0a0d", J: "#e8965a",  // cave stone/shade/mouth/ember
  K: "#e8b48c", L: "#4a3520", M: "#3f74c0", N: "#2f5890",  // skin, hair, shirt, shirt-shade
})
ramps("kwvua", "kHGyzA", "kNM")

// ---------------------------------------------------------------- ground tiles (32x32)
sprite("_blade", "d\nd")

function grassTile(name, base, seed) {
  sprite(name, { w: 32, h: 32 },
    rect(0, 0, 32, 32, base),
    scatter("_blade", 0, 0, 32, 32, 16, { seed }))
}
grassTile("ground_grass_1", "a", 1)
grassTile("ground_grass_2", "b", 2)
grassTile("ground_grass_3", "c", 3)

sprite("ground_flowers", { base: "ground_grass_1" },
  (c) => {
    const rnd = c.rng(7)
    const colors = "opqr"
    for (let i = 0; i < 5; i++) {
      const x = 2 + Math.floor(rnd() * 28)
      const y = 2 + Math.floor(rnd() * 28)
      c.px(x, y, colors[Math.floor(rnd() * colors.length)])
    }
  })

sprite("ground_path", { w: 32, h: 32 },
  rect(0, 0, 32, 32, "e"), noise(0, 0, 32, 32, "f", 0.14, 1), noise(0, 0, 32, 32, "g", 0.04, 2))

sprite("ground_sand", { w: 32, h: 32 },
  rect(0, 0, 32, 32, "h"), noise(0, 0, 32, 32, "i", 0.12, 1))

sprite("ground_water", { w: 32, h: 32 },
  grad(0, 0, 32, 32, "mlj", "v"), noise(0, 0, 32, 32, "n", 0.05, 3))

sheet("ground", ["ground_grass_1", "ground_grass_2", "ground_grass_3", "ground_flowers", "ground_path", "ground_sand", "ground_water"], { pad: 1 })

// ---------------------------------------------------------------- standing objects

sprite("obj_tree_oak", { w: 32, h: 44, outline: "k" },
  rect(14, 30, 4, 12, "s"), rect(17, 30, 1, 12, "t"),
  circ(16, 16, 15, "v"),
  shade([2, 2, 28, 28], 1, 0.5),
  circ(10, 10, 6, "u"))

sprite("obj_rock_boulder", { w: 32, h: 26, outline: "k" },
  poly([4, 23, 8, 6, 22, 4, 28, 23], "z"),
  poly([8, 6, 22, 4, 18, 13, 10, 14], "y"),
  shade([16, 10, 14, 13], 1, 0.6))

sprite("obj_tent", { w: 32, h: 34, outline: "k" },
  poly([16, 3, 30, 31, 16, 31], "D"),
  poly([16, 3, 2, 31, 16, 31], "C"),
  poly([16, 10, 10, 31, 18, 31], "E"),
  line(2, 31, 0, 33, "D"), line(30, 31, 32, 33, "D"))

sprite("obj_cave", { w: 32, h: 30, outline: "k" },
  poly([1, 27, 3, 5, 29, 7, 31, 27], "G"),
  shade([20, 6, 10, 14], 1, 0.6),
  ellipse(16, 17, 7, 10, "I"), rect(9, 17, 14, 10, "I"),
  circ(16, 21, 3, "J"), glow("J", { r: 5, strength: 0.6 }))

sheet("objects", ["obj_tree_oak", "obj_rock_boulder", "obj_tent", "obj_cave"], { pad: 1 })

// ---------------------------------------------------------------- character
// Single static pose per facing (no walk cycle yet) — the client applies its
// existing procedural bob/sway on top, same as it did for the vector draw.

sprite("char_down", { w: 16, h: 24, outline: "k" },
  rect(3, 17, 4, 6, "k"), rect(9, 17, 4, 6, "k"),
  rect(2, 9, 12, 9, "M"),
  rect(0, 10, 2, 7, "K"), rect(14, 10, 2, 7, "K"),
  circ(8, 5, 5, "K"),
  shade([2, 9, 12, 9], 1, 0.5),
  poly([2, 0, 14, 0, 14, 4, 2, 4], "L"),
  px(5, 6, "k"), px(10, 6, "k"))

sprite("char_up", { w: 16, h: 24, outline: "k" },
  rect(3, 17, 4, 6, "k"), rect(9, 17, 4, 6, "k"),
  rect(2, 9, 12, 9, "M"),
  rect(0, 10, 2, 7, "K"), rect(14, 10, 2, 7, "K"),
  circ(8, 5, 5, "K"),
  shade([2, 9, 12, 9], 1, 0.5),
  circ(8, 5, 5, "L"))

sprite("char_right", { w: 16, h: 24, outline: "k" },
  rect(6, 17, 5, 6, "k"),
  rect(4, 9, 9, 9, "M"),
  rect(11, 11, 3, 6, "K"),
  circ(8, 5, 5, "K"),
  shade([4, 9, 9, 9], 1, 0.5),
  poly([3, 1, 13, 1, 13, 5, 9, 2, 4, 4], "L"),
  px(10, 6, "k"))

sprite("char_left", { base: "char_right", flip: "x" })

sheet("characters", ["char_down", "char_up", "char_left", "char_right"], { pad: 1 })
