# Claude Code and Git: Branches, Changes and Permissions

**Module:** Git and GitHub Workflows · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289, *Configure permissions* and the settings reference (October 2026). Git output below comes from a real run on the orderdesk sample (Git for Windows; the CRLF warnings Windows prints are left out).

## Definition

Claude Code works **inside your Git repository**: it receives a snapshot of your Git state when a conversation starts, runs `git` through the Bash tool like any other command, and follows built-in instructions for writing commits and pull requests. Git is also your main **safety net** — the record of what changed, the way to undo it, and the boundary between "Claude edited files" and "the team accepted a change".

## Why It Matters

- Every change Claude makes is a working-tree change you can inspect with `git diff` before anything is committed.
- Commits and pushes are **outward-facing**: a push can trigger CI, deployments or notifications. They deserve a deliberate human decision.
- Knowing what Claude sees (and when that view goes stale) prevents confident answers about the wrong branch.

## How It Works

```text
conversation starts ──► Git snapshot: current branch, main branch, `git status`, recent commits
                         (read once — not refreshed automatically)
                                │
Claude edits files ──► working tree changes ──► you review: git status / git diff / /diff
                                │
            deliberate steps:   git add → git commit → git push → pull request
            (ask rules, your review)
```

## What Claude Knows About Your Repository

| Source | Contains | Freshness |
|--------|----------|-----------|
| Git status snapshot | Branch, main branch, `git status` output, recent commits | Taken when the conversation starts |
| Built-in Git instructions | How to write commits and pull requests | Always (unless turned off) |
| Commands Claude runs | Whatever `git log`, `git diff`, `git blame` print | Current at the time of the call |

Both built-in pieces can be removed with `"includeGitInstructions": false` (for teams with their own Git workflow skills). Because the snapshot is taken once, ask Claude to run `git status` again after you switch branches outside the session.

## Reading Branches and Uncommitted Work

Commands worth asking Claude to run — and to run yourself:

```bash
git status --short          # what changed, one line per file
git branch --show-current   # where am I?
git diff --stat             # size of each change
git diff -- src/main        # the actual production-code change
git log --oneline -5        # recent history
```

On orderdesk, after the BUG-101 fix on a new branch:

**Output:**

```text
 M src/main/java/com/example/orderdesk/order/PriceCalculator.java
 M src/test/java/com/example/orderdesk/order/PriceCalculatorTest.java
```

```text
fix/bug-101-null-discount
```

```text
 .../java/com/example/orderdesk/order/PriceCalculator.java   |  3 +++
 .../com/example/orderdesk/order/PriceCalculatorTest.java    | 13 +++++++++++++
 2 files changed, 16 insertions(+)
```

```text
diff --git a/src/main/java/com/example/orderdesk/order/PriceCalculator.java b/src/main/java/com/example/orderdesk/order/PriceCalculator.java
index c62b37e..854cf5f 100644
--- a/src/main/java/com/example/orderdesk/order/PriceCalculator.java
+++ b/src/main/java/com/example/orderdesk/order/PriceCalculator.java
@@ -11,6 +11,9 @@ public class PriceCalculator {
 
     /** Total in cents after the discount code, if any. Discounts are rounded down to whole cents. */
     public long totalCents(long subtotalCents, String discountCode) {
+        if (discountCode == null || discountCode.isBlank()) {
+            return subtotalCents;
+        }
         int percent = PERCENT_OFF.getOrDefault(discountCode.trim().toUpperCase(Locale.ROOT), 0);
         long discount = subtotalCents * percent / 100;
         return subtotalCents - discount;
```

Inside a session, `/diff` shows the same working-tree changes, including Claude's edits so far.

## Which Git Operations Prompt or Are Blocked

| Operation | Default behaviour | Recommended project rule |
|-----------|------------------|--------------------------|
| Read-only Git (`git status`, `git diff`, `git log`, …) | Runs without a prompt in every mode (built-in read-only set) | — |
| `cd other-dir && git …` | Prompts — Git in a new directory can run that directory's hooks | — |
| `git add`, `git commit`, `git switch` | Prompt in Manual mode | `ask` for commit |
| `git push` | Prompts in Manual mode | `ask` |
| `git push --force`, `git reset --hard`, `git clean -fd` | Prompt; in auto mode the classifier also checks for uncommitted work | `deny` force push |

