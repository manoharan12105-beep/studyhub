# GitHub Issues and Discussions

**Module:** GitHub Fundamentals · **Interview priority:** Awareness

> [!NOTE]
> Describes github.com as of 2026 (**Instruction only**). Closing issues from commit messages and PR descriptions is long-standing documented GitHub behaviour.

## Learning Objectives

- Write an issue that someone else can act on: a reproducible bug report or a clear task.
- Organise issues with labels, assignees and milestones, and link them to commits and pull requests.
- Know when to use Discussions instead of Issues.

## What Is It?

- **Issues** track units of work: bugs, feature requests and tasks. Each has a number (`#12`), a title, a Markdown description, comments, and metadata such as labels, assignees and milestones.
- **Discussions** are a forum attached to the repository for questions, ideas and announcements — conversations that aren't (yet) actionable work. They are enabled per repository in **Settings → General → Features**.

## Why It Matters

Issues are where work is defined before code is written. A good issue saves hours of back-and-forth; linking it to the pull request that fixes it gives a permanent trail from "problem reported" to "commit that solved it".

## How It Works

```text
issue #12 "Empty marks list crashes the report"
   │  (discussion, labels: bug, assignee: priya)
   ▼
branch fix/12-empty-marks  → commits → pull request "Fixes #12"
   ▼
PR merged into the default branch → issue #12 closed automatically, linked to the PR
```

## Writing a Good Bug Report

```markdown
## What happened
`ClassReport.summary()` throws when a student has no marks.

## Steps to reproduce
1. Create `new Student("Ravi", new int[0])`
2. Call `new ClassReport().summary(List.of(student))`

## Expected
The report lists "Ravi: no marks".

## Actual
`IllegalArgumentException: at least one mark is required`

## Environment
gradebook 1.0.0, JDK 17, Windows 11
```

Title: specific and searchable ("ClassReport.summary throws for a student with no marks"), not "Bug!!". One problem per issue. Never paste passwords, tokens or personal data — issues on public repositories are public.

## Organising Issues

| Feature | Use |
|---------|-----|
| **Labels** | Type and area: `bug`, `enhancement`, `documentation`, `good first issue` (helps newcomers find starter tasks) |
| **Assignees** | Who is working on it |
| **Milestones** | Group issues for a release (`v1.1.0`) with a progress bar |
| **Projects** | Boards and tables across issues and PRs (To do / In progress / Done) |
| **Issue templates** | `.github/ISSUE_TEMPLATE/*.md` or `.yml` forms that prompt reporters for the right information |
| **Search and filters** | `is:open label:bug assignee:@me` |

## Linking Issues and Code

- Mention `#12` anywhere (commit message, PR, another issue) to cross-reference it.
- **Closing keywords** — `close`, `closes`, `closed`, `fix`, `fixes`, `fixed`, `resolve`, `resolves`, `resolved` followed by `#12` — in a **pull request description** link the PR, and close the issue when the PR is merged into the **default branch**. In a **commit message**, the issue closes when that commit lands on the default branch.
- `Fixes your-org/other-repo#5` works across repositories.

## Discussions vs Issues

| Use Discussions for | Use Issues for |
|---------------------|----------------|
| "How do I configure grading scales?" | "Grading scale config ignores D grade" (a defect) |
| Proposals still being debated | Agreed work to be done |
| Announcements, Q&A, show and tell | Tasks with an owner and an end |

A discussion can be converted into an issue once it becomes actionable.

## Commands

```bash
# Illustrative — requires the GitHub CLI and `gh auth login`
gh issue create --title "ClassReport.summary throws for a student with no marks" --label bug
gh issue list --label bug --state open
gh issue view 12
```

## Step-by-Step Example

1. Search existing issues first (open and closed) to avoid duplicates.
2. Create issue #12 with the bug-report structure above; label `bug`.
3. Assign yourself, create `fix/12-empty-marks`, and commit the fix with its test.
4. Open a PR whose description says `Fixes #12`.
5. After the merge into `main`, #12 shows as closed by that PR.

## Common Mistakes

- **Vague titles and "doesn't work" descriptions** without steps, expected and actual results.
- **Several unrelated problems in one issue** — impossible to close cleanly.
- **Closing keywords in PRs that target a non-default branch** — the issue stays open until the change reaches the default branch.
- **Posting secrets or logs with personal data** in public issues.

## Interview Angle

Shows up as "how does your team track work?" or in open-source questions: issues with labels, a template, assignees and milestones; PRs linked with `Fixes #N`; discussions for open questions.

## Recap

- Issues track actionable work; Discussions host conversations.
- Good bug reports: steps, expected, actual, environment.
- Labels, assignees, milestones, projects and templates keep issues organised.
- `Fixes #N` in a PR (or commit) closes the issue when merged into the default branch.

## Related Topics

- [Commit Messages and Atomic Commits](../../basic-workflow/commit-messages-and-atomic-commits/content.md)
- [Pull Requests](../../pull-requests-and-review/pull-requests-fundamentals/content.md)
- [Contributing to Open Source](../../pull-requests-and-review/open-source-contribution/content.md)
