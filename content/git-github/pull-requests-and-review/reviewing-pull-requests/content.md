# Reviewing Pull Requests and Addressing Reviews

**Module:** Pull Requests and Code Review · **Interview priority:** Frequently asked

> [!NOTE]
> GitHub review features are described as of 2026 (**Instruction only**). Commands for checking out a pull request locally are standard Git/GitHub conventions; they were not run against github.com for this lesson.

## Learning Objectives

- Review a pull request's diff systematically, on GitHub and locally.
- Write useful review comments and suggested changes, and choose Comment, Approve or Request changes.
- Respond to a review as the author without losing the reviewers' trail.

## What Is It?

A **code review** is a teammate reading your change before it merges, to catch defects, improve design and share knowledge. On GitHub a review is a set of comments on lines of the PR's **Files changed** tab plus an overall verdict:

| Verdict | Meaning |
|---------|---------|
| **Comment** | Feedback without a decision |
| **Approve** | OK to merge (subject to checks and other rules) |
| **Request changes** | Must be addressed before merging; with branch protection, blocks the merge until that reviewer approves or the review is dismissed |

## Why It Matters

Reviews catch bugs CI can't (wrong behaviour that tests don't cover, unclear names, security mistakes), and spread knowledge so more than one person understands every part of the code. Good review etiquette keeps it a collaboration rather than a gate.

## How It Works

### As the reviewer

1. **Read the description first** — what problem is solved, how was it tested?
2. **Check CI** — don't spend time on a red build.
3. **Read the diff** in **Files changed**; mark files **Viewed** as you go. For larger changes, check it out locally:

```bash
# Illustrative — fetches PR #14's head into a local branch (GitHub exposes pull/<n>/head)
git fetch origin pull/14/head:pr-14
git switch pr-14
mvn -B verify
git log --oneline main..pr-14
git diff main...pr-14
```

or `gh pr checkout 14`.

4. **Comment on lines**: click `+` beside a line (or drag across lines). Use **Add single comment** for a quick note, or **Start a review** to batch comments and submit them together with a verdict.
5. **Suggest changes**: the "suggestion" button inserts a block (three backticks followed by the word `suggestion`) containing the line; edit it, and the author can apply it as a commit with one click.
6. **Submit the review** with a summary and a verdict.

### A Java review checklist

- **Correctness:** edge cases (empty marks, null, boundaries like exactly 75), off-by-one, integer division.
- **Tests:** do new tests fail without the change? Are boundaries tested?
- **Design:** responsibilities in the right class; no duplicated logic; names that say what they do.
- **Errors:** exceptions with useful messages; no swallowed exceptions.
- **Security:** no secrets, no logging of personal data, input validation, safe SQL (parameterised queries).
- **Scope:** nothing unrelated slipped in; no debug output; generated files not committed.

### As the author

- Reply to every comment — "Done", or explain why not. Resolve conversations once addressed (or let the reviewer resolve them, per team convention).
- Push fixes as **new commits** during review so reviewers can see exactly what changed since their last look; squash at merge time if the team wants a clean history.
- **Re-request review** when you've addressed everything.
- Don't take comments personally; ask questions when a comment is unclear.

## Writing Useful Comments

| Weak | Better |
|------|--------|
| "This is wrong." | "`average >= 75` makes 74.99 a C — is that intended? The issue says 'B from 75'." |
| "Rename." | "nit: `calc` → `calculator` would match the rest of the class." |
| "Why?" | "Why does the report catch `IllegalArgumentException` here instead of checking `marks().length` first? Catching hides other bugs." |

Conventions: prefix optional points with `nit:`; ask questions rather than issue orders; explain the **why**; praise good solutions; keep design debates out of line comments (talk, then summarise).

## Code-Review Etiquette

- Review the **code**, not the person. "This method…" not "You…".
- Respond within a working day; long waits encourage giant PRs.
- Approve when it's good enough and safe — not when it matches how you'd have written it.
- Authors: keep PRs small and well described so reviews can be thorough.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git fetch origin pull/<n>/head:pr-<n>` | Get a PR's commits locally | Local only |
| `gh pr checkout <n>` / `gh pr review <n> --approve` | GitHub CLI review tools | Reads / writes GitHub data |
| `git diff main...pr-<n>` | The PR's diff | Safe anywhere |

## Step-by-Step Example

Arjun reviews Priya's PR #14 "Handle students with no marks in ClassReport":

1. Reads the description and the linked issue #12; CI is green.
2. `gh pr checkout 14`, runs `mvn -B verify` and tries a class with an empty student.
3. Comments on `ClassReport.java` line 18: suggests `student.marks().length == 0` instead of catching the exception (with a suggestion block).
4. Submits **Request changes** with a summary.
5. Priya applies the suggestion, adds a test, pushes, re-requests review.
6. Arjun checks the new commits, resolves the conversation and **Approves**.

## Common Mistakes

- **Approving without reading** ("LGTM") to be fast.
- **Nitpicking formatting by hand** — automate it with a formatter and CI.
- **Force-pushing rewritten commits mid-review** without saying so — reviewers lose track of what changed.
- **Leaving comments unanswered** and re-requesting review anyway.

## Interview Angle

"How do you review code?" — description and CI first, then diff with a checklist (correctness, tests, design, errors, security, scope), check out locally for big changes, specific and kind comments with reasons, clear verdict. "How do you handle disagreement in review?" — explain the reasoning, move long debates to a conversation, follow team conventions, escalate rarely.

## Recap

- Review = line comments + a verdict (Comment, Approve, Request changes).
- Read description and CI first; use a checklist; check out large PRs locally.
- Comments should be specific, explain why, and mark optional points.
- Authors reply, push follow-up commits, and re-request review.

## Related Topics

- [Pull Requests](../pull-requests-fundamentals/content.md)
- [Merging Pull Requests](../merging-pull-requests/content.md)
- [Reviewing Java Pull Requests](../../java-project-workflow/java-pull-request-review/content.md)
- [Lab 10 — Review a Teammate's Diff](../../labs/git-lab-10-review-teammate-diff/content.md)
