# Lightweight and Annotated Tags — Interview Questions

## Beginner

### Q1. What is a Git tag?

**Style:** What

<details>
<summary>Answer</summary>

A named reference to a specific commit that doesn't move, typically used to mark releases (`v1.0.0`). Unlike a branch, committing doesn't advance it.

</details>

### Q2. What is the difference between a lightweight and an annotated tag?

**Style:** Comparison

<details>
<summary>Answer</summary>

A lightweight tag is just a ref pointing at a commit. An annotated tag (`git tag -a`) creates a tag object with the tagger, date and message (optionally a signature) that points at the commit. Use annotated tags for releases; `git describe` only uses annotated tags by default.

</details>

## Intermediate

### Q3. Why didn't your teammates get the tag you created?

**Style:** Debugging

<details>
<summary>Answer</summary>

`git push` doesn't push tags. Push it explicitly (`git push origin v1.0.0`) or use `git push --follow-tags`; teammates then receive it with their next fetch.

</details>

### Q4. What does `v1.0.0-3-g2adc903` from `git describe` mean?

**Style:** What

<details>
<summary>Answer</summary>

The current commit is 3 commits after the nearest annotated tag `v1.0.0`, and its abbreviated hash is `2adc903` (the `g` stands for git). It's a unique, human-readable version string for builds between releases.

</details>

## Advanced

### Q5. You tagged and pushed `v1.2.0` on the wrong commit. What do you do?

**Style:** Scenario

<details>
<summary>Answer</summary>

If nobody could have fetched it yet, delete and recreate it (`git tag -d`, `git push origin --delete v1.2.0`, tag the right commit, push). If it may have been fetched or artifacts were built from it, don't move it — Git doesn't update existing tags on fetch, so clones would disagree. Publish `v1.2.1` from the correct commit and mark the bad release as such.

</details>
