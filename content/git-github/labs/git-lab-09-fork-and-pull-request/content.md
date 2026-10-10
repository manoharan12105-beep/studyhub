# Lab 09 — Fork a Repository and Prepare a Pull Request

**Lab:** 09 · **Module:** Pull Requests and Code Review · **Difficulty:** Intermediate · **Verification:** Partly tested

> [!NOTE]
> The Git side was run with local bare repositories standing in for the original project (`upstream`) and your GitHub fork (`origin`). Forking on github.com and opening the pull request were **not** run (Instruction only).

## Objective

Set up a fork with `origin` and `upstream`, synchronise it with changes the maintainers made, and push a focused contribution branch ready for a pull request.

## Prerequisites

- Lessons: [Contributing to Open Source](../../pull-requests-and-review/open-source-contribution/content.md), [Pull Requests](../../pull-requests-and-review/pull-requests-fundamentals/content.md).

## Scenario

The README's run instructions don't build the project first. Priya isn't a maintainer of `your-org/gradebook`, so she contributes through a fork.

## Steps

### Step 1: Fork (on GitHub — instruction only)

On `https://github.com/your-org/gradebook`, click **Fork** and create `your-username/gradebook`.

**Expected result:** a copy of the repository under your account, showing "forked from your-org/gradebook".

To practise offline, create the two stand-ins (after running the setup script and making the first commit as in earlier labs):

```bash
cd ~/git-lab
git clone -q --bare gradebook remotes/upstream-gradebook.git     # "your-org/gradebook"
git clone -q --bare remotes/upstream-gradebook.git remotes/fork-gradebook.git   # "your fork"
rm -rf gradebook
```

### Step 2: Clone your fork and add upstream

```bash
git clone ~/git-lab/remotes/fork-gradebook.git gradebook
cd gradebook
git remote add upstream ~/git-lab/remotes/upstream-gradebook.git
git remote -v
```

**Output:**

```text
Cloning into 'gradebook'...
done.
origin	/home/student/git-lab/remotes/fork-gradebook.git (fetch)
origin	/home/student/git-lab/remotes/fork-gradebook.git (push)
upstream	/home/student/git-lab/remotes/upstream-gradebook.git (fetch)
upstream	/home/student/git-lab/remotes/upstream-gradebook.git (push)
```

On GitHub the URLs would be `https://github.com/your-username/gradebook.git` and `https://github.com/your-org/gradebook.git`.

### Step 3: The project moves on

A maintainer (Arjun) pushes "List build requirements in README" to the original project. To simulate it, clone `remotes/upstream-gradebook.git` into `~/git-lab/maintainer`, commit a README change there and push.

### Step 4: Sync your fork

```bash
git fetch upstream
git log --oneline main..upstream/main
git merge --ff-only upstream/main
git push origin main
```

**Output:**

```text
From /home/student/git-lab/remotes/upstream-gradebook
 * [new branch]      main       -> upstream/main
43bfdbe List build requirements in README
Updating 1733eba..43bfdbe
Fast-forward
 README.md | 5 +++++
 1 file changed, 5 insertions(+)
To /home/student/git-lab/remotes/fork-gradebook.git
   1733eba..43bfdbe  main -> main
```

**Explanation:** `--ff-only` keeps your fork's `main` a mirror of upstream. (GitHub's **Sync fork** button does the same on the server.)

### Step 5: Make the contribution on its own branch

```bash
git switch -c fix/readme-run-command
```

In `README.md`, change the run command to build first:

```bash
git diff
```

**Output:**

```text
diff --git a/README.md b/README.md
index 7eaa011..cb80644 100644
--- a/README.md
+++ b/README.md
@@ -8,7 +8,7 @@ Calculates average marks and letter grades for a class.
 
 ## Run
 
-    java -cp target/classes com.example.gradebook.App
+    mvn -B -q package && java -cp target/classes com.example.gradebook.App
 
 ## Requirements
 
```

```bash
git commit -am "Build before running in the README run instructions"
git push -u origin fix/readme-run-command
```

**Output:**

```text
[fix/readme-run-command 69f87d7] Build before running in the README run instructions
 1 file changed, 1 insertion(+), 1 deletion(-)
branch 'fix/readme-run-command' set up to track 'origin/fix/readme-run-command'.
To /home/student/git-lab/remotes/fork-gradebook.git
 * [new branch]      fix/readme-run-command -> fix/readme-run-command
```

### Step 6: Check exactly what the PR will contain

```bash
git log --oneline upstream/main..fix/readme-run-command
git diff --stat upstream/main...fix/readme-run-command
```

**Output:**

```text
69f87d7 Build before running in the README run instructions
 README.md | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
```

One commit, one file — a focused contribution.

### Step 7: Open the pull request (on GitHub — instruction only)

GitHub shows **Compare & pull request** for the pushed branch. Base repository `your-org/gradebook`, base `main`; head repository `your-username/gradebook`, compare `fix/readme-run-command`. Description: what (run command builds first), why (classes don't exist before a build), testing (followed the README in a fresh clone), `Fixes #<issue>` if one exists. Tick **Allow edits by maintainers**.

**Expected result:** the PR shows one commit and the README diff above; CI (if configured) runs on it.

## Verification Checklist

- ☐ `git remote -v` shows `origin` (fork) and `upstream` (original).
- ☐ Your fork's `main` equals `upstream/main`.
- ☐ The PR branch contains exactly one commit on top of `upstream/main`.

## Common Mistakes

- Committing on your fork's `main` — it diverges from upstream.
- Branching from a stale `main` — fetch upstream first.
- Creating the branch from `upstream/main` and then plain `git push` (it targets upstream — see the lesson's warning); push with `-u origin`.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `merge --ff-only` fails | Your fork's `main` has its own commits — move them to a branch and reset `main` to `upstream/main` |
| PR shows unrelated commits | Your branch started from an old or diverged `main`; rebase onto `upstream/main` |
| Maintainer asks for a rebase | `git fetch upstream && git rebase upstream/main && git push --force-with-lease` |
