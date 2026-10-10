# Searching Code and History — Interview Questions

## Beginner

### Q1. Why use `git grep` instead of `grep -r`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git grep` searches only tracked files, so it skips build output and ignored files; it's fast because it uses Git's index; and it can search any commit or branch without checking it out (`git grep pattern <commit>`).

</details>

## Intermediate

### Q2. How do you find the commit that introduced a method call?

**Style:** How

<details>
<summary>Answer</summary>

`git log -S "methodName(" --oneline --all` — the pickaxe lists commits where the number of occurrences changed; the oldest is where it was introduced. Add `-p` to see the diff, and `-- <path>` to narrow the search.

</details>

### Q3. What's the difference between `git log -S` and `git log -G`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`-S <string>` selects commits that change the number of occurrences of the string — additions and removals. `-G <regex>` selects commits whose diff adds or removes any line matching the regex — including edits that keep the count the same. Changing `>= 75` to `>= 78` on a `return 'B'` line is found by `-G "return .B."` but not by `-S "return 'B'"`.

</details>

## Advanced

### Q4. How would you find whether a password string ever existed in a repository's history?

**Style:** Scenario

<details>
<summary>Answer</summary>

`git log --all -S "the-string" --oneline` finds commits that added or removed it on any branch; `git grep "the-string" $(git rev-list --all)` searches every commit's files. If found, treat it as leaked: rotate it, then consider history remediation.

</details>
