# Local vs CI Automation and Non-Interactive Usage

**Module:** Automation and CI/CD · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 (`claude --help`) and *Run Claude Code programmatically* (October 2026). Outputs below were captured from real runs **without** a model call: flag-validation errors, and a deliberately unauthenticated run in an isolated configuration directory. `scripts/ai-review.sh` was tested with a stub `claude` and with the real, unauthenticated CLI; no review by a model is shown.

## Definition

**Non-interactive** (headless) Claude Code is `claude -p "<prompt>"`: it runs one task, prints the result to stdout and exits with a status code, with no terminal UI. Scripts, Git hooks and CI jobs use it. Because nobody is there to answer permission prompts, the **permission setup decides everything** the run may do.

## Why It Matters

- Headless runs turn Claude into a building block: summarize a log, review a diff, draft release notes.
- They also remove the human from the loop. A mistake in the flags (`bypassPermissions`, broad `--allowedTools`) acts without anyone noticing.
- A `-p` run **skips the workspace trust dialog** and still runs the project's hooks and `.mcp.json` servers (unless `--bare`). Running it in a repository you don't trust is running that repository's configuration.

## How It Works

```text
stdin (optional) ─┐
prompt ───────────┼─► claude -p ──► tools allowed by: permission mode + rules + --allowedTools
flags ────────────┘        │        (anything else that would prompt → denied, no one to ask)
                           ▼
              stdout: text | json | stream-json      exit code: 0 success, non-zero failure
```

| Interactive session | `claude -p` |
|---------------------|-------------|
| Trust dialog for new folders | No trust dialog — only use trusted directories |
| You answer prompts | Prompts can't be answered → denied (or answered by a host/hook) |
| Invalid settings show an error | Settings files that fail validation are **silently ignored** |
| Fork mode, agent teams available | Fork mode off by default; no teammates |

## Local vs CI Automation

| | Local script / Git hook | CI job |
|---|---|---|
| Credentials | Your login or `ANTHROPIC_API_KEY` | A repository/organization **secret** |
| Who sees the output | You | Everyone with access to the logs or PR |
| Environment | Your machine, your files, your `~/.claude` | Clean runner; only what the job checks out |
| Risk | Your account and files | Repository secrets, write tokens, untrusted PR content |
| Reproducibility | Varies with your configuration | Use `--bare` for the same result everywhere |

## Output Formats and Exit Codes

| Flag | Output |
|------|--------|
| `--output-format text` (default) | Plain text |
| `--output-format json` | One JSON object: `result`, `is_error`, `session_id`, usage, `total_cost_usd` (a client-side estimate), `permission_denials`, … |
| `--output-format stream-json` | Newline-delimited JSON events as they happen |
| `--json-schema '<schema>'` | With `json`: validated structured data in `structured_output` |

A real unauthenticated run (`claude --bare -p "hello" --output-format json`, no API key set) exited with status **1**; selected fields extracted with `jq`:

**Output:**

```json
{
  "type": "result",
  "subtype": "success",
  "is_error": true,
  "result": "Not logged in · Please run /login",
  "terminal_reason": "api_error",
  "num_turns": 1,
  "total_cost_usd": 0,
  "permission_denials": []
}
```

Note `"subtype": "success"` next to `"is_error": true`: check the **exit code and `is_error`**, not the subtype alone. With text output, the same failure printed `Not logged in · Please run /login` on **stdout** — failures inside the run appear as the result, so don't treat any stdout as a review.

Invalid flags fail before the run starts:

**Output:**

```text
error: option '--permission-mode <mode>' argument 'yolo' is invalid. Allowed choices are acceptEdits, auto, bypassPermissions, manual, dontAsk, plan.
```

"YOLO mode" is community slang for skipping permissions (`bypassPermissions`, `--dangerously-skip-permissions`); it is not a Claude Code mode name.

## Pre-Approving Tools and Choosing a Permission Mode

| Approach | Effect | Use for |
|----------|--------|---------|
| Pipe input on stdin | Claude needs no tool to read it | Reviews and summaries of a diff or log |
| `--allowedTools "Read" "Bash(git diff *)"` | Those run without prompts | Narrow, known commands |
| `--permission-mode dontAsk` | Anything not pre-approved is denied | Locked-down CI runs |
| `--permission-mode plan` | Read-only exploration | Analysis jobs |
| `--permission-mode acceptEdits` | File edits allowed | Local fix-up scripts you review afterwards |
| `--permission-mode auto` | Classifier reviews actions | Only where auto mode is available and acceptable |
| `--permission-prompts none` (v2.1.259+) | Nobody answers; prompting requests denied and not retried | Scheduled jobs with a permission host |
| `bypassPermissions` | No checks at all | Only in a disposable, isolated environment |

Set the mode explicitly: a run with no mode set takes the built-in starting mode, which can be `auto`.

## Bare Mode, Turn and Budget Limits

`--bare` skips auto-discovery of hooks, skills, subagents, plugins, MCP servers, auto memory and CLAUDE.md, and never reads OAuth or the keychain — authentication is `ANTHROPIC_API_KEY` (or an `apiKeyHelper` passed with `--settings`). It is the documented recommendation for scripts and CI, because a teammate's `~/.claude` hook or a project's `.mcp.json` can't change the run. Pass what you need explicitly (`--settings`, `--mcp-config`, `--append-system-prompt`, `--agents`).

