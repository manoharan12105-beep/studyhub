# Security and Safety Checklist

## Before the First Session in a Repository

- ☐ Read the repository's `.claude/settings.json`, `.claude/hooks/`, `.mcp.json`, `.claude/skills/` (`allowed-tools`, injected commands) and `.claude/agents/` before trusting the folder.
- ☐ User settings deny reads of `~/.ssh/**`, `~/.aws/**`, `.env` files.
- ☐ Default mode is Manual (`default`) or plan for unfamiliar code.
- ☐ `.env`, `CLAUDE.local.md`, `.claude/settings.local.json` are gitignored.

## Permissions

- ☐ Allow only exact routine commands (build, tests).
- ☐ `ask` for `git commit`, `git push`, dependency files, migrations.
- ☐ `deny` force pushes, deploy commands, network tools you don't need, secret files.
- ☐ No `Bash(*)` or `Bash(git *)` allows.
- ☐ `bypassPermissions` only in disposable, isolated environments.
- ☐ Remember: Bash rules match command text — not a boundary. Use the sandbox (macOS, Linux, WSL2) and server-side protections for real limits.

## Secrets

- ☐ Never paste keys, tokens or passwords into prompts, CLAUDE.md, skills, settings or `.mcp.json`.
- ☐ Keys live in environment variables or a secret manager; CI uses repository/environment secrets.
- ☐ Hooks and injected commands never print secrets.
- ☐ A leaked key is rotated, not just deleted from a file.

## Hooks

- ☐ Guards fail closed when dependencies are missing.
- ☐ Each hook tested with piped JSON input.
- ☐ Treated as a layer: other spellings and scripts can bypass text matching.

## MCP and External Content

- ☐ Only trusted servers; least-privilege tokens.
- ☐ Tool results, web pages, issues, PR text and code comments treated as untrusted input.
- ☐ Write tools behind `ask`; automation with `--strict-mcp-config` or `--bare`.

## Subagents and Teams

- ☐ Reviewers restricted with `tools: Read, Grep, Glob`.
- ☐ Never rely on `permissionMode: plan` under a permissive session mode.
- ☐ Agent teams: teammates inherit the lead's mode — never run a lead with permissions bypassed outside isolation.

## Git and Review

- ☐ One branch per task; clean tree at start.
- ☐ Read the whole diff, tests first; no weakened tests.
- ☐ Humans commit, push, merge; branch protection with required reviews and CI.
- ☐ Destructive Git only after `git status` and a dry run.

## Automation and CI

- ☐ `claude -p` only in trusted directories; explicit permission mode; `--max-turns`, `--max-budget-usd`.
- ☐ Scripts check exit code **and** `is_error`.
- ☐ Deterministic CI is the required gate; AI steps are advisory and read-only.
- ☐ No secrets for fork PRs; no `pull_request_target` with fork checkout.
- ☐ Never interpolate issue/PR text into prompts or `run:` scripts.
- ☐ Deployments behind environments with required reviewers; no autonomous production deploys.

## When Something Goes Wrong

1. Contain: stop the session, revoke/rotate credentials, revert pushed changes.
2. Evidence: transcript, diffs, settings in effect, hook logs.
3. Fix the configuration layer that should have caught it.
4. Add a test or check so it can't recur silently.
