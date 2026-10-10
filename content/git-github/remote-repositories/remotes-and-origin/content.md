# Remotes, origin and Remote-Tracking Branches

**Module:** Remote Repositories · **Interview priority:** Core

## Learning Objectives

- Explain the difference between your local repository and a remote repository.
- Add, list, rename and remove remotes; know what `origin` is.
- Read remote-tracking branches (`origin/main`) and know when they update.

## What Is It?

A **remote** is a named URL of another copy of the repository — usually on GitHub — that you exchange commits with. **`origin`** is simply the default name `git clone` gives to the repository you cloned from; nothing else about it is special.

A **remote-tracking branch** such as `origin/main` is your repository's **local, read-only record** of where a branch on the remote pointed the **last time you communicated** with it (fetch, pull or push). It is not live.

## Why It Matters

Every collaboration problem — "my push was rejected", "I don't see Arjun's branch", "why does status say I'm behind?" — comes down to three things that can each be different: your local branch, your remote-tracking branch, and the branch actually on the server. Knowing which is which is the key to remote work.

## How It Works

```text
   GitHub (remote "origin")                 your clone
  ┌──────────────────────────┐   fetch   ┌────────────────────────────────────┐
  │ main → c080e23            │ ────────► │ origin/main → c080e23  (snapshot)  │
  │                           │           │ main        → d9b72cf  (your work) │
  │                           │ ◄──────── │                                    │
  └──────────────────────────┘   push    └────────────────────────────────────┘
```

- `git fetch` updates `origin/*` from the server. Your own branches don't move.
- `git push` sends your commits and updates the server's branch (and your `origin/*`).
- Between those, `origin/main` can be out of date — it shows what the server had at your last contact.

## Adding and Inspecting Remotes

In the lab, a freshly initialised gradebook repository gets the stand-in remote:

```bash
git remote -v                     # prints nothing — no remotes yet
git remote add origin ~/git-lab/remotes/gradebook.git
git remote -v
```

**Output:**

```text
origin	/home/student/git-lab/remotes/gradebook.git (fetch)
origin	/home/student/git-lab/remotes/gradebook.git (push)
```

On GitHub the URL would be `https://github.com/your-username/gradebook.git` or `git@github.com:your-username/gradebook.git` — see [HTTPS and SSH Remotes](../../authentication-and-security/https-and-ssh-remotes/content.md).

The remote lives in `.git/config`:

```text
[remote "origin"]
	url = /home/student/git-lab/remotes/gradebook.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
	remote = origin
	merge = refs/heads/main
```

The `fetch` line is the **refspec**: "copy every branch on the server (`refs/heads/*`) to `refs/remotes/origin/*` here". The `[branch "main"]` section, created by `git push -u`, makes `origin/main` the **upstream** of `main`.

After the first push:

```bash
git branch -a
```

**Output:**

```text
* main
  remotes/origin/main
```

```bash
git remote show origin
```

**Output:**

```text
* remote origin
  Fetch URL: /home/student/git-lab/remotes/gradebook.git
  Push  URL: /home/student/git-lab/remotes/gradebook.git
  HEAD branch: main
  Remote branch:
    main tracked
  Local branch configured for 'git pull':
    main merges with remote main
  Local ref configured for 'git push':
    main pushes to main (up to date)
```

`git remote show` contacts the remote; `git remote -v` doesn't.

## Managing Remotes

| Task | Command |
|------|---------|
| List with URLs | `git remote -v` |
| Add | `git remote add <name> <url>` |
| Rename | `git remote rename <old> <new>` (also renames `old/*` tracking branches) |
| Remove | `git remote remove <name>` (deletes its tracking branches too) |
| Change the URL | `git remote set-url origin <new-url>` (e.g. switch HTTPS → SSH) |
| Details and stale branches | `git remote show <name>` |

A repository can have several remotes. The common second one is **`upstream`** — the original project when you work on a fork (`origin` = your fork). See [Contributing to Open Source](../../pull-requests-and-review/open-source-contribution/content.md).

## Commands

### git remote

**Syntax:** `git remote [-v]`, `git remote add|rename|remove|set-url …`, `git remote show <name>` · **Safety:** changes local configuration only; never changes the remote repository.

## Step-by-Step Example

Publish an existing local gradebook repository to an empty GitHub repository (or the lab's bare repository):

1. `git remote add origin <url>`.
2. `git remote -v` — check the URL; typos here cause confusing authentication errors.
3. `git push -u origin main` — first push, sets the upstream ([git push and Upstream Tracking](../git-push-and-upstream/content.md)).
4. `git branch -vv` — `main` now shows `[origin/main]`.

## Common Mistakes

- **Treating `origin/main` as live.** It only changes when you fetch, pull or push. Run `git fetch` before comparing.
- **Committing on `origin/main`.** You can't — checking it out gives a detached HEAD. Work on `main` and push.
- **Embedding credentials in the URL** (`https://user:token@github.com/…`) — they're stored in plain text in `.git/config`. Use a credential manager or SSH.
- **Assuming `origin` means GitHub.** It's whatever URL was configured; check `git remote -v`.

## Interview Angle

"What is `origin`?" — the default name for the remote you cloned from; just a name. "What is `origin/main`?" — a remote-tracking branch: your local record of the remote's `main` at the last fetch, read-only, updated by fetch/pull/push.

## Recap

- A remote is a named URL; `origin` is the conventional default name.
- `origin/main` is a local snapshot of the remote's `main` from your last contact.
- `git remote add/rename/remove/set-url` manage remotes; `-v` lists them.
- The fetch refspec maps server branches to `origin/*`; `-u` sets upstream tracking.

## Related Topics

- [git fetch and git pull](../git-fetch-and-pull/content.md)
- [git push and Upstream Tracking](../git-push-and-upstream/content.md)
- [Creating Repositories](../../configuration-and-repositories/creating-repositories/content.md)
