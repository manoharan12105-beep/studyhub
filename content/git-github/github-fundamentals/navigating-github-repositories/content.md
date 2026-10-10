# Navigating a GitHub Repository: Code, History, Branches, Releases and Settings

**Module:** GitHub Fundamentals · **Interview priority:** Awareness

> [!NOTE]
> Describes github.com as of 2026 (**Instruction only** — the web interface was not exercised for this lesson). Exact labels may move; the concepts don't.

## Learning Objectives

- Find files, commit history, branches, tags and releases in GitHub's web interface.
- Know what the main repository settings control.
- Use watching, starring and keyboard shortcuts effectively.

## What Is It?

A repository page on GitHub is a web view of the same Git data you see locally — files at a commit, the commit graph, branches and tags — plus GitHub-only data: issues, pull requests, releases, Actions runs, settings and insights.

## Why It Matters

Most code review, onboarding and investigation happens in the browser. Knowing where GitHub shows history, blame and releases lets you answer "what changed and why?" without cloning — and knowing the settings lets you protect a repository you own.

## How It Works

### The tabs

| Tab | Shows | Git equivalent |
|-----|-------|----------------|
| **Code** | Files at the selected branch or tag, README, latest commit per file, About panel | `git ls-tree`, `git show <ref>:<path>` |
| **Issues** | Bug reports, tasks, discussions of work | — (GitHub only) |
| **Pull requests** | Proposed merges with reviews and checks | — (GitHub only) |
| **Actions** | CI/CD workflow runs | — (DevOps: [CI with GitHub Actions](../../../devops/ci-cd/ci-with-github-actions/content.md)) |
| **Projects**, **Wiki**, **Discussions** | Planning boards, docs, forum (if enabled) | — |
| **Security** | Advisories, Dependabot and secret-scanning alerts | — |
| **Insights** | Contributors, traffic, dependency graph | `git shortlog -sn` (contributors) |
| **Settings** | Repository configuration (admins only) | — |

### Files and history

- The **branch selector** (top-left of the file list) switches the view to any branch or tag.
- **Commits** (clock icon with a count) opens the history of the current branch — like `git log`. Inside a folder or file, **History** filters to that path (`git log -- path`).
- Opening a file offers **Blame** (`git blame`) and **History**; clicking a line number and then **…** lets you copy a **permalink** — a URL with the commit hash, which never changes even when the file does. Press `y` on a file page to turn the URL into a permalink.
- A commit page shows its diff, parents and the pull request it came from.
- **Compare** view: `https://github.com/your-username/gradebook/compare/main...feature/class-report` shows a three-dot diff, like `git diff main...feature/class-report`.

### Branches and tags

- **Branches** page: default, yours, active and stale branches; delete merged branches; restore recently deleted ones.
- **Tags** page: every tag pushed (`git push origin v1.0.0`).
- **Releases**: tags with notes and downloadable assets ([GitHub Releases](../../tags-and-releases/github-releases/content.md)).

### Settings worth knowing (admins)

| Settings area | Controls |
|---------------|----------|
| General | Name, description, **default branch**, features (Issues, Discussions, Wiki, Projects), merge button options (merge commits / squash / rebase), auto-delete head branches, Danger Zone (visibility, transfer, archive, delete) |
| Collaborators / Collaborators and teams | Who has access and with which role |
| Branches / Rules (rulesets) | Branch protection: required reviews, status checks, no force pushes |
| Secrets and variables | Values for Actions; never commit secrets |
| Code security | Dependabot, secret scanning, push protection |
| Webhooks, GitHub Apps, Deploy keys | Integrations that can read or write the repository — review them |
| Pages | Publish a static site from a branch (how StudyHub itself is hosted) |

## Watching and Starring

| Action | Effect |
|--------|--------|
| **Watch** | Choose notifications: Participating and @mentions (default), All Activity, Ignore, or Custom (e.g. releases only) |
| **Star** | Bookmark/appreciation; listed on your profile; affects nothing in the repository |
| **Fork** | Create your own copy under your account — see [Forks, Permissions and Security](../forks-permissions-and-security/content.md) |

Watching "Releases only" on a library you depend on is a quiet way to hear about new versions.

## Keyboard Shortcuts

Press `?` on any GitHub page for the list. Useful: `t` (file finder), `.` (open the repository in the browser-based editor github.dev), `y` (permalink), `/` (search), `g` then `c` / `i` / `p` (go to Code / Issues / Pull requests).

## Step-by-Step Example

Answer "why is the B threshold 78?" entirely on GitHub:

1. **Code** → open `src/main/java/com/example/gradebook/GradeCalculator.java`.
2. **Blame** → line 21 shows the commit "Raise the B threshold to 78".
3. Click it → the commit page links to its pull request.
4. Read the PR description and review comments for the reasoning.
5. Copy a permalink to line 21 to cite it in your issue comment.

## Common Mistakes

- **Sharing a branch link instead of a permalink** — the line moves when the file changes.
- **Watching "All Activity" on busy repositories** and drowning in notifications.
- **Leaving stale deploy keys, webhooks or apps** with write access.
- **Changing the default branch** without telling the team (open PRs and clones still target the old one).

## Interview Angle

Rarely asked directly, but "how would you investigate a change on GitHub?" (blame → commit → PR → discussion) and "what repository settings would you configure for a team?" (default branch, branch protection, merge options, auto-delete branches, security features) show practical experience.

## Recap

- GitHub's Code, Commits, Blame and Compare views mirror `ls-tree`, `log`, `blame` and three-dot `diff`.
- Branches, Tags and Releases pages show refs you pushed.
- Settings control access, default branch, merge options, protection and security.
- Watch for notifications, Star for bookmarks, Fork for your own copy.

## Related Topics

- [Creating a GitHub Repository](../creating-github-repositories/content.md)
- [GitHub Issues and Discussions](../github-issues-and-discussions/content.md)
- [git blame](../../history-and-inspection/git-blame/content.md)
