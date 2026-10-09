# Claude Modes

**Module:** Foundations, Installation and Modes · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and the official *Choose a permission mode* and *Configure permissions* pages (October 2026). Defaults in this lesson are **version-dependent**; each one names the version it applies to.

## Definition

In Claude Code, the official **modes** are **permission modes**. A permission mode sets the baseline for what Claude may do in a session **without asking you first**. There are six:

| Mode (config value) | Shown in the CLI as | What runs without asking |
|---------------------|---------------------|--------------------------|
| `default` | **Manual** — `⏸ manual mode on` | Reads only |
| `acceptEdits` | **Accept edits** — `⏵⏵ accept edits on` | Reads, file edits, common filesystem commands (`mkdir`, `touch`, `rm`, `rmdir`, `mv`, `cp`, `sed`) inside the working directories |
| `plan` | **Plan** — `⏸ plan mode on` | Reads and exploration; no source edits until you approve a plan |
| `auto` | **Auto** — `⏵⏵ auto mode on` | Everything, with a background classifier reviewing actions |
| `dontAsk` | **Don't ask** — `⏵⏵ don't ask on` | Reads and pre-approved tools; anything that would prompt is **denied** |
| `bypassPermissions` | **Bypass permissions** — `⏵⏵ bypass permissions on` | Everything except a few hard safeguards |

The mode labelled **Manual** has the config value `default`; Claude Code accepts `manual` as an alias where you type the value (`claude --permission-mode manual`). Hooks and SDK integrations always see `default`.

## Why It Matters

- The mode decides whether you are **reviewing each action** or **reviewing the result**. Choosing wrongly either drowns you in prompts (so you start approving blindly) or lets an unreviewed command run.
- The same task needs different modes at different stages: plan in Plan, edit in Accept edits, run long unattended work in Auto with guardrails.
- Interviewers increasingly ask how you control an AI agent. "I switched everything off" is the wrong answer; "I chose the mode per stage and layered rules and hooks on top" is the right one.

## How It Works

The mode is one layer of a decision that Claude Code — not the model — makes before each tool call:

```text
tool call ─► PreToolUse hooks ─► deny rules ─► ask rules ─► allow rules ─► permission mode ─► run / ask / deny
             (can deny in        (block in       (force a     (skip the      (baseline for
              every mode)         every mode)     prompt)      prompt*)       everything else)

  * allow rules have no effect in bypassPermissions (everything already runs);
    some safeguards ignore allow rules entirely (protected paths, critical-path rm, see below)
