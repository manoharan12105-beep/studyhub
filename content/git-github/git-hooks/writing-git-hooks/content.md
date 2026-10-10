# Writing Git Hooks: pre-commit, commit-msg and pre-push

**Module:** Git Hooks and Automation Basics · **Interview priority:** Awareness

> [!NOTE]
> All three hooks below were run in the practice lab (Git 2.52, Git Bash): every blocked and allowed case shown is captured output.

## Learning Objectives

- Write a `pre-commit` hook that checks only the lines being committed.
- Enforce commit-message rules with `commit-msg`, and block pushes to `main` with `pre-push`.
- Connect hooks to formatting, linting and secret scanning — and to CI, where enforcement belongs.

## What Is It?

Three small, practical hooks for gradebook, kept in the versioned `.githooks/` folder and activated with `git config core.hooksPath .githooks` ([Git Hooks Fundamentals](../git-hooks-fundamentals/content.md)):

| Hook | Blocks |
|------|--------|
| `pre-commit` | Added `System.out.println("DEBUG…")` lines and likely hard-coded secrets in staged Java/properties/YAML files |
| `commit-msg` | Empty subjects, subjects longer than 72 characters, subjects ending with a period |
| `pre-push` | Direct pushes to `main` |

## Why It Matters

Each of these mistakes is cheap to catch before a commit and expensive after a push (a secret leak, a noisy history, an unreviewed change on `main`). Hooks give that feedback in under a second.

## How It Works

Hooks are shell scripts: they read what Git gives them, print a reason to standard error, and `exit 1` to block or `exit 0` to allow.

### pre-commit: check only what's being committed

`.githooks/pre-commit`:

```bash
#!/bin/sh
# Block commits that add debug output or likely secrets to staged Java/properties files.
# Fast, local feedback only — the server and CI must enforce the real rules.

staged=$(git diff --cached --name-only --diff-filter=ACM -- '*.java' '*.properties' '*.yml')
[ -z "$staged" ] && exit 0

status=0
for file in $staged; do
    # Look only at lines being added in this commit.
    added=$(git diff --cached -U0 -- "$file" | grep '^+[^+]')
    if echo "$added" | grep -q 'System\.out\.println("DEBUG'; then
        echo "pre-commit: debug println added in $file" >&2
        status=1
    fi
    if echo "$added" | grep -Eiq '(password|secret|api[_-]?key)[[:space:]]*[=:][[:space:]]*[^$[:space:]]'; then
        echo "pre-commit: possible hard-coded secret in $file" >&2
        status=1
    fi
done
[ $status -ne 0 ] && echo "pre-commit: commit blocked (fix it, or see the team's policy before using --no-verify)" >&2
exit $status
```

Key points:

- `git diff --cached` checks the **staged** content — what will actually be committed — not the working copy.
- `--diff-filter=ACM` (added, copied, modified) skips deleted files.
- `-U0` and `^+[^+]` select only **added lines**, so existing code doesn't trigger the hook.
- The secret pattern allows `${DB_PASSWORD}` placeholders (a `$` right after `=`).
- Messages go to standard error with the hook's name, so the developer knows what blocked them.

Captured runs:

**Output (committing a `DEBUG` println in `App.java`):**

```text
pre-commit: debug println added in src/main/java/com/example/gradebook/App.java
pre-commit: commit blocked (fix it, or see the team's policy before using --no-verify)
```

**Output (committing `spring.datasource.password=change-me-not-a-real-password`):**

```text
pre-commit: possible hard-coded secret in src/main/resources/application.properties
pre-commit: commit blocked (fix it, or see the team's policy before using --no-verify)
```

Changing the line to `spring.datasource.password=${DB_PASSWORD}` committed successfully (exit 0).

> [!WARNING]
> A regex like this is a **safety net with holes**: it misses secrets in other formats and may flag harmless lines. Real secret scanning uses dedicated tools with known token formats, and GitHub **push protection** rejects known credential formats on the server ([Secrets in Git History](../../authentication-and-security/secrets-in-git-history/content.md)).

### commit-msg: message rules

`.githooks/commit-msg` (Git passes the message file path as `$1`):

