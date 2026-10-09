# Block 5: Subagents and GitHub Workflows

## Subagents

- Own context, prompt, tools; one result back. Explore/Plan read-only; general-purpose can edit.
- Custom: `.claude/agents/<name>.md` with `name`, `description`, `tools`, optional `model`.
- **Read-only = `tools: Read, Grep, Glob`.** Permissive session modes override `permissionMode`.
- Forks (`/subtask`) inherit the conversation; ordinary subagents don't.
- Validate: `claude plugin validate .claude/agents`.

## Parallel Review

Same inputs → correctness, security, test-coverage reviewers → merge → dedupe → **validate** → human decides → fix in a separate step.

## Agent Teams

Experimental (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`), interactive only, lead + teammates + task list + mailbox, costly, teammates inherit the lead's mode. Use for debate-heavy research/review; avoid same-file edits.

## Feature Workflow

Inspect → Plan → Implement → Test → Review the diff → Fix → Summarize. One test per acceptance criterion; see tests fail first; summary with evidence and gaps.

## Git Rules

- Snapshot of Git state at conversation start — re-run `git status` for current state.
- `ask` on commit/push; `deny` force push; branch protection on the server.
- Review: `/diff`, `/code-review`, `/security-review` (needs `origin`).

## Regression Hunting

`git bisect start <bad> <good>` → `git bisect run <test command>` → read the first bad commit → fix the cause → `git bisect reset`.

## GitHub Action Essentials

| Item | Value |
|------|-------|
| Action | `anthropics/claude-code-action@v1` |
| Modes | Interactive (`@claude`, no `prompt`) / automation (`prompt`) |
| Secret | `${{ secrets.ANTHROPIC_API_KEY }}` or `CLAUDE_CODE_OAUTH_TOKEN` |
| Who can trigger | Users with write access; humans (bots via `allowed_bots`) |
| Limits | `--max-turns` in `claude_args`, `timeout-minutes`, `concurrency` |
| Gate | Deterministic CI required; AI advisory; humans merge |

## Self-Check

- Reviewer subagent edited a file — why? → No `tools` allowlist (or Bash allowed).
- CI didn't run on Claude's commits? → Commits made with the default `GITHUB_TOKEN`.
- Safe way to review fork PRs with AI? → Don't give secrets to fork code; human review or no-secret checks.
