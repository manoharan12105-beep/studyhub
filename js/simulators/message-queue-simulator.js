// A message queue tick by tick: producer → queue → consumers, with acknowledgements.
//
//   scenario → [Next tick] → messages published, received, acknowledged,
//   redelivered, dead-lettered or rejected, with the reason for each.
//
// Scenarios (options.scenario):
//   normal        a burst is buffered and drained by two consumers
//   crash         a consumer dies before acknowledging → redelivery → duplicate risk
//   poison        one message always fails → retried, then moved to the dead-letter queue
//   backpressure  the producer outpaces consumers and a bounded queue pushes back

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { nodesView, select, statsView } from './system-design-common.js';

const SCENARIOS = {
  normal: 'Burst buffered by the queue',
  crash: 'A consumer crashes before acknowledging',
  poison: 'A poison message and the dead-letter queue',
  backpressure: 'Producer faster than consumers (bounded queue)',
};

const CONFIG = {
  normal: { ticks: 7, produce: (t) => (t <= 3 ? 3 : 0), capacity: 20 },
  crash: { ticks: 8, produce: (t) => (t <= 3 ? 2 : 0), capacity: 20, crashAt: 2, restartAt: 6, visibility: 2 },
  poison: { ticks: 8, produce: (t) => (t <= 3 ? 2 : 0), capacity: 20, poisonId: 3, maxAttempts: 3 },
  backpressure: { ticks: 8, produce: (t) => (t <= 6 ? 4 : 0), capacity: 6 },
};

export function mount(root, { options }) {
  const scenario = select(SCENARIOS, options.scenario || 'normal');
  root.append(el('div', { class: 'viz-form' }, field('Scenario', scenario)));

  const queue = el('ol', { class: 'sd-slots', 'aria-label': 'Messages in the queue, oldest first' });
  const dlq = el('ol', { class: 'sd-slots', 'aria-label': 'Dead-letter queue' });
  const consumers = nodesView('Consumers');
  const stats = statsView('Message counters');
  const dlqWrap = el('div', {}, el('p', { class: 'tree-side-title' }, 'Dead-letter queue'), dlq);
  root.append(el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, 'Queue (oldest first)'), queue,
    el('p', { class: 'tree-side-title' }, 'Consumers'), consumers.node, dlqWrap, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1700, nextLabel: 'Next tick' });

  function render(frame) {
    queue.replaceChildren(...(frame.queue.length ? frame.queue.map((m) => el('li', {
      class: ['sd-slot', m.hidden ? 'is-hidden' : '', m.attempts > 0 ? 'is-retry' : '', frame.fresh.includes(m.id) ? 'is-new' : ''].join(' '),
    }, el('strong', {}, `#${m.id}`), el('span', {}, m.hidden ? `invisible until t=${m.visibleAt}` : m.attempts ? `attempt ${m.attempts + 1}` : 'ready'))) : [el('li', { class: 'sd-slot is-empty' }, 'empty')]));
    consumers.render(frame.consumers.map((c) => ({ title: `Consumer ${c.name}`, lines: [c.status, c.done ? `processed ${c.done}` : ' '], state: c.down ? 'down' : c.busy ? 'current' : 'idle' })));
    dlqWrap.hidden = !frame.dlq.length && frame.scenario !== 'poison';
    dlq.replaceChildren(...(frame.dlq.length ? frame.dlq.map((id) => el('li', { class: 'sd-slot is-out' }, el('strong', {}, `#${id}`), el('span', {}, 'failed 3×'))) : [el('li', { class: 'sd-slot is-empty' }, 'empty')]));
    stats.render([['Tick', frame.tick], ['Published', frame.published], ['Acknowledged', frame.acked], ['Queue depth', frame.queue.length],
      ...(frame.scenario === 'crash' ? [['Redelivered', frame.redelivered]] : []),
      ...(frame.scenario === 'poison' ? [['Dead-lettered', frame.dlq.length]] : []),
      ...(frame.scenario === 'backpressure' ? [['Rejected (producer must slow down)', frame.rejected]] : [])]);
  }

  function start() {
    const frames = run(scenario.value);
    stepper.load(frames[0], frames.slice(1));
  }

  scenario.addEventListener('change', start);
  start();
  return stepper;
}

