// Kings (earth/royal city) tile set, built with pxl (https://github.com/crsolver/claude-pxl).
// Same top-down tile-grid conventions as art/genesis.px.js.
//
// Build: npm run art:kings (from the repo root).

pal({
  k: "#1a1510",                                           // outline
  a: "#7c9457", b: "#7f9759", c: "#799152", d: "#5f7a42",  // park ground 1/2/3, blade
  e: "#a89a83", f: "#a2937c", g: "#ad9f88",                // street
  h: "#c9b899", i: "#c3b28f",                              // plaza dust
  l: "#3f74a8", m: "#355f8a", n: "#8fc4ec",                // fountain water mid/dark/highlight
  o: "#e8d26a",                                            // market banner
  s: "#6b4a2f", t: "#4e3420",                              // bark (shared oak trunk)
  u: "#467a3f", v: "#356630", w: "#2b5526",                // leaf light/mid/dark (shared oak canopy)
  C: "#d8c48a", D: "#b8a26a", E: "#6b5a38",                // tent fabric light/shade/entrance
  G: "#5c5650", H: "#2a2622", I: "#0c0a0d", J: "#e8965a",  // cave stone/shade/mouth/ember
  W: "#d9c9a6", X: "#cdbd9a", Y: "#c3b28f",                // building wall shades
  R: "#8a4a3a", S: "#7a4034", T: "#96543f",                // building roof shades
  U: "#5c4632", F: "#ffe08a",                              // door, window light
})
ramps("kwvua", "kYXW", "kSRT", "IkHGJ")

// ---------------------------------------------------------------- ground tiles (32x32)
sprite("_blade", "d\nd")

function parkTile(name, base, seed) {
  sprite(name, { w: 32, h: 32 },
    rect(0, 0, 32, 32, base),
    scatter("_blade", 0, 0, 32, 32, 14, { seed }))
}
parkTile("ground_grass_1", "a", 1)
parkTile("ground_grass_2", "b", 2)
parkTile("ground_grass_3", "c", 3)

sprite("ground_flowers", { base: "ground_grass_1" },
  (c) => {
    const rnd = c.rng(7)
    for (let i = 0; i < 5; i++) {
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
  grad(0, 0, 32, 32, "ml", "l"), noise(0, 0, 32, 32, "n", 0.05, 3))

sheet("ground", ["ground_grass_1", "ground_grass_2", "ground_grass_3", "ground_flowers", "ground_path", "ground_sand", "ground_water"], { pad: 1 })

// ---------------------------------------------------------------- standing objects

// Same oak the game already uses in every theme that calls for "tree".
sprite("obj_tree", { w: 32, h: 44, outline: "k" },
  rect(14, 30, 4, 12, "s"), rect(17, 30, 1, 12, "t"),
  circ(16, 16, 15, "v"),
  shade([2, 2, 28, 28], 1, 0.5),
  circ(10, 10, 6, "u"))

// A plastered street-front with a lit window — the one shape unique to this zone.
sprite("obj_rock", { w: 32, h: 32, outline: "k" },
  rect(4, 12, 24, 16, "W"),
  shade([4, 12, 24, 16], 1, 0.6),
  poly([2, 12, 16, 4, 30, 12], "R"),
  shade([2, 4, 28, 8], 1, 0.4),
  rect(13, 20, 6, 10, "U"),
  rect(8, 18, 4, 4, "F"), glow("F", { r: 4, strength: 0.5 }),
  rect(20, 18, 4, 4, "F"), glow("F", { r: 4, strength: 0.5 }))

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
