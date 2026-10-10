# Pull Requests: Creating and Describing Changes

**Module:** Pull Requests and Code Review · **Interview priority:** Core

> [!NOTE]
> Pull requests are a GitHub feature; the web steps describe github.com as of 2026 and were not run for this lesson (**Instruction only**). The Git commands that prepare a pull request were run in the practice lab.

## Learning Objectives

- Explain what a pull request is and how branch-based and fork-based pull requests differ.
- Open a pull request with a description reviewers can act on, including draft pull requests.
- Keep a pull request small, current with its base branch, and linked to its issue.

## What Is It?

A **pull request (PR)** is a request to merge one branch (the **head** or **compare** branch) into another (the **base**, usually `main`). GitHub shows its commits and combined diff — the three-dot diff from the merge base — and adds discussion, reviews, CI status checks and a merge button. GitLab calls the same thing a **merge request**.

| | Branch-based PR | Fork-based PR |
|-|-----------------|---------------|
| Head branch lives in | The same repository | Your fork |
| Requires | Write access to the repository | Only a fork (no write access) |
| Used by | Team members | Outside contributors, open source |

## Why It Matters

Pull requests are where code review, automated checks and team knowledge-sharing happen before code reaches `main`. A clear, focused PR is reviewed quickly and merged confidently; a vague 2,000-line PR is skimmed, delayed or rejected.

## How It Works

```text
fix/12-empty-marks  ──push──► GitHub ──"Compare & pull request"──► PR #14
       │                                   base: main ◄── compare: fix/12-empty-marks
       │                                   diff = git diff main...fix/12-empty-marks
       └── new commits pushed later update the PR automatically
```

1. Create a branch and commit ([Working with Feature Branches](../../branching-and-merging/working-with-feature-branches/content.md)).
2. `git push -u origin fix/12-empty-marks`.
3. On GitHub: **Compare & pull request** (shown after a push), or **Pull requests → New pull request**; choose base and compare branches.
4. Write the title and description; request reviewers; open as **draft** or ready for review.
5. CI runs on the PR; reviewers comment; you push more commits; the PR updates.
6. When approved and green, it's merged ([Merging Pull Requests](../merging-pull-requests/content.md)).

With the GitHub CLI:

```bash
# Illustrative — requires the GitHub CLI and `gh auth login`
gh pr create --base main --title "Handle students with no marks in ClassReport" --body-file pr.md
gh pr create --draft --fill          # draft, title/body from the commits
gh pr status
```

## Writing a Good Description

```markdown
## What
`ClassReport.summary()` now prints "no marks" for students without marks instead of throwing.

## Why
Teachers import partial class lists before exams; one empty student broke the whole report (#12).

## How
- `ClassReport` checks `marks().length == 0` before calling `average()`.
- `average()` still rejects empty input — the report handles it, not the calculator.

## Testing
- New `ClassReportTest.summaryHandlesStudentWithoutMarks`.
- `mvn -B verify` passes locally (12 tests).

## Notes for reviewers
The error-message wording in `GradeCalculator` is unchanged on purpose.

Fixes #12
```

| Element | Purpose |
|---------|---------|
| Title | What the PR does, imperative, specific — it often becomes the squash-commit message |
| What / Why | The change and its reason; link the issue |
| How | Design decisions a reviewer should know |
| Testing | What you ran and what you couldn't verify — evidence, not "works on my machine" |
| Screenshots | For UI or output changes |
| `Fixes #12` | Closes the issue when merged into the default branch |

A `.github/pull_request_template.md` file pre-fills this structure for every PR.

## Draft Pull Requests

Open a **draft** when you want early feedback or CI results but the work isn't ready to merge: drafts can't be merged and don't request reviews from code owners until you click **Ready for review**. Use them instead of "WIP" titles.

## Keeping a PR Healthy

- **Small:** one purpose; ideally a few hundred lines or less. Split large work into a series of PRs.
- **Current:** if `main` moved and there are conflicts, update the branch — merge `main` in, or rebase and `git push --force-with-lease` if the branch is yours.
- **Green:** fix failing checks before asking for review.
- **Responsive:** answer review comments; push fixes as new commits so reviewers see what changed.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git push -u origin <branch>` | Publish the head branch | **Changes the remote** |
| `git log --oneline main..HEAD` | The commits the PR will contain | Safe anywhere |
| `git diff main...HEAD --stat` | The PR's diff summary | Safe anywhere |
| `gh pr create` / `gh pr view` / `gh pr checks` | Manage PRs from the terminal | Creates/reads GitHub data |

## Step-by-Step Example

1. `git switch -c fix/12-empty-marks main`, implement with a test, `mvn -B verify`.
2. `git diff main...HEAD` — review your own diff first; remove debug code.
3. `git push -u origin fix/12-empty-marks`.
4. Open the PR with the description above, request Arjun as reviewer.
5. CI fails on formatting → fix, commit, push → the PR updates.
6. Approved → merged → branch deleted.

## Common Mistakes

- **Empty or one-word descriptions.** The reviewer has to reverse-engineer intent.
- **Mixing unrelated changes** (feature + refactor + dependency bump).
- **Opening a PR against the wrong base branch** — check base and compare before creating.
- **Reviewing your own diff for the first time in the PR.** Review it locally first.
- **Force-pushing a shared PR branch** that a co-author is also pushing to.

## Interview Angle

"What is a pull request?" — a proposal to merge a branch, with diff, discussion, review and checks; a platform feature, not a Git command. "What makes a good PR?" — small, single purpose, clear what/why/how/testing, linked issue, green CI. Distinguish branch-based (team) and fork-based (open source).

## Recap

- A PR proposes merging a head branch into a base branch, showing the three-dot diff.
- Branch-based for teams with write access; fork-based for everyone else.
- Describe what, why, how and testing; link issues with `Fixes #N`.
- Drafts for early feedback; keep PRs small, current and green.

## Related Topics

- [Reviewing Pull Requests](../reviewing-pull-requests/content.md)
- [Merging Pull Requests](../merging-pull-requests/content.md)
- Claude Code: [Code Review, Diffs and PR Preparation](../../../claude-code-mastery/github-workflows/code-review-diffs-and-prs/content.md)
- [Lab 09 — Fork a Repository and Prepare a Pull Request](../../labs/git-lab-09-fork-and-pull-request/content.md)
