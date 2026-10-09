// Shared, DOM-free logic for the Claude Code Mastery interactions.
//
// Not an interaction itself (nothing registers "claude-code-common"). Each part is
// a small model of documented Claude Code behaviour (v2.1.289, October 2026),
// simplified for teaching — the lessons say where the real product has more cases:
//   permissionOutcome  — what one action does under a permission mode and rules
//   loadedInstructions — which CLAUDE.md / rules files are in context after events
//   HOOK_SCENARIOS     — hook runs built from the orderdesk hook scripts' real output
//   MCP_EXCHANGES      — the RunbookServer stdio session (real responses)
//   contextShares      — percentages for the context budget explorer

// ── Permission modes ────────────────────────────────────────────────────────

export const MODES = {
  default: 'Manual (default)',
  acceptEdits: 'acceptEdits',
  plan: 'plan',
  auto: 'auto',
  dontAsk: 'dontAsk',
  bypassPermissions: 'bypassPermissions',
};

// kind: read | readonly-bash | edit | fs-bash | bash | protected-edit
// rule: what orderdesk's project settings say about it, when the rules are on.
export const ACTIONS = {
  'read-java': { label: 'Read PriceCalculator.java', kind: 'read' },
  'read-env': { label: 'Read .env', kind: 'read', rule: { type: 'deny', text: 'Read(.env)' } },
  'git-status': { label: 'Bash: git status', kind: 'readonly-bash' },
  'edit-java': { label: 'Edit PriceCalculator.java', kind: 'edit' },
  'edit-pom': { label: 'Edit pom.xml', kind: 'edit', rule: { type: 'ask', text: 'Edit(/pom.xml)' } },
  'edit-settings': { label: 'Edit .claude/settings.json', kind: 'protected-edit' },
  mkdir: { label: 'Bash: mkdir docs/adr', kind: 'fs-bash' },
  verify: { label: 'Bash: ./mvnw -B verify', kind: 'bash', rule: { type: 'allow', text: 'Bash(./mvnw -B verify)' } },
  push: { label: 'Bash: git push origin main', kind: 'bash', rule: { type: 'ask', text: 'Bash(git push *)' } },
  curl: { label: 'Bash: curl https://example.com', kind: 'bash', rule: { type: 'deny', text: 'Bash(curl *)' } },
};

/**
 * Outcome of one action. Returns { result: 'runs' | 'asks' | 'denied' | 'blocked' | 'classifier', why }.
 * Plan mode is modelled for a session where auto mode and bypass permissions are not
 * available (planning commands outside the read-only set then prompt).
 */
