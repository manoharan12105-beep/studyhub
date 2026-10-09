// Guided decisions with Claude Code: at each stage choose what to do next — a mode,
// a prompt, a command, a review step. Good choices move the work forward and show
// their result; poor ones explain why they don't help (or are risky).
//
//   scenario → stage → you choose →
//     right choice: its result + why → next stage
//     wrong choice: why not → same stage
//   "Show next decision" plays the expert's choice, so Next/Play walk the ideal path.
//
// Reuses the state machine of the Linux troubleshooting simulator (advance). Results
// quoted from orderdesk (stack traces, test output, hook messages) come from real
// runs in the lessons; Claude's own replies are described, never invented as quotes.

import { el, escapeHtml } from '../util.js';
import { createStepper } from '../engagement/stepper.js';
import { advance } from './linux-troubleshooting-simulator.js';

const SCENARIOS = {
  'mode-choice': {
    title: 'Choosing a permission mode',
    intro: 'You open an unfamiliar repository you cloned this morning and want to understand it before changing anything. How do you start?',
    stages: [
      [
        { cmd: 'claude --permission-mode plan', ok: true, out: 'Status line: plan mode. Claude can read and explore; source edits wait for an approved plan.', why: 'Plan mode separates understanding from changing — the right start for unfamiliar code.' },
        { cmd: 'claude --dangerously-skip-permissions', why: 'Skipping all checks in a repository you don\'t know means its content can steer commands that run with your permissions. Isolated environments only.' },
        { cmd: 'claude --permission-mode acceptEdits', why: 'You don\'t want edits yet; acceptEdits would apply them without asking.' },
      ],
      [
        { cmd: 'Ask: "Map the endpoints, build commands and risky code. Cite file:line; mark each claim verified or guess."', ok: true, out: 'A structured map with citations comes back.', why: 'Specific, checkable output — you can verify each claim with grep.' },
        { cmd: 'Ask: "Improve this codebase."', why: 'Vague requests trigger broad scanning and changes you didn\'t want; there\'s nothing to verify.' },
      ],
      [
        { cmd: 'grep -rn "@.*Mapping" src/main/java   (check the endpoint claims yourself)', ok: true, out: 'OrderController.java:31 @PostMapping\nOrderController.java:37 @GetMapping("/{id}")\nOrderController.java:44 @GetMapping("/search")', why: 'Three endpoints — any other endpoint in Claude\'s map was invented.', done: 'Now you know the code and which of Claude\'s claims to trust. Switch to Manual mode (Shift+Tab) when you start changing things.' },
        { cmd: 'Accept the map and start coding', why: 'A summary is a claim, not proof. Check it first — it takes a minute.' },
      ],
    ],
  },
  delegation: {
    title: 'Delegate or not?',
    intro: 'You need to know which of 200 test classes use @Transactional, then fix one small bug. What do you do first?',
    stages: [
      [
        { cmd: 'Use a subagent: "Find every test class that uses @Transactional; report file:line only."', ok: true, out: 'A short list returns; the 200 file reads stayed in the subagent\'s context.', why: 'A wide search with a short answer is the textbook case for delegation.' },
        { cmd: 'Ask the main conversation to read all 200 test classes', why: 'Hundreds of file reads would fill your context and stay there for the rest of the task.' },
        { cmd: 'Start an agent team of five teammates', why: 'Teams are experimental, cost many times more tokens, and this task needs no discussion.' },
      ],
      [
        { cmd: 'Fix the one-line bug in the main conversation', ok: true, out: 'Small diff; the failing test passes.', why: 'Small, sequential, iterative work belongs in the main thread — delegation would only add startup time.', done: 'Rule of thumb: delegate verbose, self-contained or restricted work; keep iterative work in the main conversation.' },
        { cmd: 'Delegate the one-line fix to a general-purpose subagent', why: 'It starts without your context and adds requests for no benefit.' },
      ],
    ],
  },
  'issue-to-pr': {
    title: 'From issue to pull request',
    intro: 'BUG-101: orders without a discount code fail with 500, and failed creates still seem to be stored. Where do you begin?',
    stages: [
      [
        { cmd: 'Plan mode: "Restate every symptom in BUG-101 and how to reproduce each with a test."', ok: true, out: 'Two symptoms: the 500 (create and read) and the stored row after a failed create.', why: 'Separating symptoms early stops you fixing only the visible one.' },
        { cmd: '"Fix BUG-101 and push it."', why: 'No reproduction, no review, and a push you didn\'t look at.' },
      ],
      [
        { cmd: 'Write failing tests for both symptoms and run them', ok: true, out: 'java.lang.NullPointerException: Cannot invoke "String.trim()" because "discountCode" is null\nrows stored after a failed create: 1', why: 'Both symptoms reproduced — now any fix can be proven.' },
        { cmd: 'Catch NullPointerException in the controller', why: 'Hides the symptom; totals would be wrong and the stored-row problem remains.' },
      ],
      [
        { cmd: 'Fix the causes: null/blank code → no discount; @Transactional on create()', ok: true, out: 'rows stored after a failed create: 0\n[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0\n[INFO] BUILD SUCCESS', why: 'The transaction rolls the save back; the full build is green.' },
        { cmd: 'Change the test to expect a 500', why: 'The issue defines the expected behaviour: 201/200 with total = subtotal.' },
      ],
      [
        { cmd: 'Review git diff (tests first), then write the PR description with evidence and gaps', ok: true, out: 'PR description: what changed, test names, the verify summary, "not verified: cleanup of rows stored before the fix", Fixes #101.', why: 'Reviewers can check every claim.', done: 'You push and open the (draft) PR yourself after reading it — the agent doesn\'t.' },
        { cmd: 'Let Claude run git push and gh pr create immediately', why: 'Push and PR are outward-facing; keep them behind ask rules and your review.' },
      ],
    ],
  },
  'debug-npe': {
    title: 'Debugging a NullPointerException',
    intro: 'PriceCalculatorTest fails on main. What do you give Claude?',
    stages: [
      [
        { cmd: 'The exact failure: test name, message and first stack frames', ok: true, out: 'java.lang.NullPointerException: Cannot invoke "String.trim()" because "discountCode" is null\n\tat com.example.orderdesk.order.PriceCalculator.totalCents(PriceCalculator.java:14)', why: 'Exact evidence; the helpful NPE message names the null variable.' },
        { cmd: '"Tests are broken, please fix."', why: 'No evidence to work from — invites guessing.' },
      ],
      [
        { cmd: '"Explain the root cause with file:line before changing anything."', ok: true, out: 'Line 14 calls trim() on a code that may legitimately be missing (the request allows no code).', why: 'Diagnosis first; you can check it against CreateOrderRequest.' },
        { cmd: '"Make the test pass."', why: 'Changing the test is one way to make it pass. Ask for the cause.' },
      ],
      [
        { cmd: 'Fix: null or blank code returns the subtotal; run ./mvnw -B verify', ok: true, out: '[INFO] Tests run: 7, Failures: 0, Errors: 0, Skipped: 0\n[INFO] BUILD SUCCESS', why: 'The cause is fixed and the original test is unchanged.', done: 'Next: add regression tests for a blank code and for rounding down, and check that git diff -- src/test shows only additions.' },
        { cmd: 'Wrap the calculation in try/catch and return 0', why: 'Every order without a code would cost 0 — a worse bug, hidden.' },
      ],
    ],
  },
  'failed-change-recovery': {
    title: 'Recovering from an unwanted change',
    intro: 'Claude\'s last two edits rewrote the README and renamed a method you didn\'t ask about. What now?',
    stages: [
      [
        { cmd: '/rewind to the checkpoint before those edits', ok: true, out: 'The README and the renamed method return to their previous content.', why: 'Checkpoints undo Claude\'s file-tool edits from this session.' },
        { cmd: 'git reset --hard', why: 'Also destroys any uncommitted work you wanted to keep — check git status and stash first, or use targeted commands.' },
        { cmd: 'Argue with Claude for several turns until it reverts', why: 'Burns context with failed attempts; rewind is direct.' },
      ],
      [
        { cmd: 'git status --short   (check what remains)', ok: true, out: ' M src/main/java/com/example/orderdesk/order/OrderController.java\n?? notes.txt', why: 'A file created by a Bash command isn\'t tracked by checkpoints — it\'s still there.' },
        { cmd: 'Assume /rewind restored everything', why: 'Bash side effects aren\'t covered by checkpoints. Look.' },
      ],
      [
        { cmd: 'git clean -n, then git clean -f notes.txt', ok: true, out: 'Would remove notes.txt\nRemoving notes.txt', why: 'A dry run first, then remove exactly that file.', done: 'Then restate the task with its scope ("only change X; don\'t rename or reformat") and continue.' },
        { cmd: 'git clean -fdx', why: 'Deletes every untracked and ignored file in the repository — including local config you need.' },
      ],
    ],
  },
  'untrusted-repo': {
    title: 'An untrusted repository',
    intro: 'A colleague sends a repository from an unknown source and asks you to "run Claude on it to see what it does". It contains .claude/settings.json, hooks and .mcp.json.',
    stages: [
      [
        { cmd: 'Read .claude/settings.json, .claude/hooks/*, .mcp.json and .claude/skills/* before trusting the folder', ok: true, out: 'A SessionStart hook runs curl … | sh; .mcp.json starts a server from an unknown npm package.', why: 'Hooks, MCP servers and skills run with your permissions once you trust the folder.' },
        { cmd: 'claude -p "summarize this repository"', why: '-p skips the trust dialog — the project hooks would run and .mcp.json servers would connect.' },
        { cmd: 'Accept the workspace trust dialog to save time', why: 'Trust is exactly what lets that configuration run.' },
      ],
      [
        { cmd: 'Explore it in a disposable container or VM, without credentials, declining trust', ok: true, out: 'Claude reads the code; no project hooks or servers run; nothing on your machine is reachable.', why: 'Contain first: isolation limits what the repository can do.', done: 'Report the malicious hook to your colleague. Untrusted repositories, issues and PR text are all untrusted input.' },
        { cmd: 'Run it on your laptop in bypassPermissions "since it\'s just reading"', why: 'Bypass removes the checks that would stop the hook\'s commands and anything the content steers Claude to do.' },
      ],
    ],
  },
};