```

Three facts to remember:

1. **Deny rules block in every mode**, including `bypassPermissions`.
2. **Explicit ask rules still prompt** in every mode (in `dontAsk` they are denied instead, because nobody is asked).
3. A **PreToolUse hook that denies** blocks the tool in every mode, even `bypassPermissions`.

## Interaction Modes vs Permission Modes vs Model Settings

People say "mode" for several unrelated controls. Keep them apart:

| Control | What it changes | How you set it | A permission mode? |
|---------|-----------------|----------------|--------------------|
| Permission mode | What runs without asking | `Shift+Tab`, `--permission-mode`, `permissions.defaultMode` | **Yes** |
| Plan mode | Explore and propose without editing | `Shift+Tab`, `/plan`, `--permission-mode plan` | **Yes** — it is one of the six |
| Model | Which Claude model reasons | `/model`, `--model` | No |
| Effort | How much the model reasons per step (`low` … `max`, model-dependent) | `/effort`, `--effort` | No |
| Fast mode | A faster, more expensive configuration of supported Opus models (research preview) | `/fast` | No |
| Output style | Tone and format of responses | `/output-style` | No |
| Shell mode | You run one command yourself (`!` prefix) | Type `!` | No |

> [!WARNING]
> **"Auto-accept" is not "auto mode".** *Accept edits* (`acceptEdits`) auto-approves file edits only; *Auto* (`auto`) lets a classifier approve almost everything. Mixing them up is the most common misconception about modes.

## The Six Modes in Detail

### Manual (`default`)

- **What it does:** Claude asks before edits, before most shell commands and before network access. Reads in the working directories, searches and a built-in set of read-only commands (`ls`, `cat`, `grep`, `git status`, `git log`, …) run without prompts.
- **Without individual approval:** reads only. **Still needs approval:** every edit, every non-read-only command, web fetches.
- **Safety:** highest visibility — you see every action. **Productivity:** lowest — prompt fatigue is the real risk; after the tenth approval people stop reading.
- **Best for:** sensitive work, unfamiliar code, learning what Claude does. **Not for:** long tasks with dozens of routine commands.
- **Prompt options:** "Yes", "Yes, and don't ask again for …" (saves an allow rule for Bash commands and domains to `.claude/settings.local.json`; edit approvals last only until the session ends), "No". Press `Tab` on Yes/No to attach a comment.

### Accept Edits (`acceptEdits`)

- **What it does:** file edits and creations inside the working directory (and `additionalDirectories`) run without prompts, plus `mkdir`, `touch`, `rm`, `rmdir`, `mv`, `cp` and `sed` on paths in scope.
- **Still needs approval:** every other shell command (builds, tests, `git`, installs), paths outside the working directories, writes to **protected paths** (`.git`, `.claude`, `.vscode`, `.idea`, `.mvn`, `.husky`, shell rc files, `.mcp.json` and others), and `rm`/`rmdir` targeting a **critical path** (root, home, the working directory itself).
- **Safety:** you review edits *after the fact* — in your editor or with `git diff`. Note that `rm` inside the project is auto-approved too.
- **Best for:** iterating on code you will review as a diff; a refactor whose plan you already approved. **Not for:** a repository without Git (you lose your review and undo tool) or when edits must be checked one by one.

### Plan (`plan`)

- **What it does:** Claude researches — reads files, runs exploration commands — and writes a plan, but **does not edit your source** until you approve it. Enter with `Shift+Tab`, by prefixing one prompt with `/plan`, or with `claude --permission-mode plan`.
- **Commands during planning:** read-only commands run; other commands prompt — or, when auto mode is available and `useAutoModeDuringPlan` is on (the default), the auto mode classifier reviews them instead.
- **Approving:** you choose *Yes, and use auto mode* (reads *Yes, auto-accept edits* when auto mode is unavailable), *Yes, manually approve edits*, or *No, keep planning*. Approving switches the mode accordingly. `Ctrl+G` opens the plan in your editor to change it first.
- **Best for:** unclear approach, multi-file changes, unfamiliar code, anything you want to discuss before code exists. **Not for:** a one-line fix you could describe in a sentence — planning adds overhead.

**Status:** Version-dependent — in interactive terminal sessions started with bypass permissions available, plan mode's edit block is not enforced (Claude is still *told* to plan). Outside the terminal and in `-p` runs, plan mode keeps its blocks.

### Auto (`auto`)

- **What it does:** no routine prompts. A separate **classifier** model reviews actions before they run and blocks anything that escalates beyond your request, targets unrecognized infrastructure, or looks driven by hostile content Claude read. Reads and edits in the working directory skip the classifier; shell commands and network actions go through it.
- **Blocked by default** (examples from the docs): `curl … | bash`, sending sensitive data to external endpoints, production deploys and migrations, force push, `git reset --hard` and other commands that discard uncommitted work, destroying files that existed before the session, writing secrets into commits, merging an unapproved pull request.
- **Still prompts:** explicit `ask` rules, critical-path removals (with a two-minute countdown in the terminal), and tools that need a person (`AskUserQuestion`). Boundaries you state in the conversation ("don't push") act as block signals — but they can be lost if compaction removes that message, so use a deny rule for a hard guarantee.
- **Fallback:** after 3 blocks in a row or 20 in a session, auto mode pauses and prompting resumes.
- **Requirements:** a supported model and provider; organizations can disable it with `permissions.disableAutoMode`. Classifier calls can add tokens and latency.
- **Best for:** long tasks where you trust the general direction, with Git, tests and review after. **Not for:** security-sensitive operations you need to approve personally; it "reduces permission prompts but does not guarantee safety" (the docs' words).

**Status:** Version-dependent — with Claude Code **v2.1.283 or later**, auto is the **built-in starting mode** for interactive terminal and VS Code sessions when nothing else sets a mode (earlier versions: only on Pro, Max and Team plans). `claude -p` usually starts in `default`. Check the status bar of your own session.

### Don't Ask (`dontAsk`)

- **What it does:** **auto-denies** every call that would otherwise prompt. Things that need no approval in Manual mode still run (reads, read-only commands), as do calls matching `permissions.allow` / `--allowedTools` and calls a PreToolUse hook approves.
- **Never in the `Shift+Tab` cycle;** start with `--permission-mode dontAsk`.
- **Best for:** CI jobs and scripts with an exact allowlist, where nobody is there to answer prompts. **Not for:** interactive work — Claude simply cannot do anything you did not pre-approve.

### Bypass Permissions (`bypassPermissions`)

- **What it does:** skips permission prompts and safety checks, including writes to protected paths. Enabled only at launch: `--permission-mode bypassPermissions`, `--dangerously-skip-permissions`, `--allow-dangerously-skip-permissions` (adds it to the cycle without activating it), or `defaultMode: "bypassPermissions"` in user, `--settings` or managed settings — **not** from a project's `.claude/settings.json`.
- **Still applies:** deny rules, explicit ask rules, critical-path `rm` prompts, PreToolUse hook denials, and the few actions no mode auto-approves.
- **Hard limits:** on Linux and macOS it refuses to start as root or under `sudo` (outside a recognized sandbox); the first interactive use shows a warning you must accept; administrators can block it with `permissions.disableBypassPermissionsMode`.
- **Best for:** isolated containers or VMs without internet access, where nothing important can be damaged. **Not for:** your laptop, a real repository with credentials, or anything connected to production. It "offers no protection against prompt injection or unintended actions".

## "YOLO", "Auto-Accept" and Other Informal Terms

Courses and blog posts often present four modes — *Default, Auto-Accept, Plan* and *YOLO*. Map them to the real ones:

| Informal name | Official mode | Note |
|---------------|---------------|------|
| Default | Manual (`default`) | Official, labelled Manual in current versions |
| Auto-Accept | Accept edits (`acceptEdits`) | Only edits are auto-accepted — not commands |
| Plan | Plan (`plan`) | Official |
| YOLO | Bypass permissions (`bypassPermissions`, `--dangerously-skip-permissions`) | **Community term (not an official feature)** |
| — | Auto (`auto`) | Official; missing from the four-mode picture |
| — | Don't ask (`dontAsk`) | Official; for CI and scripts |

Third-party wrappers and other tools may define their own "modes"; those are not Claude Code permission modes.

## What No Mode Auto-Approves

Even `bypassPermissions` does not auto-approve:

- tools matched by an explicit **ask** rule;
- tools that need a person (`AskUserQuestion`, MCP tools marked `requiresUserInteraction`, connector tools an organization set to `ask`);
- `rm` / `rmdir` targeting a **critical path** (filesystem root, top-level directories, your home directory, your working directory and its parents) — no allow rule or hook can approve these;
- a few cross-session messaging safeguards, and reads outside the working directories while `permissions.blockReadsOutsideWorkingDirectories` is on.

Writes to **protected paths** per mode:

| Mode | Write to `.git/`, `.claude/`, `.mvn/`, `.bashrc`, `.mcp.json` … |
|------|----------------------------------------------------------------|
| `default`, `acceptEdits` | Prompted |
| `plan` | Prompted, or reviewed by the classifier when auto mode is available |
| `auto` | Reviewed by the classifier |
| `dontAsk` | Denied |
| `bypassPermissions` | Allowed |

## Syntax and Configuration

**Switch during a session (CLI):** press `Shift+Tab`. From `auto`, the first press goes to Manual; the cycle is Manual → Accept edits → Plan, then the optional modes (bypass permissions first, auto last) when available. `dontAsk` is never in the cycle.

**Start a session in a mode:**

```bash
claude --permission-mode plan
claude --permission-mode acceptEdits
claude -p "run the tests and summarize failures" --permission-mode dontAsk --allowedTools "Bash(./mvnw test)" "Read"
```

**Set a default** in a settings file:

```json
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