export function permissionOutcome(mode, actionId, rulesOn) {
  const action = ACTIONS[actionId];
  const rule = rulesOn ? action.rule : undefined;
  if (rule?.type === 'deny') {
    return { result: 'denied', why: `Deny rule ${rule.text} — deny rules block in every mode, including bypassPermissions.` };
  }
  if (mode === 'plan' && (action.kind === 'edit' || action.kind === 'protected-edit')) {
    return { result: 'blocked', why: 'Plan mode: no file edits until you approve the plan — after that, the usual rules (including any ask rule) apply.' };
  }
  if (rule?.type === 'ask') {
    return mode === 'dontAsk'
      ? { result: 'denied', why: `Ask rule ${rule.text}: dontAsk denies anything that would prompt.` }
      : { result: 'asks', why: `Ask rule ${rule.text} — no mode auto-approves an explicit ask rule.` };
  }
  if (action.kind === 'protected-edit') {
    const table = {
      default: ['asks', '.claude/ is a protected path: writes are prompted.'],
      acceptEdits: ['asks', '.claude/ is a protected path: acceptEdits still prompts.'],
      plan: ['blocked', 'Plan mode: edits wait until you approve the plan (and protected-path writes are never auto-approved).'],
      auto: ['classifier', 'Protected-path writes are routed to the auto-mode classifier.'],
      dontAsk: ['denied', 'Protected-path writes are denied in dontAsk.'],
      bypassPermissions: ['runs', 'bypassPermissions allows protected-path writes — one reason it belongs in isolated environments only.'],
    };
    const [result, why] = table[mode];
    return { result, why };
  }
  if (mode === 'bypassPermissions') {
    return { result: 'runs', why: 'bypassPermissions skips prompts (deny rules and explicit ask rules still apply).' };
  }
  if (action.kind === 'read' || action.kind === 'readonly-bash') {
    return { result: 'runs', why: action.kind === 'read'
      ? 'Reads inside the working directory run without a prompt in every mode.'
      : 'git status is in the built-in read-only command set: no prompt in any mode.' };
  }
  if (rule?.type === 'allow') {
    return { result: 'runs', why: `Allow rule ${rule.text} pre-approves this command.` };
  }
  if (action.kind === 'edit') {
    const table = {
      default: ['asks', 'Manual mode prompts before file edits.'],
      acceptEdits: ['runs', 'acceptEdits auto-accepts edits inside the working directory.'],
      plan: ['blocked', 'Plan mode: no source edits until you approve the plan.'],
      auto: ['runs', 'Auto mode approves file edits in the working directory without the classifier.'],
      dontAsk: ['denied', 'dontAsk: not pre-approved, so denied instead of prompting.'],
    };
    const [result, why] = table[mode];
    return { result, why };
  }
  if (action.kind === 'fs-bash') {
    const table = {
      default: ['asks', 'Manual mode prompts before shell commands outside the read-only set.'],
      acceptEdits: ['runs', 'acceptEdits auto-approves common filesystem commands (mkdir, touch, mv, cp) in the working directory.'],
      plan: ['asks', 'Planning: commands outside the read-only set prompt (when auto mode isn\'t available).'],
      auto: ['classifier', 'The auto-mode classifier reviews shell commands.'],
      dontAsk: ['denied', 'dontAsk: not pre-approved, so denied.'],
    };
    const [result, why] = table[mode];
    return { result, why };
  }
  const table = {
    default: ['asks', 'Manual mode prompts before shell commands outside the read-only set.'],
    acceptEdits: ['asks', 'acceptEdits covers edits and common filesystem commands only — other commands still prompt.'],
    plan: ['asks', 'Planning: commands outside the read-only set prompt (when auto mode isn\'t available).'],
    auto: ['classifier', 'The auto-mode classifier reviews shell commands and network operations.'],
    dontAsk: ['denied', 'dontAsk: not pre-approved, so denied.'],
  };
  const [result, why] = table[mode];
  return { result, why };
}

// ── Instruction loading ─────────────────────────────────────────────────────

// A monorepo with two modules, a path-scoped rule and personal files.
export const INSTRUCTION_FILES = [
  { id: 'user', path: '~/.claude/CLAUDE.md', scope: 'user' },
  { id: 'memory', path: 'auto memory MEMORY.md (first 200 lines / 25 KB)', scope: 'memory' },
  { id: 'root', path: 'CLAUDE.md', scope: 'launch', dir: '' },
  { id: 'local', path: 'CLAUDE.local.md', scope: 'launch', dir: '' },
  { id: 'style', path: '.claude/rules/java-style.md (no paths)', scope: 'rule' },
  { id: 'orders', path: 'orders/CLAUDE.md', scope: 'dir', dir: 'orders' },
  { id: 'billing', path: 'billing/CLAUDE.md', scope: 'dir', dir: 'billing' },
  { id: 'migrations', path: '.claude/rules/migrations.md (paths: **/db/migration/**)', scope: 'path-rule' },
];

export const START_DIRS = { root: 'Repository root', orders: 'orders/ module' };

export const INSTRUCTION_EVENTS = {
  start: 'Session starts',
  'read-order': 'Claude reads orders/src/main/java/…/Order.java',
  'read-migration': 'Claude reads orders/src/main/resources/db/migration/V1__create_orders.sql',
  'read-billing': 'Claude reads billing/src/main/java/…/Invoice.java',
  compact: '/compact runs',
};