| Limit | Flag |
|-------|------|
| Agentic turns | `--max-turns 3` (print mode; exits with an error when reached) |
| Spend | `--max-budget-usd 0.50` (print mode) |
| Time | Your CI job's timeout (`timeout-minutes`) |
| Input size | Piped stdin is capped at 10 MB |

## Syntax and Configuration

`scripts/ai-review.sh` from the orderdesk reference project:

```bash
#!/usr/bin/env bash
# Read-only AI review of this branch's changes against a base branch.
# Usage: scripts/ai-review.sh [base-branch]   (default: main)
# Needs: git, jq, and an authenticated claude CLI. Never commits, pushes or edits files.
set -euo pipefail

base="${1:-main}"
diff_file="$(mktemp)"
trap 'rm -f "$diff_file"' EXIT

git diff "$base"...HEAD > "$diff_file"
if [ ! -s "$diff_file" ]; then
  echo "No changes against $base."
  exit 0
fi

# The diff arrives on stdin, so Claude needs no tools to read it. dontAsk denies anything
# that would prompt; --max-turns and --max-budget-usd stop a run that goes on too long.
status=0
result="$(claude -p "Review this diff for correctness and security bugs. One finding per line: file:line - problem. If there are none, print: No findings." \
  --output-format json \
  --permission-mode dontAsk \
  --max-turns 3 \
  --max-budget-usd 0.50 \
  < "$diff_file")" || status=$?

# A failed run can still print JSON: check the exit code and is_error, not only one of them.
if [ "$status" -ne 0 ] || [ "$(jq -r '.is_error' <<< "$result")" != "false" ]; then
  echo "AI review did not complete (exit $status): $(jq -r '.result // "no result"' <<< "$result" 2>/dev/null || echo "$result")" >&2
  exit 1
fi

jq -r '.result' <<< "$result"
```

Run against the real CLI while not logged in (branch with the BUG-101 fix, base `main`):

**Output:**

```text
AI review did not complete (exit 1): Not logged in · Please run /login
```

With a stub `claude` that returns `"is_error": true` but exits 0, the script also stops with exit 1 — which is why it checks both.

## Real-World Example

Consider a pre-push hook that runs `claude -p "review" | tee review.txt`. In a pipeline, the shell reports `tee`'s exit status, so when the account running it has no credentials, every "review" reads `Not logged in · Please run /login` and the hook still succeeds. Nobody notices until someone reads the file. Checking `is_error` and the exit code (as the script does) turns that silent failure into a visible one.

## Step-by-Step Walkthrough

1. Decide what the run must do; give it input on stdin where possible.
2. Choose the narrowest mode (`dontAsk` or `plan`) and only the `--allowedTools` it needs.
3. Add `--bare` for reproducibility in CI; pass settings and MCP config explicitly.
4. Use `--output-format json`; check exit code and `is_error`.
5. Add `--max-turns`, `--max-budget-usd` and a job timeout.
6. Test the script with a stub and with a failing (unauthenticated) run before trusting it.

## Common Mistakes

- `bypassPermissions` "to stop it hanging" on a developer machine.
- Running `claude -p` in an untrusted clone — its hooks and MCP servers run without a trust dialog.
- Treating stdout as success; ignoring `is_error`.
- Broad `--allowedTools "Bash"`.
- Invalid settings files silently ignored in `-p` — rules you think apply don't.

## Security Considerations

- Keep API keys in environment variables or a secret store, never in scripts or prompts.
- Headless runs on untrusted input (PR text, issue text, logs) are prompt-injection targets: give them read-only tools and no secrets.
- Prefer `--bare` in CI so local configuration can't change behaviour.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Not logged in · Please run /login` | No credentials (bare mode needs `ANTHROPIC_API_KEY`) | Provide the key from a secret |
| Run stops early with an error | `--max-turns` or budget reached | Narrow the task or raise the limit deliberately |
| Expected rules didn't apply | Settings file failed validation (silently ignored in `-p`) | Validate the JSON; test interactively |
| Tool calls denied | `dontAsk` with no matching allow | Add the specific `--allowedTools` entry |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| `--bare` | Reproducible, fast, isolated from local config | Must pass context explicitly; API key auth |
| `dontAsk` | Nothing unexpected runs | Tasks fail when they need an unlisted tool |
| JSON output | Machine-checkable | Needs `jq` or a parser |

## Interview Takeaways

- `claude -p` = one task, stdout + exit code; no one answers prompts.
- `-p` skips the trust dialog; `--bare` skips local configuration and is recommended for CI.
- Check exit code **and** `is_error`; limit turns, budget and time.
- "YOLO mode" isn't an official mode; `bypassPermissions` belongs in isolated environments only.

## Key Takeaways

- Feed input on stdin; pre-approve narrowly; choose the mode explicitly.
- Test failure paths, not only the happy path.
- Treat everything a headless run reads as potentially hostile.
