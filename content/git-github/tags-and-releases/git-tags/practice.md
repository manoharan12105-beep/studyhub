# Lightweight and Annotated Tags — Practice

### P1. Release tag

**Difficulty:** Easy · **Type:** Command · **Concepts:** annotated tags

Create an annotated tag `v1.1.0` on the current commit with the message "Release 1.1.0", then push only that tag.

<details>
<summary>Answer</summary>

```bash
git tag -a v1.1.0 -m "Release 1.1.0"
git push origin v1.1.0
```

</details>

### P2. Which type?

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** tag objects

`git cat-file -t v2.0.0` prints `commit`. Is `v2.0.0` annotated or lightweight?

<details>
<summary>Answer</summary>

Lightweight — the ref points directly at a commit. An annotated tag would print `tag`.

</details>

### P3. Pushed tags

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** follow-tags

Which command pushes the current branch together with annotated tags that point at the commits being pushed, but not lightweight bookmarks?

- A) `git push --tags`
- B) `git push --follow-tags`
- C) `git push --all`
- D) `git push -u`

<details>
<summary>Answer</summary>

**Answer:** B) `git push --follow-tags`

`--tags` pushes every tag, including private lightweight ones.

</details>

### P4. Remove a bookmark everywhere

**Difficulty:** Medium · **Type:** Command · **Concepts:** deleting tags

Delete tag `try-cache` locally and on `origin`.

<details>
<summary>Answer</summary>

```bash
git tag -d try-cache
git push origin --delete try-cache
```

</details>

### P5. Moved tag

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** moving published tags

Arjun moved `v1.0.1` to a different commit with `git tag -f` and pushed it with `--force`. Your `git fetch` still shows the old `v1.0.1`. Why, and what does this tell you about moving tags?

<details>
<summary>Answer</summary>

Git doesn't overwrite an existing local tag on fetch: a plain `git fetch` silently keeps the old one, and `git fetch --tags` reports `! [rejected] v1.0.1 -> v1.0.1 (would clobber existing tag)` (captured in the lab). You'd need `git fetch --tags --force` or to delete your tag first. Different clones now disagree about what `v1.0.1` means — exactly why published tags should never move; release `v1.0.2` instead.

</details>
