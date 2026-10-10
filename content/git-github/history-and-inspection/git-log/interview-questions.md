# git log: Reading and Filtering History — Interview Questions

## Beginner

### Q1. How do you view a compact history of a repository with its branches?

**Style:** How

<details>
<summary>Answer</summary>

`git log --oneline --graph --decorate --all` — one line per commit, the commit graph drawn in ASCII, branch and tag labels, and every branch rather than only the current one.

</details>

### Q2. How do you see the history of a single file?

**Style:** How

<details>
<summary>Answer</summary>

`git log -- path/to/File.java` lists commits that touched it; add `--follow` to continue across renames and `-p` to see each change.

</details>

## Intermediate

### Q3. How do you find all commits by one developer last week?

**Style:** How

<details>
<summary>Answer</summary>

`git log --author="Arjun" --since="2026-10-01 00:00" --until="2026-10-07 23:59" --oneline`. `--author` matches a substring or regex of the name or email. Include times in dates, because a date alone uses the current time of day.

</details>

### Q4. What is the difference between `--grep` and `-S`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`--grep` searches commit **messages**. `-S <string>` (the pickaxe) finds commits whose **diff** changes the number of occurrences of a string in the code — i.e. commits that added or removed it.

</details>

## Advanced

### Q5. What does `git log --first-parent` show, and when is it useful?

**Style:** What

<details>
<summary>Answer</summary>

It follows only the first parent of each merge, which on `main` is the main line itself: merge commits appear, but the feature-branch commits they brought in don't. Useful for a release-level view of a branch where features arrive through merges or pull requests.

</details>
