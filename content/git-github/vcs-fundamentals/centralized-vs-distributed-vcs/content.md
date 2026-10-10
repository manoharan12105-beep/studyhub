# Centralized vs Distributed Version Control

**Module:** Version Control Fundamentals · **Interview priority:** Frequently asked

## Learning Objectives

- Describe where history lives in a centralized and in a distributed system.
- Explain what you can and cannot do offline in each model.
- Compare Git with Subversion (SVN) the way interviewers expect.

## What Is It?

Version control systems come in two architectures:

- **Centralized (CVCS)** — one server holds the only complete history. Developers have a **working copy** of the files (usually one version) and talk to the server for almost everything: commit, view history, compare versions. Examples: **Subversion (SVN)**, CVS, Perforce Helix Core.
- **Distributed (DVCS)** — every developer has a **full copy of the repository**, including its entire history. Commits are made locally and exchanged between repositories. Examples: **Git**, Mercurial.

## Why It Matters

The architecture decides how you work every day: whether you can commit on a train, how expensive branching is, what happens when the server is down, and how a team shares work. Git's popularity comes largely from the distributed model.

## How It Works

```text
Centralized (SVN)                          Distributed (Git)

        ┌──────────────┐                        ┌──────────────┐
        │ central repo │ ◄─ full history         │ GitHub repo  │ ◄─ full history
        └──────┬───────┘                        └──────┬───────┘
     commit ▲  │ update                     push ▲     │ fetch / pull
            │  ▼                                 │     ▼
   ┌────────┴──────┐ ┌──────────────┐    ┌───────┴──────┐ ┌──────────────┐
   │ working copy  │ │ working copy │    │ full clone   │ │ full clone   │
   │ (files only)  │ │ (files only) │    │ files + full │ │ files + full │
   └───────────────┘ └──────────────┘    │ history      │ │ history      │
                                         └──────────────┘ └──────────────┘
```

In the centralized model, `svn commit` sends your change straight to the server — it either goes into the shared history or fails. In Git, `git commit` only writes to **your** repository; sharing is a separate, deliberate step (`git push`).

## Working Offline

| Task | Centralized (SVN) | Distributed (Git) |
|------|-------------------|-------------------|
| Edit files | Yes | Yes |
| Commit | No — needs the server | Yes — local |
| View full history / blame | No (needs the server) | Yes |
| Compare with an old version | Needs the server for most versions | Yes |
| Create and switch branches | Server operation | Yes — local and instant |
| Share work with the team | Commit (server) | Push / pull (network) |

## Failure Modes

- **Central server lost (CVCS):** nobody can commit or see history; if the server's storage is lost without backups, history is gone.
- **Hosting service down (DVCS):** everyone keeps working and committing locally; every clone holds the full history up to its last fetch, so the history can be restored from any up-to-date clone.
- **DVCS trade-off:** because commits are local, work can sit unpushed on one laptop. "Commit" and "share" are separate steps you must both take.

## Comparison

| Aspect | Centralized (SVN) | Distributed (Git) |
|--------|-------------------|-------------------|
| Complete history | On the server only | In every clone |
| Commit | Network operation, immediately shared | Local, shared later by push |
| Speed of log, diff, branch | Network-bound | Local disk |
| Branching | Server-side copy of a directory | A movable pointer; creating one is instant |
| Access control | Fine-grained per path on the server | Per repository (hosting platforms add branch rules) |
| Very large binary files, file locking | Strong (partial checkouts, locks) | Needs extras (Git LFS, sparse checkout) |
| Single point of failure | The server | None for history; the shared remote for coordination |

> [!NOTE]
> "Distributed" does not mean "no server". Teams using Git still agree on one shared repository — usually on GitHub, GitLab or Bitbucket — as the **source of truth**. The difference is that every developer has a complete copy and can work without it.

## Step-by-Step Example

Priya is on a flight with no network and fixes a bug in gradebook.

- **With SVN:** she can edit the files but cannot commit. When she lands she makes one large commit containing several unrelated changes, because she couldn't record them separately.
- **With Git:** she makes three small commits during the flight (`git commit` is local), checks `git log` and `git diff` offline, and after landing runs `git push` to share all three.

## Common Mistakes

- **"Distributed means there is no central repository."** Teams still use a shared remote by convention.
- **"Committing in Git shares my work."** It doesn't; `git push` does.
- **"Git is always better."** For huge binary assets (game art, video) or strict per-folder permissions, centralized systems can be a better fit.

## Interview Angle

Expect "Git vs SVN" or "What does distributed mean?". Answer with *where the history lives*, then the consequences: offline commits, fast local operations, cheap branching, no single point of failure for history — and the trade-off that local commits must be pushed to be shared.

## Recap

- Centralized: one server holds the history; most operations need the network.
- Distributed: every clone holds the full history; commit locally, share with push/pull.
- Git still uses a shared remote as the team's source of truth.
- Centralized systems remain strong for huge binaries and path-level permissions.

## Related Topics

- [What Is Version Control?](../what-is-version-control/content.md)
- [Git and GitHub: What They Are](../git-and-github-introduction/content.md)
- [Collaboration Workflows](../../team-workflows/git-collaboration-workflows/content.md)