export function mount(root, { options }) {
  const scenario = SCENARIOS[options.scenario] || SCENARIOS['mode-choice'];
  const term = el('pre', { class: 'mini-code term-out trouble-term', tabindex: 0, 'aria-label': 'What happened' });
  const prompt = el('p', { class: 'trouble-prompt' });
  const choices = el('div', { class: 'trouble-choices', role: 'group', 'aria-label': 'Choose the next step' });
  const progress = el('p', { class: 'viz-note' });
  root.append(el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, `${scenario.title} — StudyHub simulation`), term, prompt, choices, progress));
  const stepper = createStepper(root, { render, playDelay: 2600, nextLabel: 'Show next decision' });

  let current = null;
  function start(picks = []) {
    const first = { stage: 0, picks: [], cmd: null, out: null, kind: 'intro', text: scenario.intro };
    stepper.load(first, (frame, index) => advance(scenario, frame, picks[index]));
    for (let i = 0; i < picks.length; i += 1) stepper.next();
  }

  function render(frame) {
    current = frame;
    term.innerHTML = frame.cmd
      ? `${escapeHtml(`> ${frame.cmd}`)}${frame.out ? `\n${escapeHtml(frame.out)}` : ''}`
      : escapeHtml(scenario.intro);
    term.classList.toggle('is-wrong', frame.kind === 'wrong');
    const done = frame.stage >= scenario.stages.length;
    prompt.textContent = done ? 'Scenario complete.' : 'What do you do next?';
    choices.replaceChildren(...(done ? [] : scenario.stages[frame.stage].map((c, i) => el('button', {
      type: 'button', class: 'btn btn-secondary btn-sm trouble-choice', 'data-choice': i,
    }, c.cmd))));
    progress.textContent = `Stage ${Math.min(frame.stage + 1, scenario.stages.length)} of ${scenario.stages.length}${frame.kind === 'wrong' ? ' · that choice did not move the work forward' : ''}`;
  }

  choices.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-choice]');
    if (!button || !current) return;
    start([...current.picks, Number(button.dataset.choice)]);
  });

  start();
  return stepper;
}
