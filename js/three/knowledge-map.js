// Dashboard "knowledge map" (Three.js). Each subject is a sphere sized by its
// topic count with a ring that fills as topics are completed; its modules orbit
// it as small dots that brighten with progress.
//
// Click (or tap) a subject, use the arrow keys, or pick "View in knowledge map"
// in search: the camera flies to that subject, the others dim, and a detail
// panel (built by the dashboard from real progress data) opens below the map.
//
// It is an enhancement only: the subject cards below carry the same information
// accessibly. Loaded lazily, rendered only while visible, static when the user
// prefers reduced motion, and fully disposed on navigation.

import * as THREE from '../../assets/vendor/three-0.170.0/three.module.min.js';
import { el, icon, announce, prefersReducedMotion } from '../util.js';
import { FOCUS_EVENT, takePendingFocus } from '../map-focus.js';

// Camera poses. The overview looks at the centre from the front; a focused view
// stands just outside the ring, facing the subject, close enough to fill the
// frame but far enough that the label and orbiting modules stay in view.
const OVERVIEW = { position: new THREE.Vector3(0, 4.2, 10.5), target: new THREE.Vector3(0, 0, 0) };
const FOCUS_DISTANCE = 4.8;
const FOCUS_HEIGHT = 2.4;
const FLY_MS = 750;

function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
}

/** Cylindrical coordinates around the centre, so flights swing around the ring instead of cutting through it. */
function toCylinder(v) {
  return { angle: Math.atan2(v.x, v.z), radius: Math.hypot(v.x, v.z), y: v.y };
}

function labelSprite(text, color) {
  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = 512 * scale;
  canvas.height = 64 * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.font = '600 26px system-ui, -apple-system, "Segoe UI", sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
  sprite.scale.set(4, 0.5, 1);
  return sprite;
}

/** Mark a material as dimmable: remember its normal opacity so selection can scale it. */
function fadeable(material, opacity = 1) {
  material.transparent = true;
  material.opacity = opacity;
  material.userData.baseOpacity = opacity;
  return material;
}

/**
 * mount(host, subjects, { renderPanel }) → { destroy, focus(id), reset() }
 * subjects: [{ id, title, total, completed, percent, modules: [...] }]
 * renderPanel(subject) → element shown below the map for the selected subject.
 */
