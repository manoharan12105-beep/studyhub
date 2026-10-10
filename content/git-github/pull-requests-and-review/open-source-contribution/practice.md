# Contributing to Open Source: Forks, Upstream and Sync — Practice

### P1. Where to push

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** fork remotes

In a fork workflow without write access to the original project, you push your branch to:

- A) `upstream`
- B) `origin` (your fork)
- C) Both
- D) Neither — you email a patch

<details>
<summary>Answer</summary>

**Answer:** B) `origin` (your fork)

</details>

### P2. Sync commands

**Difficulty:** Medium · **Type:** Command · **Concepts:** syncing a fork

Write the four commands that bring your fork's `main` (local and on GitHub) up to date with `upstream/main`.

<details>
<summary>Answer</summary>

```bash
git fetch upstream
git switch main
git merge --ff-only upstream/main
git push origin main
```

</details>

### P3. Tracking surprise

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** upstream tracking

After `git switch -c fix/typo upstream/main` and a commit, `git push` fails with "The upstream branch of your current branch does not match the name of your current branch" and suggests `git push upstream HEAD:main`. Why, and what's the right fix?

<details>
<summary>Answer</summary>

The branch was set to track `upstream/main` (the original project). Following the hint would push to the original project's `main` — wrong, and refused anyway without write access. Run `git push -u origin fix/typo` to push to your fork and track it there.

</details>

### P4. Diverged fork main

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** fork hygiene

You committed two changes directly on your fork's `main`, and now `git merge --ff-only upstream/main` fails. How do you recover so that `main` mirrors upstream and your changes aren't lost?

<details>
<summary>Answer</summary>

```bash
git switch main
git branch my-changes                  # keep your two commits on a branch
git reset --hard upstream/main         # main mirrors upstream (tree was clean)
git push --force-with-lease origin main
git switch my-changes && git rebase upstream/main
```

Then open a PR from `my-changes`.

</details>
