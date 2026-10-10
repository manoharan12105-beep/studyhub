# What Is Version Control?

**Module:** Version Control Fundamentals · **Interview priority:** Core

## Learning Objectives

- Explain what a version control system (VCS) records and why.
- List the concrete problems version control solves for one developer and for a team.
- Compare manual backups (`report-final-v2.docx`) with a real version control system.

## What Is It?

A **version control system** records changes to a set of files over time, so you can see who changed what, when and why, return to any earlier state, and combine work done by several people in parallel.

Each saved state is a **version** (in Git, a **commit**). A version is not just "the files as they were"; it also carries **metadata**: the author, a timestamp, a message explaining the change, and a link to the version it came from. The collection of all versions is the **history**, and the place that stores it is the **repository**.

## Why It Matters

Software changes constantly, and most bugs are introduced by a change. Without a record of changes you cannot answer the three questions every debugging session starts with:

1. **What changed?** — the exact lines that differ between "working" and "broken".
2. **When and by whom?** — so you can ask the right person and find related changes.
3. **Why?** — the intent, recorded in a message at the time, not reconstructed from memory.

Version control is also the foundation that code review, continuous integration and deployment are built on: every pull request, CI run and release points at a specific version.

## How It Works

Every VCS follows the same cycle:

```text
 edit files ──► choose what belongs together ──► save a version with a message
     ▲                                                     │
     └──────────── continue working on top of it ◄─────────┘

 history:  v1 ◄── v2 ◄── v3 ◄── v4        (each version points back to its parent)
```

- You **edit** files normally with any editor or IDE.
- You **record** a version when the change is meaningful — "add letter grades", not "Tuesday's work".
- The VCS stores the version and links it to the previous one, forming a history you can **inspect**, **compare** and **restore**.

## Problems Version Control Solves

| Problem without version control | How a VCS solves it |
|---------------------------------|---------------------|
| "It worked yesterday" — but nobody knows what changed | Compare any two versions line by line |
| A change breaks the build and must be undone quickly | Restore or reverse one specific version |
| Two people edit the same file and one overwrites the other | Each change is recorded separately and combined (merged) explicitly |
| You want to try an idea without risking working code | Work on a separate line of development (a branch) and discard it if it fails |
| You need the exact code released last month | Every release is tied to a recorded version (often tagged) |
| Nobody remembers why a strange line exists | The commit message and history explain it |

## Manual Backups Versus Version Control

Many students start with manual copies:

```text
gradebook/
gradebook-backup/
gradebook-final/
gradebook-final-v2/
gradebook-final-v2-WORKING/
```

This fails in predictable ways:

| Aspect | Manual copies | Version control |
|--------|---------------|-----------------|
| What changed between two copies | Unknown without a separate diff tool | `git diff` shows the exact lines |
| Why it changed | Not recorded | Commit message |
| Disk usage | A full copy every time | Each unique file content stored once, compressed |
| Combining two people's work | Manual copy-paste; changes get lost | Merge with conflict detection |
| Naming | `final-v2-WORKING` means nothing | Ordered history with authors and dates |
| Restoring one file from last week | Search folders by hand | One command |

> [!IMPORTANT]
> Version control is **not a backup** by itself. A Git repository that exists only on your laptop dies with your laptop. Pushing to a remote (such as GitHub) gives you an off-machine copy — see [Remotes and origin](../../remote-repositories/remotes-and-origin/content.md).

## Step-by-Step Example

The gradebook project goes through four meaningful versions:

```text
version 1  "Create GradeCalculator with average()"
version 2  "Reject an empty list of marks"
version 3  "Add letterGrade()"
version 4  "Raise the B threshold from 70 to 75"      ← a bug report arrives after this
```

A teacher reports that a student averaging 72 now gets a C instead of a B. With version control you:

1. Compare version 3 and version 4 and see the single changed line (`70` → `75`).
2. Read the message of version 4 and ask its author whether the change was intended.
3. Undo just that change if it was a mistake — without losing versions 1–3 or any later work.

With manual copies you would first have to work out which folder holds which state.

## Use Cases

- **Solo projects:** an undo history across days and weeks, and safe experiments.
- **Team projects:** parallel work, review before changes are accepted, one shared history.
- **Releases:** knowing exactly which code is running in production.
- **Non-code text:** documentation, configuration and infrastructure files. StudyHub's own lessons are stored in Git.

## Common Mistakes

- **Treating a commit as a save button.** Record a version when a change is meaningful and complete, with a message that explains why.
- **Assuming local history is a backup.** Push to a remote you control.
- **Versioning generated files** (compiled `.class` files, `target/`, logs). They are rebuilt from source and only create noise — see [.gitignore and Tracking](../../configuration-and-repositories/gitignore-and-tracking/content.md).

## Interview Angle

"What is version control and why use it?" checks that you understand the **purpose**, not just commands. A strong answer names three things: history (what, who, when, why), safe recovery, and parallel collaboration with explicit merging.

## Recap

- A VCS records versions of files with author, time, message and parent.
- It answers what changed, who changed it, when and why.
- Manual copies lose the "why", waste space and make combining work error-prone.
- Version control is not a backup until the history also lives somewhere else.

## Related Topics

- [Centralized vs Distributed Version Control](../centralized-vs-distributed-vcs/content.md)
- [Git and GitHub: What They Are](../git-and-github-introduction/content.md)
