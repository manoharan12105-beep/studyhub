# GitHub Actions Integration and Secrets in Automation

**Module:** Automation and CI/CD · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** *Claude Code GitHub Actions* documentation (October 2026) and the action's current major tag `anthropics/claude-code-action@v1`. Both orderdesk workflows below **validate against the GitHub Actions workflow schema** (schemastore). They were **not run on GitHub**: no runner, secret, GitHub App or pull request was used for this lesson.

## Definition

The **Claude Code GitHub Action** (`anthropics/claude-code-action`) runs Claude Code inside a GitHub Actions workflow. In **interactive mode** it answers `@claude` mentions in issues and pull requests; in **automation mode** it runs a `prompt` (plain text or a skill) on any workflow event — a pull request, a schedule. It authenticates to Claude with a repository **secret** and to GitHub as the Claude GitHub App (or a token you supply).

## Why It Matters

- CI is where automation meets shared resources: repository write access, secrets, everyone's pull requests.
- Misconfiguration has a blast radius beyond your machine — leaked keys, unwanted pushes, runaway costs.
- The action is powerful (it can implement changes and push commits), so its triggers, permissions and limits need deliberate choices.

## How It Works

```text
GitHub event (PR opened, comment "@claude …", cron)
   │
   ▼
workflow job ── checks: actor has write access? actor is human (or allowed bot)?
   │
   ├─ actions/checkout ─► repository on the runner (CLAUDE.md, .claude/skills available)
   └─ claude-code-action ─► Claude Code with: secret (API key / OAuth token)
                                              claude_args (--max-turns, --allowedTools, --model)
                                              GitHub App token (comments, commits)
   ▼
result: PR/issue comment (interactive) or run log / comments the prompt asks for (automation)
```

## Interactive and Automation Modes

| | Interactive | Automation |
|---|---|---|
| Selected when | No `prompt` input | A `prompt` input is set |
| Starts on | The trigger phrase (`@claude` by default) in a comment, review, or new issue title/body | The workflow event itself |
| Output | Comment on the triggering issue/PR, updated as it works | Run log by default; comments only if the prompt and tools allow |
| Typical use | "@claude explain this failure", "@claude implement this issue" | Review every PR, nightly report |

**Who can trigger runs** — checked in both modes before Claude starts:

- **Write access:** on issue and PR events, the triggering user needs write access (exceptions via `allowed_non_write_users` with your own `github_token`).
- **Human actor:** bots are rejected unless listed in `allowed_bots` — prevents loops.

## Setup and Secrets

| Step | How |
|------|-----|
| Quick setup | `/install-github-app` in Claude Code (github.com repositories only) installs the app, adds the secret and prepares a workflow PR |
| Manual setup | Install the Claude GitHub App, add a secret, copy a workflow |
| Secret | `ANTHROPIC_API_KEY` (API billing) or `CLAUDE_CODE_OAUTH_TOKEN` (from `claude setup-token`; uses a Claude subscription) |
| Reference it | `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}` — never the value itself |
| Cloud providers | `use_bedrock`, `use_vertex`, `use_foundry` with OIDC — no static cloud keys |

> [!CAUTION]
> Never commit an API key or OAuth token, and never paste one into a workflow file, issue or prompt. GitHub masks secrets in logs, but a workflow that writes a secret somewhere else (a file, an artifact, a comment) can still leak it.

## Permissions and the GitHub App

Two different permission sets are involved:

| What | Controls | Notes |
|------|----------|-------|
| Workflow `permissions:` | The `GITHUB_TOKEN` the job receives | Set least privilege at workflow and job level; `id-token: write` is needed for the action's default app authentication |
| Claude GitHub App installation | What the app token can do | Shared by Code Review and other features: includes read/write on Contents, Issues, Pull requests, Actions, Workflows… GitHub doesn't allow accepting a subset |

So restricting `permissions:` alone doesn't stop the app from writing. To narrow what Claude can do: limit its **tools** (`--allowedTools` in `claude_args`, `settings` input), use a **custom GitHub App** with only Contents, Issues and Pull requests (documented option, Action only), and rely on **branch protection** and required reviews so nothing merges without a human.

## Limiting Cost and Time

| Control | Example |
|---------|---------|
| Turns | `claude_args: "--max-turns 15"` |
| Job timeout | `timeout-minutes: 15` |
| Parallel runs | `concurrency:` with `cancel-in-progress: true` |
| Triggers | Skip drafts; avoid running on every comment |
| Context | A concise CLAUDE.md (read on every run); specific `@claude` requests |

Each run uses GitHub Actions minutes **and** model tokens (or subscription usage with an OAuth token).

## Syntax and Configuration

