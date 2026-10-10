# Contributing to Open Source: Forks, Upstream and Sync

**Module:** Pull Requests and Code Review · **Interview priority:** Frequently asked

> [!NOTE]
> The Git commands below were run in the practice lab with local bare repositories standing in for the original project and your fork. GitHub's **Fork** and **Sync fork** buttons were not exercised (**Partly tested**).

## Learning Objectives

- Set up a fork with `origin` and `upstream` remotes.
- Keep your fork synchronised with the original project.
- Prepare a contribution the maintainers are likely to accept.

## What Is It?

Contributing to a project you can't push to follows the **fork workflow**:

```text
your-org/gradebook (upstream) ── Fork ──► your-username/gradebook (origin) ── clone ──► laptop
        ▲                                            ▲                                   │
        └──────────── pull request ◄──── push branch ┘◄──────────────────────────────────┘
```

- **`upstream`** — the original project. You fetch from it.
- **`origin`** — your fork. You push branches to it and open pull requests from it to `upstream`.

## Why It Matters

Open-source contributions are visible proof of real collaboration skills for placements and internships — and the workflow is the same at companies that use forks internally. Most first contributions fail on process (stale fork, unrelated changes, no tests, ignored guidelines), not on code.

## How It Works

### Set up remotes

```bash
git clone https://github.com/your-username/gradebook.git      # your fork
cd gradebook
git remote add upstream https://github.com/your-org/gradebook.git
git remote -v
```

In the lab (paths instead of URLs):

**Output:**

```text
origin	/home/student/git-lab/fork.git (fetch)
origin	/home/student/git-lab/fork.git (push)
upstream	/home/student/git-lab/upstream.git (fetch)
upstream	/home/student/git-lab/upstream.git (push)
```

### Keep your fork synchronised

The maintainers merged a commit upstream after you forked:

```bash
git fetch upstream
git log --oneline main..upstream/main
```

**Output:**

```text
From /home/student/git-lab/upstream
 * [new branch]      main       -> upstream/main
1b6684a Clarify build requirements
```

Bring your `main` up to date and update your fork:

```bash
git switch main
git merge --ff-only upstream/main
git push origin main
```

**Output:**

```text
Updating a62ef5f..1b6684a
Fast-forward
 README.md | 1 +
 1 file changed, 1 insertion(+)
To /home/student/git-lab/fork.git
   a62ef5f..1b6684a  main -> main
```

`--ff-only` keeps your fork's `main` an exact mirror of upstream — never commit to your fork's `main`; work on branches. GitHub's **Sync fork** button (or `gh repo sync`) does the same on the server.

### Branch for each contribution

```bash
git switch -c fix/readme-typo upstream/main
```

**Output:**

```text
branch 'fix/readme-typo' set up to track 'upstream/main'.
Switched to a new branch 'fix/readme-typo'
```

> [!WARNING]
> Starting from `upstream/main` sets the branch's upstream to **`upstream/main`** — the original project. A plain `git push` then refuses (captured in the lab):
>
> `fatal: The upstream branch of your current branch does not match the name of your current branch.`
>
> and its hints suggest `git push upstream HEAD:main` — exactly what you **don't** want (it targets the original project's `main`). Push the first time with `git push -u origin fix/readme-typo` to track your fork instead, or create the branch with `--no-track`.

Then commit, push to your fork, and open the pull request on GitHub from `your-username:fix/readme-typo` to `your-org:main`. While it's under review, update it with `git fetch upstream && git rebase upstream/main` and `git push --force-with-lease` if the maintainers ask.

## Contributing Well

1. **Read `CONTRIBUTING.md`, the code of conduct and the license** before writing code.
2. **Find or open an issue first** for anything non-trivial; ask before starting big changes. `good first issue` labels mark starter tasks.
3. **One change per PR**, following the project's style, commit conventions and branch naming.
4. **Include tests** and run the project's build (`mvn -B verify`) and linters locally.
5. **Write a clear PR description** linking the issue (`Fixes #42`).
6. **Respond to reviews** promptly and politely; maintainers are often volunteers.
7. **Allow edits from maintainers** (a checkbox on fork PRs) so small fixes don't need a round-trip.
8. **Some projects require a CLA or DCO sign-off** (`git commit -s`).

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git remote add upstream <url>` | Track the original project | Local configuration |
| `git fetch upstream` | Download upstream changes | Safe anywhere |
| `git merge --ff-only upstream/main` | Sync your `main` | Changes local state |
| `git push origin main` | Sync your fork on GitHub | **Changes the remote** (your fork) |
| `gh repo fork --clone`, `gh repo sync` | GitHub CLI shortcuts | Creates / updates your fork |

## Step-by-Step Example

1. Fork `your-org/gradebook`; clone your fork; add `upstream`.
2. Pick issue #42 ("README build command is wrong"), comment that you're working on it.
3. `git fetch upstream && git switch -c fix/42-readme-build upstream/main`.
4. Fix, commit "Fix Maven command in README build section".
5. `git push -u origin fix/42-readme-build`; open the PR with `Fixes #42`.
6. Maintainer asks to rebase: `git fetch upstream && git rebase upstream/main && git push --force-with-lease`.
7. Merged — delete the branch; sync your fork's `main`.

## Common Mistakes

- **Working on your fork's `main`** — it diverges from upstream and every later PR includes old commits.
- **Never syncing the fork** — PRs based on months-old code conflict.
- **Pushing to `upstream`** by accident (see the warning above).
- **Huge first PRs** that reformat files or change unrelated code.
- **Ignoring CI failures** or the PR template.

## Interview Angle

"How do you contribute to an open-source project?" — fork, clone, add `upstream`, branch from the latest upstream `main`, small tested change following CONTRIBUTING, PR with a clear description and linked issue, respond to review. "How do you keep a fork updated?" — fetch upstream, fast-forward `main`, push to origin (or Sync fork).

## Recap

- `origin` = your fork (push), `upstream` = original (fetch).
- Sync: `git fetch upstream`, `git merge --ff-only upstream/main`, `git push origin main`.
- Branch per contribution; first push with `-u origin` so the branch tracks your fork.
- Follow CONTRIBUTING, keep PRs small and tested, link issues.

## Related Topics

- [Forks vs Clones, Permissions and Security](../../github-fundamentals/forks-permissions-and-security/content.md)
- [Pull Requests](../pull-requests-fundamentals/content.md)
- [Collaboration Workflows](../../team-workflows/git-collaboration-workflows/content.md)
