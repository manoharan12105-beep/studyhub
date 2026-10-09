# Automated Code Review and Issue Triage — Interview Questions

## Beginner

### Q1. Should AI code review replace human review?

**Style:** Trade-off

<details>
<summary>Answer</summary>

No. It's a consistent first pass that catches some issues early. Findings can be wrong or missing and can be influenced by PR content. Humans validate findings and approve merges; deterministic CI is the required gate.

</details>

## Intermediate

### Q2. What makes issue and PR content dangerous for an AI workflow?

**Style:** Security

<details>
<summary>Answer</summary>

Anyone who can open an issue or PR controls that text, and the model reads it while holding a token and tools. Instructions hidden in it can steer the model (prompt injection), and interpolating it into scripts enables script injection. Treat it as data, keep tools minimal, and keep secrets away.

</details>

### Q3. How do you design a triage bot with minimal risk?

**Style:** Design

<details>
<summary>Answer</summary>

One effect (a label from a fixed list), exact allow rules for the commands that apply it, only safe values (issue number) interpolated, turn and time limits, no ability to close, comment or assign, and a human who reviews labels. Validate in a sandbox with hostile issues.

</details>

## Advanced

### Q4. How would you defend a PR review workflow against prompt injection?

**Style:** Security

<details>
<summary>Answer</summary>

Comment-only tools, no Bash or network on PR-triggered runs, no secrets beyond the model key, same-repo PRs only (no `pull_request_target` with fork checkout), reviewer instructions to treat content as data, findings validated by humans, branch protection and required approvals. Assume injection will sometimes succeed and limit what it can achieve.

</details>

### Q5. How do you know an automated review is worth its cost?

**Style:** Scenario

<details>
<summary>Answer</summary>

Measure validated-finding rate, false positives, defects it caught that humans missed, escaped defects, reviewer time, and token plus CI cost. Tune scope (paths, effort, triggers) or remove it if the numbers don't justify it.

</details>