Which mode a new terminal session starts in: the `--permission-mode` flag (or `--dangerously-skip-permissions`) first; then `permissions.defaultMode` from settings; then the built-in default. A `defaultMode` of `"auto"` or `"bypassPermissions"` in a project's `.claude/settings.json` or `.claude/settings.local.json` does **not** take effect — so a cloned repository cannot switch you into them. The VS Code extension has its own `claudeCode.initialPermissionMode` setting and labels (Manual, Edit automatically, Plan, Auto, Bypass permissions).

## Choosing a Mode: Decision Table

| Situation | Recommended mode | Why | Avoid |
|-----------|------------------|-----|-------|
| Repository exploration | **Plan** (or Manual) | Read-only by design; you see what Claude wants to run | Accept edits — nothing to edit yet |
| Planning a feature | **Plan** | Forces a reviewable plan before code; `Ctrl+G` to edit it | Auto — work starts before you agree on the approach |
| Implementing a small change | **Manual** or **Accept edits** | A few edits you can read in seconds | Plan — overhead for a one-sentence diff |
| Refactoring several files | **Plan → Accept edits** | Approve the plan, then review the full diff instead of 30 prompts | Bypass — no review, no safety net |
| Running tests | **Manual** with a `Bash(./mvnw test *)` allow rule, or **Auto** | Tests are routine; pre-approve the exact command | `dontAsk` interactively — anything else is denied |
| Reviewing a security-sensitive change | **Manual** (or Plan for analysis) | You must see every action personally | Auto, Bypass — the classifier is not your security review |
| An unfamiliar production repository | **Plan**, then **Manual** | Learn first; production-adjacent commands must prompt | Auto or Bypass on a repository that holds production credentials |
| A CI job or script | **dontAsk** with an exact allowlist | No one can answer prompts; anything unlisted is denied | Bypass outside an isolated runner |
| Fully unattended work in a throwaway container | **Bypass** (or Auto) inside an isolated container/VM | The isolation is the safety boundary | Bypass on a developer laptop |