```bash
#!/bin/sh
# Enforce: subject line present, at most 72 characters, not ending with a period.
subject=$(head -n 1 "$1")
if [ -z "$subject" ]; then
    echo "commit-msg: empty subject line" >&2
    exit 1
fi
if [ ${#subject} -gt 72 ]; then
    echo "commit-msg: subject is ${#subject} characters; keep it to 72 or fewer" >&2
    exit 1
fi
case "$subject" in
    *.) echo "commit-msg: subject should not end with a period" >&2; exit 1 ;;
esac
exit 0
```

**Output (two rejected attempts):**

```text
commit-msg: subject is 90 characters; keep it to 72 or fewer
commit-msg: subject should not end with a period
```

`git commit -m "Describe the grading scale in README"` then succeeded.

### pre-push: protect main

`pre-push` receives one line per ref on standard input: `<local ref> <local sha> <remote ref> <remote sha>`.

```bash
#!/bin/sh
# Refuse direct pushes to main; everything goes through a pull request.
# stdin: <local ref> <local sha> <remote ref> <remote sha>
while read local_ref local_sha remote_ref remote_sha; do
    if [ "$remote_ref" = "refs/heads/main" ]; then
        echo "pre-push: direct pushes to main are not allowed; push a branch and open a PR" >&2
        exit 1
    fi
done
exit 0
```

**Output (`git push origin main`):**

```text
pre-push: direct pushes to main are not allowed; push a branch and open a PR
error: failed to push some refs to '/home/student/git-lab/remotes/gradebook.git'
```

Pushing a feature branch worked normally (`* [new branch] docs/readme -> docs/readme`).

### Bypass — and why that's acceptable

```bash
git commit --no-verify -m "Print the average"
```

The debug commit went through (exit 0). That's by design: hooks are a convenience for honest mistakes, not a security boundary. The **server** must enforce the rule: a CI job that runs the same checks on every pull request, plus branch protection requiring that job — see DevOps: [CI with GitHub Actions](../../../devops/ci-cd/ci-with-github-actions/content.md).

## Formatting and Linting Integration

Common Java-project uses of `pre-commit`, kept **fast**:

- Check formatting of staged files with the project's formatter (for example a Maven formatter plugin's *check* goal, or Spotless) and fail with the command that fixes it.
- Reject files with conflict markers (`git diff --cached --check` does this for you).
- Run a quick compile of changed modules — not the full test suite (that belongs in `pre-push` or CI).

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git diff --cached --name-only --diff-filter=ACM` | Staged files to check | Safe anywhere |
| `git diff --cached -U0 -- <file>` | Only the changed lines | Safe anywhere |
| `git diff --cached --check` | Whitespace errors and conflict markers | Safe anywhere |
| `git config core.hooksPath .githooks` | Activate the shared hooks | Local configuration |

## Step-by-Step Example

1. Copy the three scripts into `~/git-lab/gradebook/.githooks/`, `chmod +x .githooks/*`.
2. `git config core.hooksPath .githooks`.
3. Try each blocked case above and read the messages.
4. Commit the `.githooks/` folder with a README note on activating it.
5. Add the same checks to CI so they hold even when skipped locally.

## Common Mistakes

- **Checking the working tree instead of the staged content** — the hook passes or fails on the wrong version.
- **Scanning whole files** — every commit fails because of old code.
- **Slow `pre-commit` hooks** — people bypass them.
- **Windows line endings in hook scripts** (`/bin/sh^M: bad interpreter`) — keep hooks LF via `.gitattributes`.
- **Silent failures** — always print why you blocked.

## Interview Angle

"Give an example of a useful Git hook" — a `pre-commit` that blocks debug statements or secrets in staged lines, a `commit-msg` that enforces message conventions, a `pre-push` that runs tests or blocks pushes to `main`; then explain that `--no-verify` exists and that CI/branch protection enforces the same rules.

## Recap

- `pre-commit`: inspect staged added lines (`git diff --cached -U0`); block debug code and likely secrets.
- `commit-msg`: validate the message file passed as `$1`.
- `pre-push`: read refs from stdin; block pushes to protected branches.
- Hooks give fast feedback; `--no-verify` skips them; CI and branch protection enforce.

## Related Topics

- [Git Hooks Fundamentals](../git-hooks-fundamentals/content.md)
- [Secrets in Git History](../../authentication-and-security/secrets-in-git-history/content.md)
- [Commit Messages and Atomic Commits](../../basic-workflow/commit-messages-and-atomic-commits/content.md)
