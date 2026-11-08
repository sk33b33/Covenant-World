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

function ashTile(name, base, seed) {
  sprite(name, { w: 32, h: 32 },
    rect(0, 0, 32, 32, base),
    scatter("_blade", 0, 0, 32, 32, 8, { seed }))
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
sprite("obj_tree", { w: 32, h: 42, outline: "k" },
  rect(14, 20, 4, 20, "s"),
  line(16, 20, 7, 8, "s"),
  line(16, 14, 25, 4, "s"),
  line(16, 8, 10, 2, "s"))

// Collapsed stonework with a coal-like glow in the cracks.
sprite("obj_rock", { w: 32, h: 28, outline: "k" },
  poly([3, 27, 9, 15, 16, 5, 24, 16, 29, 27], "z"),
  poly([16, 5, 24, 16, 14, 19], "y"),
  rect(13, 16, 3, 6, "R"), glow("R", { r: 4, strength: 0.6 }),
  rect(21, 19, 2, 5, "R"), glow("R", { r: 4, strength: 0.6 }))

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

sheet("objects", ["obj_tree", "obj_rock", "obj_tent", "obj_cave"], { pad: 1 })
