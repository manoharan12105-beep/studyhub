// Branch and merge visualizer: commits as nodes, branches and HEAD as labels.
//
//   scenario (create branch, fast-forward, three-way, conflict, rebase,
//   cherry-pick, reset vs revert, detached HEAD, fetch/pull)
//     → precomputed frames from the graph model in git-common.js → SVG per frame
//
// Unreachable commits (after reset, rebase, branch -D or leaving detached HEAD)
// stay on screen, faded and dashed, because Git keeps them until garbage
// collection — the reflog is how you get them back. A StudyHub simulation:
// no Git commands run.

import { el, svg } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { BRANCH_SCENARIOS, scenarioFrames, layout, byId } from '../simulators/git-common.js';

const STEP_X = 72;
const LANE_Y = 86;
const R = 15;

/** Draw a graph state as an SVG element plus an accessible commit list. */
export function renderGraph(graph, { caption = '' } = {}) {
  const { nodes, edges, labels, lanes } = layout(graph);
  const px = (n) => 34 + n.x * STEP_X;
  const py = (n) => 30 + n.y * LANE_Y;
  let maxLabel = 0;
  for (const list of Object.values(labels)) for (const l of list) maxLabel = Math.max(maxLabel, l.text.length);
  const width = Math.max(320, 34 + (nodes.length - 1) * STEP_X + Math.max(60, maxLabel * 7.4) + 20);
  const height = 30 + (lanes - 1) * LANE_Y + 70;

  const edgeEls = edges.map((e) => {
    const x1 = px(e.from); const y1 = py(e.from); const x2 = px(e.to); const y2 = py(e.to);
    const d = y1 === y2 ? `M${x1} ${y1} L${x2} ${y2}` : `M${x1} ${y1} C${x1 - STEP_X / 2} ${y1} ${x2 + STEP_X / 2} ${y2} ${x2} ${y2}`;
    return svg('path', { d, class: `git-edge${e.live ? '' : ' is-unreachable'}` });
  });
  const nodeEls = nodes.map((n) => {
    const isHead = (graph.head.branch ? graph.branches[graph.head.branch] : graph.head.detached) === n.id;
    const cls = ['git-node', n.live ? '' : 'is-unreachable', isHead ? 'is-head' : '', n.parents.length > 1 ? 'is-merge' : ''].filter(Boolean).join(' ');
    return svg('g', { class: cls },
      svg('title', { text: `${n.label}: ${n.msg}` }),
      svg('circle', { cx: px(n), cy: py(n), r: R }),
      svg('text', { x: px(n), y: py(n) + 4.5, 'text-anchor': 'middle', text: n.label }));
  });
  const labelEls = [];
  for (const [id, list] of Object.entries(labels)) {
    const n = nodes.find((x) => x.id === id);
    list.forEach((l, i) => {
      const w = l.text.length * 7.2 + 12;
      const x = px(n) - w / 2;
      const y = py(n) + R + 6 + i * 20;
      labelEls.push(svg('g', { class: `git-ref git-ref-${l.kind}` },
        svg('rect', { x, y, width: w, height: 17, rx: 4 }),
        svg('text', { x: px(n), y: y + 12.5, 'text-anchor': 'middle', text: l.text })));
    });
  }
  if (graph.conflict) {
    const head = nodes.find((x) => x.id === graph.branches[graph.head.branch]);
    labelEls.push(svg('text', { x: px(head) + R + 6, y: py(head) - R - 4, class: 'git-conflict-text', text: `⚠ conflict in ${graph.conflict.file}` }));
  }
  const picture = svg('svg', {
    class: 'git-graph-svg', width, height, viewBox: `0 0 ${width} ${height}`, role: 'img',
    'aria-label': caption || 'Commit graph',
  }, edgeEls, nodeEls, labelEls);

  const list = el('ol', { class: 'git-commit-list' }, nodes.map((n) => {
    const refs = (labels[n.id] || []).map((l) => l.text).join(', ');
    return el('li', { class: n.live ? '' : 'is-unreachable' },
      el('strong', {}, n.label), ` ${n.msg}`,
      n.parents.length ? el('span', { class: 'git-commit-meta' }, ` — parent${n.parents.length > 1 ? 's' : ''} ${n.parents.map((p) => byId(graph, p).label).join(', ')}`) : el('span', { class: 'git-commit-meta' }, ' — root commit'),
      refs ? el('span', { class: 'git-commit-refs' }, ` [${refs}]`) : null,
      n.live ? null : el('span', { class: 'git-commit-meta' }, ' (unreachable — reflog only)'));
  }));
  return { picture, list };
}

export function mount(root, { options }) {
  const select = el('select', { class: 'select' },
    Object.entries(BRANCH_SCENARIOS).map(([id, s]) => el('option', { value: id }, s.title)));
  select.value = BRANCH_SCENARIOS[options.scenario] ? options.scenario : 'three-way';
  root.append(el('div', { class: 'viz-form' }, field('Scenario', select)));

  const cmd = el('pre', { class: 'mini-code term-out', tabindex: 0, 'aria-label': 'Command for this step' });
  const graphBox = el('div', { class: 'viz-stage git-graph' });
  const details = el('details', { class: 'git-commit-details' }, el('summary', {}, 'Commits as a list'));
  root.append(el('p', { class: 'tree-side-title' }, 'Commit graph — StudyHub simulation'), cmd, graphBox, details);
  const stepper = createStepper(root, { render, playDelay: 2400, nextLabel: 'Next command' });

  function render(frame) {
    cmd.textContent = frame.cmd ? `$ ${frame.cmd}` : '$ (starting state)';
    const { picture, list } = renderGraph(frame.graph, { caption: frame.text });
    graphBox.replaceChildren(picture);
    details.replaceChildren(el('summary', {}, 'Commits as a list'), list);
  }

  function start() { stepper.load(...scenarioFrames(BRANCH_SCENARIOS[select.value])); }
  select.addEventListener('change', start);
  start();
  return stepper;
}