## Choosing a Mode for Planning, Editing and Execution

Treat one task as three stages and change mode between them:

```text
 PLAN  (plan mode)         EDIT  (accept edits)           EXECUTE  (manual + allow rules, or auto)
 read, ask, agree    ──►   Claude edits; you review  ──►  build, tests, git — each command
 on an approach            the whole diff afterwards       visible or covered by a rule
```

- **Planning** fails when Claude solves the wrong problem — Plan mode makes that cheap to catch.
- **Editing** fails when changes are unreviewed — Accept edits is fine only because you will read `git diff`.
- **Execution** fails when a command has side effects you did not intend — keep it visible (Manual), pre-approved narrowly (allow rules), or classifier-reviewed (Auto), never unlimited on a real machine.

## Real-World Example

You must add a "mark order as paid" endpoint to `orderdesk`.

1. `claude --permission-mode plan` → "Plan the endpoint POST /api/orders/{id}/pay with tests. Paying twice must be idempotent; paying a cancelled order is a conflict." You edit the plan with `Ctrl+G` to add "no schema change".
2. Approve with *Yes, manually approve edits* for the first edit to see the style, then `Shift+Tab` to Accept edits.
3. Claude asks to run `./mvnw test` — you approve with "Yes, and don't ask again for `./mvnw test *`" (scoped to this repository).
4. Claude proposes `git push --force` after a rebase; you decline. Manual and Accept edits showed you the command — in Auto the classifier would block a force push by default.
5. You read `git diff`, run the tests yourself once, and commit.

## Step-by-Step Walkthrough

