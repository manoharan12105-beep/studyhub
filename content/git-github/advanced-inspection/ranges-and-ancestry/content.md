# Ranges and Ancestry: .., ..., merge-base and --is-ancestor

**Module:** Advanced Inspection and Search · **Interview priority:** Frequently asked

## Learning Objectives

- Read two-dot and three-dot range notation for `git log` and know how `git diff` differs.
- Answer ancestry questions: "is this commit in that branch?", "where did they diverge?".
- Count and list commits between two points for release notes and reviews.

## What Is It?

A **range** selects a set of commits by reachability (following parent links):

| Notation | Commits selected (for `git log`) |
|----------|----------------------------------|
| `A..B` | Reachable from B but **not** from A — "what B has that A doesn't" |
| `B ^A` / `B --not A` | Same as `A..B` (the general form; allows several exclusions) |
| `A...B` | Reachable from **either** but not **both** — the symmetric difference |
| `A..` / `..B` | `A..HEAD` / `HEAD..B` |

**Ancestry:** commit X is an **ancestor** of Y if you can reach X by following parents from Y. "Is the fix in the release?" is an ancestry question.

## Why It Matters

Every review, release note and "did the hotfix reach production?" question is a range or ancestry question. Getting `..` and `...` wrong means reviewing the wrong changes or shipping without a fix.

## How It Works

Gradebook just before Arjun's branch was merged — `main` at `d0e8c67`, `feature/class-report` at `8b503ca`, diverged at `4b17431`:

```text
          3e2381d ── 8b503ca   feature/class-report
         /
4b17431 ─┤
         \
          d0e8c67              main
```

```bash
git log --oneline main..feature/class-report
git log --oneline feature/class-report..main
```

**Output:**

```text
8b503ca Show each student's average in ClassReport
3e2381d Add ClassReport with one line per student
d0e8c67 Round averages to two decimals
```

The first command printed the feature's two commits (what a PR from the feature would contain); the second printed `main`'s one commit (what the feature is missing).

```bash
git log --oneline --left-right main...feature/class-report
```

**Output:**

```text
> 8b503ca Show each student's average in ClassReport
< d0e8c67 Round averages to two decimals
> 3e2381d Add ClassReport with one line per student
```

Three dots: everything on either side since they diverged; `--left-right` marks which side (`<` left = `main`, `>` right = the feature).

### Ranges in git diff are different

`git diff` compares **two snapshots**, not sets of commits:

| | `git log` | `git diff` |
|-|-----------|-----------|
| `A..B` | Commits in B not in A | Same as `git diff A B` — tip to tip |
| `A...B` | Symmetric difference | `git diff $(git merge-base A B) B` — what B changed since diverging |

So for a pull-request-style view, use **`git log A..B`** and **`git diff A...B`** — the dot counts differ. (Introduced in [git show and Comparing Commits](../../history-and-inspection/git-show-and-comparing/content.md).)

### Ancestry commands

```bash
git merge-base main feature/class-report
```

**Output:**

```text
4b17431839600a5d1f32a771d395b173cd9377eb
```

`--is-ancestor` answers yes/no with its **exit code** (0 = yes, 1 = no) — ideal for scripts and CI:

```bash
git merge-base --is-ancestor 4b17431 main; echo "exit=$?"
git merge-base --is-ancestor 8b503ca d0e8c67; echo "exit=$?"
```

**Output:**

```text
exit=0
exit=1
```

Which branches already contain a commit (after the merge)?

```bash
git branch --contains 8b503ca
```

**Output:**

```text
  feature/class-report
* main
```

`git tag --contains <commit>` answers "which releases include this fix?".

### Counting

```bash
git rev-list --count main
git rev-list --count d0e8c67..main
```

**Output (after the merge and one more commit):**

```text
9
4
```

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git log A..B`, `git log A...B --left-right` | Commit sets | Safe anywhere |
| `git merge-base A B` | Best common ancestor | Safe anywhere |
| `git merge-base --is-ancestor X Y` | Exit 0 if X is an ancestor of Y | Safe anywhere |
| `git branch --contains X`, `git tag --contains X` | Refs that include X | Safe anywhere |
| `git rev-list --count <range>` | Number of commits | Safe anywhere |

## Step-by-Step Example

"Is the empty-marks fix (`a9f609c`) in release `v1.1.0`, and what else changed since `v1.0.0`?"

1. `git merge-base --is-ancestor a9f609c v1.1.0 && echo included || echo missing`.
2. `git tag --contains a9f609c` — every release that has it.
3. `git log --oneline --no-merges v1.0.0..v1.1.0` — release notes material.
4. `git diff --stat v1.0.0 v1.1.0` — files touched between releases.

## Common Mistakes

- **Using `git log A...B` expecting PR commits** — it also lists the base branch's new commits.
- **Using `git diff A..B` for review** — it's tip-to-tip; use `A...B`.
- **Reversing the order** in `A..B` — you get the other side's commits.
- **Checking "is it merged?" by searching messages** — cherry-picked or rebased commits have new ids; check ancestry for merges, and search by content (`git log -S`) for copies.

## Interview Angle

"What's the difference between `..` and `...`?" — for log: commits in B not A vs. symmetric difference; for diff: tip-to-tip vs. from the merge base. "How do you check whether a commit is in a branch?" — `git branch --contains` or `git merge-base --is-ancestor`.

## Recap

- `A..B` = commits in B not in A; `A...B` = in either but not both.
- In `git diff`, `..` means tip-to-tip and `...` means from the merge base.
- `merge-base`, `--is-ancestor`, `--contains` answer ancestry questions.
- `rev-list --count` counts commits in a range.

## Related Topics

- [git show and Comparing Commits and Branches](../../history-and-inspection/git-show-and-comparing/content.md)
- [git bisect](../git-bisect/content.md)
- [GitHub Releases](../../tags-and-releases/github-releases/content.md)
