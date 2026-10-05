// sed 's/…/…/' line by line on a practice-lab file.
//
//   pattern + replacement + flags + address → one step per input line:
//   is the line selected? → where does the pattern match? → the line sed prints
//
// sed -E (extended regex) is emulated with the browser's regex engine. For the
// patterns used in the lessons the two agree; differences (POSIX "longest
// alternative" matching, GNU-only escapes) are rejected or noted below the form.

import { el } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field, errorLine } from '../engagement/stepper.js';

const FILES = {
  'config/app.conf': [
    '# Application configuration', 'app.name=inventory', 'app.port=8080', 'app.env=dev',
    'db.host=localhost', 'db.port=5432', 'log.level=INFO',
  ],
  'app.log': [
    '2026-01-15 09:00:01 INFO  [main] Application starting',
    '2026-01-15 09:00:02 INFO  [main] Loading configuration from config/app.conf',
    '2026-01-15 09:00:03 WARN  [db] Connection pool size not set, using default 10',
    '2026-01-15 09:00:05 INFO  [http] Server listening on port 8080',
    '2026-01-15 09:15:42 ERROR [db] Connection timed out after 30s',
    '2026-01-15 09:15:43 INFO  [db] Retrying connection (attempt 2)',
    '2026-01-15 09:15:44 INFO  [db] Connection established',
    '2026-01-15 10:02:10 WARN  [http] Slow request: GET /api/orders took 2300ms',
    '2026-01-15 10:30:00 ERROR [payment] Payment gateway returned 503',
    '2026-01-15 10:30:01 ERROR [payment] Order 1042 payment failed',
    '2026-01-15 11:45:12 INFO  [http] GET /api/health 200',
    '2026-01-15 12:00:00 INFO  [main] Scheduled cleanup finished',
  ],
  'employees.csv': [
    'id,name,dept,salary,city', '101,asha,engineering,85000,chennai', '102,ravi,sales,52000,mumbai',
    '103,meena,engineering,92000,bengaluru', '104,john,hr,48000,chennai', '105,fatima,sales,61000,delhi',
    '106,arjun,engineering,78000,mumbai', '107,divya,hr,50000,bengaluru', '108,karan,sales,45000,chennai',
  ],
};

const POSIX_CLASSES = {
  '[:digit:]': '0-9', '[:alpha:]': 'A-Za-z', '[:alnum:]': 'A-Za-z0-9', '[:upper:]': 'A-Z',
  '[:lower:]': 'a-z', '[:space:]': ' \\t\\n\\r\\f\\v', '[:blank:]': ' \\t', '[:punct:]': '!-\\/:-@\\[-`{-~',
};

export function mount(root, { options }) {
  const file = el('select', { class: 'select' }, Object.keys(FILES).map((f) => el('option', { value: f }, f)));
  file.value = FILES[options.file] ? options.file : 'config/app.conf';
  const pattern = el('input', { class: 'input', autocomplete: 'off', spellcheck: 'false', value: options.pattern ?? '=' });
  const replacement = el('input', { class: 'input', autocomplete: 'off', spellcheck: 'false', value: options.replacement ?? ' = ' });
  const global = el('input', { type: 'checkbox' });
  global.checked = Boolean(options.global);
  const icase = el('input', { type: 'checkbox' });
  const address = el('input', { class: 'input', autocomplete: 'off', spellcheck: 'false', value: options.address ?? '', placeholder: 'all lines' });
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' },
    field('Input file', file),
    field('Address', address, 'Empty, a line (3), a range (2,4) or a regex (/ERROR/)'),
    field('Pattern (ERE)', pattern, 'e.g. ([0-9]+)ms  ·  ^#  ·  [a-z]+'),
    field('Replacement', replacement, '& = whole match, \\1 = group 1'),
    el('div', { class: 'field sed-flags', role: 'group', 'aria-label': 'Flags' }, el('span', {}, 'Flags'),
      el('label', {}, global, ' g (every match)'), el('label', {}, icase, ' I (ignore case)'))), error.node);

  const cmd = el('pre', { class: 'mini-code', tabindex: 0 });
  const lines = el('ol', { class: 'sed-lines' });
  const out = el('pre', { class: 'mini-code term-out', tabindex: 0, 'aria-label': 'sed output so far' });
  root.append(el('div', { class: 'code-block' }, cmd), el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, 'Input'), lines,
    el('p', { class: 'tree-side-title' }, 'Output'), out,
    el('p', { class: 'viz-note' }, 'Emulates GNU sed -E. Not supported here: \\d (sed has no \\d — use [0-9]), lookarounds and lazy quantifiers, which sed does not have either.')));
  const stepper = createStepper(root, { render, playDelay: 1000, nextLabel: 'Next line' });

  function start() {
    let script;
    try {
      script = compile({ pattern: pattern.value, replacement: replacement.value, global: global.checked, icase: icase.checked, address: address.value.trim() });
    } catch (e) {
      error.show(e.message);
      return;
    }
    error.clear();
    const delim = /\//.test(pattern.value + replacement.value) ? '#' : '/';
    cmd.innerHTML = highlight(`sed -E '${address.value.trim()}s${delim}${pattern.value}${delim}${replacement.value}${delim}${global.checked ? 'g' : ''}${icase.checked ? 'I' : ''}' ${file.value}`, 'bash');
    stepper.load(...buildFrames(FILES[file.value], script));
  }

  function render(frame) {
    lines.replaceChildren(...FILES[file.value].map((text, i) => {
      const li = el('li', { class: ['sed-line', i === frame.index ? 'is-current' : '', frame.done.includes(i) ? 'is-done' : ''].join(' ') });
      if (i === frame.index && frame.matches.length) li.append(...markMatches(text, frame.matches));
      else li.append(text);
      return li;
    }));
    out.textContent = frame.output.length ? frame.output.join('\n') : '(nothing yet)';
  }

  for (const c of [file, global, icase]) c.addEventListener('change', start);
  for (const c of [pattern, replacement, address]) c.addEventListener('input', start);
  start();
  return stepper;
}