Try each mode on `orderdesk` (see [Lab 03](../../labs/cc-lab-03-plan-vs-implement/content.md)):

1. Start `claude` and read the status bar: which mode did your session start in?
2. Press `Shift+Tab` repeatedly and watch the label change; note which modes appear.
3. In Plan mode, ask for a plan to add input validation; read it; choose *No, keep planning*.
4. Switch to Manual and ask for one small edit; answer the prompt.
5. Switch to Accept edits, ask for a second edit, then run `git diff` yourself.
6. Exit and start `claude --permission-mode dontAsk`; ask Claude to run the tests and observe the denial.

## Common Mistakes

- Confusing Accept edits with Auto, or Auto with Bypass.
- Using Bypass on a laptop "to save time". The docs restrict it to isolated environments.
- Assuming Plan mode makes the session read-only for every command — exploration commands can still run (read-only ones, or classifier-approved ones).
- Believing a "don't push" sentence is a hard rule in Auto mode — it can be compacted away; use a deny rule.
- Setting `defaultMode: "auto"` in the project's `.claude/settings.json` and wondering why it does not apply — put it in `~/.claude/settings.json`.
- Clicking through prompts in Manual mode without reading them — that is worse than a well-configured allowlist.

## Security Considerations

- Modes are convenience settings, not a security boundary. For hard limits use **deny rules**, **PreToolUse hooks**, the **sandbox** and **isolated environments** (Module 4).
- Auto mode's classifier strips tool results from its own input so hostile file content cannot address it directly, but it can still make mistakes in both directions. Keep Git, tests and review after it.
- `bypassPermissions` plus prompt injection is the classic failure: a README instructs the agent, and nothing stops it. Run it only where the worst case is "throw the container away".
- In CI, prefer `dontAsk` with an exact allowlist over Bypass; the allowlist documents exactly what the job may do.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Auto never appears in the cycle | Model or provider not supported, or `disableAutoMode` set | `/status`, check the requirements; ask your admin |
| `defaultMode: "auto"` ignored | Set in project settings | Move it to `~/.claude/settings.json` |
| Bypass refuses to start | Running as root/`sudo`, or blocked by policy | Run as a normal user inside a container; check managed settings |
| Auto mode suddenly prompts again | 3 consecutive or 20 total classifier blocks | Review the denials in `/permissions` (Recently denied tab); approve or rephrase |
| A command still prompts in Bypass | An explicit ask rule, or a critical-path `rm` | Intended; read the prompt |

## Trade-offs

| Mode | Oversight | Speed | Typical risk |
|------|-----------|-------|--------------|
| Manual | Every action | Slow | Prompt fatigue → blind approvals |
| Accept edits | Edits after the fact | Medium | Unreviewed diff if you skip `git diff` |
| Plan | Before any edit | Slow start, fast later | Over-planning tiny tasks |
| Auto | Classifier, then you | Fast | False negatives on unusual infrastructure |
| Don't ask | Predefined allowlist | Fast, rigid | Task fails when the list is incomplete |
| Bypass | None | Fastest | Anything — use only in isolation |

## Interview Takeaways

- There are six official permission modes; "YOLO" is a community nickname for Bypass, and "auto-accept" means Accept edits, not Auto.
- Modes are a baseline; deny and ask rules, hooks and the sandbox sit on top and apply in every mode.
- Explain your stage-based choice: Plan to agree, Accept edits to implement with diff review, Manual or narrow allow rules for execution, `dontAsk` for CI, Bypass only in disposable isolation.
- Mention version-dependence: auto is the built-in starting mode only from v2.1.283.

## Key Takeaways

- Permission mode = what runs without asking. Model, effort, fast mode and output style are different controls.
- Manual reads only; Accept edits adds edits; Plan blocks edits until approval; Auto uses a classifier; Don't ask denies the rest; Bypass skips checks.
- Deny rules and hook denials win in every mode; protected and critical paths have extra safeguards.
- Choose per stage, not per mood — and never use Bypass outside an isolated environment.
