# Lab 02 — Add a Remote and Push the Project

**Lab:** 02 · **Module:** Remote Repositories · **Difficulty:** Beginner · **Verification:** Partly tested

> [!NOTE]
> All Git steps were run against a **local bare repository** standing in for GitHub. The optional GitHub step at the end was not run (it needs your account). StudyHub never connects to GitHub for you.

## Objective

Publish gradebook to a remote, set the upstream, prove the remote has everything by cloning it, then push a follow-up commit.

## Prerequisites

- [Lab 01](../git-lab-01-first-repository/content.md) or the starting state below.
- Lessons: [Remotes and origin](../../remote-repositories/remotes-and-origin/content.md), [git push and Upstream Tracking](../../remote-repositories/git-push-and-upstream/content.md).

## Scenario

Priya's repository exists only on her laptop. Arjun joins next week and needs a shared copy.

## Steps

### Step 1: Starting state

```bash
bash ~/git-lab/setup-gradebook.sh
cd ~/git-lab/gradebook
printf 'target/\n.idea/\n*.iml\n*.log\n.env\n' > .gitignore
git init -q && git add . && git commit -qm "Create gradebook project"
git log --oneline
```

**Output:**

```text
gradebook created in /home/student/git-lab/gradebook
1733eba Create gradebook project
```

(Skip this if you're continuing from Lab 01 — you'll have three commits.)

### Step 2: Create the stand-in remote

```bash
git init --bare ~/git-lab/remotes/gradebook.git
```

**Output:**

```text
Initialized empty Git repository in /home/student/git-lab/remotes/gradebook.git/
```

### Step 3: Add the remote

```bash
git remote add origin ~/git-lab/remotes/gradebook.git
git remote -v
```

**Output:**

```text
origin	/home/student/git-lab/remotes/gradebook.git (fetch)
origin	/home/student/git-lab/remotes/gradebook.git (push)
```

### Step 4: First push with upstream

```bash
git push -u origin main
git branch -vv
```

**Output:**

```text
branch 'main' set up to track 'origin/main'.
To /home/student/git-lab/remotes/gradebook.git
 * [new branch]      main -> main
* main 1733eba [origin/main] Create gradebook project
```

### Step 5: Prove the remote is complete

```bash
git clone ~/git-lab/remotes/gradebook.git ~/git-lab/verify-clone
git -C ~/git-lab/verify-clone log --oneline
```

**Output:**

```text
Cloning into '/home/student/git-lab/verify-clone'...
done.
1733eba Create gradebook project
```

### Step 6: Push a follow-up commit

Append a line to `README.md`, then:

```bash
git commit -am "Ask contributors to run the build before pushing"
git status -sb
git push
git status -sb
git ls-remote origin
```

**Output:**

```text
[main e761c04] Ask contributors to run the build before pushing
 1 file changed, 2 insertions(+)
## main...origin/main [ahead 1]
To /home/student/git-lab/remotes/gradebook.git
   1733eba..e761c04  main -> main
## main...origin/main
e761c04087989140e7de057099141a6867b59a9b	HEAD
e761c04087989140e7de057099141a6867b59a9b	refs/heads/main
```

**Explanation:** `[ahead 1]` disappears after the push; `ls-remote` asks the remote directly what it has.

### Step 7 (optional, not tested): the same on GitHub

Create an **empty** repository on GitHub, then:

```bash
git remote add github https://github.com/your-username/gradebook.git
git push -u github main
```

**Expected result:** Git asks you to authenticate (browser sign-in, token or SSH key), then prints `* [new branch] main -> main`; the files appear on the repository page.

## Verification Checklist

- ☐ `git remote -v` shows `origin`.
- ☐ `git branch -vv` shows `[origin/main]` with no ahead/behind.
- ☐ The verify clone contains every commit.
- ☐ `git ls-remote origin` matches `git rev-parse HEAD`.

## Common Mistakes

- Pushing without `-u` the first time, then wondering why `git push` asks for a branch.
- Initialising the GitHub repository with a README — the first push is then rejected.
- Typos in the remote URL (`git remote set-url origin <url>` fixes them).

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `fatal: 'origin' does not appear to be a git repository` | The remote wasn't added or the path/URL is wrong — `git remote -v` |
| `remote origin already exists` | `git remote set-url origin <url>` |
| `rejected (fetch first)` on GitHub | The GitHub repo has a commit you don't — `git pull --rebase origin main`, then push |
