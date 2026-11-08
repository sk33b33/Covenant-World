import * as THREE from "three";

const canvas = document.getElementById("stage");
const statusEl = document.getElementById("status");
const populationEl = document.getElementById("population");
const roomEl = document.getElementById("room");
const promptEl = document.getElementById("prompt");
const overlayEl = document.getElementById("overlay");
const labelsEl = document.getElementById("labels");

// The HTML-declared size is the game's logical viewport — captured before
// three.js's renderer touches the canvas's width/height attributes (it sets
// those to the *physical* framebuffer size, scaled by devicePixelRatio).
const VIEW_W = canvas.width;
const VIEW_H = canvas.height;

// Server positions jump one tick at a time (20Hz); these catch up to them every
// animation frame so movement reads as smooth at whatever the display refreshes.
// Each entry also carries its own 3D sprite, shadow, ring and name-tag label —
// see ensureCharacterEntry3D / removeRenderedEntry.
const rendered = new Map();

// "roaming" → "awaiting" (challenge sent) | "challenged" (challenge received) → "battling".
let mode = "roaming";
let incomingChallenge = null;
let nearby = null;
let notice = "";
let noticeUntil = 0;
let lastOverlaySignature = null;

const config = await fetch("/config.json").then((res) => res.json());
const endpoint = `${location.protocol === "https:" ? "wss" : "ws"}://${location.host}`;
const params = new URLSearchParams(location.search);
const name = params.get("name") ?? "";
const colyseus = new Colyseus.Client(endpoint);

let room;
let battleRoom = null;
let traveling = false;
let terrain = null;

// Walking speed in pixels/second, derived from how long the server takes to
// cross one tile — so the slide finishes exactly as the step does. World
// units in the 3D scene are the same pixel units used here (1 unit = 1px,
// one tile = config.tileSize units), so this feeds straight into 3D position.
const WALK_SPEED = config.tileSize / (config.stepDurationMs / 1000);
const tileToPixel = (tile) => (tile + 0.5) * config.tileSize;

// ======================================================================
// 3D scene — a true tilted "HD-2D" camera: pixel-art sprites staged over
// a real lit 3D ground plane, rather than screen-space tricks on a flat
// top-down canvas. The networking/movement code above and below is
// untouched — world positions are still plain (x, y) pixels on the
// server's tile grid; here they just become (x, z) in three.js's Y-up
// space, with Y itself used only for camera height and billboard anchoring.
// This whole section has to sit above connectToZone (even though it reads
// like a late-file "setup"), because connectToZone calls into it — building
// the ground mesh and sprite bundle — the moment the module starts running.
// ======================================================================

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(VIEW_W, VIEW_H);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color("#11151c");

const camera = new THREE.PerspectiveCamera(27, VIEW_W / VIEW_H, 10, 6000);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.68);
scene.add(ambientLight);

// The one shared "sun" every zone is lit by — low and raking, the same
// direction the old screen-space light wash faked. Sprites (trees, rocks,
// characters) stay unlit billboards; only the ground plane responds to it.
const sunLight = new THREE.DirectionalLight(0xffdfb0, 1.0);
sunLight.position.set(-260, 420, -200);
scene.add(sunLight);
scene.add(sunLight.target);

// Camera sits at a fixed angle/offset behind-above the player and simply
// translates to follow — it never rotates with facing, matching the fixed,
// dioramic camera these HD-2D games use.
const CAMERA_OFFSET = new THREE.Vector3(0, 460, 360);
const cameraTarget = new THREE.Vector3();

function updateCamera(selfEntry) {
  const focusX = selfEntry ? selfEntry.x : 0;
  const focusZ = selfEntry ? selfEntry.y : 0;
  cameraTarget.set(focusX, 0, focusZ);
  camera.position.set(focusX + CAMERA_OFFSET.x, CAMERA_OFFSET.y, focusZ + CAMERA_OFFSET.z);
  camera.lookAt(cameraTarget);
}

const THEME_BACKGROUNDS = {
  light: "#16240f",
  fire: "#2a1c0d",
  earth: "#221d16",
  spirit: "#1c1f22",
  water: "#0f2420",
  shadow: "#180a12",
};

