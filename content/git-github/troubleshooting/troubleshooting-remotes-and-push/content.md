# Troubleshooting Remotes and Pushes

**Module:** Git Troubleshooting Playbook · **Interview priority:** Core

> [!NOTE]
> Scenarios 1, 2, 3, 6 and 7 were reproduced in the practice lab with local bare repositories. Scenarios 4 and 5 involve GitHub's servers and were **not** run; their messages are described from GitHub's documented behaviour.

## Learning Objectives

- Resolve rejected pushes, missing remote branches and wrong upstreams.
- Diagnose authentication failures and large-file rejections.
- Synchronise diverged histories and recover from an accidental force push.

## How to Use This Topic

Start every scenario with `git status`, `git remote -v`, `git branch -vv` and `git fetch` ([Diagnosing Repository State](../diagnosing-repository-state/content.md)). Remote problems fall into three groups: **can't connect/authenticate**, **remote refuses the update**, **local and remote disagree**.

## Scenario 1: git push Rejected

### Symptoms

```text
 ! [rejected]        main -> main (fetch first)
```

or `(non-fast-forward)`.

### Possible Causes

Someone pushed first; or you rewrote commits (amend, rebase) that were already pushed.

### Diagnostic Workflow

`git fetch`, then `git status -sb` (`[ahead 1, behind 1]`), `git log --oneline --graph main origin/main -10`.

### Fix

New commits from others → `git pull --rebase` (or merge), test, `git push`. Your own intentional rewrite of a branch only you use → `git push --force-with-lease`. Full captured walk-through: [Push Rejection, Divergence and Force-with-Lease](../../remote-repositories/push-rejection-and-divergence/content.md).

### Prevention

Fetch/pull before starting and before pushing; short-lived branches; never rewrite shared branches.

### Interview Explanation

"Rejection means the update isn't a fast-forward. I fetch, look, integrate with rebase or merge, test and push — force only my own branch, and only with a lease."

## Scenario 2: Remote Branch Missing Locally

### Symptoms

**Output (`git switch feature/csv-export`):**

```text
fatal: invalid reference: feature/csv-export
```

### Possible Causes

Your clone hasn't fetched since the branch was pushed; typo in the name; the branch was pushed to a different remote or fork.

### Diagnostic Workflow

`git branch -a` (is `remotes/origin/feature/csv-export` there?), `git ls-remote --heads origin` (what the server has right now).

### Fix

```bash
git fetch
git switch feature/csv-export
```

**Output:**

```text
From /home/student/git-lab/remotes/gradebook
 * [new branch]      feature/csv-export -> origin/feature/csv-export
branch 'feature/csv-export' set up to track 'origin/feature/csv-export'.
Switched to a new branch 'feature/csv-export'
```

### Prevention

Fetch regularly (`fetch.prune true` also removes branches deleted on the server).

### Interview Explanation

"Remote-tracking branches only update on fetch. After `git fetch`, `git switch <branch>` creates a local tracking branch automatically."

## Scenario 3: Incorrect Upstream

### Symptoms

`git branch -vv` shows `* feature/report … [origin/main: ahead 3]`; `git pull` merges `main`, or `git push` complains that "the upstream branch of your current branch does not match the name of your current branch".

### Possible Causes

Branch created from `origin/main` (Git set it as upstream); a fork branch tracking `upstream/main`.

### Diagnostic Workflow

`git branch -vv`; `git config --get branch.feature/report.merge`.

### Fix

```bash
git push -u origin feature/report                         # push and track the right branch
# or, if origin/feature/report already exists:
git branch --set-upstream-to=origin/feature/report
```

### Prevention

Create branches with `git switch -c feature/x` from a local branch, or `--no-track`; first push with `-u`.

### Interview Explanation

"The upstream is a per-branch setting; I check it with `branch -vv` and fix it with `push -u` or `--set-upstream-to`."

## Scenario 4: Authentication Failure

### Symptoms

`remote: Support for password authentication was removed …`, `fatal: Authentication failed for 'https://github.com/…'`, `Permission denied (publickey)`, or `Repository not found` for a private repository you can access in the browser.

### Possible Causes

Account password used over HTTPS; expired/revoked token cached by the credential helper; token missing repository access or SSO authorisation; SSH key not loaded or not registered; remote URL uses a different protocol than you set up.

### Diagnostic Workflow

`git remote -v` (HTTPS or SSH?); HTTPS: `git config --show-origin --get-all credential.helper`; SSH: `ssh -T git@github.com`, `ssh-add -l`; `git ls-remote origin` to test.

### Fix

HTTPS: clear the cached credential and sign in again with a fine-grained token or the browser flow. SSH: load the key (`ssh-add`), add the `.pub` key to GitHub, or switch the URL with `git remote set-url`. Details: [Tokens and Credential Managers](../../authentication-and-security/tokens-and-credential-managers/content.md), [SSH Keys for GitHub](../../authentication-and-security/ssh-keys-for-github/content.md).

### Prevention

