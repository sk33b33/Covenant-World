// Revelation (shadow/new creation) tile set, built with pxl
// (https://github.com/crsolver/claude-pxl). Same top-down tile-grid
// conventions as art/genesis.px.js.
//
// Build: npm run art:revelation (from the repo root).

pal({
  k: "#0d0510",                                           // outline
  a: "#3c3540", b: "#3f3742", c: "#39323d", d: "#2c2730",  // scorched ground 1/2/3, blade
  e: "#332a34", f: "#362d37", g: "#302833",                // path
  h: "#4a3f47", i: "#453a42",                              // ash
  l: "#1c1224", m: "#20142a", n: "#5a3a60",                // dark pool mid/dark/highlight
  o: "#c96b6b",                                            // ember weed
  s: "#241f26",                                            // bare branch
  y: "#3a3440", z: "#2b2530", A: "#201c24",                // rubble light/mid/dark
  C: "#d8c48a", D: "#b8a26a", E: "#6b5a38",                // tent fabric light/shade/entrance
  G: "#5c5650", H: "#2a2622", I: "#0c0a0d", J: "#e8965a",  // cave stone/shade/mouth/ember
  R: "#e05a46",                                            // rubble coal glow
})
ramps("IkHGJ")

// ---------------------------------------------------------------- ground tiles (32x32)
sprite("_blade", "d\nd")

sprite("_pebble", "A")

function ashTile(name, base, seed) {
  sprite(name, { w: 32, h: 32 },
    rect(0, 0, 32, 32, base),
    scatter("_blade", 0, 0, 32, 32, 12, { seed }),
    scatter("_pebble", 0, 0, 32, 32, 4, { seed: seed + 50 }))
}
ashTile("ground_grass_1", "a", 1)
ashTile("ground_grass_2", "b", 2)
ashTile("ground_grass_3", "c", 3)

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
  rect(0, 0, 32, 32, "e"), noise(0, 0, 32, 32, "f", 0.14, 1), noise(0, 0, 32, 32, "g", 0.05, 2))

sprite("ground_sand", { w: 32, h: 32 },
  rect(0, 0, 32, 32, "h"), noise(0, 0, 32, 32, "i", 0.1, 1))

sprite("ground_water", { w: 32, h: 32 },
  grad(0, 0, 32, 32, "mln", "m"), noise(0, 0, 32, 32, "n", 0.04, 3))

sheet("ground", ["ground_grass_1", "ground_grass_2", "ground_grass_3", "ground_flowers", "ground_path", "ground_sand", "ground_water"], { pad: 1 })

// ---------------------------------------------------------------- standing objects

// A gnarled dead tree — the ruin left where the oak would have stood.
sprite("obj_tree", { w: 34, h: 48, outline: "k" },
  rect(14, 24, 4, 22, "s"),
  line(16, 24, 6, 10, "s"), line(16, 16, 26, 4, "s"), line(16, 10, 10, 2, "s"),
  line(16, 24, 24, 14, "s"),
  circ(8, 28, 2, "o"), circ(24, 32, 2, "o"))

// Collapsed stonework with a coal-like glow in the cracks.
sprite("obj_rock", { w: 40, h: 34, outline: "k" },
  poly([3, 32, 11, 18, 20, 6, 30, 19, 37, 32], "z"),
  poly([20, 6, 30, 19, 17, 22], "y"),
  rect(16, 20, 4, 7, "R"), glow("R", { r: 4, strength: 0.6 }),
  rect(26, 23, 3, 6, "R"), glow("R", { r: 4, strength: 0.6 }),
  rect(8, 26, 3, 5, "R"), glow("R", { r: 4, strength: 0.6 }))

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
