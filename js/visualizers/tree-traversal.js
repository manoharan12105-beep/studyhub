// Binary tree traversals. Depth-first orders are shown as the recursion the
// lesson describes — the call stack is the path from the root to the current
// node, and the order only decides *when* "visit" happens. Level order shows
// the queue.

import { el, svg } from '../util.js';
import { createStepper, field, errorLine } from '../engagement/stepper.js';

const ORDERS = {
  preorder: 'Preorder (node, left, right)',
  inorder: 'Inorder (left, node, right)',
  postorder: 'Postorder (left, right, node)',
  level: 'Level order (BFS with a queue)',
};

export function mount(root, { options }) {
  const treeInput = el('input', { class: 'input', value: options.tree || '1, 2, 3, 4, 5, null, 6' });
  const orderSelect = el('select', { class: 'select' }, Object.entries(ORDERS).map(([v, l]) => el('option', { value: v }, l)));
  orderSelect.value = options.order || 'preorder';
  const run = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Apply');
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' },
    el('div', { class: 'field field-grow' }, field('Tree in level order (null = no child)', treeInput, 'Same format as LeetCode: 1, 2, 3, null, 4')),
    field('Traversal', orderSelect), run), error.node);

  const canvas = el('div', { class: 'tree-canvas' });
  const side = el('div', { class: 'tree-side' });
  root.append(el('div', { class: 'viz-stage tree-stage' }, canvas, side));
  const stepper = createStepper(root, { render, playDelay: 900 });
  let tree = null;

  function start() {
    tree = parseTree(treeInput.value);
    if (!tree) { error.show('Enter up to 15 values in level order, using null for missing children; the first value cannot be null.'); return; }
    error.clear();
    const frames = orderSelect.value === 'level' ? levelFrames(tree) : dfsFrames(tree, orderSelect.value);
    stepper.load(frames[0], frames.slice(1));
  }

  function render(frame) {
    canvas.replaceChildren(drawTree(tree, frame));
    const isLevel = orderSelect.value === 'level';
    const container = frame.container.map((id) => tree.nodes[id].value);
    side.replaceChildren(
      el('p', { class: 'tree-side-title' }, isLevel ? 'Queue (front → back)' : 'Call stack (top first)'),
      el('ol', { class: `stack-list ${isLevel ? 'is-queue' : ''}` },
        container.length ? (isLevel ? container : container.slice().reverse()).map((v) => el('li', {}, isLevel ? String(v) : `visit(${v})`))
          : el('li', { class: 'is-empty' }, 'empty')),
      el('p', { class: 'tree-side-title' }, 'Output'),
      el('p', { class: 'tree-output' }, frame.output.length ? frame.output.map((id) => tree.nodes[id].value).join('  ') : '—'));
  }

  run.addEventListener('click', start);
  treeInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  orderSelect.addEventListener('change', start);
  start();
  return stepper;
}

/** Level-order list → { nodes: [{ value, left, right, depth, x }], root }. */
function parseTree(text) {
  const parts = text.split(/[\s,]+/).filter(Boolean);
  if (!parts.length || parts.length > 31 || /^null$/i.test(parts[0])) return null;
  const nodes = [];
  const make = (raw, depth) => {
    if (/^null$/i.test(raw)) return null;
    nodes.push({ value: raw.slice(0, 4), left: null, right: null, depth });
    return nodes.length - 1;
  };
  const rootId = make(parts[0], 0);
  const queue = [rootId];
  let i = 1;
  while (queue.length && i < parts.length) {
    const parent = queue.shift();
    for (const side of ['left', 'right']) {
      if (i >= parts.length) break;
      const id = make(parts[i++], nodes[parent].depth + 1);
      nodes[parent][side] = id;
      if (id !== null) queue.push(id);
    }
  }
  if (nodes.length > 15) return null;
  // x = inorder position, so no two nodes overlap and children sit either side.
  let x = 0;
  const place = (id) => {
    if (id === null) return;
    place(nodes[id].left);
    nodes[id].x = x++;
    place(nodes[id].right);
  };
  place(rootId);
  return { nodes, root: rootId, width: x };
}

