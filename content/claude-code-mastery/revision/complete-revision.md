# Complete Claude Code Revision

> [!NOTE]
> Checked against Claude Code v2.1.289 and the official documentation (October 2026). Version-dependent details are marked in the lessons.

## Foundations and Modes

- **Claude Code** = an agentic coding tool: reads your code, edits files, runs commands, iterates toward a goal — inside permission rules you set. Surfaces: terminal, VS Code/JetBrains, desktop app, web.
- **Agent loop:** gather context → act (tools) → verify → repeat. Give it a check it can run (tests, build).
- **Permission modes:** `default` (Manual — asks before edits/commands) · `acceptEdits` · `plan` (read-only) · `auto` (classifier reviews actions) · `dontAsk` (deny anything not pre-approved) · `bypassPermissions` (no checks; isolated environments only). Shift+Tab cycles.
- **Mode ≠ model ≠ effort.** Model = which Claude (`/model`); effort = how much it thinks (`/effort`); fast mode = faster Opus at a higher price (`/fast`).
- **"YOLO mode"** is community slang, not a mode; `--permission-mode yolo` is rejected.

## Context and Sessions

- Context window holds: system prompt, CLAUDE.md, auto memory (first 200 lines / 25 KB of `MEMORY.md`), skill and agent descriptions, MCP tool names, conversation, tool results.
- `/context` shows usage; `/compact [focus]` summarizes and continues; `/clear` starts fresh; `/rewind` restores code and/or conversation to a checkpoint.
- **Checkpoints** cover Claude's file-tool edits in the session, not Bash side effects or remote actions. **Git** is the durable safety net.
- Sessions: `claude --continue`, `claude --resume`, `/rename`, `/branch`; parallel work in worktrees (`claude --worktree <name>`).

## Instructions and Memory

- **CLAUDE.md**: user (`~/.claude/CLAUDE.md`), project (`./CLAUDE.md`), local (`CLAUDE.local.md`), subdirectory (on demand), managed policy. Imports with `@path` (up to 4 hops). `AGENTS.md` supported.
- **`.claude/rules/*.md`** with `paths:` load for matching files.
- Keep CLAUDE.md short and true: commands, conventions, rules, definition of done. It's guidance — enforce must-hold rules with permissions or hooks.

## Permissions and Settings

- Rules: `allow` / `ask` / `deny`; **deny > ask > allow**. Examples: `Bash(./mvnw -B verify)`, `Edit(/pom.xml)`, `Read(.env)`, `Read(!.env.example)` (negation carves out).
- Precedence: managed > CLI flags/`--settings` > local > project > user; lists merge.
- Project settings can't set `defaultMode` to `auto` or `bypassPermissions`.
- **Workspace trust** dialog gates project config; `claude -p` skips it (project hooks and MCP servers still load unless `--bare`).
- Bash rules match command text: other spellings (`git -C . push`) aren't matched — sandbox and server-side protection for real boundaries.

## Hooks

- Commands (or HTTP/MCP tool/prompt/agent hooks) at events: `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `Notification`, `Stop`, `SubagentStop`, `PreCompact`, `SessionEnd`, …
- Input JSON on stdin; **exit 2 blocks** (stderr to Claude); exit 0 success; JSON output for decisions (`permissionDecision: allow|deny|ask`, Stop `decision: "block"`).
- Stop hooks: check `stop_hook_active`; Claude Code caps 8 consecutive continuations.
- Hooks are a layer, not a guarantee: fail closed when dependencies (jq) are missing; text matching misses spellings.

## MCP

- Open protocol: client (Claude Code) ↔ server (tools, resources, prompts) over stdio or HTTP.
- `claude mcp add [--scope local|project|user] <name> -- <command>`; `list`, `get`, `remove`; `/mcp` in session.
- Scopes: local (default, `~/.claude.json`), project (`.mcp.json`, needs approval), user. Tool names `mcp__server__tool`.
- Tool results are untrusted input; servers run as you; tokens via env-var expansion, never committed.

## Skills, Subagents, Teams

- **Skill** = `SKILL.md` (frontmatter + instructions); description always listed, body on demand; `$ARGUMENTS`, `` !`cmd` `` injection, `allowed-tools` (per-turn grant, not trust-gated), `disable-model-invocation`, `paths`, `context: fork`. Validate: `claude plugin validate .claude/skills`.
- **Subagent** = own context, prompt, tools; returns one result. Built-ins: Explore, Plan (read-only, skip CLAUDE.md), general-purpose. Files in `.claude/agents/`; `tools` allowlist makes them read-only; permissive parent modes override `permissionMode`.
- **Agent teams** (experimental, `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`): lead + teammates + task list + mailbox; costly; teammates inherit the lead's mode.

## Git, Review and Automation

- Workflow: Inspect → Plan → Implement → Test → Review the diff → Fix → Summarize. Commits and pushes behind `ask`.
- `/diff`, `/code-review` (correctness), `/security-review` (needs `origin`), `/simplify` (cleanup only).
- Headless: `claude -p` with `--output-format json`, explicit `--permission-mode`, `--allowedTools`, `--max-turns`, `--max-budget-usd`, `--bare`. Check exit code **and** `is_error`.
- GitHub Action `anthropics/claude-code-action@v1`: interactive (`@claude`) vs automation (`prompt`); secrets via `${{ secrets.… }}`; write-access and human-actor checks; limit turns, time, concurrency.
- Deterministic CI is the gate; AI review is advisory; humans approve merges and deployments.

## Debugging and Verification

- Reproduce first (failing test), read traces (exception, message, first project frame, root cause), fix the cause, full build, review the test diff.
- Evidence over plausibility: output, tests, diffs, observed behaviour. Watch for invented APIs, empty tests, scope creep, weakened tests.