/**
 * Applies events in order and returns [{ event, loaded: Set<id>, note }].
 * Files under the launch directory and its ancestors load at start; other
 * directories' CLAUDE.md load on demand; path rules load with a matching file;
 * after compaction launch-time files reload and on-demand ones drop until needed again.
 */
export function loadedInstructions(start, events) {
  const atLaunch = () => {
    const set = new Set(['user', 'memory', 'root', 'local', 'style']);
    if (start === 'orders') set.add('orders');
    return set;
  };
  let loaded = new Set();
  const steps = [];
  for (const event of events) {
    let note;
    if (event === 'start') {
      loaded = atLaunch();
      note = start === 'orders'
        ? 'Started in orders/: its CLAUDE.md and every ancestor\'s load at launch, plus user files, auto memory and unscoped rules.'
        : 'Started at the root: root CLAUDE.md, CLAUDE.local.md, user CLAUDE.md, auto memory and unscoped rules load. Subdirectory files wait until needed.';
    } else if (event === 'read-order') {
      const had = loaded.has('orders');
      loaded.add('orders');
      note = had ? 'orders/CLAUDE.md is already in context.' : 'Working in orders/ loads orders/CLAUDE.md on demand.';
    } else if (event === 'read-migration') {
      loaded.add('orders');
      loaded.add('migrations');
      note = 'The file matches the migrations rule\'s paths glob, so that rule loads (and orders/CLAUDE.md, if not yet loaded).';
    } else if (event === 'read-billing') {
      loaded.add('billing');
      note = 'billing/CLAUDE.md loads on demand — unless claudeMdExcludes lists it.';
    } else if (event === 'compact') {
      loaded = atLaunch();
      note = 'After compaction, launch-time files are re-read; on-demand CLAUDE.md files and path-scoped rules return when a matching file is read again.';
    }
    steps.push({ event, loaded: new Set(loaded), note });
  }
  return steps;
}

// ── Hooks ───────────────────────────────────────────────────────────────────

