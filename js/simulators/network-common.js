// Shared building blocks for the Computer Networks simulators.
//
// Not an interaction itself (nothing registers "network-common"); it only keeps
// the protocol simulators consistent:
//   sequenceView  — actors with their current state + the ordered message log
//                   (handshakes, DORA, DNS lookups, TLS): a vertical list, so it
//                   reads well on a phone and to a screen reader.
//   tableView     — a small key/value or row table (ARP cache, NAT table …).
//   select        — a <select> from { value: label }.

import { el } from '../util.js';

export function select(options, value) {
  const s = el('select', { class: 'select' }, Object.entries(options).map(([v, l]) => el('option', { value: v }, l)));
  s.value = value in options ? value : Object.keys(options)[0];
  return s;
}

/**
 * actors: [{ id, label }]
 * render(frame) expects frame.states = { actorId: 'text' } and
 * frame.log = [{ from, to, label, note?, lost?, encrypted? }] (all messages so far).
 */
export function sequenceView(actors) {
  const chips = actors.map((a) => {
    const state = el('span', { class: 'seq-state' });
    const chip = el('li', { class: 'seq-actor', 'data-actor': a.id }, el('strong', {}, a.label), state);
    return { id: a.id, chip, state };
  });
  const actorList = el('ul', { class: 'seq-actors', 'aria-label': 'Participants and their state' }, chips.map((c) => c.chip));
  const log = el('ol', { class: 'seq-log', 'aria-label': 'Messages so far' });
  const names = Object.fromEntries(actors.map((a) => [a.id, a.label]));
  const node = el('div', { class: 'seq-view' }, actorList, log);

  function render(frame) {
    for (const c of chips) {
      const text = frame.states?.[c.id] ?? '';
      c.state.textContent = text;
      c.chip.classList.toggle('is-active', Boolean(frame.active?.includes(c.id)));
    }
    const items = (frame.log || []).map((m, i, all) => el('li', {
      class: ['seq-msg', i === all.length - 1 && frame.fresh !== false ? 'is-current' : '', m.lost ? 'is-lost' : '',
        m.encrypted ? 'is-encrypted' : '', m.marker ? 'is-marker' : ''].join(' '),
    },
    m.marker
      ? el('span', { class: 'seq-label' }, m.label)
      : [
        el('span', { class: 'seq-dir' }, `${names[m.from] || m.from} → ${names[m.to] || m.to}`),
        el('code', { class: 'seq-label' }, m.label),
        m.lost ? el('span', { class: 'seq-flag' }, 'lost') : null,
        m.encrypted ? el('span', { class: 'seq-flag seq-flag-lock' }, 'encrypted') : null,
        m.note ? el('span', { class: 'seq-note' }, m.note) : null,
      ]));
    log.replaceChildren(...(items.length ? items : [el('li', { class: 'seq-msg seq-empty' }, 'No messages yet.')]));
  }

  return { node, render };
}

/** columns: ['IP', 'MAC']; rows: [['192.168.1.1', 'a4:…'], …]; highlight: row index set. */
export function tableView(title, columns) {
  const table = el('table', { class: 'viz-table' });
  const wrap = el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': title }, table);
  const node = el('div', { class: 'net-table' }, el('p', { class: 'tree-side-title' }, title), wrap);

  function render(rows, { highlight = [], empty = 'Empty', rowClass } = {}) {
    const body = rows.length
      ? rows.map((r, i) => el('tr', { class: rowClass ? rowClass(r, i) : (highlight.includes(i) ? 'is-current' : '') },
        r.map((cell) => el('td', {}, cell))))
      : [el('tr', {}, el('td', { colspan: columns.length, class: 'muted' }, empty))];
    table.replaceChildren(
      el('thead', {}, el('tr', {}, columns.map((c) => el('th', { scope: 'col' }, c)))),
      el('tbody', {}, body));
  }

  return { node, render };
}
