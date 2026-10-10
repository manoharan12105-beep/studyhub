# git reflog: Recovering Lost Commits and Branches — Interview Questions

## Beginner

### Q1. What is the reflog?

**Style:** What

<details>
<summary>Answer</summary>

A local log of every position `HEAD` (and each branch) has pointed to — commits, checkouts, resets, rebases, merges — with the commit id before and after. It lets you find commits that are no longer on any branch.

</details>

### Q2. What's the difference between `git log` and `git reflog`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git log` walks commit ancestry from a starting point — what's in the branch's history. `git reflog` lists where `HEAD` or a ref has been over time in this clone, including commits no longer reachable from any branch. The reflog is local and expires; history is shared and permanent.

</details>

## Intermediate

### Q3. You ran `git reset --hard HEAD~3` by mistake. How do you recover?

**Style:** Scenario

<details>
<summary>Answer</summary>

`git reflog` — the top entry is the reset; the next one (`HEAD@{1}`) is where you were. `git reset --hard HEAD@{1}` (or `ORIG_HEAD`) restores the branch. Any uncommitted changes that the reset overwrote cannot be recovered.

</details>

### Q4. How do you recover a branch deleted with `git branch -D`?

**Style:** How

<details>
<summary>Answer</summary>

Use the hash in the deletion message (`was a8cdcbf`) or find the branch's last commit in `git reflog`, then `git branch <name> <hash>`. If the reflog has nothing (e.g. you never checked it out), `git fsck --unreachable --no-reflogs` lists unreachable commits.

</details>

## Advanced

### Q5. What can't the reflog help with?

**Style:** Trap

<details>
<summary>Answer</summary>

Uncommitted changes destroyed by `reset --hard`, `restore`, `checkout -- file` or `clean` (never stored as commits); commits that only existed in another clone (reflogs aren't shared); and commits pruned after their reflog entries expired (default 30 days for unreachable entries) and garbage collection ran.

</details>
