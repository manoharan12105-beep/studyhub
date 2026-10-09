# GitHub Actions Integration and Secrets in Automation — Interview Questions

## Beginner

### Q1. What does the Claude Code GitHub Action do?

**Style:** What

<details>
<summary>Answer</summary>

It runs Claude Code inside a GitHub Actions workflow — answering `@claude` mentions in issues and PRs (interactive mode) or running a prompt or skill on events like PRs and schedules (automation mode) — authenticated with a secret and the Claude GitHub App.

</details>

## Intermediate

### Q2. How do you handle secrets for it?

**Style:** How

<details>
<summary>Answer</summary>

Store `ANTHROPIC_API_KEY` or `CLAUDE_CODE_OAUTH_TOKEN` as a GitHub secret and reference it with `${{ secrets.… }}`; never commit keys or put them in prompts or `claude_args`; for cloud providers use OIDC so no static keys are stored; keep secrets away from runs on untrusted fork code.

</details>

### Q3. Who can trigger the action, and why does it matter?

**Style:** Security

<details>
<summary>Answer</summary>

On issue/PR events the actor needs write access, and bots are rejected unless allowed. This stops outsiders from spending your budget or steering an agent that holds repository credentials, and stops bot loops.

</details>

## Advanced

### Q4. How would you introduce Claude into a team's GitHub workflow safely?

**Style:** Design

<details>
<summary>Answer</summary>

Keep the deterministic CI as a required check; start with an advisory, comment-only review in automation mode with narrow tools, turn caps, timeouts and concurrency; same-repo PRs only; branch protection with required human approval; measure usefulness; only then consider interactive write workflows, possibly with a custom app limited to the needed permissions.

</details>

### Q5. Explain the difference between workflow permissions and the GitHub App's permissions.

**Style:** Comparison

<details>
<summary>Answer</summary>

Workflow `permissions:` scope the job's `GITHUB_TOKEN`. The action authenticates as the Claude GitHub App by default, whose installation permissions (shared with other Claude features, accepted as a set) decide what its token can do. Restrict Claude via its tools and settings, a custom app, and branch protection — not only via `permissions:`.

</details>