/** Validate the sed pieces and turn them into JS regexes. Throws Error with a learner-friendly message. */
export function compile({ pattern, replacement, global, icase, address }) {
  if (!pattern) throw new Error('The pattern is empty. sed would reuse the previous pattern; type one here.');
  if (/\\d/.test(pattern)) throw new Error('sed has no \\d. Use [0-9] or [[:digit:]].');
  if (/\(\?|[*+?}]\?/.test(pattern)) throw new Error('Lookarounds (?=…) and lazy quantifiers (*?, +?) do not exist in sed.');
  let source = pattern;
  for (const [cls, js] of Object.entries(POSIX_CLASSES)) source = source.split(cls).join(js);
  let regex;
  try {
    regex = new RegExp(source, `g${icase ? 'i' : ''}`);
  } catch {
    throw new Error('That is not a valid regular expression (check brackets and parentheses).');
  }
  if (regex.test('')) throw new Error('This pattern can match an empty string, which makes the result hard to read. Make it match at least one character.');
  const groups = new RegExp(`${source}|`).exec('').length - 1;
  const refs = [...replacement.matchAll(/\\(\d)/g)].map((m) => Number(m[1]));
  const bad = refs.find((n) => n > groups);
  if (bad) throw new Error(`The replacement uses \\${bad}, but the pattern has only ${groups} group${groups === 1 ? '' : 's'} ( … ). sed reports "invalid reference \\${bad} on s command's RHS".`);
  return { regex, replacement, global, select: parseAddress(address) };
}

function parseAddress(address) {
  if (!address) return () => true;
  let m = address.match(/^(\d+)$/);
  if (m) return (_, n) => n === Number(m[1]);
  m = address.match(/^(\d+),(\d+)$/);
  if (m) return (_, n) => n >= Number(m[1]) && n <= Number(m[2]);
  m = address.match(/^\/(.+)\/$/);
  if (m) {
    let re;
    try { re = new RegExp(m[1]); } catch { throw new Error('The address regex is not valid.'); }
    return (line) => re.test(line);
  }
  throw new Error('Address must be empty, a line number (3), a range (2,4) or a regex in slashes (/ERROR/).');
}

/** Apply sed's replacement syntax: & = whole match, \1–\9 = groups, \& = literal &, \n = newline. */
function expand(replacement, match) {
  return replacement.replace(/\\([0-9&n\\])|&/g, (token, esc) => {
    if (token === '&') return match[0];
    if (esc === '&') return '&';
    if (esc === 'n') return '\n';
    if (esc === '\\') return '\\';
    return match[Number(esc)] ?? '';
  });
}

export function buildFrames(input, { regex, replacement, global, select }) {
  const output = [];
  const done = [];
  const frames = [];
  const first = { index: -1, matches: [], output: [], done: [], text: `sed reads ${input.length} lines one at a time into its "pattern space", runs the script on it, then prints the result (unless -n is used).` };
  input.forEach((line, i) => {
    const n = i + 1;
    let text;
    let matches = [];
    let result = line;
    if (!select(line, n)) {
      text = `Line ${n} is not selected by the address, so it is printed unchanged.`;
    } else {
      regex.lastIndex = 0;
      const all = [...line.matchAll(regex)];
      matches = global ? all : all.slice(0, 1);
      if (!matches.length) {
        text = `Line ${n}: the pattern does not match — printed unchanged.`;
      } else {
        let pos = 0;
        let built = '';
        for (const m of matches) {
          built += line.slice(pos, m.index) + expand(replacement, m);
          pos = m.index + m[0].length;
        }
        result = built + line.slice(pos);
        const skipped = all.length - matches.length;
        text = `Line ${n}: ${matches.length} match${matches.length === 1 ? '' : 'es'} replaced${skipped ? ` (${skipped} more on this line ignored — add the g flag)` : ''} → ${JSON.stringify(result)}.`;
      }
    }
    output.push(...result.split('\n'));
    done.push(i);
    frames.push({ index: i, matches: matches.map((m) => [m.index, m.index + m[0].length]), output: output.slice(), done: done.slice(), text });
  });
  frames.push({ index: -1, matches: [], output: output.slice(), done: done.slice(), text: 'End of input. The file itself is unchanged — sed wrote to standard output. Add -i (ideally -i.bak) to edit the file in place.' });
  return [first, frames];
}

function markMatches(text, ranges) {
  const parts = [];
  let pos = 0;
  for (const [start, end] of ranges) {
    parts.push(text.slice(pos, start), el('mark', { class: 'sed-match' }, text.slice(start, end)));
    pos = end;
  }
  parts.push(text.slice(pos));
  return parts.filter((p) => p !== '');
}
