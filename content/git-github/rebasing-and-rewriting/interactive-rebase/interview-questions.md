# Interactive Rebase: Reorder, Squash, Reword, Edit — Interview Questions

## Beginner

### Q1. How do you combine your last three commits into one?

**Style:** How

<details>
<summary>Answer</summary>

`git rebase -i HEAD~3`, keep the first line as `pick`, change the other two to `squash` (or `fixup` to discard their messages), save, and write the combined message. Alternatively `git reset --soft HEAD~3` then `git commit`. If the commits were pushed to a branch only you use, publish with `git push --force-with-lease`.

</details>

## Intermediate

### Q2. What's the difference between `squash` and `fixup`?

**Style:** Comparison

<details>
<summary>Answer</summary>

Both meld the commit into the one above it. `squash` opens the editor with both messages so you can write a combined one; `fixup` keeps only the previous commit's message and discards this one's (unless `fixup -C`).

</details>

### Q3. How does `--autosquash` work?

**Style:** How

<details>
<summary>Answer</summary>

Commits created with `git commit --fixup=<hash>` (or `--squash=<hash>`) get a message starting `fixup! <target subject>`. `git rebase -i --autosquash` moves each such commit directly under its target and sets its command to `fixup` (or `squash`), so you only confirm the list.

</details>

### Q4. How do you change something in a commit that is five commits back?

**Style:** How

<details>
<summary>Answer</summary>

`git rebase -i HEAD~6`, mark that commit `edit`, save. When the rebase stops, change the files, `git add`, `git commit --amend`, then `git rebase --continue`. Or make a `git commit --fixup=<hash>` and autosquash it.

</details>

## Advanced

### Q5. How can you prove every commit on a cleaned-up branch still builds?

**Style:** How

<details>
<summary>Answer</summary>

Add `exec` lines (or run `git rebase -i --exec "mvn -q -B verify" main`): Git runs the command after each commit and stops at the first failure, letting you fix that commit before continuing. This keeps history bisectable.

</details>