// Script results are the real output of the orderdesk hook scripts fed this input
// (Lab 09 and Test-Driven Bug Fixes), with the project path shown as /home/dev/orderdesk
// and jq's pretty-printed JSON compacted to one line. What Claude Code does next is the
// documented behaviour.
export const HOOK_SCENARIOS = {
  'protect-env': {
    title: 'Claude tries to edit .env',
    event: 'PreToolUse', matcher: 'Edit|Write', script: 'protect-files.sh',
    input: '{"tool_name":"Edit","tool_input":{"file_path":"/home/dev/orderdesk/.env"}}',
    stdout: '', stderr: 'Blocked: .env holds secrets. Ask the developer to change it.', exit: 2,
    outcome: 'blocked', effect: 'Exit 2 on PreToolUse blocks the tool call. The edit never happens; Claude receives the stderr text and should ask you instead.',
  },
  'new-migration': {
    title: 'Claude creates V2__add_paid_at.sql',
    event: 'PreToolUse', matcher: 'Edit|Write', script: 'protect-files.sh',
    input: '{"tool_name":"Write","tool_input":{"file_path":"/home/dev/orderdesk/src/main/resources/db/migration/V2__add_paid_at.sql"}}',
    stdout: '', stderr: '', exit: 0,
    outcome: 'continues', effect: 'Exit 0 with no output: the hook has no objection. The normal permission check decides (Manual mode would still prompt for the new file).',
  },
  'pom-ask': {
    title: 'Claude edits pom.xml',
    event: 'PreToolUse', matcher: 'Edit|Write', script: 'protect-files.sh',
    input: '{"tool_name":"Edit","tool_input":{"file_path":"/home/dev/orderdesk/pom.xml"}}',
    stdout: '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"ask","permissionDecisionReason":"pom.xml changes the build for everyone: review this edit before approving it."}}',
    stderr: '', exit: 0,
    outcome: 'asks', effect: 'Exit 0 with a JSON decision "ask": Claude Code shows you a permission prompt with the reason, even in modes that would otherwise accept edits.',
  },
  'force-push': {
    title: 'Claude runs git push --force origin main',
    event: 'PreToolUse', matcher: 'Bash', script: 'block-dangerous-bash.sh',
    input: '{"tool_name":"Bash","tool_input":{"command":"git push --force origin main"}}',
    stdout: '{"hookSpecificOutput":{"hookEventName":"PreToolUse","permissionDecision":"deny","permissionDecisionReason":"Force-push rewrites shared history. Push normally and let a human decide."}}',
    stderr: '', exit: 0,
    outcome: 'blocked', effect: 'A JSON "deny" decision blocks the command; Claude sees the reason. A spelling such as "git -C . push --force" would not match this text-based guard — branch protection is the real control.',
  },
  'java-tabs': {
    title: 'Claude writes a Java file indented with tabs',
    event: 'PostToolUse', matcher: 'Edit|Write', script: 'check-java-file.sh',
    input: '{"tool_name":"Write","tool_input":{"file_path":"/home/dev/orderdesk/Tabbed.java"}}',
    stdout: '', stderr: '/home/dev/orderdesk/Tabbed.java contains tab characters: this project indents with 4 spaces.', exit: 2,
    outcome: 'feedback', effect: 'PostToolUse runs after the write — the file is already changed. Exit 2 shows stderr to Claude, which fixes the indentation in its next step.',
  },
  'stop-red': {
    title: 'Claude tries to finish while tests fail',
    event: 'Stop', matcher: '(none)', script: 'test-before-stop.sh',
    input: '{"hook_event_name":"Stop","stop_hook_active":false}',
    stdout: '', stderr: 'Tests fail after your changes. Fix the cause (do not weaken tests), then run ./mvnw -B verify:\n[ERROR]   PriceCalculatorTest.discountIsRoundedDownToWholeCents:41 expected: <900> but was: <899>', exit: 2,
    outcome: 'continues-turn', effect: 'Exit 2 on Stop prevents Claude from finishing; the stderr text becomes the reason to keep working. On the next stop, stop_hook_active is true and this hook lets the turn end (Claude Code also caps 8 consecutive continuations).',
  },
};

export function hookFrames(id) {
  const s = HOOK_SCENARIOS[id];
  return [
    { stage: 'tool', text: `Claude decides to act: ${s.title}.` },
    { stage: 'match', text: `${s.event} fires. The matcher "${s.matcher}" selects ${s.script}.` },
    { stage: 'input', text: 'Claude Code sends the event as JSON on the script\'s stdin.' },
    { stage: 'result', text: `The script exits ${s.exit}${s.stdout ? ' and prints a JSON decision' : s.stderr ? ' and writes a message to stderr' : ' with no output'}.` },
    { stage: 'effect', text: s.effect },
  ];
}

// ── MCP ─────────────────────────────────────────────────────────────────────

// Requests and responses from the real stdio session with RunbookServer.java (Lab 10).
export const MCP_EXCHANGES = {
  initialize: {
    request: '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"manual-test","version":"0.0.1"}}}',
    response: '{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2025-06-18","capabilities":{"tools":{}},"serverInfo":{"name":"runbook","version":"1.0.0"}}}',
  },
  initialized: { request: '{"jsonrpc":"2.0","method":"notifications/initialized"}', response: null },
  list: {
    request: '{"jsonrpc":"2.0","id":2,"method":"tools/list"}',
    response: '{"jsonrpc":"2.0","id":2,"result":{"tools":[{"name":"get_runbook","description":"Returns the team\'s runbook for deploy, rollback or db-migration.","inputSchema":{"type":"object","properties":{"topic":{"type":"string","enum":["deploy","rollback","db-migration"]}},"required":["topic"]}}]}}',
  },
  rollback: {
    request: '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_runbook","arguments":{"topic":"rollback"}}}',
    response: '{"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"1. Redeploy the previous image tag. 2. Do not roll back database migrations; ship a new forward migration instead. 3. Post in #incidents."}],"isError":false}}',
  },
  payroll: {
    request: '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"get_runbook","arguments":{"topic":"payroll"}}}',
    response: '{"jsonrpc":"2.0","id":4,"result":{"content":[{"type":"text","text":"Unknown topic. Use deploy, rollback or db-migration."}],"isError":true}}',
  },
  resources: {
    request: '{"jsonrpc":"2.0","id":5,"method":"resources/list"}',
    response: '{"jsonrpc":"2.0","id":5,"error":{"code":-32601,"message":"Method not found: resources/list"}}',
  },
};

