# Troubleshooting Remotes and Pushes — Practice

### P1. Get the branch

**Difficulty:** Easy · **Type:** Command · **Concepts:** fetch, tracking

Arjun pushed `feature/csv-export` an hour ago. Get it as a local branch tracking the remote.

<details>
<summary>Answer</summary>

```bash
git fetch
git switch feature/csv-export
```

</details>

### P2. Read the fetch line

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** forced update

`git fetch` prints ` + 3a070e0...550dd7f main -> origin/main  (forced update)`. What happened on the server?

<details>
<summary>Answer</summary>

Someone force-pushed `main`: it moved from `3a070e0` to `550dd7f` in a way that isn't a fast-forward, so commits reachable only from `3a070e0` are no longer on the remote `main`.

</details>

### P3. Recover the old tip

**Difficulty:** Hard · **Type:** Command · **Concepts:** remote-tracking reflog

On your clone (which fetched before the force push), show the commit `origin/main` pointed to before the forced update.

<details>
<summary>Answer</summary>

`git log --oneline -1 origin/main@{1}` (or inspect `git reflog show origin/main`).

</details>

### P4. Which group?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** classifying remote problems

Classify each message: (a) `Permission denied (publickey)`; (b) `! [rejected] main -> main (fetch first)`; (c) `Your branch and 'origin/main' have diverged`.

<details>
<summary>Answer</summary>

(a) Can't authenticate (SSH key not loaded or registered). (b) Remote refuses the update (not a fast-forward). (c) Local and remote disagree (both have unique commits) — integrate first.

</details>

### P5. Wrong upstream

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** set-upstream

`git branch -vv` shows `* feature/report 1a2b3c4 [origin/main: ahead 3]`, and `origin/feature/report` already exists. Fix the upstream.

<details>
<summary>Answer</summary>

`git branch --set-upstream-to=origin/feature/report`

</details>
