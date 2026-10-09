// Dashboard "knowledge galaxy" (Three.js). Each library group of the sidebar is
// a sun; its subjects are planets orbiting it, sized by topic count, with a ring
// whose arc fills as topics are completed. Nothing here is hard-coded: the
// systems, planets and numbers all come from the metadata and progress passed in.
//
// Click (or tap) a planet, use the arrow keys, or pick "View in knowledge map"
// in search: the camera flies to that subject, everything else dims, and a
// detail panel (built by the dashboard) opens below the map. Clicking a sun
// zooms into its system — on a phone that is how the planets' names become
// readable — and the panel lists the system's subjects.
//
// It is an enhancement only: the subject cards on the dashboard carry the same
// information accessibly. Loaded lazily, rendered only while visible and only
// when something moves, static when the user prefers reduced motion, and fully
// disposed on navigation.

import * as THREE from '../../assets/vendor/three-0.170.0/three.module.min.js';
import { el, icon, announce, prefersReducedMotion } from '../util.js';
import { FOCUS_EVENT, takePendingFocus } from '../map-focus.js';

// Camera always looks down at the galactic plane from this elevation; only its
// distance and target change. A fixed angle keeps flights simple and calm.
const ELEVATION = THREE.MathUtils.degToRad(58);
const VIEW_DIR = new THREE.Vector3(0, Math.sin(ELEVATION), Math.cos(ELEVATION));
const FLY_MS = 750;
// One revolution of a solar system takes about four minutes: alive, not busy.
const ORBIT_SPEED = 0.026;

// Layout, in world units. Planets keep PLANET_GAP between them along an orbit
// (room for their labels); further planets move to the next orbit out.
const SUN_RADIUS = 0.42;
const FIRST_ORBIT = 2.1;
const ORBIT_STEP = 1.35;
const PLANET_GAP = 2.3;
const SYSTEM_MARGIN = 1.1;

