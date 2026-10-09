# Permission Fundamentals: Allow, Ask and Deny — Practice

### P1. Evaluation order

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** precedence

Settings contain `"allow": ["Bash(aws s3 ls)"]` and `"deny": ["Bash(aws *)"]`. Claude runs `aws s3 ls`. What happens?

- A) It runs, because the allow rule is more specific
- B) It is blocked, because deny rules are evaluated first
- C) You are asked
- D) It depends on the permission mode

<details>
<summary>Answer</summary>

**Answer:** B) It is blocked, because deny rules are evaluated first

Order is deny → ask → allow and the first match wins; specificity does not change the order. An allow rule cannot carve an exception out of a deny rule.

</details>

### P2. Pre-approve the tests

**Difficulty:** Easy · **Type:** Configuration · **Concepts:** allow rules

Write an allow rule that lets Claude run `./mvnw test` with any arguments but nothing else under `./mvnw`.

<details>
<summary>Answer</summary>

`"Bash(./mvnw test *)"` — the trailing ` *` also matches `./mvnw test` with no arguments. It does not match `./mvnw deploy` or `./mvnw -q test` (different text before the `*`); add a separate rule for `./mvnw -q test *` if you use that form.

</details>

### P3. Wildcard trap

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** wildcard position

Which commands does `"allow": ["Bash(git * main)"]` approve? `git log --oneline main` · `git push origin main` · `git merge main` · `git log`

<details>
<summary>Answer</summary>

`git log --oneline main`, `git push origin main` and `git merge main`. Not `git log`. The `*` stands in for the subcommand, so every git subcommand ending in `main` is allowed — including a push. Claude Code warns at startup about allow rules with a `*` before the subcommand. Prefer `Bash(git log *)`.

</details>

### P4. Compound command

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** compound commands

You allow `Bash(./mvnw test *)`. Claude runs `./mvnw test && git push origin main`. Does it run without a prompt?

<details>
<summary>Answer</summary>

No. Claude Code splits compound commands and each part must match an allow rule independently; `git push origin main` is not allowed, so you are asked (and if `git push *` is an ask rule, it always prompts).

</details>

### P5. Wrong tool name

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** Edit vs Write rules

`"deny": ["Write(src/main/resources/db/migration/**)"]` does not stop edits to migrations. Why, and what is the correct rule?

<details>
<summary>Answer</summary>

File permission checks consult only `Edit(path)` and `Read(path)` rules; a `Write(path)` rule is accepted but never consulted (Claude Code warns at startup). Use `"Edit(src/main/resources/db/migration/**)"` — `Edit` rules cover all built-in editing tools.

</details>

### P6. Anchors

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** gitignore anchors

You put `"deny": ["Read(/secrets/**)"]` in `~/.claude/settings.json` to protect every project's `secrets/` folder. Does it work?

<details>
<summary>Answer</summary>

No. In user settings a single leading `/` anchors at the settings source — `~/.claude/` — so the rule protects `~/.claude/secrets/**`. To match a `secrets` directory under the current directory at any depth, use `Read(secrets/**)` (deny rules with one directory segment match at any depth), or `Read(//**/secrets/**)` to match anywhere on the filesystem.

</details>

### P7. Does deny stop curl?

**Difficulty:** Hard · **Type:** Security · **Concepts:** Bash rule limits

You deny `Bash(curl *)` to prevent data exfiltration. List two ways a command could still reach the network and the control that actually enforces a network boundary.

<details>
<summary>Answer</summary>

`/usr/bin/curl …` or `sh -c 'curl …'` (different command text), or another tool such as `wget`, a Java/Python program or `git` to a new remote. Bash rules match text, not programs. The **sandbox** with network isolation (allowed domains) enforces the boundary at the operating-system level for shell commands; a PreToolUse hook can add inspection; auto mode's classifier blocks sending sensitive data externally by default.

</details>

### P8. Policy design

**Difficulty:** Hard · **Type:** Workflow design · **Concepts:** allow/ask/deny design

Design rules for: running tests (frequent), editing `pom.xml` (rare, risky), `git push` (sometimes), reading `~/.aws/credentials` (never), `./mvnw deploy` (never from Claude).

<details>
<summary>Answer</summary>

```json
{
  "permissions": {
    "allow": ["Bash(./mvnw test *)"],
    "ask": ["Edit(/pom.xml)", "Bash(git push *)"],
    "deny": ["Read(~/.aws/**)", "Bash(./mvnw deploy *)"]
  }
}
```

Tests: allow — routine and local. `pom.xml`: ask — every dependency change is a supply-chain decision. Push: ask — publishes work; also protect the branch on the server. Credentials: deny — must never enter context. Deploy: deny — and note `./mvnw -B deploy` would not match, so back it with a hook or keep deploy credentials off the machine.

</details>

### P9. Saved approvals

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** don't ask again

In Manual mode you answer "Yes, and don't ask again" to (a) `./mvnw test -Dtest=OrderControllerTest` and (b) an edit to `Order.java`. Which approval is still in effect tomorrow?

<details>
<summary>Answer</summary>

(a). Bash approvals are saved permanently for the repository as an allow rule in `.claude/settings.local.json` (the dialog writes a prefix form such as `./mvnw test *`). File-modification approvals last only until the session ends.

</details>
