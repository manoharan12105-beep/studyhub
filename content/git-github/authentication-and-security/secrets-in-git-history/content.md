# Secrets in Git History: Prevention, Response and Remediation

**Module:** GitHub Authentication and Security · **Interview priority:** Core

## Learning Objectives

- Keep secrets out of repositories from the start.
- Explain why deleting a committed secret doesn't remove it, using real history.
- Respond to a leaked secret in the right order: revoke and rotate first, clean history second.

## What Is It?

A **secret** is any value that grants access: passwords, API keys, tokens, private keys, connection strings with credentials. Once committed, a secret is stored in a blob object that every later clone, fork and backup receives — **deleting the file in a new commit only hides it from the current version**.

## Why It Matters

Automated scanners search public repositories for credentials continuously; leaked keys are often abused within minutes. Even in private repositories, a secret in history is readable by everyone with access, today and in the future. The fix that actually protects you is **revoking and rotating** the credential — history clean-up alone never is.

## How It Works

In the lab, Priya committed a Spring Boot `application.properties` with a (fake) database password, then "fixed" it:

```bash
git rm --cached src/main/resources/application.properties
echo "src/main/resources/application.properties" >> .gitignore
git add .gitignore
git commit -m "Stop tracking application.properties"
```

**Output:**

```text
[main f777bab] Stop tracking application.properties
 2 files changed, 1 insertion(+), 3 deletions(-)
 delete mode 100644 src/main/resources/application.properties
```

The current tree no longer has the file (`git ls-files` doesn't list it). But history does:

```bash
git log --oneline -- src/main/resources/application.properties
git show HEAD~1:src/main/resources/application.properties | grep password
```

**Output:**

```text
f777bab Stop tracking application.properties
ff087e0 Add database configuration
spring.datasource.password=change-me-not-a-real-password
```

Anyone can also search all of history for it:

```bash
git log --oneline -S "change-me-not-a-real-password"
git grep -n "password" $(git rev-list --all) -- src/main/resources
```

**Output:**

```text
f777bab Stop tracking application.properties
ff087e0 Add database configuration
ff087e01c1a8fd9de26b6a4c297afb78c9a8d81f:src/main/resources/application.properties:3:spring.datasource.password=change-me-not-a-real-password
```

## Prevention

1. **Never put real secrets in tracked files.** Use environment variables or a secret store; Spring Boot reads `${DB_PASSWORD}` placeholders and environment variables ([Configuration and Secrets](../../../devops/production-readiness/configuration-and-secrets/content.md)).
2. **Ignore local config from day one:** `.env`, `application-local.properties`, `*.pem`, `*.key`.
3. **Commit templates instead:** `application-example.properties` or `.env.example` with placeholder values (`change-me`).
4. **Scan before committing:** a `pre-commit` hook or tool that blocks likely secrets ([Writing Git Hooks](../../git-hooks/writing-git-hooks/content.md)) — helpful, but bypassable.
5. **Server-side protection:** GitHub **secret scanning** detects known credential formats, and **push protection** rejects a push containing one before it lands.
6. **Review `git diff --staged`** before every commit.

## Response: the Order Matters

> [!CAUTION]
> **Removing a secret from Git history does not make it safe.** It may already be copied — clones, forks, CI logs, caches, scanners. The credential must be **revoked and replaced**. History clean-up is optional hygiene that comes after.

1. **Revoke / rotate the credential now** — new database password, regenerate the API key, revoke the token. Update the systems that use it.
2. **Check for misuse** — access logs, the provider's audit log, GitHub's security log.
3. **Remove it from the current version** — untrack, ignore, move to environment configuration (as above).
4. **Decide whether to rewrite history** (next section). For a rotated credential in a private repository, many teams stop here.
5. **Prevent a repeat** — `.gitignore`, templates, push protection, a pre-commit check.

## History Remediation Overview

If the repository must not contain the old value (policy, a public repository, a value that can't be rotated quickly), rewrite history **after** rotating:

```bash
# Illustrative — requires git-filter-repo (a separate Python tool); not run for this lesson.
# Work on a fresh mirror clone, never your only copy.
git clone --mirror https://github.com/your-org/gradebook.git
cd gradebook.git
git filter-repo --path src/main/resources/application.properties --invert-paths
git push --force --mirror
```

- `git filter-repo` (recommended by the Git project over the older `git filter-branch`) or the **BFG Repo-Cleaner** rewrite every affected commit, producing **new commit ids** for all of them.
- This is the most disruptive rewrite there is: announce it, have everyone push first, and have everyone **re-clone** afterwards — an old clone pushed back reintroduces the secret.
- Forks, open pull requests, caches and copies others made aren't touched; for sensitive data on GitHub, contact GitHub Support to purge cached views.

See [Rewriting History Safely](../../rebasing-and-rewriting/rewriting-history-safely/content.md) for coordinating it.

## Commands

| Command | Purpose | Safety |
|---------|---------|--------|
| `git log -S "<value>" --all` | Find commits that added/removed a value | Safe anywhere |
| `git grep "<pattern>" $(git rev-list --all)` | Search every commit's files | Safe anywhere |
| `git rm --cached <file>` | Stop tracking (current version only) | Changes local state |
| `git filter-repo …` | Rewrite history to remove files or text | **Rewrites all history; changes the remote when force-pushed** |

## Step-by-Step Example

Arjun pushed `.env` containing an API key to a public repository:

1. Revoke the key at the provider and issue a new one; update the deployment's environment.
2. Check the provider's logs for use since the push.
3. `git rm --cached .env`, add `.env` to `.gitignore`, commit `.env.example` with placeholders, push.
4. Public repository → rewrite history with `git filter-repo`, force-push, ask everyone to re-clone, and ask GitHub Support to remove cached views.
5. Enable push protection and add a pre-commit secret check.

## Common Mistakes

- **Cleaning history and keeping the same credential.**
- **"It was only public for five minutes."** Scanners are faster.
- **Thinking private repositories make secrets acceptable.**
- **Deleting the file and stopping** — `git log -p` still shows it.
- **Rewriting history without coordination** — someone's old clone re-pushes the secret.

## Interview Angle

"You accidentally committed an AWS key and pushed it. What do you do?" — revoke/rotate immediately, check for misuse, remove from the code and ignore it, then optionally purge history with `git filter-repo`/BFG with a coordinated force push; stress that history rewriting is not a substitute for rotation. Mention prevention: env variables, push protection, pre-commit scanning.

## Recap

- A committed secret lives in every later clone; deleting it only changes the latest snapshot.
- Prevent: env vars and secret stores, `.gitignore`, templates, scanning, push protection.
- Respond: revoke and rotate first, check logs, then untrack.
- Rewriting history (`git filter-repo`, BFG) is optional, disruptive and never enough on its own.

## Related Topics

- [.gitignore and Tracking Files](../../configuration-and-repositories/gitignore-and-tracking/content.md)
- [Searching Code and History](../../advanced-inspection/searching-code-and-history/content.md)
- [Spring Boot Repository Collaboration](../../java-project-workflow/spring-boot-repository-collaboration/content.md)
