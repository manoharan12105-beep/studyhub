# git archive, Useful Aliases and Efficient Investigation — Practice

### P1. Clean source bundle

**Difficulty:** Easy · **Type:** Command · **Concepts:** git archive

Create `gradebook.tar.gz` from the current commit with all files inside a top-level folder `gradebook/`.

<details>
<summary>Answer</summary>

`git archive --format=tar.gz --prefix=gradebook/ -o gradebook.tar.gz HEAD`

</details>

### P2. What's inside?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** archive contents

You have uncommitted edits to `README.md` and an ignored `target/` folder. What does `git archive -o out.zip HEAD` contain?

- A) Your edited README and `target/`
- B) The committed README, no `target/`
- C) The committed README and `target/`
- D) Nothing — archive refuses with uncommitted changes

<details>
<summary>Answer</summary>

**Answer:** B) The committed README, no `target/`

</details>

### P3. Define an alias

**Difficulty:** Easy · **Type:** Configuration · **Concepts:** aliases

Create a global alias `git hist` that shows the last 20 commits of all branches as a decorated one-line graph.

<details>
<summary>Answer</summary>

`git config --global alias.hist "log --oneline --graph --decorate --all -20"`

</details>

### P4. Risky alias

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** alias safety

A teammate suggests `git config --global alias.sync '!git fetch && git reset --hard origin/main'`. What's dangerous about it, and what's a safer version?

<details>
<summary>Answer</summary>

It silently discards uncommitted work and any local commits on whatever branch you're on, every time you type `git sync`. A safer version only fast-forwards: `!git fetch && git merge --ff-only @{u}` — it refuses if there's anything to lose.

</details>
