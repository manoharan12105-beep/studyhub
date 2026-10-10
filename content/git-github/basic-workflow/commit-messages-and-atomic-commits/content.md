# Commit Messages and Atomic Commits

**Module:** The Three Areas and Basic Workflow · **Interview priority:** Frequently asked

## Learning Objectives

- Write a commit message with a clear subject and a body that explains why.
- Decide what belongs in one commit (an **atomic commit**) and split work that doesn't.
- Use message trailers such as `Fixes #12` and `Co-authored-by:` correctly.

## What Is It?

A **commit message** is the permanent explanation attached to a change. Its first line is the **subject** (a summary shown by `git log --oneline` and on GitHub); after a blank line comes the optional **body** (the reasoning).

An **atomic commit** contains exactly **one logical change**, complete enough that the project still builds and its tests pass. "Add D grade" is atomic; "Add D grade, rename App, update README typo, bump JUnit" is four commits squeezed into one.

## Why It Matters

Messages and commit size decide how useful history is:

- `git log --oneline` should read like a changelog.
- `git blame` points to a commit; the message must say *why* the line exists.
- `git revert` and `git cherry-pick` operate on whole commits — mixing changes means you can't undo one without the others.
- `git bisect` needs every commit to build; a half-finished commit makes the search ambiguous.
- Reviewers can read a focused 40-line commit; a 900-line mixture gets skimmed.

## How It Works

The widely used conventions (from the Git project and most open-source guides):

```text
Explain why an empty marks list is rejected          ← subject: ≤ 50 chars, imperative, no period
                                                     ← blank line (required)
Teachers read this message in the import error       ← body: wrap at ~72 chars,
dialog. The old text did not say what the marks         explain WHY and any trade-off;
were needed for, so several reported it as a crash.     the diff already shows WHAT

Fixes #12                                            ← trailers
```

Captured with `git log -1` after committing it (`git commit -m "<subject>" -m "<body>" -m "Fixes #12"` — each `-m` is a paragraph):

**Output:**

```text
commit a3b3bea8672aa1fd976711873dab9b5ee1839255
Author: Priya Sharma <priya@example.com>
Date:   Thu Oct 1 10:16:00 2026 +0530

    Explain why an empty marks list is rejected
    
    Teachers read this message in the import error dialog. The old text
    did not say what the marks were needed for, so several reported it as
    a crash.
    
    Fixes #12
```

## Writing the Subject

- **Imperative mood:** "Add D grade", "Fix rounding" — it completes the sentence "If applied, this commit will …". Git's own generated messages ("Merge branch …", "Revert …") use it too.
- **Specific:** "Fix NPE when marks are empty" beats "Fix bug".
- **Short:** about 50 characters; GitHub truncates long subjects.

| Weak | Better |
|------|--------|
| `fix` | `Reject averages of an empty marks list` |
| `changes` | `Add D grade for averages from 50 to 59` |
| `Updated GradeCalculator.java` | `Round class averages to two decimals` |
| `WIP` | (don't share it — squash or reword before pushing) |
| `Fixed the bug that Arjun found yesterday` | `Fix B boundary: 75 is a B, not a C` |

## Trailers

| Trailer | Effect |
|---------|--------|
| `Fixes #12` / `Closes #12` | On GitHub, closes issue 12 when the commit reaches the default branch (also works in a pull request description) |
| `Co-authored-by: Arjun Mehta <arjun@example.com>` | GitHub credits a co-author |
| `Signed-off-by: …` | Developer Certificate of Origin sign-off some projects require (`git commit -s` adds it) |

## Team Conventions

Many teams adopt a structured format such as **Conventional Commits** (`feat: add D grade`, `fix: reject empty marks`, `docs: …`) so tools can generate changelogs and version numbers. Follow the repository's existing convention — consistency matters more than which convention.

## Atomic Commits in Practice

Priya's afternoon on gradebook produced: the D grade, tests for it, a README typo fix and a JUnit version bump. A good history:

```text
Bump JUnit to 5.11.4
Fix typo in README build section
Add D grade for averages from 50 to 59      ← code + its tests together
```

The tests belong **with** the code they test — a commit that adds a feature without its tests, or tests without the feature, breaks one of the two rules (atomic or buildable).

Tools for splitting work: stage by file (`git add <file>`), by hunk (`git add -p`), or tidy up local commits before pushing with [interactive rebase](../../rebasing-and-rewriting/interactive-rebase/content.md).

## Commands

### git commit with a body

**Syntax:** `git commit` (editor) or `git commit -m "<subject>" -m "<body paragraph>"` · **Safety:** changes local state.

### git log --oneline

**Purpose:** check that subjects read well as a list. **Safety:** safe anywhere.

## Step-by-Step Example

1. Finish one logical change and its tests.
2. `git diff --staged` — is everything here part of that one change?
3. Ask: "Could I revert this commit alone without breaking anything else?" If not, split it.
4. Write the subject in the imperative; add a body when the *why* isn't obvious from the diff.
5. Add `Fixes #N` if it resolves an issue.

## Common Mistakes

- **Describing the diff instead of the reason** ("Changed 70 to 75"). Say why ("Align B boundary with the 2026 grading policy").
- **"Fix review comments" commits** pushed to a shared branch forever. Squash them into the commit they fix before merging, if the team allows rewriting that branch.
- **Mixing formatting with logic.** A reformat hides the real change in a giant diff — commit it separately.
- **Committing half-done work to shared branches** so you "don't lose it". Push it to your own branch, or use `git stash`.

## Interview Angle

"What makes a good commit?" — atomic (one logical change), builds and passes tests, imperative subject under ~50 characters, body explaining why. Add *why it matters*: revert, cherry-pick, bisect and blame all work on commit boundaries.

## Recap

- Subject: imperative, specific, ~50 characters. Body: why, wrapped at ~72.
- One logical change per commit, including its tests, leaving the build green.
- Trailers: `Fixes #N`, `Co-authored-by:`, `Signed-off-by:`.
- Follow the team's convention consistently.

## Related Topics

- [git commit](../git-commit/content.md)
- [Interactive Rebase](../../rebasing-and-rewriting/interactive-rebase/content.md)
- [Writing a Good Pull Request](../../pull-requests-and-review/pull-requests-fundamentals/content.md)
