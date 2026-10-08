// Volume persistence: does the PostgreSQL data survive? Choose how the data
// directory is stored, then insert rows and recreate, down, down -v or delete
// the storage, and watch what the next container sees.
//
//   storage mode + your actions (history) → frames folded with volumeStep()
//
// Encodes Docker's rules: containers are replaceable, named volumes and bind
// mounts are not deleted with them, down keeps volumes, down -v deletes named
// (and anonymous) volumes but never a bind-mounted host folder. A StudyHub simulation.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { nodesView, select, statsView } from './system-design-common.js';
import { STORAGE_MODES, VOLUME_ACTIONS, initialVolumeState, volumeStep } from './devops-common.js';

export function mount(root, { options }) {
  const mode = select(STORAGE_MODES, options.mode || 'named');
  root.append(el('div', { class: 'viz-form' }, field('PostgreSQL data stored in', mode)));
  root.append(el('p', { class: 'viz-note' }, 'StudyHub simulation — the commands are described, not run.'));
  const buttons = el('div', { class: 'trouble-choices', role: 'group', 'aria-label': 'Actions' },
    Object.entries(VOLUME_ACTIONS).map(([id, label]) => el('button', {
      type: 'button', class: 'btn btn-secondary btn-sm trouble-choice', 'data-action': id,
    }, label)));
  const cards = nodesView('Containers and storage');
  const stats = statsView('Data');
  root.append(el('div', { class: 'viz-stage' }, buttons, cards.node, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1600, nextLabel: 'Next action' });

  let history = [];
  function render(frame) {
    const { state } = frame;
    cards.render([
      { title: `Container db (#${state.generation})`, lines: [`sees ${state.stored} row(s)`], state: frame.lost ? 'down' : 'ok' },
      { title: mode.value === 'none' ? 'Anonymous volume of this container' : mode.value === 'bind' ? 'Host folder /srv/pgdata' : 'Named volume pgdata', lines: [`${state.stored} row(s) stored`], state: 'primary' },
      ...(state.orphaned ? [{ title: 'Orphaned anonymous volume', lines: [`${state.orphaned} row(s) nobody mounts`], state: 'stale' }] : []),
    ]);
    stats.render([['Rows visible to the app', state.stored], ['Containers created', state.generation]]);
  }

  function rebuild() {
    let state = initialVolumeState();
    const first = { state, lost: false, text: `Storage: ${STORAGE_MODES[mode.value]}. Insert a few rows, then replace the container.` };
    const frames = history.map((action) => {
      const result = volumeStep(mode.value, state, action);
      state = result.state;
      return { state, lost: result.lost, text: `${VOLUME_ACTIONS[action]}: ${result.text}` };
    });
    stepper.load(first, frames);
    for (let i = 0; i < frames.length; i += 1) stepper.next();
  }

  buttons.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    history.push(button.dataset.action);
    rebuild();
  });
  mode.addEventListener('change', () => { history = []; rebuild(); });
  rebuild();
  return stepper;
}
