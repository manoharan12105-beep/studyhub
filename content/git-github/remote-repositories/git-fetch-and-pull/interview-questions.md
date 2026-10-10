# git fetch and git pull — Interview Questions

## Beginner

### Q1. What is the difference between `git fetch` and `git pull`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git fetch` downloads new commits and updates remote-tracking branches (`origin/main`) without touching your local branches or working files. `git pull` does a fetch and then integrates the upstream branch into your current branch, by merge, rebase or fast-forward — so it can change files and cause conflicts.

</details>

### Q2. Why might you prefer `git fetch` over `git pull`?

**Style:** Why

<details>
<summary>Answer</summary>

To inspect incoming changes before integrating them (`git log main..origin/main`, `git diff main...origin/main`), to choose merge or rebase deliberately, and to update your view of all remote branches without risking conflicts in your working directory.

</details>

## Intermediate

### Q3. What does `git pull --rebase` do?

**Style:** What

<details>
<summary>Answer</summary>

It fetches, then rebases your local commits that aren't on the upstream onto the updated upstream branch instead of merging. The result is a linear history without "Merge branch 'main' of …" commits. It rewrites only your unpushed local commits.

</details>

### Q4. `git pull` fails with "Need to specify how to reconcile divergent branches". What happened and what do you do?

**Style:** Debugging

<details>
<summary>Answer</summary>

Your branch and its upstream both have commits the other lacks, and no pull strategy is configured, so Git refuses to choose. Decide: `git pull --rebase` (linear), `git pull --no-rebase` (merge commit) or investigate first; then set a default with `git config pull.rebase true|false` or `pull.ff only`.

</details>

## Advanced

### Q5. After `git fetch`, `git status` says "behind 3". What exactly is being compared?

**Style:** What happens internally

<details>
<summary>Answer</summary>

Your local branch against its configured upstream's remote-tracking ref (e.g. `main` vs `origin/main`), as recorded locally. "Behind 3" means `origin/main` has 3 commits not reachable from `main` — as of the last fetch; without fetching, status can't know about newer pushes.

</details>
