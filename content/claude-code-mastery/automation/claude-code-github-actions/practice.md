# GitHub Actions Integration and Secrets in Automation — Practice

### P1. Which mode?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** interactive vs automation

A workflow uses `anthropics/claude-code-action@v1` with a `prompt` input on `pull_request` events. Which mode runs?

- A) Interactive — it waits for `@claude`
- B) Automation — it runs the prompt on the event
- C) Neither; `prompt` is ignored
- D) Both at once

<details>
<summary>Answer</summary>

**Answer:** B) Automation — it runs the prompt on the event

Without `prompt`, the action waits for the trigger phrase (interactive mode).

</details>

### P2. Store the key

**Difficulty:** Easy · **Type:** Security · **Concepts:** secrets

Which line is correct?

- A) `anthropic_api_key: sk-ant-…`
- B) `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}`
- C) `claude_args: "--api-key sk-ant-…"`
- D) `env: { ANTHROPIC_API_KEY: "sk-ant-…" }`

<details>
<summary>Answer</summary>

**Answer:** B) `anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}`

Keys live only in GitHub secrets; the workflow references them.

</details>

### P3. Who can trigger?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** trigger checks

A user without write access comments "@claude fix this" on an issue in your public repository. What happens by default, and why does that matter?

<details>
<summary>Answer</summary>

The run fails the write-access check and Claude doesn't start. Without it, anyone who can comment could spend your tokens and steer an agent that holds a repository token. Exceptions need `allowed_non_write_users` and your own `github_token`.

</details>

### P4. Add limits

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** cost control

Add three controls to a Claude review job so a run can't go on for long or pile up on rapid pushes.

<details>
<summary>Answer</summary>

```yaml
concurrency:
  group: claude-review-${{ github.event.pull_request.number }}
  cancel-in-progress: true
jobs:
  review:
    timeout-minutes: 15
    steps:
      - uses: anthropics/claude-code-action@v1
        with:
          claude_args: "--max-turns 15"
```

(plus the job's other settings). Turn cap, job timeout, and one run per PR at a time.

</details>

### P5. Permissions confusion

**Difficulty:** Medium · **Type:** Misconception · **Concepts:** app vs workflow permissions

A colleague sets `permissions: contents: read` on the `@claude` job and says "now Claude can't push". Is that right?

<details>
<summary>Answer</summary>

Not necessarily. Job `permissions:` restrict the `GITHUB_TOKEN`. By default the action authenticates as the Claude GitHub App, whose installation has read/write on Contents and Pull requests. Limit Claude's tools (`--allowedTools`/`settings`), consider a custom app with fewer permissions, and protect branches.

</details>

### P6. CI didn't run

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** GITHUB_TOKEN

Claude pushed fixes to a PR, but the CI workflow never ran on those commits. The workflow passes `github_token: ${{ secrets.GITHUB_TOKEN }}` to the action. Explain and fix.

<details>
<summary>Answer</summary>

GitHub doesn't trigger workflows for commits made with the default `GITHUB_TOKEN` (to prevent loops). Remove the `github_token` input so the action authenticates as the Claude GitHub App, or pass a custom app token.

</details>

### P7. Fork PRs

**Difficulty:** Hard · **Type:** Security · **Concepts:** pull_request_target

Reviews don't run on fork PRs because secrets are withheld. Someone proposes switching to `pull_request_target` and checking out the PR head. Why is that dangerous?

<details>
<summary>Answer</summary>

`pull_request_target` runs in the base repository's context with access to secrets and a write-capable token. Checking out and running fork code (or letting an agent act on it with tools) gives an untrusted author's code and text access to those secrets. Keep AI review on same-repository PRs, or run a no-secrets, read-only review for forks.

</details>

### P8. Validate, then what?

**Difficulty:** Hard · **Type:** Workflow design · **Concepts:** verification

Both workflows pass schema validation. List three things that validation does **not** tell you and how you would check each.

<details>
<summary>Answer</summary>

1. That the secret exists and is valid — test the key locally with `claude`, check the repository's secrets list.
2. That the action, plugin and tools behave as intended — run it on a test PR in a sandbox repository.
3. That permissions are least privilege and branch protection is on — review repository settings and the app installation; try a push to `main` from a test account.

</details>