// ---------------------------------------------------------------- sprite sheets
// Per-theme pixel-art sprite sheets (see art/*.px.js, built with `npm run
// art:all`), served from client/assets/art/<folder>/{ground,objects}.{png,
// json}. The character sheet is shared (the player's own look doesn't
// change by zone), so it's loaded once from the genesis folder regardless
// of theme.
const SPRITE_THEME_FOLDERS = {
  light: "genesis",
  fire: "exodus",
  earth: "kings",
  spirit: "prophets",
  water: "gospel",
  shadow: "revelation",
};
const CHARACTER_SHEET_FOLDER = "genesis";
const ANIMAL_SHEET_FOLDER = "animals";
// Which species wanders a given zone's theme — all drawn from one shared
// sheet (see art/animals.px.js), same idea as the shared character sheet.
const THEME_ANIMALS = {
  light: "sheep",
  fire: "camel",
  earth: "dog",
  spirit: "goat",
  water: "sheep",
  shadow: "crow",
};
const SPRITE_BUNDLE_PROMISES = new Map();
let characterSheetPromise = null;
let animalSheetPromise = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

async function loadSheet(folder, name) {
  const [img, meta] = await Promise.all([
    loadImage(`/assets/art/${folder}/${name}.png`),
    fetch(`/assets/art/${folder}/${name}.json`).then((res) => res.json()),
  ]);
  return { img, frames: meta.frames, size: meta.meta.size };
}

function loadCharacterSheet() {
  characterSheetPromise ??= loadSheet(CHARACTER_SHEET_FOLDER, "characters");
  return characterSheetPromise;
}

function loadAnimalSheet() {
  animalSheetPromise ??= loadSheet(ANIMAL_SHEET_FOLDER, "animals");
  return animalSheetPromise;
}

/** Loads (once, cached) the sprite bundle for a theme; awaited before a zone's scene is built. */
function ensureSpriteBundle(themeKey) {
  const folder = SPRITE_THEME_FOLDERS[themeKey] ?? SPRITE_THEME_FOLDERS.light;
  if (!SPRITE_BUNDLE_PROMISES.has(themeKey)) {
    SPRITE_BUNDLE_PROMISES.set(
      themeKey,
      Promise.all([loadSheet(folder, "ground"), loadSheet(folder, "objects"), loadCharacterSheet(), loadAnimalSheet()]).then(
        ([ground, objects, characters, animals]) => ({ ground, objects, characters, animals }),
      ),
    );
  }
  return SPRITE_BUNDLE_PROMISES.get(themeKey);
}

function groundFrameName(kind, noise) {
  if (kind === "flowers") return "ground_flowers";
  if (kind === "path") return "ground_path";
  if (kind === "sand") return "ground_sand";
  if (kind === "water") return "ground_water";
  return `ground_grass_${1 + Math.floor(noise * 3)}`; // also covers tree/rock/tent/cave tiles
}

const OBJECT_SPRITES = {
  tree: { frame: "obj_tree", shadow: 0.85 },
  rock: { frame: "obj_rock", shadow: 0.85 },
  tent: { frame: "obj_tent", shadow: 0.95 },
  cave: { frame: "obj_cave", shadow: 0.95 },
};

/** Stable per-tile variation, so the same tile always looks the same. */
function tileNoise(tx, ty) {
  const value = Math.sin(tx * 127.1 + ty * 311.7) * 43758.5453;
  return value - Math.floor(value);
}

function tileAt(tx, ty) {
  if (!terrain) return "grass";
  const char = terrain.rows[ty]?.[tx];
  if (!char) return "grass";
  for (const [kind, spec] of Object.entries(config.terrain)) if (spec.char === char) return kind;
  return "grass";
}

/** Crops a texture atlas down to one frame, keeping pixel-art edges crisp. */
function frameTexture(img, frame, sheetSize) {
  const texture = new THREE.Texture(img);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  texture.offset.set(frame.x / sheetSize.w, 1 - (frame.y + frame.h) / sheetSize.h);
  texture.repeat.set(frame.w / sheetSize.w, frame.h / sheetSize.h);
  texture.needsUpdate = true;
  return texture;
}

function billboardMaterial(img, frame, sheetSize) {
  return new THREE.SpriteMaterial({ map: frameTexture(img, frame, sheetSize), alphaTest: 0.5 });
}

