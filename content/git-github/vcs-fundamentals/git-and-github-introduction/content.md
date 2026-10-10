# Git and GitHub: What They Are

**Module:** Version Control Fundamentals · **Interview priority:** Core

## Learning Objectives

- Define Git and GitHub precisely and explain why they are not the same thing.
- Place GitLab and Bitbucket in the same picture.
- Describe Git's role in a software team's daily work.

## What Is It?

**Git** is a free, open-source, **distributed version control system**. It is a program you install and run on your own computer (`git commit`, `git log`, `git merge`). It was created by Linus Torvalds in 2005 to manage the Linux kernel's source code.

**GitHub** is a **hosting and collaboration platform** for Git repositories, run as a web service (owned by Microsoft since 2018). It stores copies of repositories on its servers and adds features Git itself doesn't have: pull requests and code review, issues, permissions, branch protection, releases, GitHub Actions (CI/CD) and a web interface.

## Why It Matters

Mixing the two up leads to real mistakes: thinking a commit is "on GitHub" when it is only local, believing you need an account to use Git, or expecting `git` commands to create pull requests. Interviewers ask "Git vs GitHub" precisely to check this mental model.

## How It Works

```text
 your computer                                   github.com
┌─────────────────────────────┐               ┌──────────────────────────────┐
│ Git (the tool)              │   git push    │ Hosted Git repository        │
│  working files              │ ────────────► │  + pull requests, reviews    │
│  .git/ (full history)       │ ◄──────────── │  + issues, permissions       │
│  commit, branch, merge, log │   git fetch   │  + releases, Actions (CI/CD) │
└─────────────────────────────┘               └──────────────────────────────┘
   works with no account and                     a platform built around Git
   no network                                    repositories
```

Git talks to GitHub through ordinary Git network operations (`clone`, `fetch`, `pull`, `push`) over HTTPS or SSH. Everything else on GitHub — pull requests, issues, reviews — lives on the platform, not inside the Git history.

## Git vs GitHub

| Aspect | Git | GitHub |
|--------|-----|--------|
| What it is | Version control software | Web platform hosting Git repositories |
| Where it runs | Your machine | GitHub's servers (accessed by browser, Git, the `gh` CLI, an API) |
| Needs an account or network | No | Yes |
| Core features | Commits, branches, merges, history, diffs | Remote hosting, pull requests, reviews, issues, permissions, Actions |
| Alternatives | Mercurial, SVN (other VCSs) | GitLab, Bitbucket, Azure Repos, self-hosted Gitea |
| Pull requests | Not a Git concept | A GitHub feature |

> [!TIP]
> One-line interview answer: **"Git is the version control tool; GitHub is a service that hosts Git repositories and adds collaboration features such as pull requests."**

## GitLab and Bitbucket

GitLab and Bitbucket host the same kind of Git repositories — your local `git` commands are identical whichever host you use. They differ in the platform around Git:

| Platform | Known for | Review unit |
|----------|-----------|-------------|
| GitHub | Largest open-source community, GitHub Actions | Pull request |
| GitLab | One application for the whole lifecycle with built-in CI/CD; can be self-hosted | Merge request |
| Bitbucket | Atlassian product, integrates with Jira | Pull request |

Because they all speak Git, moving a repository between them means pushing the same history to a new remote; issues, reviews and CI configuration are platform data that need separate migration.

## Git's Role in a Software Team

A typical Java team's day touches Git at every step:

1. Pull the latest `main` and create a **branch** for a task.
2. Make small **commits** while implementing and testing.
3. **Push** the branch and open a **pull request** on GitHub.
4. Teammates **review** the diff; CI runs the build and tests on the pushed commit.
5. The pull request is **merged** into `main`; a release is **tagged**.
6. When a bug appears, `git log`, `git blame` and `git bisect` locate the change; `git revert` undoes it.

Git provides the history and the merging; GitHub provides the shared place, the review process and the automation hooks around it.

## Commands

### git (the program)

**Purpose:** every Git operation is a subcommand: `git <command> [options]`.

```bash
git status
git log --oneline
git help commit
```

### gh (GitHub's CLI)

**Purpose:** GitHub-specific actions (pull requests, issues, releases) from the terminal. It is a separate tool from Git.

```bash
# Illustrative — requires the GitHub CLI and a signed-in account
gh pr create --title "Add letter grades" --body "Adds letterGrade() and tests."
```

## Common Mistakes

- **"I pushed to Git."** You push *with* Git *to* a remote, such as GitHub.
- **"I need GitHub to use version control."** Git works fully offline with no account.
- **"Pull requests are part of Git."** They are a hosting-platform feature; Git has `git request-pull`, an old email-based helper that most people never use.
- **"Deleting the GitHub repository deletes my history."** Every clone still holds the full history.

## Interview Angle

Answer "Git vs GitHub" in two sentences, then add one example of each: Git — commit, branch, merge locally; GitHub — pull requests, reviews, issues, Actions. Mention that GitLab and Bitbucket are alternatives to GitHub, not to Git.

## Recap

- Git is a distributed version control tool that runs locally.
- GitHub hosts Git repositories and adds collaboration and automation.
- GitLab and Bitbucket are GitHub alternatives; your `git` commands don't change.
- In a team, Git holds the history; the platform holds reviews, issues and CI.

## Related Topics

- [Centralized vs Distributed Version Control](../centralized-vs-distributed-vcs/content.md)
- [Installing Git and Getting Help](../installing-git/content.md)
- [Creating a GitHub Repository](../../github-fundamentals/creating-github-repositories/content.md)
- DevOps: [CI with GitHub Actions](../../../devops/ci-cd/ci-with-github-actions/content.md)
