// Data flowing through a pipeline, one command at a time.
//
//   pipeline → stage 1 output → | → stage 2 output → | → … → terminal
//
// Every intermediate output below was captured by running each prefix of the
// pipeline in the practice lab (~/linux-lab), so what you see is exactly what
// the real commands produce. (In reality all stages run at the same time and
// stream lines; showing them one after another makes each transformation clear.)

import { el } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field } from '../engagement/stepper.js';

const PIPELINES = {
  fruits: {
    label: 'Most common fruit',
    stages: [
      ['cat fruits.txt', 'Read the file: 7 lines, duplicates scattered.', ['banana', 'apple', 'cherry', 'apple', 'banana', 'mango', 'apple']],
      ['sort', 'sort puts equal lines next to each other — required, because uniq only looks at neighbours.', ['apple', 'apple', 'apple', 'banana', 'banana', 'cherry', 'mango']],
      ['uniq -c', 'uniq -c collapses each run of identical adjacent lines into one, prefixed with its count.', ['      3 apple', '      2 banana', '      1 cherry', '      1 mango']],
      ['sort -rn', 'sort -rn orders by that number, largest first. (Ties are then compared as whole lines in reverse, so mango comes before cherry.)', ['      3 apple', '      2 banana', '      1 mango', '      1 cherry']],
    ],
  },
  ips: {
    label: 'Top 3 client IPs in access.log',
    stages: [
      ["cut -d' ' -f1 access.log", 'cut keeps field 1 of each space-separated line: the client IP of every request.', ['192.168.1.10', '192.168.1.11', '192.168.1.10', '10.0.0.5', '192.168.1.12', '10.0.0.5', '192.168.1.10', '10.0.0.5', '192.168.1.11', '192.168.1.10']],
      ['sort', 'Group identical IPs together (text order, so 10.0.0.5 sorts before 192.…).', ['10.0.0.5', '10.0.0.5', '10.0.0.5', '192.168.1.10', '192.168.1.10', '192.168.1.10', '192.168.1.10', '192.168.1.11', '192.168.1.11', '192.168.1.12']],
      ['uniq -c', 'Count each group.', ['      3 10.0.0.5', '      4 192.168.1.10', '      2 192.168.1.11', '      1 192.168.1.12']],
      ['sort -rn', 'Sort numerically by the count, descending.', ['      4 192.168.1.10', '      3 10.0.0.5', '      2 192.168.1.11', '      1 192.168.1.12']],
      ['head -3', 'Keep the first three lines: the top three clients.', ['      4 192.168.1.10', '      3 10.0.0.5', '      2 192.168.1.11']],
    ],
  },
  errors: {
    label: 'Errors per component in app.log',
    stages: [
      ['grep ERROR app.log', 'grep passes on only the lines containing ERROR.', ['2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s', '2026-01-15 10:30:00 ERROR [payment] Payment gateway returned 503', '2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed']],
      ["cut -d' ' -f4", 'Field 4 (date, time, level, component) is the component in brackets.', ['[db]', '[payment]', '[payment]']],
      ['sort', 'Already grouped here, but sort makes it safe for any input order.', ['[db]', '[payment]', '[payment]']],
      ['uniq -c', 'Count per component.', ['      1 [db]', '      2 [payment]']],
    ],
  },
  depts: {
    label: 'Employees per department (skip the CSV header)',
    stages: [
      ['cut -d, -f3 employees.csv', 'Column 3 of the CSV — including the header line "dept".', ['dept', 'engineering', 'sales', 'engineering', 'hr', 'sales', 'engineering', 'hr', 'sales']],
      ['tail -n +2', 'tail -n +2 starts printing at line 2, dropping the header.', ['engineering', 'sales', 'engineering', 'hr', 'sales', 'engineering', 'hr', 'sales']],
      ['sort', 'Group the departments.', ['engineering', 'engineering', 'engineering', 'hr', 'hr', 'sales', 'sales', 'sales']],
      ['uniq -c', 'Count each department.', ['      3 engineering', '      2 hr', '      3 sales']],
    ],
  },
  salaries: {
    label: 'Two highest salaries above 60000',
    stages: [
      ["awk -F, 'NR>1 && $4 > 60000 {print $2, $4}' employees.csv", 'awk skips the header (NR>1), keeps rows whose salary (field 4) exceeds 60000, and prints name and salary.', ['asha 85000', 'meena 92000', 'fatima 61000', 'arjun 78000']],
      ['sort -k2 -rn', 'Sort by the second field (-k2), numerically, descending.', ['meena 92000', 'asha 85000', 'arjun 78000', 'fatima 61000']],
      ['head -2', 'Keep the top two.', ['meena 92000', 'asha 85000']],
    ],
  },
};

export function mount(root, { options }) {
  const choice = el('select', { class: 'select' }, Object.entries(PIPELINES).map(([v, p]) => el('option', { value: v }, p.label)));
  choice.value = PIPELINES[options.pipeline] ? options.pipeline : 'fruits';
  root.append(el('div', { class: 'viz-form' }, field('Pipeline', choice)));

  const cmd = el('pre', { class: 'mini-code', tabindex: 0 });
  const lane = el('ol', { class: 'flow-lane pipe-lane' });
  const outTitle = el('p', { class: 'tree-side-title' });
  const out = el('pre', { class: 'mini-code term-out', tabindex: 0, 'aria-label': 'Data at this point' });
  const stats = el('p', { class: 'viz-note' });
  root.append(el('div', { class: 'code-block' }, cmd), el('div', { class: 'viz-stage' }, lane, outTitle, out, stats));
  const stepper = createStepper(root, { render, playDelay: 1800, nextLabel: 'Next stage' });

  function start() {
    const p = PIPELINES[choice.value];
    cmd.innerHTML = highlight(p.stages.map(([c]) => c).join(' | '), 'bash');
    lane.replaceChildren(...p.stages.map(([c]) => el('li', { class: 'flow-node' }, el('span', {}, el('code', {}, c)))));
    const frames = p.stages.map(([c, text, lines], i) => ({ stage: i, lines, text: `${c}: ${text}`, last: i === p.stages.length - 1 }));
    const first = { stage: -1, lines: [], text: 'Each command reads the previous command\'s standard output as its standard input. Step through the stages to see the data after each one.' };
    stepper.load(first, frames);
  }

  function render(frame) {
    [...lane.children].forEach((li, i) => {
      li.className = ['flow-node', i === frame.stage ? 'is-current' : '', i < frame.stage ? 'is-visited' : ''].join(' ');
      li.toggleAttribute('aria-current', i === frame.stage);
    });
    outTitle.textContent = frame.stage < 0 ? 'Data' : frame.last ? 'Final output (on the terminal)' : `Output of stage ${frame.stage + 1} → stdin of stage ${frame.stage + 2}`;
    out.textContent = frame.lines.length ? frame.lines.join('\n') : '(nothing has run yet)';
    stats.textContent = frame.stage < 0 ? '' : `${frame.lines.length} line${frame.lines.length === 1 ? '' : 's'}`;
  }

  choice.addEventListener('change', start);
  start();
  return stepper;
}