orderdesk's deterministic gate, `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-java@v6
        with:
          distribution: temurin
          java-version: "21"
          cache: maven
      - name: Build and test
        run: ./mvnw -B verify
```

The advisory AI review, `.github/workflows/claude-review.yml` (adapted from the documented code-review workflow, with limits added):

```yaml
name: Claude review

on:
  pull_request:
    types: [opened, synchronize, ready_for_review, reopened]

permissions:
  contents: read

concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true

jobs:
  review:
    # Same-repository, non-draft pull requests only: GitHub withholds secrets from fork PRs.
    if: >-
      github.event.pull_request.draft == false &&
      github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    timeout-minutes: 15
    permissions:
      contents: read
      pull-requests: read
      issues: read
      id-token: write
    steps:
      - uses: actions/checkout@v7
        with:
          fetch-depth: 1
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          plugin_marketplaces: "https://github.com/anthropics/claude-code.git"
          plugins: "code-review@claude-code-plugins"
          prompt: "/code-review:code-review --comment ${{ github.repository }}/pull/${{ github.event.pull_request.number }}"
          claude_args: '--max-turns 15 --allowedTools "mcp__github_inline_comment__create_inline_comment"'
```

The only tool allowed is the inline-comment tool: the review can comment, not push. The documentation notes that `--allowedTools` must name this tool in `claude_args` for the action to start the comment server.

**Validation** (schemastore GitHub workflow schema, Ajv):

**Output:**

```text
valid   .github/workflows/ci.yml
valid   .github/workflows/claude-review.yml
```

Schema validation proves structure, not behaviour: it doesn't check that the secret exists, that the plugin installs, or that the review is useful.

## Real-World Example

The documented interactive workflow (`contents: write`) lets any collaborator with write access comment "@claude implement this issue", and Claude can push a branch and open a PR — that is the feature. What keeps it safe is everything around it: branch protection on `main`, the CI workflow as a required check, a required human approval, and `--max-turns` plus a job timeout. Without those, a comment could lead to unreviewed changes on `main`.

## Step-by-Step Walkthrough

1. Add the deterministic CI workflow first; make it a required check.
2. Store `ANTHROPIC_API_KEY` (or `CLAUDE_CODE_OAUTH_TOKEN`) as a repository secret.
3. Start with an advisory, comment-only review workflow (automation mode, narrow `--allowedTools`).
4. Add limits: `--max-turns`, `timeout-minutes`, `concurrency`, draft/fork conditions.
5. Validate the YAML (schema or `actionlint`) before committing.
6. Protect `main`: required reviews, required CI, no force pushes.
7. Only then consider interactive `@claude` with write abilities — and review what it pushes.

## Common Mistakes

- Putting the key in the workflow file or in `claude_args`.
- Assuming job `permissions:` limit the GitHub App's token.
- Passing `github_token: ${{ secrets.GITHUB_TOKEN }}` and wondering why CI doesn't run on Claude's commits (GitHub doesn't trigger workflows from the default token's commits).
- No `--max-turns` or timeout.
- Running on `pull_request_target` with checkout of PR code — untrusted code with secrets.

## Security Considerations

- PR titles, bodies, comments and changed files are untrusted input for the model; keep tools narrow on PR-triggered runs.
- Fork PRs don't receive secrets on public repositories — don't "fix" that with `pull_request_target` plus checkout of the fork's code.
- The write-access and human-actor checks reduce abuse; branch protection and required reviews are what keep `main` safe.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| No response to `@claude` | App not installed, workflows disabled, secret missing, wrong phrase, user lacks write access | Check each; `@claude` as a whole word |
| CI doesn't run on Claude's commits | Commits made with the default `GITHUB_TOKEN` | Let the action authenticate as the app, or use a custom app token |
| Authentication errors | Invalid key/token | Test it locally with `claude` first |
| Review never posts comments | `--allowedTools` in `claude_args` doesn't name the inline-comment tool | Add it, as in the example |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Advisory review only | Low risk | Humans still apply fixes |
| Interactive `@claude` with write | Fast fixes from comments | Needs strong branch protection and review discipline |
| API key vs OAuth token | API: per-token billing, org control; OAuth: uses a subscription | Different billing and ownership |
| Official app vs custom app | Official: all features | Custom: fewer permissions, Action only |

## Interview Takeaways

- Interactive (`@claude`, no `prompt`) vs automation (`prompt`) mode.
- Secrets via `${{ secrets.… }}`; write-access and human-actor checks; app permissions ≠ workflow permissions.
- Limit turns, time and concurrency; keep CI deterministic and required; keep humans approving merges.

## Key Takeaways

- Start advisory and comment-only.
- Store keys only as secrets.
- Narrow tools, cap turns and time, protect branches.
- Validate workflows — and remember validation isn't execution.
