# Centralized vs Distributed Version Control — Interview Questions

## Beginner

### Q1. What is the difference between centralized and distributed version control?

**Style:** Comparison

<details>
<summary>Answer</summary>

In a centralized system (SVN), one server holds the complete history and developers have working copies; commits and history queries go to the server. In a distributed system (Git), every clone contains the full history, commits are local, and repositories exchange commits with push and pull.

</details>

### Q2. Can you commit in Git without an internet connection?

**Style:** What

<details>
<summary>Answer</summary>

Yes. `git commit` writes to your local repository. You need the network only to exchange commits with another repository (`git fetch`, `git pull`, `git push`).

</details>

## Intermediate

### Q3. Git vs SVN — give three practical differences.

**Style:** Comparison

<details>
<summary>Answer</summary>

1. **History location:** every Git clone has the full history; SVN keeps it on the server.
2. **Commit vs share:** a Git commit is local and shared later by push; an SVN commit goes straight to the server.
3. **Branching:** a Git branch is a lightweight pointer created instantly and locally; an SVN branch is a server-side directory copy.

A fair answer also notes where SVN is stronger: file locking, partial checkouts and very large binary assets.

</details>

### Q4. If GitHub is down for a day, what can a Git team still do?

**Style:** Scenario

<details>
<summary>Answer</summary>

Everything local: commit, branch, merge, rebase, view history and diffs. What stops is sharing through GitHub — pushes, pulls, pull requests and CI triggered by GitHub. Developers can still exchange commits another way (another remote, `git bundle`) if needed.

</details>

## Advanced

### Q5. What is the main risk the distributed model introduces?

**Style:** Trap

<details>
<summary>Answer</summary>

Work that is committed but never pushed exists only on one machine, and branches can drift apart for a long time. Committing feels safe, but it is not shared or backed up until it is pushed. Teams counter this with short-lived branches and frequent pushes.

</details>
