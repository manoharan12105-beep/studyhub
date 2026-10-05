// Dashboard "knowledge map" (Three.js). Each subject is a sphere sized by its
// topic count with a ring that fills as topics are completed; its modules orbit
// it as small dots that brighten with progress. Click a subject to open it.
//
// It is an enhancement only: the subject cards below carry the same information
// accessibly. Loaded lazily, rendered only while visible, static when the user
// prefers reduced motion, and fully disposed on navigation.

import * as THREE from '../../assets/vendor/three-0.170.0/three.module.min.js';
import { navigate, href } from '../router.js';
import { prefersReducedMotion } from '../util.js';

function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888';
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

export function mount(host, subjects) {
  const reduced = prefersReducedMotion();
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  host.append(renderer.domElement);
  const tooltip = document.createElement('div');
  tooltip.className = 'map-tooltip';
  tooltip.hidden = true;
  const legend = document.createElement('p');
  legend.className = 'map-legend';
  legend.textContent = 'Your knowledge map · rings fill as you complete topics · click a subject';
  host.append(tooltip, legend);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
  camera.position.set(0, 4.2, 10.5);
  camera.lookAt(0, 0, 0);
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

  function build() {
    world.clear();
    pickables.length = 0;
    orbiters.length = 0;
    const accent = new THREE.Color(token('--accent'));
    const success = new THREE.Color(token('--success'));
    const muted = new THREE.Color(token('--border-strong'));
    const text = token('--text');
    const maxTopics = Math.max(...subjects.map((s) => s.total), 1);
    const radius = 3.6;

    // A faint centre: "you", linked to every subject.
    const core = new THREE.Mesh(track(new THREE.SphereGeometry(0.22, 24, 16)), track(new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.4 })));
    world.add(core);

    subjects.forEach((subject, i) => {
      const angle = (i / subjects.length) * Math.PI * 2;
      const group = new THREE.Group();
      group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      world.add(group);

      const size = 0.32 + 0.38 * Math.sqrt(subject.total / maxTopics);
      const done = subject.percent / 100;
      const color = muted.clone().lerp(accent, 0.55 + 0.45 * done);
      const sphere = new THREE.Mesh(track(new THREE.SphereGeometry(size, 32, 24)), track(new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 })));
      sphere.userData = subject;
      group.add(sphere);
      pickables.push(sphere);

      // Progress ring: the full track, then the completed arc in the success colour.
      const ringR = size + 0.16;
      const trackRing = new THREE.Mesh(track(new THREE.TorusGeometry(ringR, 0.025, 8, 64)), track(new THREE.MeshBasicMaterial({ color: muted, transparent: true, opacity: 0.6 })));
      trackRing.rotation.x = Math.PI / 2;
      group.add(trackRing);
      if (done > 0) {
        const arc = new THREE.Mesh(track(new THREE.TorusGeometry(ringR, 0.05, 8, 64, Math.max(0.05, done * Math.PI * 2))), track(new THREE.MeshBasicMaterial({ color: success })));
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
          track(new THREE.MeshBasicMaterial({ color: muted.clone().lerp(success, moduleDone) })));
        dot.position.set(Math.cos(a) * (ringR + 0.35), Math.sin(a * 2) * 0.12, Math.sin(a) * (ringR + 0.35));
        orbit.add(dot);
      });

      const line = new THREE.Line(track(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), group.position.clone()])),
        track(new THREE.LineBasicMaterial({ color: muted, transparent: true, opacity: 0.5 })));
      world.add(line);

      const label = labelSprite(subject.title, text);
      track(label.material.map);
      track(label.material);
      label.position.set(0, size + 0.55, 0);
      group.add(label);
    });
    renderOnce();
  }

  // ---- sizing, picking, loop ----------------------------------------------------
  function resize() {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderOnce();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let hovered = null;
  function pick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(pickables, false)[0]?.object || null;
  }
  function onMove(event) {
    hovered = pick(event);
    renderer.domElement.style.cursor = hovered ? 'pointer' : '';
    if (hovered) {
      const s = hovered.userData;
      const rect = host.getBoundingClientRect();
      tooltip.textContent = `${s.title} — ${s.completed}/${s.total} topics (${s.percent}%)`;
      tooltip.style.left = `${event.clientX - rect.left}px`;
      tooltip.style.top = `${event.clientY - rect.top}px`;
      tooltip.hidden = false;
    } else tooltip.hidden = true;
    renderOnce();
  }
  function onClick(event) {
    const target = pick(event);
    if (target) navigate(href(['c', target.userData.id]));
  }
  function onLeave() { hovered = null; tooltip.hidden = true; renderer.domElement.style.cursor = ''; }
  renderer.domElement.addEventListener('pointermove', onMove);
  renderer.domElement.addEventListener('click', onClick);
  renderer.domElement.addEventListener('pointerleave', onLeave);

  let visible = true;
  let frame = 0;
  const visibility = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; loop(); });
  visibility.observe(host);
  const clock = new THREE.Clock();

  function renderOnce() {
    renderer.render(scene, camera);
  }
  function loop() {
    cancelAnimationFrame(frame);
    if (reduced || !visible || document.hidden) { renderOnce(); return; }
    const tick = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      // Pause the slow spin while the pointer is over a subject, so it can be clicked.
      if (!hovered) world.rotation.y += dt * 0.12;
      for (const orbit of orbiters) orbit.rotation.y += dt * 0.5;
      renderOnce();
      frame = requestAnimationFrame(tick);
    };
    clock.getDelta();
    frame = requestAnimationFrame(tick);
  }
  const onVisibility = () => loop();
  document.addEventListener('visibilitychange', onVisibility);
  const onTheme = () => { disposeTracked(); build(); };
  document.addEventListener('studyhub:theme', onTheme);

  function disposeTracked() {
    for (const d of disposables) d.dispose?.();
    disposables.length = 0;
  }

  build();
  resize();
  loop();

  return {
    destroy() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('studyhub:theme', onTheme);
      disposeTracked();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      tooltip.remove();
      legend.remove();
    },
  };
}
