# Collaboration Workflows: Centralized, Feature-Branch and Forking

**Module:** Team Collaboration Workflows · **Interview priority:** Frequently asked

## Learning Objectives

- Describe the centralized, feature-branch and forking workflows and who uses each.
- Compare them on review, access control and integration risk.
- Pick a reasonable workflow for a given team — without claiming one is always best.

## What Is It?

A **Git workflow** is a team agreement about where people commit, how changes are reviewed and how they reach the main line. Git doesn't enforce one; the team (and the hosting platform's settings) do.

| Workflow | Everyone commits to | Integration | Typical team |
|----------|--------------------|-------------|--------------|
| **Centralized** | `main` directly | `git pull --rebase` + `git push` | Very small team, early prototype, solo |
| **Feature-branch** | Short branches in the shared repository | Pull requests into `main` | Most company and student teams |
| **Forking** | Branches in personal forks | Pull requests from forks into the original | Open source; organisations restricting write access |

Branching *models* such as Gitflow and trunk-based development build on these — see [Gitflow and Trunk-Based Development](../gitflow-and-trunk-based/content.md).

## Why It Matters

Without an agreed workflow, teams get surprise force pushes, unreviewed code on `main`, and branches nobody merges. Interviewers ask "what Git workflow did your team use and why?" to see whether you understand trade-offs, not just commands.

## How It Works

### Centralized workflow

```text
Priya ─┐                 ┌─ git pull --rebase ; git push
Arjun ─┼─► origin/main ◄─┤
Meera ─┘                 └─ everyone on main
```

Everyone works on `main`, rebases onto the latest remote `main` before pushing, and resolves conflicts locally. Simple, linear history — but **no review before code lands**, and one broken push breaks everybody.

### Feature-branch workflow

```text
main ──●────────●──────────●────►       (protected: PRs only)
        \      /  \       /
         ●──●─●    ●──●──●
   feature/report   fix/12-npe
```

Every change gets a branch and a pull request; `main` is protected and receives only reviewed, CI-green changes. The team shares one repository, so everyone needs write access to push branches.

### Forking workflow

```text
upstream repo (maintainers push) ◄── PRs ── each contributor's fork ◄── their laptop
```

Contributors never need write access to the main repository; maintainers review every PR. More setup per person (two remotes, syncing forks), but the safest model for untrusted contributors. Details: [Contributing to Open Source](../../pull-requests-and-review/open-source-contribution/content.md).

## Comparison

| | Centralized | Feature-branch | Forking |
|-|-------------|----------------|---------|
| Review before `main` | No (unless pair-programming) | Yes, PRs | Yes, PRs |
| Write access needed | Everyone, to `main` | Everyone, to branches | Only maintainers |
| CI before merge | Only after push | On every PR | On every PR |
| Setup cost | Lowest | Low | Higher |
| Risk to `main` | High | Low with protection | Low |
| History | Linear | Depends on merge method | Depends on merge method |

## Choosing

- **Two students, a weekend project:** centralized is fine — agree to `pull --rebase` before pushing.
- **A 4–10 person team building a Spring Boot service:** feature branches + PRs + protected `main` + required CI.
- **Public library with outside contributors:** forking workflow.
- **An enterprise with strict access rules:** forks internally, or feature branches with tight branch protection and code owners.

Teams often mix: maintainers use feature branches in the main repository while external contributors use forks.

## Commands

The workflows use commands you already know:

| Step | Centralized | Feature-branch / forking |
|------|-------------|--------------------------|
| Start | `git pull --rebase` | `git switch -c feature/x origin/main` (fork: `upstream/main`) |
| Share | `git push` to `main` | `git push -u origin feature/x`, open a PR |
| Integrate | — | Merge the PR (merge, squash or rebase) |

## Step-by-Step Example

A 5-person capstone team chooses feature-branch workflow:

1. Protect `main`: PRs required, 1 approval, Maven CI must pass, no force pushes.
2. Branch names: `feature/…`, `fix/…`, with the issue number.
3. Each task: issue → branch → PR with `Fixes #N` → review → squash merge → delete branch.
4. Everyone starts the day with `git switch main && git pull`.

## Common Mistakes

- **Adopting a heavyweight model for a tiny team** — process without benefit.
- **Feature branches with no review or CI** — all the overhead, none of the safety.
- **Calling one workflow "the best".** It depends on team size, trust, release cadence and tooling.
- **Unprotected `main`** in a feature-branch workflow — someone eventually pushes directly.

## Interview Angle

Describe the workflow you used, why it fitted (team size, review needs, access), and its trade-offs. Mention protected `main`, PRs, CI checks and how you kept branches short-lived.

## Recap

- Centralized: everyone on `main` — simple, no review.
- Feature-branch: branches + PRs into protected `main` — the common default.
- Forking: contributors' forks + PRs — no write access needed.
- Choose by team size, trust and process needs; mixes are common.

## Related Topics

- [Gitflow and Trunk-Based Development](../gitflow-and-trunk-based/content.md)
- [Branch Protection and Code Ownership](../branch-protection-and-code-ownership/content.md)
- [Working with Feature Branches](../../branching-and-merging/working-with-feature-branches/content.md)