function dfsFrames(tree, order) {
  const frames = [];
  const output = [];
  const stack = [];
  const snap = (current, text) => frames.push({ current, container: stack.slice(), output: output.slice(), text });
  const v = (id) => tree.nodes[id].value;

  snap(null, `${ORDERS[order]}: call visit(${v(tree.root)}) on the root.`);
  function visit(id) {
    stack.push(id);
    const node = tree.nodes[id];
    const kids = [node.left, node.right].filter((c) => c !== null).map(v);
    snap(id, `Enter visit(${v(id)}). ${kids.length ? `Children: ${kids.join(' and ')}.` : 'It is a leaf.'}`);
    if (order === 'preorder') { output.push(id); snap(id, `Preorder outputs the node before its subtrees: output ${v(id)}.`); }
    if (node.left !== null) visit(node.left);
    if (order === 'inorder') { output.push(id); snap(id, `Left subtree of ${v(id)} is done${node.left === null ? ' (empty)' : ''}: inorder outputs ${v(id)} now.`); }
    if (node.right !== null) visit(node.right);
    if (order === 'postorder') { output.push(id); snap(id, `Both subtrees of ${v(id)} are done: postorder outputs ${v(id)} last.`); }
    stack.pop();
    snap(stack[stack.length - 1] ?? null, `Return from visit(${v(id)})${stack.length ? ` to visit(${v(stack[stack.length - 1])})` : ' — traversal complete'}.`);
  }
  visit(tree.root);
  frames[frames.length - 1].text += ` Output: ${output.map(v).join(' ')}. Every node was entered once: O(n) time, O(h) stack space.`;
  return frames;
}

function levelFrames(tree) {
  const frames = [];
  const output = [];
  const queue = [tree.root];
  const v = (id) => tree.nodes[id].value;
  frames.push({ current: null, container: queue.slice(), output: [], text: `Level order: put the root ${v(tree.root)} in the queue.` });
  while (queue.length) {
    const id = queue.shift();
    output.push(id);
    const node = tree.nodes[id];
    const kids = [node.left, node.right].filter((c) => c !== null);
    queue.push(...kids);
    frames.push({
      current: id, container: queue.slice(), output: output.slice(),
      text: `Dequeue ${v(id)} and output it. ${kids.length ? `Enqueue its children ${kids.map(v).join(', ')} at the back.` : 'No children to enqueue.'}`,
    });
  }
  frames.push({ current: null, container: [], output, text: `The queue is empty: done. Output: ${output.map(v).join(' ')} — level by level, left to right. O(n) time, O(w) queue space (w = widest level).` });
  return frames;
}

function drawTree(tree, frame) {
  const gapX = 52;
  const gapY = 64;
  const maxDepth = Math.max(...tree.nodes.map((n) => n.depth));
  const width = Math.max(1, tree.width) * gapX + 20;
  const height = (maxDepth + 1) * gapY + 10;
  const pos = (n) => ({ x: n.x * gapX + gapX / 2 + 10, y: n.depth * gapY + 30 });
  const outputIndex = new Map(frame.output.map((id, i) => [id, i + 1]));
  const onStack = new Set(frame.container);

  const edges = [];
  const circles = [];
  tree.nodes.forEach((node, id) => {
    const p = pos(node);
    for (const child of [node.left, node.right]) {
      if (child === null) continue;
      const c = pos(tree.nodes[child]);
      edges.push(svg('line', { x1: p.x, y1: p.y, x2: c.x, y2: c.y, class: 'tree-edge' }));
    }
    const classes = ['tree-node'];
    if (outputIndex.has(id)) classes.push('is-visited');
    if (onStack.has(id)) classes.push('is-active');
    if (frame.current === id) classes.push('is-current');
    circles.push(svg('g', { class: classes.join(' ') },
      svg('circle', { cx: p.x, cy: p.y, r: 18 }),
      svg('text', { x: p.x, y: p.y + 5, 'text-anchor': 'middle' }, document.createTextNode(node.value)),
      outputIndex.has(id) ? svg('text', { x: p.x + 20, y: p.y - 14, class: 'tree-order', 'text-anchor': 'middle' }, document.createTextNode(`#${outputIndex.get(id)}`)) : null));
  });
  return svg('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': `Binary tree with ${tree.nodes.length} nodes` }, edges, circles);
}
