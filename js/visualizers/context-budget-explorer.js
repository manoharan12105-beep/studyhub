// Context budget: enter how many tokens each part of a session uses and watch the
// window fill in the order Claude Code loads it — the always-loaded part first, then
// the conversation. Change a number to see what a shorter CLAUDE.md, fewer MCP
// servers or a /clear would buy.
//
//   token counts + window size → contextShares() → one frame per part
//
// The starting numbers are example values for a medium session, not measurements;
// run /context in your own session for real ones. A StudyHub visualizer.

import { el } from '../util.js';
import { createStepper, field, errorLine } from '../engagement/stepper.js';
import { barsView, select, statsView } from '../simulators/system-design-common.js';
import { contextShares } from '../simulators/claude-code-common.js';

const PARTS = [
  { id: 'system', label: 'System prompt and tools', tokens: 12000, when: 'Sent with every request.' },
  { id: 'claudemd', label: 'CLAUDE.md files and rules', tokens: 3000, when: 'Loaded at session start; a long file costs this on every request.' },
  { id: 'memory', label: 'Auto memory', tokens: 1500, when: 'First 200 lines or 25 KB of MEMORY.md.' },
  { id: 'skills', label: 'Skill and agent descriptions', tokens: 2500, when: 'Names and descriptions only; bodies load when used.' },
  { id: 'mcp', label: 'MCP tool names', tokens: 1500, when: 'Names load; full definitions load on demand (tool search).' },
  { id: 'conversation', label: 'Conversation and tool results', tokens: 60000, when: 'Grows every turn — the part /compact and /clear act on.' },
];

const WINDOWS = { 200000: '200,000 tokens', 1000000: '1,000,000 tokens (extended context models)' };

export function mount(root) {
  const inputs = PARTS.map((p) => el('input', { type: 'number', class: 'input', min: 0, max: 2000000, step: 500, value: p.tokens, inputmode: 'numeric' }));
  const windowSize = select(WINDOWS, '200000');
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' },
    ...PARTS.map((p, i) => field(p.label, inputs[i])), field('Context window', windowSize, 'Example values — check /context for yours'), error.node));

  const bars = barsView('Context window usage');
  const stats = statsView('Totals');
  root.append(el('div', { class: 'viz-stage' }, bars.node, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1300, nextLabel: 'Load next part' });

  function render(frame) {
    bars.render(frame.rows.map((r, i) => {
      const loaded = i < frame.count;
      return {
        label: r.label, value: loaded ? r.tokens : 0, max: frame.window,
        note: loaded ? `${r.tokens.toLocaleString('en-US')} (${r.percent}%)` : 'not loaded yet',
        state: i === frame.count - 1 ? 'current' : undefined,
      };
    }));
    stats.render([
      ['Used', frame.used.toLocaleString('en-US')],
      ['Free', frame.free.toLocaleString('en-US')],
      ['Used of window', `${frame.window > 0 ? Math.round((frame.used / frame.window) * 1000) / 10 : 0}%`],
    ]);
  }

  function start() {
    const values = inputs.map((i) => Number(i.value));
    if (values.some((v) => !Number.isFinite(v) || v < 0)) {
      error.show('Enter token counts of 0 or more.');
      return;
    }
    error.clear();
    const window = Number(windowSize.value);
    const items = PARTS.map((p, i) => ({ label: p.label, tokens: Math.round(values[i]) }));
    const frames = PARTS.map((p, i) => {
      const partial = contextShares(items.slice(0, i + 1), window);
      const all = contextShares(items, window);
      return {
        count: i + 1, rows: all.rows, window, used: partial.used, free: partial.free,
        text: `${p.label}: ${p.when}${i === PARTS.length - 1 && all.over ? ' The total exceeds the window — auto-compaction would have summarized the conversation long before this.' : ''}`,
      };
    });
    const all = contextShares(items, window);
    const first = { count: 0, rows: all.rows, window, used: 0, free: window, text: 'An empty window. Press "Load next part" to add each part in loading order.' };
    stepper.load(first, frames);
  }

  for (const input of inputs) input.addEventListener('change', start);
  windowSize.addEventListener('change', start);
  start();
  return stepper;
}