function token(name, fallback = '#888') {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Numbered tokens --name-1, --name-2 … until one is missing. */
function palette(name) {
  const colors = [];
  for (let i = 1; i <= 16; i += 1) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(`${name}-${i}`).trim();
    if (!value) break;
    colors.push(value);
  }
  return colors.length ? colors : ['#888'];
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

/** Small deterministic PRNG (mulberry32): the same metadata always draws the same galaxy. */
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Soft white radial blob, tinted per use by the sprite colour (sun glow, halos, nebulae). */
function glowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.22, 'rgba(255,255,255,0.45)');
  g.addColorStop(0.55, 'rgba(255,255,255,0.1)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Banded surface, so planets differ in more than colour. Seeded by the subject id. */
function planetTexture(color, seed) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 128, 64);
  const random = seededRandom(seed);
  for (let y = 0; y < 64;) {
    const h = 3 + random() * 9;
    ctx.fillStyle = random() < 0.5 ? `rgba(255,255,255,${0.06 + random() * 0.16})` : `rgba(0,0,0,${0.06 + random() * 0.2})`;
    ctx.fillRect(0, y, 128, h);
    y += h;
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** Mark a material as dimmable: remember its normal opacity so selection can scale it. */
function fadeable(material, opacity = 1) {
  material.transparent = true;
  material.opacity = opacity;
  material.userData.baseOpacity = opacity;
  return material;
}

function progressText(s) {
  if (s.total && s.completed >= s.total) return `${s.completed}/${s.total} · Complete`;
  if (!s.completed) return `0/${s.total} · Not started`;
  return `${s.completed}/${s.total} · ${s.percent}%`;
}

/** Orbits for n planets: inner orbits first, each holding as many as fit PLANET_GAP apart. */
function orbitPlan(count) {
  const orbits = [];
  let left = count;
  for (let k = 0; left > 0; k += 1) {
    const radius = FIRST_ORBIT + k * ORBIT_STEP;
    const fits = Math.max(1, Math.floor((2 * Math.PI * radius) / PLANET_GAP));
    const take = Math.min(left, fits);
    orbits.push({ radius, count: take });
    left -= take;
  }
  return orbits;
}

/**
 * Systems in a grid whose shape best matches the stage (seen from ELEVATION):
 * a row on a wide stage, two columns on a phone. Deterministic for a given
 * metadata and aspect ratio.
 */
function gridColumns(count, cell, aspect) {
  let best = 1;
  let bestScore = Infinity;
  for (let cols = 1; cols <= count; cols += 1) {
    const rows = Math.ceil(count / cols);
    // A ragged last row may miss at most half its places (four systems: 4 or 2 + 2, never 3 + 1).
    if (cols * rows - count > Math.floor(cols / 2)) continue;
    const projected = (cols * cell) / (rows * cell * Math.sin(ELEVATION));
    const score = Math.abs(Math.log(projected / aspect));
    if (score < bestScore) { best = cols; bestScore = score; }
  }
  return best;
}

/**
 * mount(host, systems, { renderPanel, renderSystemPanel }) → { destroy, focus(id), reset() }
 * systems: [{ id, title, subjects: [{ id, title, total, completed, percent }] }] in sidebar order.
 * renderPanel(subject, system) → element shown below the map for the selected subject.
 * renderSystemPanel(system, selectSubject) → element shown for a selected sun.
 */
export function mount(host, systems, { renderPanel, renderSystemPanel } = {}) {
  systems = systems.filter((s) => s.subjects.length);
  const reduced = prefersReducedMotion();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const canvas = renderer.domElement;
  // role="application" lets screen readers pass the arrow keys through to the map.
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label', 'Knowledge galaxy. Left and right arrow keys move between subjects, up and down arrow keys between library groups; Escape resets the view.');

  // Labels are HTML over the canvas: crisp at any zoom, readable at a fixed size
  // on a phone, and larger tap targets than the planets. Screen readers use the
  // canvas, the panel and the subject cards instead.
  const labelLayer = el('div', { class: 'galaxy-labels', 'aria-hidden': 'true' });
  const resetButton = el('button', { type: 'button', class: 'btn btn-secondary btn-sm galaxy-reset', hidden: true }, icon('reset', 14), 'Reset view');
  const stage = el('div', { class: 'galaxy-stage' }, canvas, labelLayer, resetButton);
  const panel = el('section', { class: 'map-panel', 'aria-label': 'Selection', hidden: true });
  host.append(stage, panel);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 1000);
  const lookTarget = new THREE.Vector3();

  const world = new THREE.Group();
  scene.add(world);
  const disposables = [];
  const pickables = [];
  const labels = [];
  const track = (x) => { disposables.push(x); return x; };

  // Registries, rebuilt with the scene (theme change, new grid shape). Every
  // system and subject passed in takes part, so new subjects need no code.
  const nodes = new Map(); // subject id → planet objects
  const suns = new Map(); // system id → sun objects
  let colors = null;
  let columns = 0;
  let overview = null;
  let selected = null; // { kind: 'subject' | 'system', id }
  let hoveredId = null;

  const subjectOrder = systems.flatMap((system) => system.subjects.map((s) => s.id));

  /** Every system gets the cell of the largest one, so the grid stays even. */
  function cellSize() {
    const outer = Math.max(...systems.map((s) => { const plan = orbitPlan(s.subjects.length); return plan[plan.length - 1].radius; }));
    return 2 * (outer + SYSTEM_MARGIN + 0.6);
  }

  /** Planets ride their system's turning orbit group; counter-turn them so each progress arc keeps starting at the top. */
  function turnSystems(angles) {
    [...suns.values()].forEach((sunNode, i) => { if (angles[i] !== undefined) sunNode.orbitGroup.rotation.y = angles[i]; });
    for (const node of nodes.values()) node.group.rotation.y = -suns.get(node.system.id).orbitGroup.rotation.y;
  }
  const systemAngles = () => [...suns.values()].map((n) => n.orbitGroup.rotation.y);

  // ---- scene -----------------------------------------------------------------------
  function build() {
    world.clear();
    labelLayer.replaceChildren();
    pickables.length = 0;
    labels.length = 0;
    nodes.clear();
    suns.clear();
    colors = {
      background: new THREE.Color(token('--galaxy-bg', '#070b18')),
      nebula: new THREE.Color(token('--galaxy-nebula', '#1e2a5c')),
      accent: new THREE.Color(token('--galaxy-accent', '#a5b4fc')),
      done: new THREE.Color(token('--galaxy-done', '#4ade80')),
      track: new THREE.Color(token('--galaxy-text-muted', '#aab3c5')),
      suns: palette('--galaxy-sun'),
      planets: palette('--galaxy-planet'),
    };
    renderer.setClearColor(colors.background, 1);

    const glow = track(glowTexture());
    world.add(new THREE.AmbientLight(0xffffff, 0.55));

    const plans = systems.map((system) => orbitPlan(system.subjects.length));
    const cell = cellSize();
    columns = gridColumns(systems.length, cell, aspect());
    const rows = Math.ceil(systems.length / columns);
    // A stage wider than the grid: spread the columns rather than leave empty sky at the sides.
    const spread = THREE.MathUtils.clamp(aspect() / ((columns * cell) / (rows * cell * Math.sin(ELEVATION))), 1, 1.45);
    const maxTopics = Math.max(...systems.flatMap((s) => s.subjects.map((subject) => subject.total)), 1);
    let planetIndex = 0;

    systems.forEach((system, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      // Centre a short last row; nudge alternate columns so the grid reads as a galaxy, not a table.
      const inRow = Math.min(columns, systems.length - row * columns);
      const x = (col - (inRow - 1) / 2) * cell * spread;
      const z = (row - (rows - 1) / 2) * cell + (columns > 1 ? (col % 2 ? 1 : -1) * cell * 0.07 : 0);
      const group = new THREE.Group();
      group.position.set(x, 0, z);
      world.add(group);

      const sunColor = new THREE.Color(colors.suns[i % colors.suns.length]);
      const nebula = new THREE.Sprite(track(fadeable(new THREE.SpriteMaterial({ map: glow, color: colors.nebula, blending: THREE.AdditiveBlending, depthWrite: false }), 0.55)));
      nebula.scale.set(cell * 1.15, cell * 1.15, 1);
      nebula.position.y = -1.2;
      group.add(nebula);

      const sun = new THREE.Mesh(track(new THREE.SphereGeometry(SUN_RADIUS, 32, 24)), track(fadeable(new THREE.MeshBasicMaterial({ color: sunColor }))));
      group.add(sun);
      const corona = new THREE.Sprite(track(fadeable(new THREE.SpriteMaterial({ map: glow, color: sunColor, blending: THREE.AdditiveBlending, depthWrite: false }), 0.9)));
      corona.scale.set(SUN_RADIUS * 7, SUN_RADIUS * 7, 1);
      group.add(corona);
      // The sun lights its own planets (no shadows, no fall-off): each system reads as one unit.
      const light = new THREE.PointLight(sunColor, 2.4, 0, 0);
      group.add(light);
      const sunHit = new THREE.Mesh(track(new THREE.SphereGeometry(SUN_RADIUS * 2.4, 12, 8)), track(new THREE.MeshBasicMaterial({ visible: false })));
      sunHit.userData = { kind: 'system', id: system.id };
      group.add(sunHit);
      pickables.push(sunHit);

      const orbitGroup = new THREE.Group();
      // Start each system at a different angle so the grid does not look stamped.
      orbitGroup.rotation.y = i * 0.9;
      group.add(orbitGroup);

      const sunLabel = addLabel({ kind: 'system', id: system.id, className: 'galaxy-label-sun', text: [system.title] });
      const sunNode = { system, group, sun, corona, nebula, orbitGroup, label: sunLabel, radius: plans[i][plans[i].length - 1].radius + 1 };
      suns.set(system.id, sunNode);

      let s = 0;
      plans[i].forEach((orbit, k) => {
        const path = new THREE.LineLoop(track(new THREE.BufferGeometry().setFromPoints(
          Array.from({ length: 96 }, (_, a) => new THREE.Vector3(Math.cos((a / 96) * Math.PI * 2) * orbit.radius, 0, Math.sin((a / 96) * Math.PI * 2) * orbit.radius)))),
        track(fadeable(new THREE.LineBasicMaterial({ color: colors.track }), 0.16)));
        group.add(path);
        for (let p = 0; p < orbit.count; p += 1, s += 1) {
          const subject = system.subjects[s];
          const angle = (p / orbit.count) * Math.PI * 2 + k * 0.6;
          addPlanet(subject, system, orbitGroup, new THREE.Vector3(Math.cos(angle) * orbit.radius, 0, Math.sin(angle) * orbit.radius), planetIndex, maxTopics, glow);
          planetIndex += 1;
        }
      });
    });

    addStarfield(cell * Math.max(columns, rows) * 2.4);
    overview = boundsPose([...suns.values()].map((n) => ({ center: n.group.position, radius: n.radius + 0.5 })));
    turnSystems([]);
    measureLabels();
    applyStyles();
  }

  function addPlanet(subject, system, parent, position, index, maxTopics, glow) {
    const size = 0.3 + 0.3 * Math.sqrt(subject.total / maxTopics);
    const base = colors.planets[index % colors.planets.length];
    const map = track(planetTexture(base, hash(subject.id)));
    const sphere = new THREE.Mesh(track(new THREE.SphereGeometry(size, 32, 24)),
      track(fadeable(new THREE.MeshStandardMaterial({ map, roughness: 0.75, metalness: 0, emissive: colors.accent, emissiveIntensity: 0 }))));
    sphere.rotation.z = 0.35;
    const group = new THREE.Group();
    group.position.copy(position);
    group.add(sphere);
    parent.add(group);

    // Selection halo: hidden until hovered or selected.
    const halo = new THREE.Sprite(track(fadeable(new THREE.SpriteMaterial({ map: glow, color: colors.accent, blending: THREE.AdditiveBlending, depthWrite: false }), 0)));
    halo.scale.set(size * 5, size * 5, 1);
    group.add(halo);

    // Progress ring: the full faint track, then the completed arc. Complete
    // subjects get a full ring in the "done" colour; the label says it in words.
    const done = subject.total ? subject.completed / subject.total : 0;
    const ringR = size + 0.2;
    const trackRing = new THREE.Mesh(track(new THREE.TorusGeometry(ringR, 0.018, 6, 72)), track(fadeable(new THREE.MeshBasicMaterial({ color: colors.track }), 0.35)));
    trackRing.rotation.x = Math.PI / 2;
    group.add(trackRing);
    if (done > 0) {
      const complete = done >= 1;
      const arc = new THREE.Mesh(track(new THREE.TorusGeometry(ringR, complete ? 0.05 : 0.042, 8, 96, complete ? Math.PI * 2 : Math.max(0.08, done * Math.PI * 2))),
        track(fadeable(new THREE.MeshBasicMaterial({ color: complete ? colors.done : colors.accent }))));
      // Start the arc at the top of the ring (as seen from the camera) and fill clockwise.
      arc.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
      group.add(arc);
    }

    // An invisible, larger sphere is the click target, so small planets are as
    // easy to hit as big ones. (Raycasting ignores material.visible.)
    const hit = new THREE.Mesh(track(new THREE.SphereGeometry(ringR + 0.3, 12, 8)), track(new THREE.MeshBasicMaterial({ visible: false })));
    hit.userData = { kind: 'subject', id: subject.id };
    group.add(hit);
    pickables.push(hit);

    const label = addLabel({ kind: 'subject', id: subject.id, className: 'galaxy-label-planet', text: [subject.title, progressText(subject)] });
    nodes.set(subject.id, { subject, system, group, sphere, halo, label, ringR, baseScale: 1 });
  }

  /** Two layers of fixed-size points far below the plane: one draw call each, seeded. */
  function addStarfield(span) {
    const random = seededRandom(hash(systems.map((s) => s.id).join('|')));
    const layer = (count, size, brightness) => {
      const positions = new Float32Array(count * 3);
      const tints = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 1) {
        positions[i * 3] = (random() - 0.5) * span;
        positions[i * 3 + 1] = -4 - random() * 18;
        positions[i * 3 + 2] = (random() - 0.5) * span;
        const b = brightness * (0.45 + random() * 0.55);
        // A few warm and cool stars; most are white.
        const tint = random();
        tints.set(tint < 0.12 ? [b, b * 0.85, b * 0.7] : tint < 0.24 ? [b * 0.8, b * 0.9, b] : [b, b, b], i * 3);
      }
      const geometry = track(new THREE.BufferGeometry());
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(tints, 3));
      world.add(new THREE.Points(geometry, track(fadeable(new THREE.PointsMaterial({ size, sizeAttenuation: false, vertexColors: true, depthWrite: false }), 1))));
    };
    layer(900, 1.2, 0.75);
    layer(140, 2.2, 1);
  }

  function addLabel({ kind, id, className, text }) {
    const [name, meta] = text;
    const node = el('div', { class: `galaxy-label ${className}`, 'data-kind': kind, 'data-id': id },
      el('span', { class: 'galaxy-label-name' }, name),
      meta ? el('span', { class: 'galaxy-label-meta' }, meta) : null);
    labelLayer.append(node);
    const label = { node, kind, id, width: 0, height: 0, visible: true };
    labels.push(label);
    return label;
  }

  function measureLabels() {
    for (const label of labels) {
      label.width = label.node.offsetWidth;
      label.height = label.node.offsetHeight;
    }
  }

  /** Selected = bright with a halo; hovered = halo; everything outside the selection dims. */
  function applyStyles() {
    const focusSystem = selected?.kind === 'system' ? selected.id : selected ? nodes.get(selected.id)?.system.id ?? null : null;
    for (const [id, sunNode] of suns) {
      const dim = focusSystem !== null && id !== focusSystem;
      sunNode.group.traverse((object) => {
        const material = object.material;
        if (!material || material.userData.baseOpacity === undefined) return;
        material.opacity = material.userData.baseOpacity * (dim ? 0.22 : 1);
      });
      sunNode.label.node.classList.toggle('is-dim', dim);
      sunNode.label.node.classList.toggle('is-selected', selected?.kind === 'system' && selected.id === id);
    }
    for (const [id, node] of nodes) {
      const isSelected = selected?.kind === 'subject' && selected.id === id;
      const hovered = id === hoveredId;
      node.halo.material.opacity = isSelected ? 0.75 : hovered ? 0.45 : 0;
      node.sphere.material.emissiveIntensity = isSelected ? 0.25 : hovered ? 0.15 : 0;
      node.group.scale.setScalar(hovered && !isSelected ? 1.12 : 1);
      node.label.node.classList.toggle('is-selected', isSelected);
      node.label.node.classList.toggle('is-dim', focusSystem !== null && node.system.id !== focusSystem);
    }
    requestRender();
  }

  // ---- camera ----------------------------------------------------------------------
  function aspect() {
    const { width, height } = stage.getBoundingClientRect();
    return width && height ? width / height : 2;
  }

  /**
   * The closest camera pose (on the fixed viewing angle) that shows every circle
   * given — centre on the plane plus radius — with a margin for labels.
   */
  function boundsPose(circles) {
    const box = new THREE.Box3();
    for (const { center, radius } of circles) {
      box.expandByPoint(new THREE.Vector3(center.x - radius, -0.3, center.z - radius));
      box.expandByPoint(new THREE.Vector3(center.x + radius, 0.9, center.z + radius));
    }
    const target = box.getCenter(new THREE.Vector3());
    target.y = 0;
    const corners = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(x, y, z));
    const probe = camera.clone();
    const place = (distance) => {
      probe.position.copy(target).addScaledVector(VIEW_DIR, distance);
      probe.lookAt(target);
      probe.updateMatrixWorld();
      return corners.map((corner) => corner.clone().project(probe));
    };
    const fits = (distance) => place(distance).every((p) => Math.abs(p.x) <= 0.94 && Math.abs(p.y) <= 0.9);
    const search = () => {
      let lo = 0.5;
      let hi = 300; // well inside the far plane, so "fits" flips only once along the search
      for (let i = 0; i < 30; i += 1) {
        const mid = (lo + hi) / 2;
        if (fits(mid)) hi = mid; else lo = mid;
      }
      return hi;
    };
    // Perspective draws the near side larger: slide the target until the frame is
    // balanced top to bottom, then fit again.
    let distance = search();
    for (let pass = 0; pass < 3; pass += 1) {
      const ys = place(distance).map((p) => p.y);
      const shift = (Math.max(...ys) + Math.min(...ys)) / 2;
      const units = (Math.tan(THREE.MathUtils.degToRad(probe.fov / 2)) * distance) / Math.sin(ELEVATION);
      target.z -= shift * units;
      distance = search();
    }
    return { position: target.clone().addScaledVector(VIEW_DIR, distance), target };
  }

  function subjectPose(node) {
    world.updateMatrixWorld();
    const center = node.group.getWorldPosition(new THREE.Vector3());
    // Close enough to fill the frame, far enough that the label and neighbours stay in view.
    return boundsPose([{ center, radius: node.ringR + 3 }]);
  }

  function systemPose(sunNode) {
    return boundsPose([{ center: sunNode.group.position, radius: sunNode.radius }]);
  }

  let flight = null;

  function jumpTo({ position, target }) {
    flight = null;
    camera.position.copy(position);
    lookTarget.copy(target);
    camera.lookAt(lookTarget);
    requestRender();
  }

  function flyTo(pose) {
    // Reduced motion (or the map is off-screen): jump straight there.
    if (!animating()) { jumpTo(pose); return; }
    flight = { fromPos: camera.position.clone(), fromTarget: lookTarget.clone(), end: pose, start: performance.now() };
    requestRender();
  }

  function stepFlight(now) {
    if (!flight) return;
    const t = Math.min(1, (now - flight.start) / FLY_MS);
    const k = easeInOutCubic(t);
    camera.position.lerpVectors(flight.fromPos, flight.end.position, k);
    lookTarget.lerpVectors(flight.fromTarget, flight.end.target, k);
    camera.lookAt(lookTarget);
    if (t === 1) flight = null;
  }

  // ---- selection -------------------------------------------------------------------
  function showPanel(content, source) {
    resetButton.hidden = false;
    panel.replaceChildren(content);
    panel.hidden = false;
    if (source === 'search') {
      // Coming from search: bring the map into view and put focus on the panel.
      host.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      panel.querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
    }
  }

  function select(id, { source = 'pointer' } = {}) {
    const node = nodes.get(id);
    if (!node) return false;
    selected = { kind: 'subject', id };
    applyStyles();
    flyTo(subjectPose(node));
    showPanel(renderPanel ? renderPanel(node.subject, node.system) : el('h2', {}, node.subject.title), source);
    const s = node.subject;
    announce(`${s.title}, ${node.system.title}: ${s.completed} of ${s.total} topics completed.`);
    return true;
  }

  function selectSystem(id, { source = 'pointer' } = {}) {
    const sunNode = suns.get(id);
    if (!sunNode) return false;
    selected = { kind: 'system', id };
    applyStyles();
    flyTo(systemPose(sunNode));
    const { system } = sunNode;
    showPanel(renderSystemPanel ? renderSystemPanel(system, (subjectId) => select(subjectId, { source: 'search' })) : el('h2', {}, system.title), source);
    const completed = system.subjects.reduce((sum, s) => sum + s.completed, 0);
    const total = system.subjects.reduce((sum, s) => sum + s.total, 0);
    announce(`${system.title}: ${system.subjects.length} ${system.subjects.length === 1 ? 'subject' : 'subjects'}, ${completed} of ${total} topics completed.`);
    return true;
  }

  function reset() {
    if (selected === null) return;
    const focusWasInside = panel.contains(document.activeElement) || document.activeElement === resetButton;
    selected = null;
    applyStyles();
    flyTo(overview);
    resetButton.hidden = true;
    panel.hidden = true;
    panel.replaceChildren();
    if (focusWasInside) canvas.focus({ preventScroll: true });
    announce('Knowledge galaxy overview');
  }

  resetButton.addEventListener('click', () => reset());
  panel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { event.stopPropagation(); reset(); }
  });

  // ---- sizing, picking, keyboard, loop ---------------------------------------------
  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    // A new stage shape may want a different grid (row ↔ two columns).
    if (gridColumns(systems.length, cellSize(), width / height) !== columns) {
      const angles = systemAngles();
      disposeTracked();
      build();
      turnSystems(angles);
    } else {
      overview = boundsPose([...suns.values()].map((n) => ({ center: n.group.position, radius: n.radius + 0.5 })));
      measureLabels();
    }
    if (selected?.kind === 'subject') jumpTo(subjectPose(nodes.get(selected.id)));
    else if (selected?.kind === 'system') jumpTo(systemPose(suns.get(selected.id)));
    else jumpTo(overview);
    applyStyles();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    // Planets win over a sun behind them.
    const hits = raycaster.intersectObjects(pickables, false);
    return (hits.find((h) => h.object.userData.kind === 'subject') || hits[0])?.object.userData || null;
  }
  function setHovered(id) {
    if (id === hoveredId) return;
    hoveredId = id;
    applyStyles();
  }
  function choose(target) {
    if (!target) return;
    if (target.kind === 'subject' && !(selected?.kind === 'subject' && selected.id === target.id)) select(target.id);
    if (target.kind === 'system' && !(selected?.kind === 'system' && selected.id === target.id)) selectSystem(target.id);
  }
  function onMove(event) {
    const target = pick(event);
    // Touch has no hover: the tap selects and the panel shows the details.
    if (event.pointerType !== 'touch') setHovered(target?.kind === 'subject' ? target.id : null);
    canvas.style.cursor = target ? 'pointer' : '';
  }
  const onClick = (event) => choose(pick(event));
  function onLeave() {
    canvas.style.cursor = '';
    setHovered(null);
  }
  function labelTarget(event) {
    const node = event.target.closest('.galaxy-label');
    return node ? { kind: node.dataset.kind, id: node.dataset.id } : null;
  }
  const onLabelClick = (event) => choose(labelTarget(event));
  function onLabelOver(event) {
    if (event.pointerType === 'touch') return;
    const target = labelTarget(event);
    setHovered(target?.kind === 'subject' ? target.id : null);
  }

  function currentSystemId() {
    if (selected?.kind === 'system') return selected.id;
    if (selected?.kind === 'subject') return nodes.get(selected.id)?.system.id ?? null;
    return null;
  }
  function onKey(event) {
    const ids = subjectOrder;
    const systemIds = systems.map((s) => s.id);
    let at = selected?.kind === 'subject' ? ids.indexOf(selected.id) : -1;
    // From a selected sun, Right goes to its first planet and Left to the planet before it.
    if (selected?.kind === 'system') at = ids.indexOf(suns.get(selected.id).system.subjects[0].id) - 0.5;
    const sysAt = systemIds.indexOf(currentSystemId());
    const wrap = (i, n) => ((i % n) + n) % n;
    if (event.key === 'ArrowRight') select(ids[wrap(Math.floor(at) + 1, ids.length)], { source: 'keyboard' });
    else if (event.key === 'ArrowLeft') select(ids[at < 0 ? ids.length - 1 : wrap(Math.ceil(at) - 1, ids.length)], { source: 'keyboard' });
    else if (event.key === 'ArrowDown') selectSystem(systemIds[wrap(sysAt + 1, systemIds.length)], { source: 'keyboard' });
    else if (event.key === 'ArrowUp') selectSystem(systemIds[sysAt < 0 ? systemIds.length - 1 : wrap(sysAt - 1, systemIds.length)], { source: 'keyboard' });
    else if (event.key === 'Home') select(ids[0], { source: 'keyboard' });
    else if (event.key === 'End') select(ids[ids.length - 1], { source: 'keyboard' });
    else if (event.key === 'Escape' && selected !== null) { event.stopPropagation(); reset(); }
    else return;
    event.preventDefault();
  }
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('keydown', onKey);
  labelLayer.addEventListener('click', onLabelClick);
  labelLayer.addEventListener('pointerover', onLabelOver);
  // Leaving a label: the canvas's own pointermove takes over if the pointer lands on it.
  labelLayer.addEventListener('pointerout', () => setHovered(null));

  // ---- labels ----------------------------------------------------------------------
  const projected = new THREE.Vector3();
  const offset = new THREE.Vector3();
  /**
   * Place each HTML label at its object's screen position, then hide any that
   * would overlap a more important one: selection first, then the hovered
   * planet, suns, the focused system's planets, everything else. So labels
   * never collide at any width; hidden ones return as the camera zooms in.
   */
  function placeLabels() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const focusSystem = currentSystemId();
    const placed = [];
    // The Reset button sits over the top-right corner: keep labels out from under it.
    if (!resetButton.hidden) {
      const stageBox = stage.getBoundingClientRect();
      const box = resetButton.getBoundingClientRect();
      placed.push({ left: box.left - stageBox.left - 4, top: box.top - stageBox.top - 4, right: box.right - stageBox.left + 4, bottom: box.bottom - stageBox.top + 4 });
    }
    const toScreen = (v) => ({ x: ((v.x + 1) / 2) * width, y: ((1 - v.y) / 2) * height });
    // Planets and suns, as screen boxes: labels prefer not to cover them.
    const bodies = [];
    const disc = (c, r) => ({ left: c.x - r, top: c.y - r, right: c.x + r, bottom: c.y + r });
    const entries = labels.map((label) => {
      const { width: w, height: h } = label;
      let priority;
      let candidates;
      if (label.kind === 'system') {
        const sunNode = suns.get(label.id);
        projected.copy(sunNode.group.position).project(camera);
        const c = toScreen(projected);
        const top = toScreen(offset.copy(sunNode.group.position).addScaledVector(camera.up, SUN_RADIUS * 2.2).project(camera)).y;
        const reach = c.y - top;
        bodies.push(disc(c, reach * 0.55));
        // Above the sun, else below, right, left.
        candidates = [[c.x - w / 2, top - h - 2], [c.x - w / 2, c.y + reach + 2], [c.x + reach + 4, c.y - h / 2], [c.x - reach - w - 4, c.y - h / 2]];
        priority = selected?.kind === 'system' && selected.id === label.id ? 1000 : 800;
      } else {
        const node = nodes.get(label.id);
        node.group.getWorldPosition(projected);
        offset.copy(projected).addScaledVector(camera.up, node.ringR * 1.15);
        projected.project(camera);
        const c = toScreen(projected);
        const reach = Math.abs(c.y - toScreen(offset.project(camera)).y);
        bodies.push(disc(c, reach * 0.8));
        // Below the planet, else above, right, left.
        candidates = [[c.x - w / 2, c.y + reach + 2], [c.x - w / 2, c.y - reach - h - 2], [c.x + reach + 4, c.y - h / 2], [c.x - reach - w - 4, c.y - h / 2]];
        const isSelected = selected?.kind === 'subject' && selected.id === label.id;
        priority = isSelected ? 1000 : label.id === hoveredId ? 900 : node.system.id === focusSystem ? 500 : 100;
      }
      return { label, candidates, priority, behind: projected.z > 1 };
    });
    entries.sort((a, b) => b.priority - a.priority);
    for (const entry of entries) {
      const { label } = entry;
      let spot = null;
      // First a spot clear of labels and bodies; failing that, one clear of labels only.
      for (const obstacles of [placed.concat(bodies), placed]) {
        for (const [cx, cy] of entry.behind ? [] : entry.candidates) {
          const x = Math.round(cx);
          const y = Math.round(cy);
          const rect = { left: x - 3, top: y - 2, right: x + label.width + 3, bottom: y + label.height + 2 };
          const onStage = rect.left >= 0 && rect.right <= width && rect.top >= 0 && rect.bottom <= height;
          if (onStage && obstacles.every((r) => rect.right <= r.left || rect.left >= r.right || rect.bottom <= r.top || rect.top >= r.bottom)) {
            spot = { x, y, rect };
            break;
          }
        }
        if (spot) break;
      }
      if (spot) {
        placed.push(spot.rect);
        label.node.style.transform = `translate(${spot.x}px, ${spot.y}px)`;
      }
      if (Boolean(spot) !== label.visible) {
        label.visible = Boolean(spot);
        label.node.classList.toggle('is-culled', !spot);
      }
    }
  }

  // ---- render loop -----------------------------------------------------------------
  let visible = true;
  let frame = 0;
  let dirty = true;
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; loop(); });
  visibility.observe(stage);
  const clock = new THREE.Clock();
  const animating = () => !reduced && visible && !document.hidden;
  // Systems stop turning while a planet is hovered (so it can be clicked) or
  // anything is selected (so the camera stays on it).
  const orbiting = () => animating() && !hoveredId && selected === null;

  function renderOnce() {
    renderer.render(scene, camera);
    placeLabels();
    dirty = false;
  }
  function requestRender() {
    dirty = true;
    // The loop renders on its next frame; without one (static or off-screen), render now.
    if (!frame) renderOnce();
  }
  // One loop for the whole galaxy. It runs only while the map is on screen and
  // motion is allowed, and draws only when something moved.
  function loop() {
    cancelAnimationFrame(frame);
    frame = 0;
    if (!animating()) {
      // Stopped mid-flight (scrolled away, tab hidden): finish it instantly.
      if (flight) jumpTo(flight.end);
      renderOnce();
      return;
    }
    const tick = (now) => {
      const dt = Math.min(clock.getDelta(), 0.05);
      if (orbiting()) {
        turnSystems(systemAngles().map((a) => a + dt * ORBIT_SPEED));
        dirty = true;
      }
      if (flight) { stepFlight(now); dirty = true; }
      if (dirty) renderOnce();
      frame = requestAnimationFrame(tick);
    };
    clock.getDelta();
    frame = requestAnimationFrame(tick);
  }
  const onVisibility = () => loop();
  document.addEventListener('visibilitychange', onVisibility);
  const onTheme = () => {
    const angles = systemAngles();
    disposeTracked();
    build();
    turnSystems(angles);
    applyStyles();
  };
  document.addEventListener('studyhub:theme', onTheme);
  // Search asked for a subject: fly to it (the request may predate this mount).
  const onFocusRequest = () => {
    const id = takePendingFocus();
    if (id) select(id, { source: 'search' });
  };
  document.addEventListener(FOCUS_EVENT, onFocusRequest);

  function disposeTracked() {
    for (const d of disposables) d.dispose?.();
    disposables.length = 0;
  }

  build();
  resize();
  jumpTo(overview);
  loop();
  onFocusRequest();

  return {
    focus: (id) => select(id, { source: 'search' }),
    reset,
    destroy() {
      cancelAnimationFrame(frame);
      frame = 0;
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('studyhub:theme', onTheme);
      document.removeEventListener(FOCUS_EVENT, onFocusRequest);
      disposeTracked();
      renderer.dispose();
      renderer.forceContextLoss();
      stage.remove();
      panel.remove();
    },
  };
}
