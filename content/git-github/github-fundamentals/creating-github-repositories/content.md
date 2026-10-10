# Creating a GitHub Repository and Writing a README

**Module:** GitHub Fundamentals · **Interview priority:** Frequently asked

> [!NOTE]
> GitHub's web interface changes from time to time; menu names below describe it as of 2026. Steps on github.com were not run for this lesson (**Instruction only**); the Git commands were run against the practice lab's stand-in remote.

## Learning Objectives

- Create a GitHub repository with the right owner, name, visibility and initial files.
- Connect an existing local repository to it, or clone it.
- Write a README that lets a stranger understand, build and run the project.

## What Is It?

A **GitHub repository** is a hosted Git repository plus GitHub's features around it: a web view of files and history, issues, pull requests, settings and permissions, releases and Actions. It is created on github.com (or with the `gh` CLI) and then becomes a remote for your local repository.

## Why It Matters

The repository is the team's shared source of truth and, for students, a public portfolio. A clear name, a sensible visibility choice, a `.gitignore` and a good README make the difference between a project people can use and one they close immediately.

## How It Works

### Creating it on github.com

1. Top-right **+** → **New repository**.
2. **Owner:** your account or an organisation. **Repository name:** short, lowercase, hyphenated (`gradebook`).
3. **Description:** one sentence ("Calculates average marks and letter grades for a class").
4. **Visibility:** Public or Private (see below).
5. **Initialise** — only if you are starting fresh: add a README, a `.gitignore` template (choose *Maven* or *Java*), and a license.
6. **Create repository.**

> [!IMPORTANT]
> If you already have a local repository with commits (like gradebook), create the GitHub repository **empty** — no README, `.gitignore` or license. Otherwise GitHub creates its own first commit, your histories are unrelated, and your first push is rejected.

### Connecting an existing local repository

GitHub shows these commands for an empty repository:

```bash
git remote add origin https://github.com/your-username/gradebook.git
git branch -M main
git push -u origin main
```

`git branch -M main` renames the current branch to `main` (forcefully) — harmless if it's already `main`. In the lab the same steps against the stand-in remote produce:

**Output (`git push -u origin main`):**

```text
branch 'main' set up to track 'origin/main'.
To /home/student/git-lab/remotes/gradebook.git
 * [new branch]      main -> main
```

### Or with the GitHub CLI

```bash
# Illustrative — requires the GitHub CLI and `gh auth login`
gh repo create gradebook --public --source=. --remote=origin --push
```

### Starting from GitHub instead

If you initialised the repository on GitHub, clone it: `git clone https://github.com/your-username/gradebook.git`.

## Public vs Private

| | Public | Private |
|-|--------|---------|
| Who can see code and history | Everyone on the internet | You, collaborators you invite, and organisation members with access |
| Who can contribute | Anyone via forks and pull requests; only collaborators can push | Only people with access |
| Good for | Open source, portfolios, learning in public | Coursework you mustn't share, company code, anything with sensitive data |
| Risk | Any secret committed is exposed to the world immediately | Still not a place for secrets |

Organisations on enterprise plans also have **Internal** visibility (visible to the enterprise's members). Visibility can be changed later in **Settings → General → Danger Zone**; making a repository public exposes its entire history, so review it first.

## Writing the README

`README.md` at the repository root is rendered on the repository's home page. A useful README for gradebook:

```markdown
# gradebook

Calculates average marks and letter grades (A/B/C/D/F) for a class.

## Requirements

- JDK 17+
- Maven 3.9+

## Build and test

    mvn -B verify

## Run

    java -cp target/classes com.example.gradebook.App

## Grading scale

A: 90+, B: 75+, C: 60+, D: 50+, F: below 50

## Contributing

Create a branch, open a pull request, and make sure `mvn -B verify` passes.
```

Checklist: what it does (one sentence), requirements, build/test/run commands that actually work, an example, how to contribute, the license. Add a screenshot or sample output for applications. Keep it current — a README with wrong build commands is worse than none.

## Other Repository Files GitHub Recognises

| File | Purpose |
|------|---------|
| `LICENSE` | Terms of use; shown in the sidebar. No license = others may not legally reuse the code |
| `.gitignore` | Ignore rules ([.gitignore and Tracking](../../configuration-and-repositories/gitignore-and-tracking/content.md)) |
| `CONTRIBUTING.md` | How to contribute; linked when people open issues and PRs |
| `CODE_OF_CONDUCT.md` | Community standards |
| `SECURITY.md` | How to report vulnerabilities privately |
| `.github/ISSUE_TEMPLATE/`, `.github/pull_request_template.md` | Templates for issues and PRs |
| `.github/CODEOWNERS` | Automatic review requests ([Code Ownership](../../team-workflows/branch-protection-and-code-ownership/content.md)) |
| `.github/workflows/*.yml` | GitHub Actions — see DevOps: [CI with GitHub Actions](../../../devops/ci-cd/ci-with-github-actions/content.md) |

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git remote add origin <url>` | Connect local to GitHub | Local configuration |
| `git push -u origin main` | First push | **Changes the remote** |
| `gh repo create …` | Create from the terminal | Creates a remote repository |

## Step-by-Step Example

1. Create an empty public repository `gradebook` on GitHub.
2. In `~/git-lab/gradebook`: `git remote add origin https://github.com/your-username/gradebook.git`.
3. `git push -u origin main`.
4. Refresh the page: files, the README and the commit count appear.
5. Add a description and topics (`java`, `maven`) in the repository's **About** panel.

## Common Mistakes

- **Initialising with a README when you already have commits** → the push is rejected `(fetch first)`, and `git pull --no-rebase origin main` stops with `fatal: refusing to merge unrelated histories`. Fix: `git pull --rebase origin main` once (it replays your commits on top of GitHub's initial commit — tested in the lab), or recreate the repository empty.
- **Choosing public for coursework** that must stay private, or for code containing secrets.
- **README that says "TODO"** — or build steps that don't work.
- **No `.gitignore`**, so `target/` and `.idea/` get pushed.

## Interview Angle

"How do you put an existing project on GitHub?" — create an empty repository, `git remote add origin <url>`, `git push -u origin main`. "What goes in a good README?" — purpose, requirements, build/run/test commands, usage, contribution and license.

## Recap

- Create the repository empty when pushing an existing local history.
- Public = visible to everyone (forever, including history); private = invited people.
- `remote add` + `push -u` connects and publishes.
- The README is the project's front door: purpose, setup, build, run, contribute.

## Related Topics

- [Navigating a GitHub Repository](../navigating-github-repositories/content.md)
- [Remotes and origin](../../remote-repositories/remotes-and-origin/content.md)
- [Lab 02 — Add a Remote and Push](../../labs/git-lab-02-push-to-remote/content.md)
