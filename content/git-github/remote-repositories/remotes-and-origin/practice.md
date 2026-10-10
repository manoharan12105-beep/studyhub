# Remotes, origin and Remote-Tracking Branches — Practice

### P1. What is origin/main?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** remote-tracking branch

`origin/main` is best described as:

- A) A live view of `main` on GitHub
- B) Your local record of the remote's `main` at your last fetch, pull or push
- C) A branch you commit to before pushing
- D) A copy of your local `main`

<details>
<summary>Answer</summary>

**Answer:** B) Your local record of the remote's `main` at your last fetch, pull or push

</details>

### P2. Add a remote

**Difficulty:** Easy · **Type:** Command · **Concepts:** git remote add

Add a remote called `origin` with URL `https://github.com/your-username/gradebook.git`, then list remotes with their URLs.

<details>
<summary>Answer</summary>

```bash
git remote add origin https://github.com/your-username/gradebook.git
git remote -v
```

</details>

### P3. Stale view

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** fetch updates tracking branches

Arjun says he pushed `feature/report` ten minutes ago, but `git branch -a` doesn't list `remotes/origin/feature/report`. Why, and what fixes it?

<details>
<summary>Answer</summary>

Remote-tracking branches only update when you communicate with the remote. Run `git fetch` (or `git fetch origin`); the new branch then appears.

</details>

### P4. Fork setup

**Difficulty:** Medium · **Type:** Command · **Concepts:** multiple remotes

You cloned your fork (`origin`). Add the original project `https://github.com/your-org/gradebook.git` as a second remote named `upstream` and download its branches.

<details>
<summary>Answer</summary>

```bash
git remote add upstream https://github.com/your-org/gradebook.git
git fetch upstream
```

</details>