From the orderdesk project settings:

```json
{
  "permissions": {
    "ask": ["Bash(git commit *)", "Bash(git push *)"],
    "deny": ["Bash(git push --force *)"]
  }
}
```

> [!WARNING]
> Bash rules match the command text Claude writes. The permissions documentation states that `Bash(git push *)` doesn't match `git -C . push origin main` or `git 'push' origin main`; likewise `git push --force *` doesn't match `git push origin +main`. A deny rule covers the usual spelling, not the program. Branch protection on the server (no force pushes to `main`) is the control that actually holds.

## Why Commits and Pushes Stay Deliberate

- **A commit is a claim** that a change is reviewed and coherent. Review the diff first.
- **A push leaves your machine**: CI runs, teammates see it, deployments may trigger. It can't be taken back quietly.
- Commit messages Claude writes describe what *it believes* it did; check them against the diff.
- Claude Code adds attribution to commits and PR descriptions by default; the `attribution` setting changes or hides it — follow your team's policy.

## Syntax and Configuration

```json
{
  "includeGitInstructions": true,
  "attribution": {
    "commit": "Assisted-by: AI coding agent",
    "pr": "",
    "sessionUrl": false
  }
}
```

`includeGitInstructions` defaults to `true`. `attribution.commit` replaces the default commit trailer, an empty `pr` removes pull request attribution, and `"attribution": false` (v2.1.281+) hides all of it. Your CLAUDE.md rules about attribution take precedence unless the setting comes from managed settings.

## Real-World Example

Suppose a developer switches to `main` in another terminal halfway through a session, then asks Claude "which branch are we on?". The only Git state Claude has without running a command is the start-of-conversation snapshot, which still says `fix/bug-101-null-discount`. A reliable answer needs `git branch --show-current` run now. Lesson: the snapshot is a starting point; current state comes from running Git.

## Step-by-Step Walkthrough

1. Start every task on a branch: `git switch -c fix/bug-101-null-discount`.
2. Make sure the tree is clean before Claude starts (`git status --short` prints nothing), so its changes stand alone.
3. Let Claude work; review with `git diff` (or `/diff`) after each step.
4. Run the build yourself or check the output Claude shows.
5. Stage selectively (`git add -p`), commit with a message you agree with.
6. Push and open the PR deliberately.

## Common Mistakes

- Starting on a dirty tree — your changes and Claude's become indistinguishable.
- Letting Claude commit "everything" with `git add -A`, including generated files or secrets.
- Trusting the snapshot after switching branches.
- Allow rules like `Bash(git *)` — that includes push.
- Relying on a deny rule instead of server-side branch protection.

## Security Considerations

- `.gitignore` your `.env` files and deny reading them; a commit of a secret is effectively a leak once pushed.
- Git hooks run code: be careful when Claude runs Git in an untrusted repository.
- Review commit content, not only messages; inspect `git diff --cached` before committing.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Claude names the wrong branch | Snapshot from conversation start | Ask it to run `git status`/`git branch --show-current` |
| Every Git command prompts after `cd` | Git in a different directory can run hooks | Start Claude in the repository root |
| Deny rule didn't stop a force push | Different spelling of the command | Server-side branch protection; a hook as a second layer |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Claude commits for you | Fast, good messages | Easy to commit unreviewed work |
| You commit | Deliberate review | A few extra steps |
| `includeGitInstructions: false` | Your own Git workflow | You must supply equivalent guidance |

## Interview Takeaways

- Claude sees a Git snapshot at conversation start, then runs Git like any command.
- Read-only Git runs without prompts; commits and pushes should be `ask`, force push `deny` — plus branch protection.
- Review diffs before committing; pushes are outward-facing.

## Key Takeaways

- Branch first, clean tree, review the diff.
- Commits and pushes are human decisions.
- Command-text rules are a layer; the server enforces the rest.
- Re-check Git state instead of trusting the snapshot.
