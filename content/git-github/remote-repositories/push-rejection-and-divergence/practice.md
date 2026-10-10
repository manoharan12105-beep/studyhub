# Push Rejection, Divergence and Force-with-Lease — Practice

### P1. Read the rejection

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** fetch first

```text
 ! [rejected]        main -> main (fetch first)
hint: Updates were rejected because the remote contains work that you do not
hint: have locally.
```

What happened, and is `--force` an appropriate response?

<details>
<summary>Answer</summary>

Someone pushed commits to `main` that you don't have. No — forcing would delete their commits. Fetch, integrate, then push.

</details>

### P2. The protective option

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** force-with-lease

Which option refuses to overwrite the remote branch if someone else pushed since your last fetch?

- A) `--force`
- B) `--force-with-lease`
- C) `--no-verify`
- D) `--set-upstream`

<details>
<summary>Answer</summary>

**Answer:** B) `--force-with-lease`

</details>

### P3. Stale info

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** lease rejection

`git push --force-with-lease` prints `! [rejected] feature/report -> feature/report (stale info)`. What does it mean and what should you do next?

<details>
<summary>Answer</summary>

The remote branch moved since your last fetch — someone else pushed to it. `git fetch`, look at their commits (`git log feature/report..origin/feature/report`), integrate them into your rewritten branch (e.g. rebase onto `origin/feature/report` or cherry-pick), then push again with the lease.

</details>

### P4. Sync sequence

**Difficulty:** Medium · **Type:** Command · **Concepts:** divergence

`git status -sb` shows `## main...origin/main [ahead 2, behind 3]` and your two commits are unpushed. Write the commands to get a linear history and publish it.

<details>
<summary>Answer</summary>

```bash
git fetch
git rebase origin/main      # or: git pull --rebase
# resolve conflicts if any, run the tests
git push
```

</details>

### P5. Pin the lease

**Difficulty:** Hard · **Type:** Command · **Concepts:** explicit lease

You rebased `feature/report`. Before rebasing, the remote branch was at `27e2ad6`. Push so that it only succeeds if the remote is still exactly at `27e2ad6`.

<details>
<summary>Answer</summary>

`git push --force-with-lease=feature/report:27e2ad6 origin feature/report`

</details>