export function mount(host, subjects, { renderPanel } = {}) {
  const reduced = prefersReducedMotion();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const canvas = renderer.domElement;
  // role="application" lets screen readers pass the arrow keys through to the map.
  canvas.setAttribute('tabindex', '0');
  canvas.setAttribute('role', 'application');
  canvas.setAttribute('aria-label', 'Knowledge map. Arrow keys focus a subject; Escape resets the view.');

  const tooltip = el('div', { class: 'map-tooltip', 'aria-hidden': 'true', hidden: true });
  const legend = el('p', { class: 'map-legend', 'aria-hidden': 'true' }, 'Rings fill as you complete topics · click a subject to explore it');
  const resetButton = el('button', { type: 'button', class: 'btn btn-secondary btn-sm map-reset', hidden: true }, icon('reset', 14), 'Reset view');
  const stage = el('div', { class: 'map-stage' }, canvas, tooltip, legend, resetButton);
  const panel = el('section', { class: 'map-panel', 'aria-label': 'Selected subject', hidden: true });
  host.append(stage, panel);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  const lookTarget = OVERVIEW.target.clone();
  camera.position.copy(OVERVIEW.position);
  camera.lookAt(lookTarget);
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(4, 8, 6);
  scene.add(sun);

  const world = new THREE.Group();
  scene.add(world);
  const disposables = [];
  const pickables = [];
  const orbiters = [];
  const track = (x) => { disposables.push(x); return x; };

  // Node registry: subject id → its scene objects. Rebuilt with the scene (theme
  // change); every subject passed in takes part, so new subjects need no code.
  const nodes = new Map();
  let colors = null;
  let core = null;
  let selectedId = null;
  let hoveredId = null;

  function build() {
    world.clear();
    pickables.length = 0;
    orbiters.length = 0;
    nodes.clear();
    colors = {
      accent: new THREE.Color(token('--accent')),
      success: new THREE.Color(token('--success')),
      muted: new THREE.Color(token('--border-strong')),
    };
    const { accent, success, muted } = colors;
    const text = token('--text');
    const maxTopics = Math.max(...subjects.map((s) => s.total), 1);
    const radius = 3.6;

    // A faint centre: "you", linked to every subject.
    core = new THREE.Mesh(track(new THREE.SphereGeometry(0.22, 24, 16)), track(fadeable(new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.4 }))));
    world.add(core);

    subjects.forEach((subject, i) => {
      const angle = (i / subjects.length) * Math.PI * 2;
      const group = new THREE.Group();
      group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      world.add(group);

      const size = 0.32 + 0.38 * Math.sqrt(subject.total / maxTopics);
      const done = subject.percent / 100;
      const color = muted.clone().lerp(accent, 0.55 + 0.45 * done);
      const sphere = new THREE.Mesh(track(new THREE.SphereGeometry(size, 32, 24)),
        track(fadeable(new THREE.MeshStandardMaterial({ color, emissive: accent, emissiveIntensity: 0, roughness: 0.45, metalness: 0.05 }))));
      group.add(sphere);

      // Progress ring: the full track, then the completed arc in the success colour.
      const ringR = size + 0.16;
      const trackRing = new THREE.Mesh(track(new THREE.TorusGeometry(ringR, 0.025, 8, 64)), track(fadeable(new THREE.MeshBasicMaterial({ color: muted }), 0.6)));
      trackRing.rotation.x = Math.PI / 2;
      group.add(trackRing);
      if (done > 0) {
        const arc = new THREE.Mesh(track(new THREE.TorusGeometry(ringR, 0.05, 8, 64, Math.max(0.05, done * Math.PI * 2))), track(fadeable(new THREE.MeshBasicMaterial({ color: success }))));
        arc.rotation.x = Math.PI / 2;
        group.add(arc);
      }

      // Modules orbit their subject; brighter = more of the module completed.
      const orbit = new THREE.Group();
      group.add(orbit);
      orbiters.push(orbit);
      subject.modules.forEach((module, m) => {
        const a = (m / subject.modules.length) * Math.PI * 2;
        const moduleDone = module.total ? module.completed / module.total : 0;
        const dot = new THREE.Mesh(track(new THREE.SphereGeometry(0.06, 12, 8)),
          track(fadeable(new THREE.MeshBasicMaterial({ color: muted.clone().lerp(success, moduleDone) }))));
        dot.position.set(Math.cos(a) * (ringR + 0.35), Math.sin(a * 2) * 0.12, Math.sin(a) * (ringR + 0.35));
        orbit.add(dot);
      });

      // An invisible, larger sphere is the click target, so small subjects are as
      // easy to hit as big ones without drawing them bigger. (Raycasting ignores
      // material.visible; rendering skips it.)
      const hit = new THREE.Mesh(track(new THREE.SphereGeometry(ringR + 0.45, 16, 12)), track(new THREE.MeshBasicMaterial({ visible: false })));
      hit.userData.subjectId = subject.id;
      group.add(hit);
      pickables.push(hit);

      const line = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), group.position.clone()])),
        track(new THREE.LineBasicMaterial({ color: muted, transparent: true, opacity: 0.5 })));
      world.add(line);

      const label = labelSprite(subject.title, text);
      track(label.material.map);
      track(fadeable(label.material, 0.85));
      label.position.set(0, size + 0.55, 0);
      group.add(label);

      nodes.set(subject.id, { subjectId: subject.id, subject, group, sphere, hit, label, line, position: group.position });
    });
    applyStyles();
  }

  /** Selected = bright; hovered = slightly brighter; the rest dim while something is selected. */
  function applyStyles() {
    // The centre sits right behind a focused subject's label: fade it out of the way.
    core.material.opacity = selectedId === null ? 1 : 0.25;
    for (const node of nodes.values()) {
      const selected = node.subjectId === selectedId;
      const hovered = node.subjectId === hoveredId;
      const dimmed = selectedId !== null && !selected;
      node.group.traverse((object) => {
        const material = object.material;
        if (!material || material.userData.baseOpacity === undefined) return;
        material.opacity = material.userData.baseOpacity * (dimmed ? 0.3 : 1);
      });
      // Labels stay readable even when dimmed.
      node.label.material.opacity = selected || hovered ? 1 : dimmed ? 0.55 : 0.85;
      node.sphere.material.emissiveIntensity = selected ? 0.35 : hovered ? 0.2 : 0;
      node.line.material.opacity = selected ? 0.95 : dimmed ? 0.15 : 0.5;
      node.line.material.color.copy(selected ? colors.accent : colors.muted);
    }
  }

  // ---- camera flights --------------------------------------------------------------
  let flight = null;

  function focusPose(node) {
    world.updateMatrixWorld();
    const at = node.group.getWorldPosition(new THREE.Vector3());
    const { angle, radius } = toCylinder(at);
    const r = radius + FOCUS_DISTANCE;
    return {
      position: new THREE.Vector3(Math.sin(angle) * r, FOCUS_HEIGHT, Math.cos(angle) * r),
      target: at.add(new THREE.Vector3(0, 0.3, 0)),
    };
  }

  function jumpTo({ position, target }) {
    flight = null;
    camera.position.copy(position);
    lookTarget.copy(target);
    camera.lookAt(lookTarget);
  }

  function flyTo(pose) {
    // Reduced motion (or the map is off-screen): jump straight there.
    if (!animating()) {
      jumpTo(pose);
      renderOnce();
      return;
    }
    const { position, target } = pose;
    const from = toCylinder(camera.position);
    const to = toCylinder(position);
    // Turn the short way round the ring.
    let turn = to.angle - from.angle;
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    flight = { from, to, turn, fromTarget: lookTarget.clone(), toTarget: target.clone(), end: pose, start: performance.now() };
  }

  function stepFlight(now) {
    if (!flight) return;
    const t = Math.min(1, (now - flight.start) / FLY_MS);
    const k = easeInOutCubic(t);
    const { from, to } = flight;
    const angle = from.angle + flight.turn * k;
    const radius = from.radius + (to.radius - from.radius) * k;
    camera.position.set(Math.sin(angle) * radius, from.y + (to.y - from.y) * k, Math.cos(angle) * radius);
    lookTarget.lerpVectors(flight.fromTarget, flight.toTarget, k);
    camera.lookAt(lookTarget);
    if (t === 1) flight = null;
  }

  // ---- selection -------------------------------------------------------------------
  function select(id, { source = 'pointer' } = {}) {
    const node = nodes.get(id);
    if (!node) return false;
    selectedId = id;
    applyStyles();
    flyTo(focusPose(node));
    resetButton.hidden = false;
    panel.replaceChildren(renderPanel ? renderPanel(node.subject) : el('h2', {}, node.subject.title));
    panel.hidden = false;
    const s = node.subject;
    announce(`${s.title}: ${s.completed} of ${s.total} topics completed.`);
    if (source === 'search') {
      // Coming from search: bring the map into view and put focus on the panel.
      host.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      panel.querySelector('[tabindex="-1"]')?.focus({ preventScroll: true });
    }
    return true;
  }

  function reset() {
    if (selectedId === null) return;
    const focusWasInside = panel.contains(document.activeElement) || document.activeElement === resetButton;
    selectedId = null;
    applyStyles();
    flyTo(OVERVIEW);
    resetButton.hidden = true;
    panel.hidden = true;
    panel.replaceChildren();
    if (focusWasInside) canvas.focus({ preventScroll: true });
    announce('Knowledge map overview');
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
    renderOnce();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function pick(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(pickables, false)[0]?.object.userData.subjectId || null;
  }
  function setHovered(id) {
    if (id === hoveredId) return;
    hoveredId = id;
    applyStyles();
    renderOnce();
  }
  function onMove(event) {
    const id = pick(event);
    setHovered(id);
    canvas.style.cursor = id ? 'pointer' : '';
    // Touch has no hover: the tap selects and the panel shows the details.
    if (!id || event.pointerType === 'touch') { tooltip.hidden = true; return; }
    const s = nodes.get(id).subject;
    const rect = stage.getBoundingClientRect();
    tooltip.replaceChildren(el('strong', {}, s.title), el('span', {}, `${s.total} topics · ${s.percent}% complete`));
    tooltip.style.left = `${event.clientX - rect.left}px`;
    tooltip.style.top = `${event.clientY - rect.top}px`;
    tooltip.hidden = false;
  }
  function onClick(event) {
    const id = pick(event);
    if (id && id !== selectedId) select(id);
  }
  function onLeave() {
    tooltip.hidden = true;
    canvas.style.cursor = '';
    setHovered(null);
  }
  function onKey(event) {
    const ids = [...nodes.keys()];
    const at = ids.indexOf(selectedId);
    let next = null;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = ids[(at + 1) % ids.length];
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') next = ids[at <= 0 ? ids.length - 1 : at - 1];
    else if (event.key === 'Home') next = ids[0];
    else if (event.key === 'End') next = ids[ids.length - 1];
    else if (event.key === 'Escape' && selectedId !== null) {
      event.stopPropagation();
      reset();
      return;
    } else return;
    event.preventDefault();
    if (next) select(next, { source: 'keyboard' });
  }
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('click', onClick);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('keydown', onKey);

  let visible = true;
  let frame = 0;
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; loop(); });
  visibility.observe(stage);
  const clock = new THREE.Clock();
  const animating = () => !reduced && visible && !document.hidden;

  function renderOnce() {
    renderer.render(scene, camera);
  }
  // The same single loop as before: it only runs while the map is on screen and
  // motion is allowed; flights and the selection glow ride along in it.
  function loop() {
    cancelAnimationFrame(frame);
    if (!animating()) {
      // Stopped mid-flight (scrolled away, tab hidden): finish it instantly.
      if (flight) jumpTo(flight.end);
      renderOnce();
      return;
    }
    const tick = (now) => {
      const dt = Math.min(clock.getDelta(), 0.05);
      // The slow spin stops while a subject is hovered (so it can be clicked) or
      // selected (so the camera stays on it).
      if (!hoveredId && selectedId === null) world.rotation.y += dt * 0.12;
      for (const orbit of orbiters) orbit.rotation.y += dt * 0.5;
      stepFlight(now);
      const node = nodes.get(selectedId);
      if (node) node.sphere.material.emissiveIntensity = 0.3 + 0.1 * Math.sin(now / 450);
      renderOnce();
      frame = requestAnimationFrame(tick);
    };
    clock.getDelta();
    frame = requestAnimationFrame(tick);
  }
  const onVisibility = () => loop();
  document.addEventListener('visibilitychange', onVisibility);
  const onTheme = () => { disposeTracked(); build(); renderOnce(); };
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
  loop();
  onFocusRequest();

  return {
    focus: (id) => select(id, { source: 'search' }),
    reset,
    destroy() {
      cancelAnimationFrame(frame);
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
