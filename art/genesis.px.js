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

sprite("_pebble", "A")

function grassTile(name, base, seed) {
  sprite(name, { w: 32, h: 32 },
    rect(0, 0, 32, 32, base),
    scatter("_blade", 0, 0, 32, 32, 24, { seed }),
    scatter("_pebble", 0, 0, 32, 32, 3, { seed: seed + 50 }))
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

sprite("obj_tree", { w: 40, h: 54, outline: "k" },
  poly([15, 52, 13, 40, 27, 40, 25, 52], "s"),
  rect(18, 38, 4, 14, "s"), rect(21, 38, 1, 14, "t"),
  circ(20, 20, 18, "v"),
  circ(12, 15, 10, "w"),
  circ(29, 17, 9, "w"),
  noise(3, 3, 34, 30, "w", 0.08, 5),
  shade([3, 3, 34, 34], 1, 0.45),
  circ(14, 11, 7, "u"))

sprite("obj_rock", { w: 40, h: 32, outline: "k" },
  poly([5, 29, 10, 8, 28, 5, 35, 29], "z"),
  poly([10, 8, 28, 5, 22, 17, 13, 18], "y"),
  poly([13, 18, 22, 17, 24, 26, 11, 27], "A"),
  shade([20, 12, 12, 10], 1, 0.6),
  circ(6, 29, 3, "z"), circ(33, 28, 2, "A"))

sprite("obj_tent", { w: 44, h: 46, outline: "k" },
  poly([22, 6, 42, 42, 22, 42], "D"),
  poly([22, 6, 2, 42, 22, 42], "C"),
  poly([22, 15, 14, 42, 26, 42], "E"),
  rect(2, 39, 40, 3, "E"),
  line(22, 1, 22, 7, "E"),
  poly([22, 0, 22, 5, 29, 3], "D"),
  line(2, 42, -2, 45, "D"), line(9, 42, 6, 46, "D"),
  line(42, 42, 46, 45, "D"), line(35, 42, 38, 46, "D"))

sprite("obj_cave", { w: 44, h: 42, outline: "k" },
  poly([2, 38, 4, 16, 10, 6, 22, 2, 34, 6, 40, 16, 42, 38], "G"),
  noise(2, 2, 40, 36, "H", 0.1, 4),
  shade([26, 6, 14, 18], 1, 0.6),
  ellipse(22, 24, 9, 14, "I"), rect(13, 24, 18, 14, "I"),
  poly([14, 10, 17, 2, 19, 11], "G"), poly([21, 9, 23, 1, 25, 10], "G"), poly([28, 10, 31, 3, 33, 11], "G"),
  circ(22, 30, 4, "J"), glow("J", { r: 6, strength: 0.6 }))

sheet("objects", ["obj_tree", "obj_rock", "obj_tent", "obj_cave"], { pad: 1 })

// ---------------------------------------------------------------- character
// A short walk cycle per facing: an idle pose plus two alternating stride
// frames, generated from the same primitives with the limbs offset rather
// than hand-drawn per frame. legs and the opposite-side arm swing against
// each other, same as a real gait. The client swaps frames by walk phase
// while entry.moving is true — see client/main.js updateCharacter3D.

function frontBody(name, swing) {
  sprite(name, { w: 16, h: 24, outline: "k" },
    rect(3, 17 + swing, 4, 6 - swing, "k"), rect(9, 17 - swing, 4, 6 + swing, "k"),
    rect(2, 9, 12, 9, "M"),
    rect(0, 10 - swing, 2, 7, "K"), rect(14, 10 + swing, 2, 7, "K"),
    circ(8, 5, 5, "K"),
    shade([2, 9, 12, 9], 1, 0.5),
    poly([2, 0, 14, 0, 14, 4, 2, 4], "L"),
    px(5, 6, "k"), px(10, 6, "k"))
}
frontBody("char_down", 0)
frontBody("char_down_walk1", 2)
frontBody("char_down_walk2", -2)

function backBody(name, swing) {
  sprite(name, { w: 16, h: 24, outline: "k" },
    rect(3, 17 + swing, 4, 6 - swing, "k"), rect(9, 17 - swing, 4, 6 + swing, "k"),
    rect(2, 9, 12, 9, "M"),
    rect(0, 10 - swing, 2, 7, "K"), rect(14, 10 + swing, 2, 7, "K"),
    circ(8, 5, 5, "K"),
    shade([2, 9, 12, 9], 1, 0.5),
    circ(8, 5, 5, "L"))
}
backBody("char_up", 0)
backBody("char_up_walk1", 2)
backBody("char_up_walk2", -2)

function sideBody(name, swing) {
  sprite(name, { w: 16, h: 24, outline: "k" },
    rect(6 + swing, 17, 5, 6, "k"),
    rect(4, 9, 9, 9, "M"),
    rect(11 - swing, 11, 3, 6, "K"),
    circ(8, 5, 5, "K"),
    shade([4, 9, 9, 9], 1, 0.5),
    poly([3, 1, 13, 1, 13, 5, 9, 2, 4, 4], "L"),
    px(10, 6, "k"))
}
sideBody("char_right", 0)
sideBody("char_right_walk1", 2)
sideBody("char_right_walk2", -2)

sprite("char_left", { base: "char_right", flip: "x" })
sprite("char_left_walk1", { base: "char_right_walk1", flip: "x" })
sprite("char_left_walk2", { base: "char_right_walk2", flip: "x" })

sheet("characters", [
  "char_down", "char_down_walk1", "char_down_walk2",
  "char_up", "char_up_walk1", "char_up_walk2",
  "char_left", "char_left_walk1", "char_left_walk2",
  "char_right", "char_right_walk1", "char_right_walk2",
], { pad: 1 })