// A soft round smudge, reused (tinted and scaled) for every ground-contact
// shadow and the green/red adjacency rings — cheaper than per-shape canvas
// draws, and now it's real geometry a 3D light doesn't have to fake.
function buildRadialTexture(inner, outer) {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(size / 2, size / 2, size * inner, size / 2, size / 2, size * outer);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const SHADOW_TEXTURE = buildRadialTexture(0, 0.4);
const RING_TEXTURE = (() => {
  const size = 64;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  g.strokeStyle = "rgba(255,255,255,1)";
  g.lineWidth = 4;
  g.beginPath();
  g.ellipse(size / 2, size / 2, size * 0.38, size * 0.38, 0, 0, Math.PI * 2);
  g.stroke();
  return new THREE.CanvasTexture(c);
})();

function makeShadowMesh(worldDiameter) {
  const mat = new THREE.MeshBasicMaterial({
    map: SHADOW_TEXTURE,
    color: 0x0a0604,
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(worldDiameter, worldDiameter * 0.6), mat);
  mesh.rotation.x = -Math.PI / 2;
  return mesh;
}

/** A small seeded PRNG so each zone's animals spawn in the same spots every load. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hashSeed(...parts) {
  let h = 0;
  for (const ch of parts.join("|")) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function makeRingMesh(color) {
  const mat = new THREE.MeshBasicMaterial({ map: RING_TEXTURE, color, transparent: true, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(52, 30), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  return mesh;
}

// ---------------------------------------------------------------- zone scene
// Terrain is static once generated, so the whole zone's ground is composited
// to one offscreen canvas ONCE (used as a single textured plane) and every
// standing object becomes a sprite built once too — nothing here is rebuilt
// per frame, unlike the old immediate-mode 2D canvas draw.

let zoneScene = null;

function clearZoneScene() {
  if (!zoneScene) return;
  scene.remove(zoneScene.group);
  zoneScene.group.traverse((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material?.map) obj.material.map.dispose();
    if (obj.material) obj.material.dispose();
  });
  zoneScene.groundTexture.dispose();
  for (const el of zoneScene.landmarkLabels) el.remove();
  zoneScene = null;
}

function buildZoneScene(terrainData, bundle, themeKey) {
  clearZoneScene();

  const size = config.tileSize;
  const w = terrainData.width * size;
  const h = terrainData.height * size;

  const groundCanvas = document.createElement("canvas");
  groundCanvas.width = w;
  groundCanvas.height = h;
  const groundCtx = groundCanvas.getContext("2d");

  const waterTiles = [];
  const walkableTiles = [];
  for (let ty = 0; ty < terrainData.height; ty++) {
    for (let tx = 0; tx < terrainData.width; tx++) {
      const kind = tileAt(tx, ty);
      const noise = tileNoise(tx, ty);
      const frame = bundle.ground.frames[groundFrameName(kind, noise)]?.frame;
      if (frame) groundCtx.drawImage(bundle.ground.img, frame.x, frame.y, frame.w, frame.h, tx * size, ty * size, size, size);
      if (kind === "water") waterTiles.push({ tx, ty, x: tx * size, y: ty * size });
      else if (config.terrain[kind]?.walkable) walkableTiles.push({ tx, ty, x: tx * size, y: ty * size });
    }
  }

  const groundTexture = new THREE.CanvasTexture(groundCanvas);
  groundTexture.colorSpace = THREE.SRGBColorSpace;
  groundTexture.magFilter = THREE.NearestFilter;
  groundTexture.minFilter = THREE.LinearMipmapLinearFilter;
  groundTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const group = new THREE.Group();

  const groundGeo = new THREE.PlaneGeometry(w, h);
  groundGeo.rotateX(-Math.PI / 2);
  groundGeo.translate(w / 2, 0, h / 2);
  const groundMat = new THREE.MeshLambertMaterial({ map: groundTexture });
  group.add(new THREE.Mesh(groundGeo, groundMat));

  // A thin perimeter line, echoing the old zone-boundary stroke.
  const borderPoints = [
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(w, 1, 0),
    new THREE.Vector3(w, 1, h),
    new THREE.Vector3(0, 1, h),
    new THREE.Vector3(0, 1, 0),
  ];
  const border = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(borderPoints),
    new THREE.LineBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }),
  );
  group.add(border);

  const landmarkLabels = [];
  for (const landmark of terrainData.landmarks ?? []) {
    const el = document.createElement("div");
    el.className = "label landmark";
    el.textContent = landmark.name;
    labelsEl.appendChild(el);
    landmarkLabels.push(Object.assign(el, { worldX: tileToPixel(landmark.tx), worldZ: landmark.ty * size + size * 0.2 }));
  }

  for (let ty = 0; ty < terrainData.height; ty++) {
    for (let tx = 0; tx < terrainData.width; tx++) {
      const kind = tileAt(tx, ty);
      const spec = OBJECT_SPRITES[kind];
      if (!spec) continue;
      const frame = bundle.objects.frames[spec.frame]?.frame;
      if (!frame) continue;

      const worldX = tileToPixel(tx);
      const worldZ = tileToPixel(ty);

      const shadow = makeShadowMesh(size * spec.shadow);
      shadow.position.set(worldX, 0.5, worldZ + size * 0.18);
      group.add(shadow);

      const sprite = new THREE.Sprite(billboardMaterial(bundle.objects.img, frame, bundle.objects.size));
      sprite.scale.set(frame.w, frame.h, 1);
      sprite.position.set(worldX, frame.h / 2, worldZ);
      group.add(sprite);
    }
  }

  // Ambient wildlife — decorative only (see art/animals.px.js header): each
  // one wanders a smooth deterministic loop around a seeded spawn point,
  // simulated locally per client rather than server-synced.
  const species = THEME_ANIMALS[themeKey] ?? THEME_ANIMALS.light;
  const animalFrame = bundle.animals.frames[species]?.frame;
  const animals = [];
  if (animalFrame && walkableTiles.length) {
    const rng = mulberry32(hashSeed(themeKey, String(terrainData.width), String(terrainData.height)));
    const count = Math.min(walkableTiles.length, 7);
    for (let i = 0; i < count; i++) {
      const tile = walkableTiles[Math.floor(rng() * walkableTiles.length)];

      const shadow = makeShadowMesh(size * 0.55);
      group.add(shadow);

      const sprite = new THREE.Sprite(billboardMaterial(bundle.animals.img, animalFrame, bundle.animals.size));
      sprite.scale.set(animalFrame.w, animalFrame.h, 1);
      group.add(sprite);

      animals.push({
        sprite,
        shadow,
        anchorX: tile.x + size / 2,
        anchorZ: tile.y + size / 2,
        radiusX: 50 + rng() * 60,
        radiusZ: 30 + rng() * 40,
        speed: 0.25 + rng() * 0.2,
        phase: rng() * Math.PI * 2,
        w: animalFrame.w,
        h: animalFrame.h,
      });
    }
  }

  scene.add(group);
  scene.background = new THREE.Color(THEME_BACKGROUNDS[themeKey] ?? THEME_BACKGROUNDS.light);
  scene.fog = new THREE.Fog(scene.background.getHex(), 420, 1500);
  sunLight.target.position.set(w / 2, 0, h / 2);

  zoneScene = { group, groundCanvas, groundCtx, groundTexture, groundSheet: bundle.ground, waterTiles, landmarkLabels, animals, width: w, height: h };
}

/** Animals wander a smooth deterministic loop — no server state, purely cosmetic. */
function updateAnimals(now) {
  if (!zoneScene) return;
  const t = now / 1000;
  for (const animal of zoneScene.animals) {
    const ang = t * animal.speed + animal.phase;
    const x = animal.anchorX + Math.sin(ang) * animal.radiusX;
    const z = animal.anchorZ + Math.sin(ang * 1.3 + animal.phase) * animal.radiusZ;
    const facing = Math.cos(ang) < 0 ? -1 : 1;

    animal.sprite.position.set(x, animal.h / 2, z);
    animal.sprite.scale.set(facing * animal.w, animal.h, 1);
    animal.shadow.position.set(x, 0.5, z + animal.h * 0.12);
  }
}

let lastShimmerUpdate = 0;

/** Water is the only ground tile that moves — redrawn at a modest rate, not every frame. */
function updateWaterShimmer(now) {
  if (!zoneScene || !zoneScene.waterTiles.length) return;
  if (now - lastShimmerUpdate < 120) return;
  lastShimmerUpdate = now;

  const size = config.tileSize;
  const groundSheet = zoneScene.groundSheet;
  const shimmer = now / 700;
  const { groundCtx: gctx } = zoneScene;
  const frame = groundSheet.frames["ground_water"]?.frame;
  if (!frame) return;

  for (const tile of zoneScene.waterTiles) {
    gctx.drawImage(groundSheet.img, frame.x, frame.y, frame.w, frame.h, tile.x, tile.y, size, size);
    const wave = Math.sin(shimmer + tile.tx * 0.7 + tile.ty * 0.4) * 3;
    gctx.fillStyle = "rgba(255,255,255,0.13)";
    gctx.fillRect(tile.x + 4, tile.y + 10 + wave, size - 12, 2);
    gctx.fillStyle = "rgba(255,255,255,0.07)";
    gctx.fillRect(tile.x + 9, tile.y + 21 - wave, size - 18, 2);
  }
  zoneScene.groundTexture.needsUpdate = true;
}

// ======================================================================
// Networking / input / game state — unchanged from the old renderer.
// ======================================================================

const KEY_BINDINGS = {
  ArrowUp: "up", KeyW: "up",
  ArrowDown: "down", KeyS: "down",
  ArrowLeft: "left", KeyA: "left",
  ArrowRight: "right", KeyD: "right",
};

const held = { up: false, down: false, left: false, right: false };
const pressedAt = {};
const releasedAt = {};
let lastSent = null;

/**
 * A key is reported as held for at least this long. The server samples held
 * direction on its own 20Hz tick, so a tap shorter than one tick would land
 * and clear between samples and be lost entirely — and tapping to turn on the
 * spot is exactly what the turn delay exists for.
 */
const MIN_HOLD_MS = 90;

/**
 * Joins a zone, or moves to another one. The matchmaker picks which *instance*
 * of that zone we land in, so this is also what happens when an instance fills
 * up and a new one opens.
 */
async function connectToZone(zoneId, entry) {
  traveling = true;
  statusEl.textContent = "travelling…";

  if (room) {
    try {
      await room.leave();
    } catch {
      // Already gone; nothing to wind down.
    }
  }

  // Nobody from the old zone exists here.
  for (const sessionId of [...rendered.keys()]) removeRenderedEntry(sessionId);
  nearby = null;
  backToRoaming("");

  const resolvedZoneId = zoneId ?? config.startingZone;
  const themeKey = config.zones.find((z) => z.id === resolvedZoneId)?.theme ?? "light";

  const [terrainData, bundle] = await Promise.all([
    fetch(`/zones/${resolvedZoneId}/terrain.json`).then((res) => res.json()),
    ensureSpriteBundle(themeKey),
  ]);
  terrain = terrainData;
  buildZoneScene(terrain, bundle, themeKey);

  try {
    room = await colyseus.joinOrCreate("zone", { name, zoneId, entry });
  } catch (error) {
    statusEl.textContent = `could not join: ${error.message}`;
    throw error;
  }

  // This is a test client — the live room handles are deliberately reachable
  // from the console (and from automated smoke tests).
  window.room = room;
  traveling = false;
  statusEl.textContent = "connected";

  room.onLeave(() => {
    if (traveling) return;
    statusEl.textContent = "disconnected";
    populationEl.textContent = "";
  });

  room.onMessage("challenge:sent", ({ name: target }) => {
    mode = "awaiting";
    incomingChallenge = { name: target };
  });
  room.onMessage("challenge:received", ({ from, name: challenger }) => {
    if (mode !== "roaming") return;
    mode = "challenged";
    incomingChallenge = { from, name: challenger };
  });
  room.onMessage("challenge:declined", ({ by }) => backToRoaming(`${by} declined`));
  room.onMessage("challenge:expired", () => backToRoaming("challenge expired"));
  room.onMessage("challenge:failed", ({ reason }) => backToRoaming(reason));
  room.onMessage("battle:start", ({ reservation }) => enterBattle(reservation));
  room.onMessage("battle:result", ({ outcome, won }) => {
    // The battle room's own state drives the result screen; this is the zone's
    // authoritative copy, and the only word a client that never made it into
    // the battle room gets.
    if (mode !== "battling") showNotice(outcome === "played" ? (won ? "you won" : "you lost") : `battle ${outcome}`);
  });
  room.onMessage("zone:travel", ({ zoneId: destination, entry: arrivalEdge }) => {
    // Held keys belong to the room we're leaving.
    for (const key of Object.keys(held)) held[key] = false;
    lastSent = null;
    connectToZone(destination, arrivalEdge);
  });
}

await connectToZone(params.get("zone") ?? config.startingZone);

window.addEventListener("keydown", onKey);
window.addEventListener("keyup", onKey);

function onKey(event) {
  const direction = KEY_BINDINGS[event.code];

  if (direction) {
    event.preventDefault();
    // Movement keys are dead outside the overworld — the server freezes you
    // during a battle anyway, so releasing them here keeps the two in step.
    if (event.type === "keydown") {
      if (!held[direction]) pressedAt[direction] = performance.now();
      held[direction] = mode === "roaming";
    } else {
      releasedAt[direction] = performance.now();
    }
    return;
  }

  if (event.type !== "keydown") return;

  if (event.code === "KeyE" && mode === "roaming" && nearby) {
    room.send("challenge", { targetSessionId: nearby.sessionId });
  } else if (event.code === "KeyY" && mode === "challenged") {
    room.send("challenge:respond", { from: incomingChallenge.from, accept: true });
    incomingChallenge = null;
    mode = "awaiting";
  } else if (event.code === "KeyN" && mode === "challenged") {
    room.send("challenge:respond", { from: incomingChallenge.from, accept: false });
    backToRoaming("declined");
  } else if (event.code === "KeyR" && mode === "battling" && battleRoom?.state?.phase === "active") {
    battleRoom.send("ready");
  }
}

async function enterBattle(reservation) {
  mode = "battling";
  incomingChallenge = null;

  try {
    battleRoom = await colyseus.consumeSeatReservation(reservation);
  } catch (error) {
    backToRoaming(`could not enter the battle: ${error.message}`);
    return;
  }

  window.battleRoom = battleRoom;
  battleRoom.onLeave(() => {
    battleRoom = null;
    window.battleRoom = null;
    backToRoaming("");
  });
}

function backToRoaming(message) {
  mode = "roaming";
  incomingChallenge = null;
  if (message) showNotice(message);
}

function showNotice(message) {
  notice = message;
  noticeUntil = performance.now() + 3000;
}

function sendInputIfChanged() {
  const now = performance.now();
  for (const direction of Object.keys(held)) {
    const releasedAfterPress = (releasedAt[direction] ?? -1) >= (pressedAt[direction] ?? 0);
    if (held[direction] && releasedAfterPress && now - (pressedAt[direction] ?? 0) >= MIN_HOLD_MS) {
      held[direction] = false;
    }
  }

  const serialized = JSON.stringify(held);
  if (serialized === lastSent) return;
  lastSent = serialized;
  room.send("input", held);
}

let previousFrame = performance.now();

function frame(now) {
  const delta = Math.min((now - previousFrame) / 1000, 0.1);
  previousFrame = now;

  if (traveling) {
    requestAnimationFrame(frame);
    return;
  }

  sendInputIfChanged();
  interpolate(delta);
  draw(now);
  drawOverlays(now);

  requestAnimationFrame(frame);
}

function interpolate(delta) {
  // The first state patch lands shortly after join, so the first few frames
  // render an empty world rather than a crash.
  const players = room.state?.players;
  if (!players) return;

  const present = new Set();
  const self = players.get(room.sessionId);
  let closest = null;

  players.forEach((player, sessionId) => {
    present.add(sessionId);
    const targetX = tileToPixel(player.tx);
    const targetY = tileToPixel(player.ty);
    let entry = rendered.get(sessionId);

    if (!entry) {
      entry = { x: targetX, y: targetY };
      rendered.set(sessionId, entry);
    }

    // Slide at a constant walking pace toward the tile the server says they're
    // on. A jump of more than a couple of tiles isn't walking — it's a spawn or
    // a zone change — so take it instantly rather than gliding across the map.
    const gapX = targetX - entry.x;
    const gapY = targetY - entry.y;
    const reach = WALK_SPEED * delta;

    if (Math.hypot(gapX, gapY) > config.tileSize * 2) {
      entry.x = targetX;
      entry.y = targetY;
    } else {
      entry.x = Math.abs(gapX) <= reach ? targetX : entry.x + Math.sign(gapX) * reach;
      entry.y = Math.abs(gapY) <= reach ? targetY : entry.y + Math.sign(gapY) * reach;
    }

    entry.name = player.name;
    entry.dir = player.dir;
    entry.moving = player.moving;
    entry.inBattle = player.inBattle;

    if (self && !self.inBattle && !player.inBattle && sessionId !== room.sessionId) {
      // Adjacency, diagonals included — the eight tiles around you.
      const distance = Math.max(Math.abs(self.tx - player.tx), Math.abs(self.ty - player.ty));
      if (distance <= config.challengeRadiusTiles && (!closest || distance < closest.distance)) {
        closest = { sessionId, name: player.name, distance };
      }
    }
  });

  for (const sessionId of [...rendered.keys()]) {
    if (!present.has(sessionId)) removeRenderedEntry(sessionId);
  }

  nearby = closest;
  // players.size is what this client can see, not the instance's population —
  // interest management means those are different numbers now.
  populationEl.textContent = `${players.size} visible · ${room.state.population} / ${config.zoneCapacity} here`;
  roomEl.textContent = `${room.state.zoneName} — ${room.state.zoneSubtitle} · instance ${room.roomId}`;
}

// ---------------------------------------------------------------- characters
// Direction materials are built once (shared across every player, including
// zone switches) since the character sheet never changes by theme.
let characterMaterials = null;

async function characterMaterialsReady() {
  if (characterMaterials) return characterMaterials;
  const sheet = await loadCharacterSheet();
  characterMaterials = {};
  for (const dir of ["down", "up", "left", "right"]) {
    characterMaterials[dir] = {};
    for (const pose of ["idle", "walk1", "walk2"]) {
      const frameName = pose === "idle" ? `char_${dir}` : `char_${dir}_${pose}`;
      const frame = sheet.frames[frameName].frame;
      characterMaterials[dir][pose] = { material: billboardMaterial(sheet.img, frame, sheet.size), w: frame.w, h: frame.h };
    }
  }
  return characterMaterials;
}
await characterMaterialsReady();

function ensureCharacterEntry3D(entry, sessionId) {
  if (entry.sprite3D) return;
  const base = characterMaterials.down.idle;

  const sprite = new THREE.Sprite(base.material);
  sprite.scale.set(base.w, base.h, 1);
  scene.add(sprite);

  const shadow = makeShadowMesh(24);
  scene.add(shadow);

  const nearRing = makeRingMesh(0x8ee88e);
  const battleRing = makeRingMesh(0xe06c75);
  scene.add(nearRing, battleRing);

  const label = document.createElement("div");
  label.className = "label" + (sessionId === room.sessionId ? " self" : "");
  labelsEl.appendChild(label);

  entry.sprite3D = sprite;
  entry.shadow3D = shadow;
  entry.nearRing3D = nearRing;
  entry.battleRing3D = battleRing;
  entry.label = label;
}

function removeRenderedEntry(sessionId) {
  const entry = rendered.get(sessionId);
  if (!entry) return;
  for (const obj of [entry.sprite3D, entry.shadow3D, entry.nearRing3D, entry.battleRing3D]) {
    if (!obj) continue;
    scene.remove(obj);
    obj.material?.dispose();
  }
  entry.label?.remove();
  rendered.delete(sessionId);
}

function updateCharacter3D(entry, sessionId, now) {
  ensureCharacterEntry3D(entry, sessionId);

  // A two-frame walk cycle (legs and the opposite arm alternate, baked into
  // char_*_walk1/walk2 — see art/genesis.px.js) plus a light bob/squash.
  entry.phase = (entry.phase ?? 0) + (entry.moving ? 0.22 : 0);
  if (!entry.moving) entry.phase = 0;
  const bob = entry.moving ? Math.abs(Math.sin(entry.phase)) * 4 : 0;
  const squash = entry.moving ? 1 - Math.abs(Math.sin(entry.phase)) * 0.04 : 1;

  const dir = entry.dir ?? "down";
  const dirSet = characterMaterials[dir] ?? characterMaterials.down;
  const pose = !entry.moving ? "idle" : Math.sin(entry.phase) >= 0 ? "walk1" : "walk2";
  const def = dirSet[pose];
  if (entry.sprite3D.material !== def.material) entry.sprite3D.material = def.material;
  entry.sprite3D.scale.set(def.w * (1 / squash), def.h * squash, 1);
  entry.sprite3D.position.set(entry.x, (def.h * squash) / 2 + bob, entry.y);

  entry.shadow3D.position.set(entry.x, 0.5, entry.y + 6);

  const isNearby = nearby?.sessionId === sessionId;
  entry.nearRing3D.visible = isNearby && !entry.inBattle;
  if (isNearby) entry.nearRing3D.position.set(entry.x, 0.6, entry.y + 4);

  entry.battleRing3D.visible = !!entry.inBattle;
  if (entry.inBattle) entry.battleRing3D.position.set(entry.x, 0.6, entry.y + 4);

  const screen = worldToScreen(entry.x, def.h * squash + bob + 14, entry.y);
  entry.label.style.left = `${screen.x}px`;
  entry.label.style.top = `${screen.y}px`;
  entry.label.style.display = screen.behind ? "none" : "block";
  if (entry.label.textContent !== entry.name) entry.label.textContent = entry.name ?? "";
}

// ---------------------------------------------------------------- draw
const projected = new THREE.Vector3();

function worldToScreen(x, y, z) {
  projected.set(x, y, z).project(camera);
  return {
    x: (projected.x * 0.5 + 0.5) * VIEW_W,
    y: (-projected.y * 0.5 + 0.5) * VIEW_H,
    behind: projected.z > 1,
  };
}

function draw(now) {
  if (!zoneScene) return;

  const self = rendered.get(room?.sessionId);
  updateCamera(self);
  updateWaterShimmer(now);
  updateAnimals(now);

  for (const [sessionId, entry] of rendered) updateCharacter3D(entry, sessionId, now);

  for (const label of zoneScene.landmarkLabels) {
    const screen = worldToScreen(label.worldX, 64, label.worldZ);
    label.style.left = `${screen.x}px`;
    label.style.top = `${screen.y}px`;
    label.style.display = screen.behind ? "none" : "block";
  }

  renderer.render(scene, camera);
}

function drawOverlays(now) {
  const showingNotice = notice && now < noticeUntil;
  const promptText =
    mode === "roaming" && nearby ? `Press E to challenge ${nearby.name}` : showingNotice ? notice : "";

  promptEl.hidden = promptText === "";
  if (promptText) promptEl.textContent = promptText;

  const overlay = overlayContent();
  const signature = JSON.stringify(overlay);
  if (signature === lastOverlaySignature) return;
  lastOverlaySignature = signature;

  overlayEl.hidden = overlay === null;
  if (overlay) overlayEl.innerHTML = overlay.map((line) => line).join("");
}

function overlayContent() {
  if (mode === "challenged" && incomingChallenge) {
    return [
      `<strong>${escapeHtml(incomingChallenge.name)} challenges you!</strong>`,
      `<div class="keys">[Y] accept · [N] decline</div>`,
    ];
  }

  if (mode === "awaiting") {
    return [`<strong>Waiting for ${escapeHtml(incomingChallenge?.name ?? "your opponent")}…</strong>`];
  }

  if (mode === "battling") {
    const state = battleRoom?.state;
    if (!state) return [`<strong>Entering battle…</strong>`];

    if (state.phase === "resolved") {
      const won = state.winnerZoneSessionId === room.sessionId;
      const headline = state.outcome === "forfeit" ? (won ? "Opponent forfeited" : "You forfeited") : won ? "You win!" : "You lose";
      return [`<strong>${headline}</strong>`, `<div class="keys">returning to the overworld…</div>`];
    }

    const names = [];
    state.players.forEach((player) => names.push(`${escapeHtml(player.name)}${player.ready ? " ✓" : ""}`));
    return [
      `<strong>Battle — ${names.join(" vs ")}</strong>`,
      `<div class="keys">${state.phase === "active" ? "[R] ready up" : "waiting for your opponent…"}</div>`,
      `<div class="keys">(placeholder match — the TCG ruleset goes here)</div>`,
    ];
  }

  return null;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

requestAnimationFrame(frame);
