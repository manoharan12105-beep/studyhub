# Git Interview Questions: Command Comparisons — Interview Questions

## Intermediate

### Q1. `git fetch` vs `git pull`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** `fetch` downloads commits and updates remote-tracking branches only; `pull` = `fetch` + integrate (merge, rebase or fast-forward) into the current branch.

**Explanation:** Fetch never changes your branches or files; pull can create merge commits, rewrite your unpushed commits (with `--rebase`) and cause conflicts.

**Example:** `git fetch && git log main..origin/main` to inspect, then `git pull --rebase`.

**Misconception:** "Fetch updates my code" — it updates `origin/*` only.

**Follow-up:** "What does `pull --rebase` do?"

</details>

### Q2. `git merge` vs `git rebase`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** Merge joins histories with a merge commit and keeps existing commits; rebase replays your commits on top of another base, creating new commits and a linear history.

**Explanation:** Merge is safe on shared branches; rebase rewrites, so use it on private branches. Rebase conflicts are resolved per commit, and ours/theirs are swapped.

**Example:** Rebase my unpushed feature onto `main` before a PR; merge `main` into a branch others share.

**Misconception:** "Rebase is always better" — it loses the true shape of history and is dangerous on shared commits.

**Follow-up:** "What is the golden rule of rebasing?"

</details>

### Q3. `git reset` vs `git revert`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** Reset moves the branch pointer back (rewriting history); revert adds a new commit that undoes an earlier one (preserving history).

**Explanation:** Reset suits local, unpushed commits; revert suits anything shared, and can undo a commit in the middle of history.

**Example:** `git reset --soft HEAD~1` to redo my last local commit; `git revert a1b2c3d` for a bad commit on `main`.

**Misconception:** "Revert deletes the commit" — the original stays in history.

**Follow-up:** "How do you revert a merge?" — `-m 1`.

</details>

### Q4. `git reset --soft` vs `--mixed` vs `--hard`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** All move the branch; soft keeps index and working files (changes staged), mixed (default) resets the index (changes unstaged), hard also resets working files (changes discarded).

**Explanation:** Commits are recoverable via reflog in all cases; uncommitted edits lost to `--hard` are not.

**Example:** Squash three local commits: `git reset --soft HEAD~3 && git commit`.

**Misconception:** "Hard reset can always be undone" — not for uncommitted work.

**Follow-up:** "How do you recover from an accidental `reset --hard`?"

</details>

### Q5. `git restore` vs `git reset`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** `restore` changes **files** (working directory and/or index) from a source without moving any branch; `reset <commit>` **moves the branch**.

**Explanation:** `restore <file>` discards edits, `restore --staged <file>` unstages, `restore --source=<commit> <file>` brings back an old version. Only `reset <file>` (unstage) overlaps.

**Example:** Unstage `pom.xml`: `git restore --staged pom.xml`.

**Misconception:** Using `reset --hard` to undo a single file.

**Follow-up:** "Is `restore <file>` reversible?" — no for unstaged edits.

</details>

### Q6. `git switch` vs `git checkout`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** `checkout` both switches branches and restores files; Git 2.23 split these into `switch` (branches) and `restore` (files).

**Explanation:** `switch` refuses to detach HEAD without `--detach` and never overwrites files by path, removing the ambiguity of `checkout <name>`.

**Example:** `git switch -c fix/x` ≡ `git checkout -b fix/x`.

**Misconception:** `checkout` is deprecated — it still works; `switch`/`restore` are just clearer.

**Follow-up:** "What's dangerous about `git checkout file.txt`?"

</details>

### Q7. `git stash apply` vs `git stash pop`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** Both re-apply a stash; `pop` then drops it from the list — only if it applied without conflicts; `apply` keeps it.

**Explanation:** Keep the stash with `apply` when you might need it again (another branch) or when unsure.

**Example:** `git stash apply stash@{1}` on two branches.

**Misconception:** "pop always deletes the stash" — not after a conflict.

**Follow-up:** "How do you include untracked files?" — `stash push -u`.

</details>

### Q8. Clone vs fork?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** A clone is a local copy made with Git; a fork is a server-side copy under your GitHub account.

