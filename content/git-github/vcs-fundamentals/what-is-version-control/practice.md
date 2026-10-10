# What Is Version Control? — Practice

### P1. What a version records

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** version metadata

Which of these is **not** normally stored with a version (commit)?

- A) The author's name and email
- B) A message describing the change
- C) The name of the editor used to make the change
- D) A link to the previous version

<details>
<summary>Answer</summary>

**Answer:** C) The name of the editor used to make the change

A version stores content plus author, timestamp, message and parent. The tool you edited with is irrelevant to history.

</details>

### P2. Manual copies

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** manual backups

A team keeps `project-final`, `project-final-v2` and `project-final-v2-fixed`. Name two questions they cannot answer quickly that version control answers in one command.

<details>
<summary>Answer</summary>

Any two of: exactly which lines differ between two copies; who made a particular change; why it was made; when a specific line last changed; which copy was released.

</details>

### P3. Backup or not?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** local history

A student commits every day to a Git repository on their laptop and never pushes. The laptop is stolen. What is lost, and which single habit would have prevented it?

<details>
<summary>Answer</summary>

Everything — the working files and the whole history live on the same disk. Pushing regularly to a remote repository (for example on GitHub) keeps a second copy of every pushed commit.

</details>

### P4. Choose the recovery

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** undoing one change

Version 4 of a project broke a feature; versions 5 and 6 added unrelated, working features. What should version control let you do, and why is restoring a copy of version 3 a poor choice?

<details>
<summary>Answer</summary>

Undo only the change made in version 4 while keeping versions 5 and 6. Restoring version 3 would also throw away the good work in versions 5 and 6.

</details>