Credential manager or SSH agent; token expiry reminders; never embed credentials in URLs.

### Interview Explanation

"I identify the protocol from `remote -v`, then test that path: cached token and its permissions for HTTPS, loaded and registered key for SSH."

## Scenario 5: Large File Rejected by the Remote

### Symptoms

**Expected result:** GitHub rejects the push with a `GH001: Large files detected` error naming the file and GitHub's 100 MB per-file limit (GitHub also warns about files over 50 MB).

### Possible Causes

A large artifact, dataset or video was committed — even if a later commit deleted it, the push still contains it in history.

### Diagnostic Workflow

Find large blobs being pushed:

```bash
git rev-list --objects origin/main..HEAD | git cat-file --batch-check='%(objecttype) %(objectsize) %(rest)' | sort -k2 -n | tail -5
```

### Fix

If the commits are **unpushed**: remove the file from them — `git rm --cached big.zip` + `git commit --amend` if it's in the last commit, or interactive rebase / `git filter-repo` if older. Then ignore it, or track it with Git LFS ([Sparse Checkout, Partial Clone and LFS](../../specialized-workflows/sparse-checkout-and-lfs/content.md)) if it must be versioned.

### Prevention

`.gitignore` build outputs and data; Git LFS set up **before** adding binaries.

### Interview Explanation

"GitHub blocks files over 100 MB; deleting the file in a new commit doesn't help because the push includes history. I rewrite the unpushed commits to drop it, then ignore it or use LFS."

## Scenario 6: Diverged Local and Remote Histories

### Symptoms

`Your branch and 'origin/main' have diverged, and have 1 and 1 different commits each`; `git pull` says `Need to specify how to reconcile divergent branches`.

### Possible Causes

Both you and someone else committed since your last sync; or one side was rewritten.

### Diagnostic Workflow

`git log --oneline --left-right --graph main...origin/main` — whose commits are on which side? Were any rewritten copies (same message, different id)?

### Fix

Normal divergence → `git pull --rebase` (or `--no-rebase`), resolve, test, push; set `pull.rebase` to avoid the prompt. Divergence caused by a teammate's rewrite → `git reset --hard origin/main` if you have no local work, otherwise rebase only your commits with `git rebase --onto origin/main <old-base>`. Details: [git fetch and git pull](../../remote-repositories/git-fetch-and-pull/content.md).

### Prevention

Integrate often; agree a pull strategy; don't rewrite shared branches.

### Interview Explanation

"Diverged means both sides have unique commits. I inspect with a left-right log, then rebase or merge deliberately."

## Scenario 7: Accidental Force Push

### Symptoms

Commits disappeared from `main` on GitHub; teammates see `(forced update)` when fetching.

**Output (a teammate's `git fetch`):**

```text
From /home/student/git-lab/remotes/gradebook
 + 3a070e0...550dd7f main       -> origin/main  (forced update)
```

### Possible Causes

`git push --force` after a local reset or rebase, without realising others' commits were on the remote.

### Diagnostic Workflow

Anyone who fetched **before** the force push has the old tip in the **reflog of their remote-tracking branch**:

```bash
git reflog show origin/main
git log --oneline -1 origin/main@{1}
```

**Output:**

```text
550dd7f refs/remotes/origin/main@{0}: fetch: forced-update
3a070e0 Raise the B threshold to 78
```

`origin/main@{1}` is the value before the forced update — the lost tip.

### Fix

Restore the remote branch from that commit (with a lease, so you don't clobber yet another change):

```bash
git push --force-with-lease=main:550dd7f origin origin/main@{1}:main
```

**Output:**

```text
To /home/student/git-lab/remotes/gradebook.git
 + 550dd7f...3a070e0 origin/main@{1} -> main (forced update)
```

Then re-apply any genuinely new commit from the bad push (cherry-pick `550dd7f` if it's wanted). The person who force-pushed can also use their own reflog (`git reflog`) to find the pre-reset tip. On GitHub, the repository's activity view may also show the previous tip.

### Prevention

Branch protection blocking force pushes on `main`; `--force-with-lease` as habit; alias `push --force` away.

### Interview Explanation

"I recover the old tip from a remote-tracking reflog (`origin/main@{1}`) on any clone that fetched before the force push, push it back with a lease, and then protect the branch so it can't happen again."

## Key Takeaways

- Fetch, inspect, then act — remote problems are usually a stale local view.
- Rejected pushes: integrate; force only your own branch, with a lease.
- Authentication: identify the protocol, test that path.
- Large files: remove them from unpushed history; ignore or use LFS.
- Force-push accidents are recoverable from remote-tracking reflogs; branch protection prevents them.

## Related Topics

- [Push Rejection, Divergence and Force-with-Lease](../../remote-repositories/push-rejection-and-divergence/content.md)
- [HTTPS and SSH Remotes](../../authentication-and-security/https-and-ssh-remotes/content.md)
- [Branch Protection and Code Ownership](../../team-workflows/branch-protection-and-code-ownership/content.md)
