# git push and Upstream Tracking — Interview Questions

## Beginner

### Q1. What does `git push -u origin feature/x` do?

**Style:** What

<details>
<summary>Answer</summary>

Pushes the local branch `feature/x` to the remote `origin` (creating it there if new) and sets `origin/feature/x` as its upstream, so later `git push`, `git pull` and `git status` work without naming the remote and branch.

</details>

### Q2. How do you delete a branch on the remote?

**Style:** How

<details>
<summary>Answer</summary>

`git push origin --delete feature/x` (older syntax: `git push origin :feature/x`). Others remove their stale `origin/feature/x` with `git fetch --prune`; their local branches remain until deleted.

</details>

## Intermediate

### Q3. What is an upstream branch?

**Style:** What

<details>
<summary>Answer</summary>

The remote-tracking branch a local branch is linked to (`branch.<name>.remote` and `.merge` in `.git/config`). It's the default target for push and pull and the reference for "ahead/behind" in `git status` and `git branch -vv`.

</details>

### Q4. Your branch shows `[origin/feature/x: gone]`. What does it mean?

**Style:** Debugging

<details>
<summary>Answer</summary>

The upstream branch was deleted on the remote and your `origin/feature/x` ref was pruned. The local branch still exists. If its work is merged, delete it (`git branch -d feature/x`); if not, push it again or set a new upstream.

</details>

## Advanced

### Q5. Why aren't tags pushed by `git push`, and how should releases be pushed?

**Style:** Why

<details>
<summary>Answer</summary>

Push sends branches by default so experimental local tags don't leak. Push release tags explicitly (`git push origin v1.2.0`), or use `git push --follow-tags`, which pushes annotated tags pointing at commits being pushed — a good default (`push.followTags=true`) that skips lightweight tags.

</details>
