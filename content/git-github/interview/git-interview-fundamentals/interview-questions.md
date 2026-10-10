# Git Interview Questions: Fundamentals — Interview Questions

## Beginner

### Q1. What is Git?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** Git is a free, distributed version control system that records snapshots of a project's files as commits.

**Explanation:** Every clone holds the full history; commits, branches and merges happen locally and are shared with push and fetch.

**Example:** I commit locally while offline and push to GitHub later.

**Misconception:** Git is not GitHub — GitHub is a hosting platform for Git repositories.

**Follow-up:** "What does distributed mean?" — every clone is a full repository.

</details>

### Q2. What is the difference between Git and GitHub?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** Git is the version control tool; GitHub is a web service that hosts Git repositories and adds collaboration features.

**Explanation:** Git works without any server or account; GitHub adds pull requests, code review, issues, permissions, releases and Actions.

**Example:** `git commit` is Git; opening a pull request is GitHub.

**Misconception:** "I committed to GitHub" — you commit locally and push to GitHub.

**Follow-up:** "Name alternatives to GitHub" — GitLab, Bitbucket.

</details>

### Q3. What is the difference between centralized and distributed version control?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** In centralized systems (SVN) the full history lives on one server; in distributed systems (Git) every clone has it.

**Explanation:** So Git commits, logs, diffs and branches are local and fast, and work continues offline; sharing is a separate push/fetch step.

**Example:** I can bisect or blame on a train without network.

**Misconception:** Distributed doesn't mean "no central repository" — teams still use a shared remote as the source of truth.

**Follow-up:** "Downside?" — unpushed work exists only on one machine.

</details>

### Q4. Explain the working directory, staging area and repository.

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** The working directory holds the files you edit, the staging area (index) holds the snapshot for the next commit, and the repository stores the commits.

**Explanation:** `git add` copies changes into the index; `git commit` records the index as a commit.

**Example:** I edit two files but stage only the bug fix, so the commit stays focused.

**Misconception:** `git commit` doesn't take your latest edits — only what's staged.

**Follow-up:** "Why have a staging area?" — to build focused commits, even from parts of a file (`git add -p`).

</details>

### Q5. What is a commit?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** A snapshot of the project plus metadata: author, committer, timestamps, message and parent commit(s), identified by a hash of all of that.

**Explanation:** Commits form a chain through their parents; changing any commit changes its id and its descendants' ids.

**Example:** `git cat-file -p HEAD` shows tree, parent, author, committer and message.

**Misconception:** A commit doesn't store a diff; diffs are computed by comparing snapshots.

**Follow-up:** "What is a commit hash?"

</details>

### Q6. What does `git status` show?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** The current branch, its relation to the upstream (ahead/behind), staged changes, unstaged changes, untracked files and any operation in progress.

**Explanation:** It compares HEAD with the index and the index with the working directory.

**Example:** `git status -sb` gives `## main...origin/main [ahead 1]` and two-column file codes.

**Misconception:** Ahead/behind is relative to your last fetch, not live.

**Follow-up:** "What does `MM` mean?" — staged and modified again.

</details>

### Q7. What is `.gitignore`?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** A committed file listing patterns of untracked files Git should ignore.

**Explanation:** Used for build output (`target/`), IDE files, logs and local secrets; shared with the team.

**Example:** `target/` and `*.log` in a Maven project.

**Misconception:** It doesn't affect files that are already tracked — use `git rm --cached`.

**Follow-up:** "How do you find which rule ignores a file?" — `git check-ignore -v`.

</details>

### Q8. What is a branch?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** A movable pointer to a commit.

**Explanation:** A small ref file holding a commit id; committing moves the current branch forward.

**Example:** `git switch -c feature/report` creates and switches instantly.

**Misconception:** A branch isn't a copy of the files.

**Follow-up:** "What is HEAD?" — a pointer to the current branch.

</details>

### Q9. What is HEAD?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** HEAD points to what you have checked out — normally the current branch.

**Explanation:** `.git/HEAD` contains `ref: refs/heads/main`; when HEAD holds a commit id directly, you're in detached HEAD.

**Example:** `HEAD~1` is the parent of the current commit.

**Misconception:** HEAD isn't always "the latest commit of main" — it's whatever you checked out.

**Follow-up:** "What is detached HEAD?"

</details>

### Q10. What is the difference between `git clone` and `git init`?

**Style:** Comparison

<details>
<summary>Answer</summary>

**Direct:** `git init` creates a new empty repository; `git clone` copies an existing one with its full history.

**Explanation:** Clone also sets up `origin`, remote-tracking branches and checks out the default branch.

**Example:** `git clone https://github.com/your-org/gradebook.git`.

**Misconception:** A clone isn't just the latest files — it's the whole history.

**Follow-up:** "What is `origin`?"

</details>

### Q11. What is `origin`?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** The default name for the remote you cloned from.

**Explanation:** It's just an alias for a URL in `.git/config`; `origin/main` is your local record of that remote's `main`.

**Example:** `git remote -v` shows its fetch and push URLs.

**Misconception:** `origin` isn't special or necessarily GitHub.

**Follow-up:** "What's `upstream` in a fork workflow?"

</details>

### Q12. What does `git push` do?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** Uploads your commits to a remote and moves the remote branch to your commit — only as a fast-forward by default.

**Explanation:** If the remote has commits you don't, the push is rejected so their work isn't lost.

**Example:** `git push -u origin feature/report` publishes a branch and sets its upstream.

**Misconception:** `git push` doesn't push tags by default.

**Follow-up:** "Your push was rejected — why?"

</details>

### Q13. What is a merge conflict?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** A situation where Git can't combine two branches automatically because both changed the same lines differently.

**Explanation:** Git marks the file with `<<<<<<<`, `=======`, `>>>>>>>` and waits; you edit, `git add`, and commit — or `git merge --abort`.

**Example:** Two developers changing the B-grade threshold to different values.

**Misconception:** A conflict-free merge isn't guaranteed to be correct — run the tests.

**Follow-up:** "How do you resolve one?"

</details>

### Q14. What makes a good commit message?

**Style:** What

<details>
<summary>Answer</summary>

**Direct:** A short imperative subject (about 50 characters) and, when needed, a body explaining why.

**Explanation:** History, blame and review rely on messages; the diff already shows what changed.

**Example:** "Reject an empty marks list in average()" plus "Fixes #12".

**Misconception:** "fix", "changes" or "WIP" are not messages.

**Follow-up:** "What is an atomic commit?"

</details>

### Q15. How do you see a project's history?

**Style:** How

<details>
<summary>Answer</summary>

**Direct:** `git log`, typically `git log --oneline --graph --decorate --all`.

**Explanation:** Filters like `--author`, `--since`, `--grep` and `-- <path>` narrow it down; `git show <hash>` displays one commit.

**Example:** `git log --oneline -- src/main/java/.../GradeCalculator.java`.

**Misconception:** `git log` shows only the current branch's history unless you add `--all` or name branches.

**Follow-up:** "How do you find who changed a line?" — `git blame`.

</details>
