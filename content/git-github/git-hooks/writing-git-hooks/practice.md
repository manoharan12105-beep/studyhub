# Writing Git Hooks — Practice

### P1. Exit status

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** blocking

What must a `pre-commit` hook do to stop the commit?

- A) Print "ERROR"
- B) Exit with a non-zero status
- C) Delete the index
- D) Exit with status 0

<details>
<summary>Answer</summary>

**Answer:** B) Exit with a non-zero status

</details>

### P2. Only added lines

**Difficulty:** Medium · **Type:** Command · **Concepts:** staged diff

In a hook, which command prints only the lines being added to `App.java` in this commit (no context lines, no `+++` header)?

<details>
<summary>Answer</summary>

`git diff --cached -U0 -- App.java | grep '^+[^+]'`

</details>

### P3. Write a commit-msg rule

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** commit-msg

Write a `commit-msg` hook that rejects messages whose subject doesn't start with an uppercase letter.

<details>
<summary>Answer</summary>

```bash
#!/bin/sh
subject=$(head -n 1 "$1")
case "$subject" in
    [A-Z]*) exit 0 ;;
    *) echo "commit-msg: start the subject with a capital letter" >&2; exit 1 ;;
esac
```

Make it executable and place it in the hooks directory.

</details>

### P4. Placeholder allowed

**Difficulty:** Medium · **Type:** Output prediction · **Concepts:** secret pattern

With the lesson's `pre-commit` hook, which of these staged lines is blocked: (a) `spring.datasource.password=${DB_PASSWORD}` (b) `app.api-key=abc123` (c) `// password is read from the environment`?

<details>
<summary>Answer</summary>

Only (b): `api-key` followed by `=` and a non-`$` character matches. (a) uses a placeholder (`$` after `=`), and (c) has no `=`/`:` after the word.

</details>

### P5. Bad interpreter

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** line endings

On a teammate's Linux machine every commit fails with `/bin/sh^M: bad interpreter`. What happened and how do you fix it for everyone?

<details>
<summary>Answer</summary>

The hook script was committed with Windows CRLF line endings, so the shebang line ends in a carriage return. Convert it to LF and add `.githooks/* text eol=lf` to `.gitattributes` so it's always checked out with LF.

</details>
