# Git Interview Questions: Command Comparisons

**Module:** Git Interview Preparation · **Interview priority:** Core

## Learning Objectives

- Answer the classic "X vs Y" Git questions precisely.
- Explain each pair by **what it changes** (working directory, index, branch, remote, history).
- Pick the right command for a given situation and justify it.

## What Is It?

Intermediate interviews lean heavily on comparisons: fetch vs pull, merge vs rebase, reset vs revert, restore vs reset, switch vs checkout, stash apply vs pop, clone vs fork, tag vs release, `--force` vs `--force-with-lease`. Each has a crisp answer rooted in Git's model.

## Why It Matters

Comparisons expose shallow knowledge quickly: someone who memorised "rebase makes history linear" stumbles on "when must you not rebase?". Framing every answer by *what changes where* keeps you accurate under follow-up pressure.

## The Comparison Framework

For any command, ask:

| Question | Example: `git reset --hard HEAD~1` | Example: `git revert HEAD` |
|----------|-----------------------------------|----------------------------|
| Moves a branch? | Yes, backwards | Yes, forwards (new commit) |
| Changes the index? | Yes | Yes (to the new commit) |
| Changes working files? | Yes, discards edits | Yes, applies the inverse |
| Rewrites history? | Yes | No |
| Touches the remote? | No | No |
| Safe on shared branches? | No | Yes |

The **Command Comparisons** revision sheet and the interactive comparison tables in this subject drill the same pairs.

## Key Takeaways

- Answer comparisons by listing what each command changes.
- Always include *when to use which* and the safety implication.
- Shared history → commands that add commits; private history → rewriting is fine.

## Related Topics

- [Fundamentals](../git-interview-fundamentals/content.md)
- [Advanced Questions](../git-interview-advanced/content.md)
- [Scenario Questions](../git-interview-scenarios/content.md)
