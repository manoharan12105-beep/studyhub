# Git Hooks: Client-Side, Server-Side and Their Limits

**Module:** Git Hooks and Automation Basics · **Interview priority:** Frequently asked

## Learning Objectives

- Explain what Git hooks are, where they live and when they run.
- Distinguish client-side hooks from server-side hooks.
- Explain why local hooks are feedback, not enforcement, and how teams share them.

## What Is It?

A **Git hook** is an executable script that Git runs automatically at a specific point in its workflow. If certain hooks exit with a non-zero status, Git **aborts** the operation.

| Hook | When it runs | Can block? | Typical use |
|------|--------------|-----------|-------------|
| `pre-commit` | Before the commit message is requested | Yes | Lint, format check, block debug code or secrets |
| `prepare-commit-msg` | Before the editor opens | Yes | Pre-fill the message (e.g. issue number from the branch name) |
| `commit-msg` | After the message is written | Yes | Enforce message rules |
| `post-commit` | After the commit | No | Notifications |
| `pre-rebase` | Before a rebase | Yes | Refuse to rebase protected branches |
| `post-checkout`, `post-merge` | After switching / merging | No | Regenerate files, warn about dependency changes |
| `pre-push` | Before sending objects | Yes | Run tests, block pushes to `main` |

Those are **client-side** (they run in your clone). **Server-side** hooks — `pre-receive`, `update`, `post-receive` — run on the server receiving a push; on self-hosted Git servers they can reject pushes for everyone. GitHub doesn't let you install arbitrary server-side hooks; it offers the equivalent through branch protection, rulesets, push protection, required status checks and webhooks/Actions.

## Why It Matters

Hooks catch mistakes at the cheapest moment — before a commit or push leaves your machine. But because they're local and optional, relying on them alone for policy is a classic mistake.

## How It Works

Hooks live in `.git/hooks/` by default. A new repository contains only **samples**:

```bash
ls .git/hooks
```

**Output:**

```text
applypatch-msg.sample
commit-msg.sample
fsmonitor-watchman.sample
post-update.sample
pre-applypatch.sample
pre-commit.sample
pre-merge-commit.sample
pre-push.sample
pre-rebase.sample
pre-receive.sample
prepare-commit-msg.sample
push-to-checkout.sample
sendemail-validate.sample
update.sample
```

A hook is active when a file with the exact hook name (no `.sample`) exists and is executable (`chmod +x`). It can be written in any language with a shebang line; Bash is the most common. Git passes information as arguments (e.g. `commit-msg` gets the path of the message file) or on standard input (`pre-push` gets the refs being pushed).

### Sharing hooks with a team

`.git/hooks` isn't versioned, so hooks don't travel with clones. The usual approach: commit them in a folder such as `.githooks/` and point Git at it:

```bash
git config core.hooksPath .githooks
```

Every developer must run that once per clone. Captured in the lab: a fresh clone contained `.githooks/` but `git config core.hooksPath` printed nothing (exit 1), and a commit adding a `DEBUG` println **succeeded**; after setting `core.hooksPath`, the same commit was blocked. Tools in some ecosystems automate the setup (for example a build step that sets `core.hooksPath`, or a hook manager such as the `pre-commit` framework).

## Limitations

1. **Not distributed automatically** — new clones run no hooks until configured.
2. **Bypassable:** `git commit --no-verify` (or `-n`) skips `pre-commit` and `commit-msg`; `git push --no-verify` skips `pre-push`. Captured: with `--no-verify` the blocked debug commit went through.
3. **Machine-dependent:** a Bash hook may not run in the same way on every OS; slow hooks get disabled by frustrated developers.
4. **Can't see the server's state** — a local hook can't know what branch protection or CI will decide.
5. **Run with your permissions** — a hook script is code; never enable hooks from a repository you don't trust.

> [!IMPORTANT]
> Local hooks are **fast feedback**, not **enforcement**. Anything that must always hold — reviews, passing tests, no force pushes, no secrets — must be enforced on the server: branch protection, required status checks in CI, push protection. See [Branch Protection and Code Ownership](../../team-workflows/branch-protection-and-code-ownership/content.md) and DevOps: [CI with GitHub Actions](../../../devops/ci-cd/ci-with-github-actions/content.md).

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `ls .git/hooks` | See installed and sample hooks | Safe anywhere |
| `git config core.hooksPath .githooks` | Use versioned hooks | Local configuration |
| `chmod +x .githooks/*` | Make hooks executable | Local |
| `git commit --no-verify`, `git push --no-verify` | Skip hooks | Bypasses safety checks — follow team policy |

## Step-by-Step Example

1. `mkdir .githooks` and add a `pre-commit` script ([Writing Git Hooks](../writing-git-hooks/content.md)).
2. `chmod +x .githooks/pre-commit`; commit the folder.
3. Document in README: "After cloning, run `git config core.hooksPath .githooks`."
4. Add the same checks to CI so they're enforced even when someone skips the hook.

## Common Mistakes

- **Forgetting `chmod +x`** — Git silently ignores non-executable hooks (it may print a "hook was ignored because it's not set as executable" hint).
- **Naming it `pre-commit.sh`** — the file name must be exactly the hook name.
- **Slow hooks** (full test suites in `pre-commit`) — developers start using `--no-verify`. Keep `pre-commit` fast; heavier checks go in `pre-push` or CI.
- **Treating hooks as security.**

## Interview Angle

"What are Git hooks?" — scripts Git runs at points like pre-commit, commit-msg, pre-push (client-side) or pre-receive/update (server-side), able to block operations. "Can they enforce policy?" — client-side hooks can be skipped with `--no-verify` and aren't cloned; enforcement belongs on the server (protection rules, CI).

## Recap

- Hooks are executable scripts named after events; some can block operations.
- Client-side hooks run in your clone; server-side hooks run where pushes are received.
- Share hooks via a committed folder + `core.hooksPath` — each clone must opt in.
- `--no-verify` bypasses them; use server-side controls for anything mandatory.

## Related Topics

- [Writing Git Hooks: pre-commit, commit-msg and pre-push](../writing-git-hooks/content.md)
- [Branch Protection and Code Ownership](../../team-workflows/branch-protection-and-code-ownership/content.md)
- Claude Code: [Hooks Fundamentals](../../../claude-code-mastery/hooks/hooks-fundamentals/content.md) (a different kind of hook: Claude Code's own lifecycle events)