function run(name) {
  const cfg = CONFIG[name];
  let nextId = 1;
  const queue = [];   // { id, attempts, visibleAt }
  const consumers = [{ name: 'A', done: 0 }, { name: 'B', done: 0 }];
  const dlq = [];
  let published = 0;
  let acked = 0;
  let redelivered = 0;
  let rejected = 0;
  const processedIds = new Set();
  const frames = [];
  const snap = (tick, fresh, text, states) => frames.push({
    scenario: name, tick, fresh, text, published, acked, redelivered, rejected,
    queue: queue.map((m) => ({ ...m, hidden: m.visibleAt > tick })),
    dlq: dlq.slice(),
    consumers: consumers.map((c, i) => ({ name: c.name, done: c.done, ...(states?.[i] || { status: 'idle' }) })),
  });

  snap(0, [], {
    normal: 'Producer: an order service publishing "send receipt" messages. Two consumers each process one message per tick and acknowledge it afterwards. Press "Next tick".',
    crash: 'Consumers acknowledge only AFTER processing. If a consumer dies before acknowledging, the broker hides the message for a 2-tick visibility timeout and then delivers it again.',
    poison: 'Message #3 is malformed and fails every time it is processed. The broker allows 3 attempts, then moves it to the dead-letter queue (DLQ).',
    backpressure: 'The producer publishes 4 messages per tick, but the two consumers handle only 2 per tick. The queue is bounded at 6 messages.',
  }[name]);

  for (let tick = 1; tick <= cfg.ticks; tick += 1) {
    const notes = [];
    const fresh = [];
    // 1. Producer publishes.
    const count = cfg.produce(tick);
    for (let i = 0; i < count; i += 1) {
      if (queue.length >= cfg.capacity) {
        rejected += 1;
        continue;
      }
      queue.push({ id: nextId, attempts: 0, visibleAt: 0 });
      fresh.push(nextId);
      nextId += 1;
      published += 1;
    }
    if (count) notes.push(`Producer publishes ${fresh.length} message(s)${fresh.length < count ? ` and ${count - fresh.length} are REJECTED because the queue is full — backpressure: the producer must slow down, buffer or retry later` : ''}.`);

    // 2. Each live consumer receives the oldest visible message and processes it.
    const states = consumers.map(() => ({ status: 'idle' }));
    consumers.forEach((c, i) => {
      const down = cfg.crashAt && c.name === 'B' && tick > cfg.crashAt && tick < cfg.restartAt;
      if (down) {
        states[i] = { status: 'crashed — restarting', down: true };
        return;
      }
      const index = queue.findIndex((m) => m.visibleAt <= tick && !fresh.includes(m.id));
      if (index === -1) return;
      const msg = queue[index];
      if (cfg.crashAt && c.name === 'B' && tick === cfg.crashAt) {
        msg.visibleAt = tick + cfg.visibility;
        processedIds.add(msg.id);
        states[i] = { status: `processing #${msg.id}… CRASHED before ack`, down: true };
        notes.push(`Consumer B wrote the receipt for #${msg.id} to its database, then crashed BEFORE acknowledging. The broker keeps #${msg.id} invisible until t=${msg.visibleAt}, then redelivers it.`);
        return;
      }
      if (name === 'poison' && msg.id === cfg.poisonId) {
        msg.attempts += 1;
        if (msg.attempts >= cfg.maxAttempts) {
          queue.splice(index, 1);
          dlq.push(msg.id);
          states[i] = { status: `#${msg.id} failed (attempt ${msg.attempts}) → DLQ`, busy: true };
          notes.push(`#${msg.id} failed its last allowed attempt (${msg.attempts} of ${cfg.maxAttempts}) and is moved to the dead-letter queue: it stops blocking work and is kept for inspection. Alert and fix, then redrive it.`);
        } else {
          msg.visibleAt = tick + 1;
          states[i] = { status: `#${msg.id} failed (attempt ${msg.attempts})`, busy: true };
          notes.push(`#${msg.id} fails (attempt ${msg.attempts} of ${cfg.maxAttempts}); it returns to the queue after a delay.`);
        }
        return;
      }
      queue.splice(index, 1);
      const duplicate = processedIds.has(msg.id);
      if (duplicate) redelivered += 1;
      processedIds.add(msg.id);
      c.done += 1;
      acked += 1;
      states[i] = { status: `processed #${msg.id}, ack ✓${duplicate ? ' (REDELIVERED)' : ''}`, busy: true };
      if (duplicate) notes.push(`Consumer ${c.name} receives #${msg.id} again and processes it: without an idempotency check the customer gets a SECOND receipt. Deduplicate by message ID.`);
    });
    if (cfg.restartAt === tick) notes.push('Consumer B has restarted and rejoins.');
    if (!notes.length) notes.push(queue.length ? 'Consumers keep draining the backlog.' : 'The queue is empty: everything published has been processed and acknowledged.');
    snap(tick, fresh, `t=${tick}: ${notes.join(' ')}`, states);
  }

  const summary = {
    normal: `Summary: a burst of ${published} messages arrived faster than the consumers could handle; the queue buffered it and the consumers drained it at their own pace. The producer never waited.`,
    crash: `Summary: nothing was lost (at-least-once delivery), but the message in flight during the crash was processed twice (${redelivered} redelivery). At-least-once delivery requires idempotent consumers.`,
    poison: `Summary: ${acked} messages succeeded; the poison message was retried ${CONFIG.poison.maxAttempts} times and parked in the DLQ instead of looping forever.`,
    backpressure: `Summary: ${published} published, ${rejected} rejected because the bounded queue was full. A bigger queue would only postpone the problem: scale consumers, slow the producer, or shed low-value work.`,
  }[name];
  frames[frames.length - 1].text += ` ${summary}`;
  return frames;
}
