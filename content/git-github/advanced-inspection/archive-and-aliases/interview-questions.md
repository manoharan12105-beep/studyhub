# git archive, Useful Aliases and Efficient Investigation — Interview Questions

## Beginner

### Q1. How do you create a ZIP of exactly version 1.1.0 of a project?

**Style:** How

<details>
<summary>Answer</summary>

`git archive --format=zip --prefix=gradebook-1.1.0/ -o gradebook-1.1.0.zip v1.1.0` — it contains only tracked files from that tag, without `.git`, build output or uncommitted changes.

</details>

## Intermediate

### Q2. What is a Git alias, and how is a `!` alias different?

**Style:** Comparison

<details>
<summary>Answer</summary>

An alias defines a shortcut subcommand in configuration (`alias.lg = log --oneline --graph`). A normal alias expands to Git arguments; an alias starting with `!` runs the rest as a shell command, so it can chain commands or call other programs — and therefore deserves the same caution as any script.

</details>

## Advanced

### Q3. Walk me through investigating "grades changed after the last release".

**Style:** Scenario

<details>
<summary>Answer</summary>

`git log --oneline v1.0.0..main` for candidate commits; `git diff v1.0.0 main --stat` for touched files; `git log -G "return '[A-F]'" -p -- src/main` for grade-rule changes; `git blame` on the rule lines and `git show` for context and the PR; if still unclear, `git bisect run` with a script that checks a known grade; finally `git tag --contains <fix>` to see where a fix has shipped.

</details>
