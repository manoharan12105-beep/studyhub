// Dockerfile layer cache: pick a Dockerfile layout and a change, then step
// through the build to see which layers are CACHED and which are rebuilt.
//
//   (dockerfile, change) → layerPlan() → one frame per instruction
//
// The rule is Docker's: a layer is reused when its instruction and inputs are
// unchanged; once one layer is rebuilt, every later layer of that stage is too.
// Rebuilding the build stage changes the JAR, so the runtime stage's
// COPY --from=build runs again. A StudyHub simulation — nothing is built.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select, statsView } from '../simulators/system-design-common.js';
import { CHANGES, DOCKERFILES, layerPlan } from '../simulators/devops-common.js';

export function mount(root, { options }) {
  const layout = select(Object.fromEntries(Object.entries(DOCKERFILES).map(([k, v]) => [k, v.title])), options.dockerfile || 'naive');
  const change = select(CHANGES, options.change || 'source');
  root.append(el('div', { class: 'viz-form' }, field('Dockerfile', layout), field('What changed since the last build', change)));

  const list = el('ol', { class: 'layer-list', 'aria-label': 'Build steps' });
  const stats = statsView('Build summary');
  root.append(el('div', { class: 'viz-stage' }, list, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1200, nextLabel: 'Next layer' });

  let plan = [];
  function render(frame) {
    list.replaceChildren(...plan.map((layer, i) => {
      const shown = i < frame.done;
      const status = !shown ? 'pending' : layer.rebuilt ? 'rebuilt' : 'cached';
      return el('li', { class: `layer-item is-${status}`, 'aria-current': i === frame.done - 1 ? 'step' : null },
        el('code', {}, layer.instruction),
        el('span', { class: 'layer-status' }, status === 'pending' ? '…' : status === 'cached' ? 'CACHED' : 'REBUILT'),
        el('span', { class: 'layer-stage' }, layer.stage === 'build' ? 'build stage' : 'runtime stage'));
    }));
    const seen = plan.slice(0, frame.done);
    stats.render([['Cached', seen.filter((l) => !l.rebuilt).length], ['Rebuilt', seen.filter((l) => l.rebuilt).length], ['Layers', plan.length]]);
  }

  function start() {
    plan = layerPlan(layout.value, change.value);
    const first = { done: 0, text: `${DOCKERFILES[layout.value].title} — ${CHANGES[change.value]}. Press "Next layer" to build.` };
    const frames = plan.map((layer, i) => ({
      done: i + 1,
      text: `${layer.instruction} → ${layer.rebuilt ? 'REBUILT' : 'CACHED'}: ${layer.why}.${i === plan.length - 1 ? summary(plan) : ''}`,
    }));
    stepper.load(first, frames);
  }

  function summary(layers) {
    const deps = layers.find((l) => /dependency:go-offline|COPY \. \./.test(l.instruction));
    if (!deps) return '';
    return deps.rebuilt
      ? ' Dependencies were downloaded again — the slow part of a Java build.'
      : ' The dependency layer stayed cached, so only your code was compiled.';
  }

  layout.addEventListener('change', start);
  change.addEventListener('change', start);
  start();
  return stepper;
}
