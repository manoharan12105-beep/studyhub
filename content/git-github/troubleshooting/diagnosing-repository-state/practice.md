# Diagnosing Repository State Before Changing It — Practice

### P1. Read-only?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** safe diagnosis

Which command is **not** safe to run while diagnosing (it can change your branch or files)?

- A) `git status`
- B) `git reflog`
- C) `git pull`
- D) `git branch -vv`

<details>
<summary>Answer</summary>

**Answer:** C) `git pull`

It merges or rebases into your branch. `git fetch` is the safe way to update remote information.

</details>

### P2. Read the snapshot

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** interpreting status

```text
* main 1e1e146 [origin/main: ahead 1] Use 76 for B
```

`git status` also says "You have unmerged paths". Summarise the situation in two sentences.

<details>
<summary>Answer</summary>

A merge is in progress on `main` with at least one conflicted file. `main` also has one local commit that hasn't been pushed.

</details>

### P3. Leave the operation

**Difficulty:** Easy · **Type:** Command · **Concepts:** in-progress operations

`.git/CHERRY_PICK_HEAD` exists and you want to return to the state before the cherry-pick. Which command?

<details>
<summary>Answer</summary>

`git cherry-pick --abort`

</details>

### P4. Cleaner graph

**Difficulty:** Medium · **Type:** Command · **Concepts:** log options

`git log --oneline --graph --all` shows strange commits named "index on main" and "untracked files on main". What are they, and which command shows branches and remote branches only?

<details>
<summary>Answer</summary>

They're the internal commits of a stash (`refs/stash`), included by `--all`. Use `git log --oneline --graph --decorate --branches --remotes`.

</details>

### P5. Order the diagnosis

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** routine

A push was rejected. Put these in a sensible order: `git push`, `git fetch`, `git status`, `git log --oneline main..origin/main`, `git pull --rebase`.

<details>
<summary>Answer</summary>

`git status` → `git fetch` → `git log --oneline main..origin/main` (see what's new) → `git pull --rebase` (integrate; resolve, test) → `git push`.

</details>
