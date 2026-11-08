// Exodus (fire/wilderness) tile set, built with pxl (https://github.com/crsolver/claude-pxl).
// Same top-down tile-grid conventions as art/genesis.px.js — see that file's
// header comment and client/main.js collectTallTerrain for how these are used.
//
// Build: npm run art:exodus (from the repo root).

pal({
  k: "#1a0f05",                                           // outline
  a: "#8a7a44", b: "#8d7d47", c: "#847440", d: "#6b5e34",  // scrub ground 1/2/3, blade
  e: "#c79a5a", f: "#c29556", g: "#bf8f4c",                // path
  h: "#e2b877", i: "#dcae6c", j: "#e6c084",                // sand
  l: "#2f8f95", m: "#31989e", n: "#8fe4e4",                // oasis water mid/dark/highlight
  o: "#f0dd6e",                                            // desert wildflower
  s: "#8a6a3c", t: "#a9814a",                              // palm trunk dark/light
  u: "#3f8a4a", v: "#357a40",                              // palm frond light/dark
  y: "#8a8378", z: "#787168", A: "#625c54",                // boulder light/mid/dark
  C: "#d8c48a", D: "#b8a26a", E: "#6b5a38",                // tent fabric light/shade/entrance
  G: "#5c5650", H: "#2a2622", I: "#0c0a0d", J: "#e8965a",  // cave stone/shade/mouth/ember
})
ramps("IkHGzyJ")

// ---------------------------------------------------------------- ground tiles (32x32)
sprite("_blade", "d\nd")

sprite("_pebble", "A")

function scrubTile(name, base, seed) {
  sprite(name, { w: 32, h: 32 },
    rect(0, 0, 32, 32, base),
    scatter("_blade", 0, 0, 32, 32, 16, { seed }),
    scatter("_pebble", 0, 0, 32, 32, 4, { seed: seed + 50 }))
}
scrubTile("ground_grass_1", "a", 1)
scrubTile("ground_grass_2", "b", 2)
scrubTile("ground_grass_3", "c", 3)

sprite("ground_flowers", { base: "ground_grass_1" },
  (c) => {
    const rnd = c.rng(7)
    for (let i = 0; i < 4; i++) {
      const x = 2 + Math.floor(rnd() * 28)
      const y = 2 + Math.floor(rnd() * 28)
      c.px(x, y, "o")
    }
  })

sprite("ground_path", { w: 32, h: 32 },
  rect(0, 0, 32, 32, "e"), noise(0, 0, 32, 32, "f", 0.16, 1), noise(0, 0, 32, 32, "g", 0.05, 2))

sprite("ground_sand", { w: 32, h: 32 },
  rect(0, 0, 32, 32, "h"), noise(0, 0, 32, 32, "i", 0.16, 1), noise(0, 0, 32, 32, "j", 0.05, 2))

sprite("ground_water", { w: 32, h: 32 },
  grad(0, 0, 32, 32, "ml", "l"), noise(0, 0, 32, 32, "n", 0.05, 3))

sheet("ground", ["ground_grass_1", "ground_grass_2", "ground_grass_3", "ground_flowers", "ground_path", "ground_sand", "ground_water"], { pad: 1 })

// ---------------------------------------------------------------- standing objects

// A leaning palm — the one shape in this zone that isn't shared with another theme.
sprite("obj_tree", { w: 40, h: 56, outline: "k" },
  poly([20, 54, 26, 54, 30, 12, 24, 13], "s"),
  poly([23, 54, 26, 54, 28, 14, 26, 14], "t"),
  poly([28, 10, 6, 1, 11, 9, 28, 15], "v"),
  poly([28, 10, 2, 15, 9, 19, 28, 17], "u"),
  poly([28, 10, 4, 28, 12, 29, 28, 20], "v"),
  poly([28, 10, 22, 0, 30, 4, 30, 14], "v"),
  poly([28, 10, 38, 8, 35, 17, 28, 15], "u"),
  poly([28, 10, 39, 20, 32, 22, 28, 16], "v"),
  poly([28, 10, 36, 30, 29, 28, 28, 18], "u"),
  circ(24, 16, 2, "t"), circ(27, 18, 2, "t"))

// Same desert boulder the game already uses in every theme that calls for "rock".
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