**Explanation:** You fork when you can't push to the original, then clone the fork, push branches to it and open PRs to the original (`upstream`).

**Example:** Contributing to an open-source library.

**Misconception:** "Fork is a Git command" — it's a hosting-platform feature.

**Follow-up:** "How do you keep a fork in sync?"

</details>

### Q9. Git tag vs GitHub Release?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** A tag is a Git ref to a commit; a Release is GitHub data built on a tag with notes, assets and flags.

**Explanation:** Tags travel with clones; releases don't. Releases often attach build artifacts such as JARs.

**Example:** Tag `v1.1.0` then publish a release with `gradebook-1.1.0.jar`.

**Misconception:** "Deleting a release deletes the tag" — they're separate.

**Follow-up:** "Lightweight vs annotated tags?"

</details>

### Q10. `--force` vs `--force-with-lease`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** `--force` overwrites the remote branch unconditionally; `--force-with-lease` only if it still points where your remote-tracking ref says.

**Explanation:** The lease protects teammates' newer commits; it's weakened by background fetches, so pin the expected commit or add `--force-if-includes`.

**Example:** After rebasing my PR branch: `git push --force-with-lease`.

**Misconception:** "Lease is always safe" — not after an unexamined fetch.

**Follow-up:** "How do you prevent force pushes to main?" — branch protection.

</details>

### Q11. Fast-forward vs three-way merge?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** Fast-forward moves the branch pointer when the current branch hasn't diverged; three-way creates a merge commit using the merge base and both tips.

**Explanation:** `--no-ff` forces a merge commit; `--ff-only` refuses to create one.

**Example:** Merging a branch nobody else changed `main` alongside → fast-forward.

**Misconception:** "Every merge creates a merge commit."

**Follow-up:** "What's a merge base?"

</details>

### Q12. `git diff` vs `git diff --staged` vs `git diff HEAD`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** Unstaged changes (working vs index); staged changes (index vs HEAD); all changes since the last commit (working vs HEAD).

**Explanation:** Review `--staged` before committing.

**Example:** `git diff` empty but files changed → they're staged.

**Misconception:** New untracked files never appear in `git diff`.

**Follow-up:** "`main..feature` vs `main...feature` in diff?"

</details>

### Q13. `HEAD~2` vs `HEAD^2`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** `HEAD~2` is the grandparent along first parents; `HEAD^2` is the second parent of a merge commit.

**Explanation:** `^n` selects among parents; `~n` walks generations.

**Example:** On a merge `M`, `M^2` is the merged branch's tip.

**Misconception:** They're the same "two back".

**Follow-up:** "List the commits a merge brought in" — `git log M^1..M^2`.

</details>

### Q14. `git log -S` vs `git log -G` vs `git log --grep`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** `-S` finds commits that change the count of a string; `-G` finds commits adding/removing lines matching a regex; `--grep` searches commit messages.

**Explanation:** Changing `>= 75` to `>= 78` on a `return 'B'` line is found by `-G "return .B."`, not by `-S "return 'B'"`.

**Example:** When was `Math.round` introduced? `git log -S "Math.round"`.

**Misconception:** `--grep` searches code.

**Follow-up:** "How would you find when a secret was committed?"

</details>

### Q15. `git rm` vs `git rm --cached`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** `git rm` deletes the file and stages the deletion; `--cached` stages the deletion but keeps the file on disk (untracks it).

**Explanation:** Use `--cached` with `.gitignore` for files that shouldn't be tracked.

**Example:** `git rm --cached .env` after adding `.env` to `.gitignore` (and rotating secrets).

**Misconception:** Untracking removes the file from history.

**Follow-up:** "What happens on teammates' machines when they pull?" — their copy is deleted.

</details>

### Q16. Merge commit vs squash vs rebase merge on GitHub?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** Merge commit keeps all PR commits plus a merge; squash makes one new commit; rebase re-creates each commit on top of the base with no merge commit.

**Explanation:** Trade-offs: detail vs clean history, revertability, bisect granularity; squash and rebase make Git see the branch as unmerged.

**Example:** Squash small PRs with messy commits; merge commits for large well-structured ones.

**Misconception:** One method is always best.

**Follow-up:** "Why does `git branch -d` fail after a squash merge?"

</details>
