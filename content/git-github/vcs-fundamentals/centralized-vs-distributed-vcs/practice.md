# Centralized vs Distributed Version Control — Practice

### P1. Where is the history?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** distributed model

In Git, where does the complete project history live?

- A) Only on GitHub
- B) Only on the first developer's machine
- C) In every clone of the repository
- D) In a central database that every commit contacts

<details>
<summary>Answer</summary>

**Answer:** C) In every clone of the repository

Each clone contains the whole history (up to its last fetch). GitHub is one more copy, used as the shared source of truth.

</details>

### P2. Offline commit

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** offline work

Which statement is true for Subversion but **false** for Git?

- A) You can edit files without a network connection
- B) Committing requires contacting the server
- C) History can be viewed with a command
- D) Several developers can work on the same project

<details>
<summary>Answer</summary>

**Answer:** B) Committing requires contacting the server

An SVN commit writes to the central server. A Git commit writes to your local repository.

</details>

### P3. Pick a system

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** trade-offs

A game studio stores hundreds of gigabytes of textures and needs artists to lock a file while they edit it. Why might a centralized system (or Git with extensions) be considered here?

<details>
<summary>Answer</summary>

Every Git clone downloads the full history, which is expensive for huge binary files, and binary files cannot be merged, so exclusive locks matter. Centralized systems support partial checkouts and file locking natively; Git needs Git LFS (which also offers locking) and sparse checkout to approach that.

</details>

### P4. Shared or not?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** commit vs push

Arjun says: "I committed the fix an hour ago, so the team has it." Using the distributed model, explain what is wrong and what he must do.

<details>
<summary>Answer</summary>

A Git commit only exists in his local repository. Teammates get it only after he pushes it to the shared remote (`git push`) and they fetch or pull it.

</details>