export const MCP_VARIANTS = {
  rollback: 'Ask about rolling back a release',
  payroll: 'Ask for a topic the server doesn\'t have',
  resources: 'Client asks for resources the server doesn\'t offer',
  denied: 'You deny the tool call',
};

/** Ordered steps for one variant: { from, to, label, note, states }. */
export function mcpSteps(variant) {
  const steps = [
    { from: 'client', to: 'server', label: 'initialize', note: 'Claude Code starts the process (stdio) and proposes a protocol version.' },
    { from: 'server', to: 'client', label: 'result: protocolVersion 2025-06-18, capabilities.tools', note: 'The server answers with its version and capabilities.' },
    { from: 'client', to: 'server', label: 'notifications/initialized', note: 'A notification — no id, so no reply. Now `claude mcp list` would show ✔ Connected.' },
    { from: 'client', to: 'server', label: 'tools/list', note: 'Claude Code asks which tools exist.' },
    { from: 'server', to: 'client', label: 'get_runbook {topic: deploy|rollback|db-migration}', note: 'The name, description and input schema are what Claude uses to decide when to call it. In Claude Code the tool is mcp__runbook__get_runbook.' },
  ];
  if (variant === 'resources') {
    steps.push(
      { from: 'client', to: 'server', label: 'resources/list', note: 'A method this server doesn\'t implement.' },
      { from: 'server', to: 'client', label: 'error -32601 Method not found', note: 'A JSON-RPC protocol error, different from a tool-level error.' },
    );
    return steps;
  }
  steps.push(
    { from: 'model', to: 'client', label: `call get_runbook(topic=${variant === 'payroll' ? 'payroll' : 'rollback'})`, note: 'Claude picks the tool from your request.' },
    { from: 'client', to: 'user', label: 'permission prompt for mcp__runbook__get_runbook', note: 'MCP tool calls go through the same permission system as built-in tools.' },
  );
  if (variant === 'denied') {
    steps.push({ from: 'user', to: 'client', label: 'deny', note: 'Nothing is sent to the server; Claude is told the call was denied and answers without the runbook.' });
    return steps;
  }
  steps.push(
    { from: 'user', to: 'client', label: 'allow', note: 'Approve once, or add an allow rule for mcp__runbook__get_runbook.' },
    { from: 'client', to: 'server', label: 'tools/call', note: 'The arguments travel as JSON-RPC over stdin.' },
  );
  steps.push(variant === 'payroll'
    ? { from: 'server', to: 'client', label: 'isError: true — "Unknown topic. Use deploy, rollback or db-migration."', note: 'A tool-level error: Claude reads it and can retry with a valid topic.' }
    : { from: 'server', to: 'client', label: 'isError: false — "1. Redeploy the previous image tag. 2. …"', note: 'The result text enters Claude\'s context — which is why results from untrusted sources need care.' });
  steps.push({ from: 'client', to: 'model', label: 'tool result in context', note: 'Claude answers using the text.' });
  return steps;
}

// ── Context budget ──────────────────────────────────────────────────────────

/** items: [{ label, tokens }], windowTokens → rows with percent of the window and the total. */
export function contextShares(items, windowTokens) {
  const used = items.reduce((sum, i) => sum + Math.max(0, i.tokens), 0);
  return {
    used,
    free: Math.max(0, windowTokens - used),
    over: used > windowTokens,
    rows: items.map((i) => ({ label: i.label, tokens: i.tokens, percent: windowTokens > 0 ? Math.round((i.tokens / windowTokens) * 1000) / 10 : 0 })),
  };
}
