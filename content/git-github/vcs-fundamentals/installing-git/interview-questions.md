# Installing Git and Getting Help — Interview Questions

## Beginner

### Q1. How do you check which version of Git is installed?

**Style:** What

<details>
<summary>Answer</summary>

`git --version`. It prints, for example, `git version 2.52.0`. The version matters because some commands are newer — `git switch` and `git restore` arrived in Git 2.23.

</details>

### Q2. What is the difference between `git help log` and `git log -h`?

**Style:** Comparison

<details>
<summary>Answer</summary>

`git help log` (same as `git log --help`) opens the full manual page with every option explained. `git log -h` prints a short usage summary directly in the terminal — quick when you only need to recall an option name.

</details>

## Intermediate

### Q3. What does "fatal: not a git repository (or any of the parent directories): .git" mean?

**Style:** Debugging

<details>
<summary>Answer</summary>

Git searched the current directory and every parent directory for a `.git` directory and found none, so the command has no repository to work on. Change into the project folder, or create a repository with `git init` or `git clone`.

</details>
