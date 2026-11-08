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

sprite("_pebble", "A")

function shoreTile(name, base, seed) {
  sprite(name, { w: 32, h: 32 },
    rect(0, 0, 32, 32, base),
    scatter("_blade", 0, 0, 32, 32, 22, { seed }),
    scatter("_pebble", 0, 0, 32, 32, 3, { seed: seed + 50 }))
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
