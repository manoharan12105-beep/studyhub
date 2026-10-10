// Repository state simulator: working directory, staging area, local repository
// and remote, side by side.
//
//   your actions (edit, create, add, restore, commit, branch, switch, merge,
//   a teammate's push, fetch, pull, push) → replayed from the start into frames
//   → four panels show what each action changed
//
// File contents are version labels (v1, v2…) so changes are easy to follow.
// Actions Git would refuse (committing with nothing staged, a rejected push…)
// show Git's reason and change nothing. A StudyHub simulation: no Git runs.

import { el } from '../util.js';
import { createStepper } from '../engagement/stepper.js';
import { AREA_ACTIONS, areaFrames, fileStatus } from './git-common.js';

const STATUS_TEXT = {
  '??': 'untracked',
  ' M': 'modified, not staged',
  'M ': 'staged',
  'MM': 'staged, then modified again',
  'A ': 'new file, staged',
  'AM': 'new file staged, then modified',
};

export function mount(root, { options }) {
  const groups = [...new Set(AREA_ACTIONS.map((a) => a.group))];
  const buttons = el('div', { class: 'git-actions', role: 'group', 'aria-label': 'Git actions' },
    groups.map((g) => el('div', { class: 'git-action-group' },
      el('span', { class: 'git-action-label' }, g),
      AREA_ACTIONS.filter((a) => a.group === g).map((a) => el('button', { type: 'button', class: 'btn btn-secondary btn-sm', 'data-action': a.id }, a.label)))),
    el('div', { class: 'git-action-group' },
      el('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'data-action': 'clear' }, 'Start over')));

  const panels = {
    work: el('div', { class: 'git-area' }),
    index: el('div', { class: 'git-area' }),
    repo: el('div', { class: 'git-area' }),
    remote: el('div', { class: 'git-area' }),
  };
  const last = el('p', { class: 'verdict' });
  root.append(
    el('p', { class: 'tree-side-title' }, 'Repository state — StudyHub simulation'),
    buttons,
    last,
    el('div', { class: 'git-areas' },
      el('section', { 'aria-label': 'Working directory' }, el('h4', { class: 'git-area-title' }, '1. Working directory'), panels.work),
      el('section', { 'aria-label': 'Staging area' }, el('h4', { class: 'git-area-title' }, '2. Staging area (index)'), panels.index),
      el('section', { 'aria-label': 'Local repository' }, el('h4', { class: 'git-area-title' }, '3. Local repository'), panels.repo),
      el('section', { 'aria-label': 'Remote repository' }, el('h4', { class: 'git-area-title' }, '4. Remote (origin)'), panels.remote)));
  const stepper = createStepper(root, { render, playDelay: 2200, nextLabel: 'Next action' });

  let history = Array.isArray(options.actions) ? options.actions.filter((a) => AREA_ACTIONS.some((x) => x.id === a)) : [];

  function render(frame) {
    const s = frame.state;
    last.className = `verdict ${frame.error ? 'verdict-bad' : 'verdict-ok'}`;
    last.textContent = frame.action ? `$ ${AREA_ACTIONS.find((a) => a.id === frame.action).label}${frame.error ? ' — refused' : ''}` : 'Starting state';

    const status = fileStatus(s);
    panels.work.replaceChildren(el('ul', { class: 'git-file-list' }, status.filter((f) => f.work !== '—').map((f) =>
      el('li', { class: f.code && f.code[1] !== ' ' ? 'is-changed' : '' },
        el('code', {}, f.file), ` ${f.work}`,
        f.code ? el('span', { class: 'git-status-code' }, ` ${f.code.replace(/ /g, '·')} ${STATUS_TEXT[f.code] || ''}`) : null))));
    panels.index.replaceChildren(el('ul', { class: 'git-file-list' }, status.filter((f) => f.index !== '—').map((f) =>
      el('li', { class: f.index !== f.head ? 'is-changed' : '' },
        el('code', {}, f.file), ` ${f.index}`,
        f.index !== f.head ? el('span', { class: 'git-status-code' }, ' staged for the next commit') : null))));

    const refsFor = (id) => [
      ...Object.entries(s.branches).filter(([, v]) => v === id).map(([b]) => (b === s.head ? `HEAD → ${b}` : b)),
      ...(s.tracking.main === id ? ['origin/main'] : []),
    ];
    panels.repo.replaceChildren(el('ol', { class: 'git-commit-list', reversed: true }, [...s.commits].reverse().map((c) =>
      el('li', {}, el('strong', {}, c.id), ` ${c.msg}`,
        el('span', { class: 'git-commit-meta' }, ` — ${Object.entries(c.tree).map(([f, v]) => `${f.replace(/\..*$/, '')} ${v}`).join(', ')}`),
        refsFor(c.id).length ? el('span', { class: 'git-commit-refs' }, ` [${refsFor(c.id).join(', ')}]`) : null))));

    const unfetched = s.remoteExtra.map((c) => c.id);
    panels.remote.replaceChildren(
      el('p', { class: 'git-remote-line' }, 'main → ', el('strong', {}, s.remote.branches.main)),
      el('p', { class: 'git-commit-meta' }, `Commits on the server: ${s.remote.commits.join(', ')}`),
      unfetched.length ? el('p', { class: 'git-status-code' }, `Not fetched yet: ${unfetched.join(', ')}`) : null);
  }

  function start() {
    stepper.load(...areaFrames(history));
    while (stepper.next());
  }

  buttons.addEventListener('click', (event) => {
    const action = event.target.closest('button[data-action]')?.dataset.action;
    if (!action) return;
    history = action === 'clear' ? [] : [...history, action];
    start();
  });

  start();
  return stepper;
}
