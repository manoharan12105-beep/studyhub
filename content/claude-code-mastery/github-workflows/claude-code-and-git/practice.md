# Claude Code and Git: Branches, Changes and Permissions — Practice

### P1. What runs without a prompt?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** read-only commands

In Manual mode with no extra rules, which command runs without a permission prompt?

- A) `git commit -m "fix"`
- B) `git push`
- C) `git diff --stat`
- D) `git switch -c feature/pay`

<details>
<summary>Answer</summary>

**Answer:** C) `git diff --stat`

Read-only forms of `git` are in Claude Code's built-in read-only set and run without prompting in every mode.

</details>

### P2. Stale snapshot

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Git snapshot

When does Claude Code read the Git status snapshot it gives Claude?

- A) Before every message
- B) When the conversation starts
- C) After every commit
- D) Never — Claude must always run Git

<details>
<summary>Answer</summary>

**Answer:** B) When the conversation starts

It holds the branch, main branch, `git status` output and recent commits as they were then. Ask Claude to run Git again for current state.

</details>

### P3. Read the status

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** git status

What does this output tell you?

```text
 M src/main/java/com/example/orderdesk/order/PriceCalculator.java
 M src/test/java/com/example/orderdesk/order/PriceCalculatorTest.java
?? src/main/java/com/example/orderdesk/order/DiscountPolicy.java
```

<details>
<summary>Answer</summary>

Two tracked files are modified and not staged (` M`), and one new file is untracked (`??`). Before committing, check whether the new class was part of the task — an unexpected new file is a scope question for review.

</details>

### P4. Write the rules

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** permission rules

Write a `permissions` block that asks before commits and pushes, and denies force pushes and `git reset --hard`.

<details>
<summary>Answer</summary>

```json
{
  "permissions": {
    "ask": ["Bash(git commit *)", "Bash(git push *)"],
    "deny": ["Bash(git push --force *)", "Bash(git push -f *)", "Bash(git reset --hard *)"]
  }
}
```

Remember these match command text, not every spelling; keep branch protection on the server.

</details>

### P5. Dirty start

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** clean working tree

You had uncommitted edits to `OrderController.java` when you asked Claude to fix BUG-101, which also touched that file. What problem does this create, and how should you have started?

<details>
<summary>Answer</summary>

Your edits and Claude's are mixed in one diff, so you can't review Claude's change on its own or revert it cleanly. Commit or stash your work first (`git stash push -m "wip controller"`), start on a fresh branch with a clean tree, and let Claude's changes stand alone.

</details>

### P6. Over-broad allow

**Difficulty:** Medium · **Type:** Security · **Concepts:** allow rules

A teammate adds `"allow": ["Bash(git *)"]` to stop prompts. What does it allow that you probably don't want?

<details>
<summary>Answer</summary>

Every Git command: `git push`, `git push --force` (unless denied), `git reset --hard`, `git clean -fdx`, `git config` changes. Allow specific read or local commands instead, and keep `ask` for commit and push. Deny rules still win over allow, but only for the spellings they match.

</details>

### P7. Commit review

**Difficulty:** Hard · **Type:** Workflow design · **Concepts:** deliberate commits

Claude offers: "I'll commit with `git add -A && git commit -m 'Fix BUG-101'`." List what you check before you approve, and what you would do differently.

<details>
<summary>Answer</summary>

Check `git status --short` for unexpected or generated files (`target/`, `.env`, IDE files), read `git diff` for scope and weakened tests, and confirm the build result. Prefer staging specific files (or `git add -p`), then `git diff --cached` before committing, and a message that states what changed and how it was verified. The ask rule gives you the moment to do this — use it rather than approving by reflex.

</details>
