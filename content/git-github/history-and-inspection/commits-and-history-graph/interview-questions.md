# Commits, Hashes and the History Graph — Interview Questions

## Beginner

### Q1. What is a commit hash?

**Style:** What

<details>
<summary>Answer</summary>

The commit's unique id: a cryptographic hash (SHA-1 by default, 40 hex characters) of the commit's contents — tree, parents, author, committer and message. Any unique prefix (usually 7+ characters) can be used to refer to it.

</details>

### Q2. What is a parent commit?

**Style:** What

<details>
<summary>Answer</summary>

The commit a new commit was built on. Most commits have one parent; the first commit (root) has none; a merge commit has two or more — the first parent is the branch you were on, the others are the branches merged in.

</details>

## Intermediate

### Q3. Why is Git history called a directed acyclic graph?

**Style:** Why

<details>
<summary>Answer</summary>

Each commit points to its parent(s), giving directed edges; merges give a commit several parents and branches give a commit several children, so it's a graph rather than a line. It is acyclic because a commit's id includes its parents' ids — a commit can't be its own ancestor.

</details>

### Q4. Why does amending or rebasing a commit change its hash?

**Style:** What happens internally

<details>
<summary>Answer</summary>

The hash is computed from the commit's contents, including the committer timestamp and parent id. Amend changes the content or timestamp; rebase changes the parent. A different content means a different hash, and every descendant also gets a new hash because its parent id changed.

</details>

## Advanced

### Q5. Does a commit know which branch it was made on?

**Style:** Trap

<details>
<summary>Answer</summary>

No. A commit stores only tree, parents, author, committer and message. Branches are separate refs pointing at commits; the merge message ("Merge branch 'feature/x'") is the only trace of a branch name, and it's just text. `git branch --contains <commit>` tells you which current branches can reach it.

</details>
