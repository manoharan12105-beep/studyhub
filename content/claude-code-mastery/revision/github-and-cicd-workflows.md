# GitHub and CI/CD Workflows

## The Feature Workflow

| Step | Output to check |
|------|-----------------|
| Inspect (plan mode) | Requirements restated; relevant `file:line` |
| Plan | File-by-file plan; one test per acceptance criterion; what won't change |
| Implement | Small diffs that follow the plan |
| Test | New tests seen failing first; full build output |
| Review the diff | `git diff --stat`, `git diff`, test diff additions only |
| Fix | Only validated findings; re-run tests |
| Summarize | Files, tests per requirement, verify output, not-verified list |

## Git with Claude Code

- Claude gets a Git snapshot (branch, main branch, status, recent commits) **at conversation start** — re-run Git for current state.
- Read-only Git runs without prompts; `git commit`/`git push` → `ask`; force push → `deny`; server-side branch protection is the real control.
- `includeGitInstructions: false` removes built-in commit/PR instructions and the snapshot; `attribution` changes or hides commit/PR attribution.

## Review Tools

| Tool | Finds | Notes |
|------|-------|-------|
| `/diff` | — (shows changes) | Your own reading |
| `/code-review [effort] [--fix] [--comment] [target]` | Correctness bugs | Background subagent; `/review` alias; background `--fix` edits are outside checkpoints |
| `/security-review` | Security issues vs origin's default branch | Needs an `origin` remote |
| `/simplify` | Cleanup only | Doesn't hunt bugs |
| Code Review (managed) | Severity-tagged inline PR comments | Research preview, Team/Enterprise; never approves/blocks |

## Regression Analysis

```bash
git bisect start <bad> <good>
git bisect run ./mvnw -o -B -q test -Dtest=PriceCalculatorTest   # 0 good, 1–127 bad (125 skip)
git bisect reset
```

Never weaken the test that caught the regression; fix the introducing change.

## Headless Claude Code

| Flag | Purpose |
|------|---------|
| `-p "<prompt>"` | One task, stdout + exit code |
| `--output-format json` | `result`, `is_error`, `total_cost_usd`, `permission_denials` |
| `--permission-mode dontAsk` / `plan` | Locked-down runs |
| `--allowedTools "Read" "Bash(git diff *)"` | Narrow pre-approval |
| `--max-turns N`, `--max-budget-usd X` | Bound the run |
| `--bare` | Skip local hooks, skills, plugins, MCP, memory, CLAUDE.md; API key auth |
| `--permission-prompts none` | Unattended: prompting requests denied, not retried |

Check **exit code and `is_error`** — a failed run can print JSON with `"subtype": "success"` and `"is_error": true`. `-p` skips the trust dialog; invalid settings files are silently ignored.

## GitHub Action

| Mode | Trigger | Output |
|------|---------|--------|
| Interactive (no `prompt`) | `@claude` in issue/PR comments, reviews, new issues | Comment on the thread |
| Automation (`prompt` set) | Any workflow event (PR, cron) | Run log, or comments if tools allow |

- `uses: anthropics/claude-code-action@v1`; secret `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` via `${{ secrets.… }}`.
- Checks before running: triggering user has write access; actor is human (bots need `allowed_bots`).
- Limits: `claude_args: "--max-turns N"`, `timeout-minutes`, `concurrency`.
- Workflow `permissions:` scope `GITHUB_TOKEN`; the Claude GitHub App token has its installation's permissions — restrict tools, consider a custom app, protect branches.
- Fork PRs get no secrets; never use `pull_request_target` + checkout of fork code with secrets.
- Never interpolate `${{ github.event.issue.title/body }}` into prompts or `run:` scripts.

## Gates

- Required check = deterministic build and tests. AI steps: advisory (`if: failure()` explanations, comment-only reviews).
- Deployments: `environment:` with required reviewers; environment secrets released after approval.
- No autonomous production deploys.
