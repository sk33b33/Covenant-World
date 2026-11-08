// Gospel (water/Galilee) tile set, built with pxl (https://github.com/crsolver/claude-pxl).
// Same top-down tile-grid conventions as art/genesis.px.js. Tree and rock are
// shared shapes — the live game already renders "oak" and "boulder" with the
// same fixed colours in every theme that uses them, so this zone needs no new
// object art, only its own ground palette.
//
// Build: npm run art:gospel (from the repo root).

pal({
  k: "#0a1613",                                           // outline
  a: "#4e8a5e", b: "#50905f", c: "#4b8459", d: "#3c6e49",  // shore grass 1/2/3, blade
  e: "#b3a077", f: "#ac9970", g: "#b9a77e",                // path
  h: "#d6c69a", i: "#d0c093",                              // sand
  l: "#2f7fa0", m: "#2f86a8", n: "#8fd4ec",                // lake water light/mid/highlight
  o: "#e8e8f2", p: "#f0dd6e",                              // shore flowers
  s: "#6b4a2f", t: "#4e3420",                              // bark
  u: "#467a3f", v: "#356630", w: "#2b5526",                // leaf light/mid/dark
  y: "#9aa0a3", z: "#7d8285", A: "#5c6164",                // rock light/mid/dark
  C: "#d8c48a", D: "#b8a26a", E: "#6b5a38",                // tent fabric light/shade/entrance
  G: "#5c5650", H: "#2a2622", I: "#0c0a0d", J: "#e8965a",  // cave stone/shade/mouth/ember
})
ramps("kwvua", "kHGyzA")

// ---------------------------------------------------------------- ground tiles (32x32)
sprite("_blade", "d\nd")

function shoreTile(name, base, seed) {
  sprite(name, { w: 32, h: 32 },
    rect(0, 0, 32, 32, base),
    scatter("_blade", 0, 0, 32, 32, 16, { seed }))
}
shoreTile("ground_grass_1", "a", 1)
shoreTile("ground_grass_2", "b", 2)
shoreTile("ground_grass_3", "c", 3)

sprite("ground_flowers", { base: "ground_grass_1" },
  (c) => {
    const rnd = c.rng(7)
    const colors = "op"
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
  grad(0, 0, 32, 32, "mln", "w"), noise(0, 0, 32, 32, "n", 0.05, 3))

sheet("ground", ["ground_grass_1", "ground_grass_2", "ground_grass_3", "ground_flowers", "ground_path", "ground_sand", "ground_water"], { pad: 1 })

// ---------------------------------------------------------------- standing objects

sprite("obj_tree", { w: 32, h: 44, outline: "k" },
  rect(14, 30, 4, 12, "s"), rect(17, 30, 1, 12, "t"),
  circ(16, 16, 15, "v"),
  shade([2, 2, 28, 28], 1, 0.5),
  circ(10, 10, 6, "u"))

sprite("obj_rock", { w: 32, h: 26, outline: "k" },
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

sheet("objects", ["obj_tree", "obj_rock", "obj_tent", "obj_cave"], { pad: 1 })
