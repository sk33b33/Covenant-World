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

sprite("_pebble", "g")

function parkTile(name, base, seed) {
  sprite(name, { w: 32, h: 32 },
    rect(0, 0, 32, 32, base),
    scatter("_blade", 0, 0, 32, 32, 20, { seed }),
    scatter("_pebble", 0, 0, 32, 32, 3, { seed: seed + 50 }))
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
sprite("obj_tree", { w: 40, h: 54, outline: "k" },
  poly([15, 52, 13, 40, 27, 40, 25, 52], "s"),
  rect(18, 38, 4, 14, "s"), rect(21, 38, 1, 14, "t"),
  circ(20, 20, 18, "v"),
  circ(12, 15, 10, "w"),
  circ(29, 17, 9, "w"),
  noise(3, 3, 34, 30, "w", 0.08, 5),
  shade([3, 3, 34, 34], 1, 0.45),
  circ(14, 11, 7, "u"))

// A proper two-storey street-front with lit windows on both floors and a
// chimney — the one shape unique to this zone.
sprite("obj_rock", { w: 44, h: 58, outline: "k" },
  rect(4, 32, 36, 24, "W"),
  rect(8, 16, 28, 18, "X"),
  shade([4, 32, 36, 24], 1, 0.5),
  shade([8, 16, 28, 18], 1, 0.4),
  poly([4, 16, 22, 2, 40, 16], "R"),
  shade([4, 4, 36, 14], 1, 0.4),
  rect(30, 1, 6, 11, "S"),
  rect(19, 44, 6, 12, "U"),
  rect(10, 36, 5, 5, "F"), glow("F", { r: 3, strength: 0.4 }),
  rect(29, 36, 5, 5, "F"), glow("F", { r: 3, strength: 0.4 }),
  rect(12, 21, 5, 5, "F"), glow("F", { r: 3, strength: 0.4 }),
  rect(27, 21, 5, 5, "F"), glow("F", { r: 3, strength: 0.4 }))

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
