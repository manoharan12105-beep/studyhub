# .gitignore and Tracking Files — Practice

### P1. Read the short status

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** status codes

What does each line mean?

```text
?? notes.md
!! target/
 M pom.xml
```

<details>
<summary>Answer</summary>

`notes.md` is untracked; `target/` is ignored (shown only with `--ignored`); `pom.xml` is tracked and modified but not staged.

</details>

### P2. Pick the pattern

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** patterns

Which pattern ignores Maven's `target` directory at the repository root only, but not a `src/main/resources/target/` folder?

- A) `target`
- B) `target/`
- C) `/target/`
- D) `**/target/`

<details>
<summary>Answer</summary>

**Answer:** C) `/target/`

A leading slash anchors the pattern to the folder containing the `.gitignore`. `target/` and `**/target/` match at any depth.

</details>

### P3. Keep one file

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** negation

Write `.gitignore` rules that ignore everything inside `logs/` except `logs/README.md`.

<details>
<summary>Answer</summary>

```text
logs/*
!logs/README.md
```

`logs/` (the directory itself) would not work: an excluded directory is never searched, so the negation could not apply.

</details>

### P4. Already committed

**Difficulty:** Medium · **Type:** Command · **Concepts:** git rm --cached

The `target/` directory was committed last week. Write the commands that stop tracking it, keep it on disk and record the change.

<details>
<summary>Answer</summary>

```bash
echo "target/" >> .gitignore
git rm -r --cached target/
git add .gitignore
git commit -m "Stop tracking build output"
```

</details>

### P5. Why is it ignored?

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** check-ignore

A new file `src/main/resources/app.log.template` refuses to show up in `git status`. Which command tells you the exact rule responsible, and which rule is the likely culprit?

<details>
<summary>Answer</summary>

`git check-ignore -v src/main/resources/app.log.template`. A pattern such as `*.log*` or `*.log.*` would match it (`*.log` alone would not, because the name doesn't end in `.log`). Fix the pattern or add a negation such as `!*.log.template`.

</details>

### P6. Secret already pushed

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** secrets, history

`.env` with a database password was pushed to a shared repository a month ago. A teammate proposes: "Add `.env` to `.gitignore` and run `git rm --cached .env` — problem solved." What is wrong with this plan, and what must happen first?

<details>
<summary>Answer</summary>

It only stops tracking the file from now on; the password remains in every earlier commit and in every clone. First revoke/rotate the password so the leaked value is useless, then untrack and ignore the file; removing it from history (with a history-rewriting tool) is an optional, coordinated clean-up — never a substitute for rotation.

</details>
