# git fetch and git pull — Practice

### P1. What changes?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** fetch scope

After `git fetch`, which of these has changed?

- A) Your working directory files
- B) Your local `main` branch
- C) `origin/main`
- D) Your staging area

<details>
<summary>Answer</summary>

**Answer:** C) `origin/main`

Fetch only updates remote-tracking refs (and downloads objects).

</details>

### P2. What arrived?

**Difficulty:** Easy · **Type:** Command · **Concepts:** inspecting after fetch

After `git fetch`, list the commits on `origin/main` that your `main` doesn't have.

<details>
<summary>Answer</summary>

`git log --oneline main..origin/main`

</details>

### P3. Predict the pull

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** fast-forward vs merge

`git status` after a fetch says "Your branch is behind 'origin/main' by 2 commits, and can be fast-forwarded." What will `git pull` do?

<details>
<summary>Answer</summary>

Fast-forward: move `main` to `origin/main`'s commit and update the files. No merge commit, no rebase, no conflicts.

</details>

### P4. Pick a strategy

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** pull.rebase

Configure Git so that every `git pull` in all your repositories rebases local commits instead of merging.

<details>
<summary>Answer</summary>

`git config --global pull.rebase true`

</details>

### P5. Diverged

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** divergence

`git status`: "Your branch and 'origin/main' have diverged, and have 1 and 1 different commits each". Your commit is unpushed. Give two ways to integrate, and the history each produces.

<details>
<summary>Answer</summary>

`git pull --rebase` — your commit is replayed after the remote's: a straight line. `git pull --no-rebase` — a merge commit joins both: a small diamond in history. Either way, then `git push`.

</details>
