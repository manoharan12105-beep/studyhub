# Installing Git and Getting Help — Practice

### P1. Quick usage

**Difficulty:** Easy · **Type:** Command · **Concepts:** help

You remember that `git log` can limit the number of commits shown but not the option's name. Which command shows a short summary of `git log`'s options in the terminal?

<details>
<summary>Answer</summary>

`git log -h`. (The option you are looking for is `-n <number>`, or simply `-<number>` such as `-5`.)

</details>

### P2. Read the error

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** repository discovery

You open a new terminal in your home directory and run `git status`. Your home directory is not inside any repository. What happens?

- A) Git prints `nothing to commit, working tree clean`
- B) Git creates a repository in your home directory
- C) Git prints `fatal: not a git repository (or any of the parent directories): .git`
- D) Git lists every file in your home directory as untracked

<details>
<summary>Answer</summary>

**Answer:** C) Git prints `fatal: not a git repository (or any of the parent directories): .git`

`git status` never creates a repository. It searches upwards for `.git` and fails if none exists.

</details>

### P3. New command missing

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** versions

On a lab machine, `git switch main` fails with `git: 'switch' is not a git command`. What is the likely cause and how do you confirm it?

<details>
<summary>Answer</summary>

The installed Git is older than 2.23, which introduced `git switch`. Confirm with `git --version`; upgrade Git, or use the older equivalent `git checkout main`.

</details>
