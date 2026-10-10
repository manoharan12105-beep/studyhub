# Troubleshooting Conflicts, Ignored Files and Line Endings — Practice

### P1. Who ignores it?

**Difficulty:** Easy · **Type:** Command · **Concepts:** check-ignore

`git add src/main/resources/app.log.template` says the path is ignored. Which command shows the exact rule?

<details>
<summary>Answer</summary>

`git check-ignore -v src/main/resources/app.log.template` (in the lab it printed `.gitignore:1:*.log*	src/main/resources/app.log.template`).

</details>

### P2. Read --eol

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** line endings

What does `i/lf    w/crlf  attr/  	src/App.java` tell you?

<details>
<summary>Answer</summary>

The file is stored with LF endings in the repository (index) but has CRLF in your working directory, and no `.gitattributes` rule applies to it.

</details>

### P3. Line-ending policy

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** .gitattributes

Write a `.gitattributes` that normalises text files to LF, keeps Windows `.cmd` scripts as CRLF, and marks `.jar` files as binary — and the command to re-apply it to existing files.

<details>
<summary>Answer</summary>

```text
* text=auto eol=lf
*.cmd text eol=crlf
*.jar binary
```

`git add --renormalize .`, then commit.

</details>

### P4. Too many rebase conflicts

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** abort, alternatives

Rebasing your 12-commit branch onto `main` produces the same conflict in commit after commit. What are your options?

<details>
<summary>Answer</summary>

`git rebase --abort`, then either merge `main` into the branch (resolve once), squash your commits first and rebase the single commit, or enable `rerere` so repeated identical conflicts are resolved automatically.

</details>

### P5. Leftover markers

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** conflict check

Which command reports leftover conflict markers before you commit?

- A) `git status`
- B) `git diff --check`
- C) `git log --merge`
- D) `git add`

<details>
<summary>Answer</summary>

**Answer:** B) `git diff --check`

It reports "leftover conflict marker" lines; `git add` accepts the file regardless.

</details>
