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

function scrubTile(name, base, seed) {
  sprite(name, { w: 32, h: 32 },
    rect(0, 0, 32, 32, base),
    scatter("_blade", 0, 0, 32, 32, 10, { seed }))
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
sprite("obj_tree", { w: 32, h: 44, outline: "k" },
  poly([18, 43, 22, 43, 25, 10, 21, 11], "s"),
  poly([20, 43, 22, 43, 24, 12, 22, 12], "t"),
  poly([23, 9, 6, 2, 10, 8, 23, 13], "v"),
  poly([23, 9, 2, 14, 8, 17, 23, 15], "u"),
  poly([23, 9, 18, 0, 24, 4, 25, 12], "v"),
  poly([23, 9, 31, 8, 29, 15, 23, 13], "u"),
  poly([23, 9, 30, 18, 25, 18, 23, 14], "v"))

// Same desert boulder the game already uses in every theme that calls for "rock".
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
