# Creating Repositories: git init, git clone and the .git Directory — Practice

### P1. After git init

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** git init

You run `git init` in a folder with three Java files. What is true immediately afterwards?

- A) The three files are committed
- B) The three files are staged
- C) A `.git` directory exists and the three files are untracked
- D) A remote named `origin` is configured

<details>
<summary>Answer</summary>

**Answer:** C) A `.git` directory exists and the three files are untracked

`git init` only creates the database. Nothing is staged or committed, and there is no remote.

</details>

### P2. Branch that isn't there

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** HEAD, first commit

In a brand-new repository, `.git/HEAD` contains `ref: refs/heads/main`, but `.git/refs/heads/` is empty. Explain.

<details>
<summary>Answer</summary>

HEAD names the branch you are on, but a branch is a file holding a commit id, and there is no commit yet. `refs/heads/main` is created by the first commit. Until then Git reports `No commits yet`.

</details>

### P3. What does a clone contain?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** git clone

Which of these does `git clone` **not** give you?

- A) The full commit history
- B) A remote named `origin`
- C) The remote's open pull requests and issues
- D) A checked-out default branch

<details>
<summary>Answer</summary>

**Answer:** C) The remote's open pull requests and issues

Pull requests and issues are hosting-platform data, not part of the Git repository.

</details>

### P4. Wrong folder

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** git init location

After running `git init`, `git status` lists `Documents/`, `Downloads/` and `Pictures/` as untracked. What happened, and how do you undo it safely?

<details>
<summary>Answer</summary>

`git init` ran in your home directory. Confirm with `git rev-parse --show-toplevel`; if it prints your home directory and that repository has no commits you need, remove only that `.git` directory (`rm -rf ~/.git` after double-checking the path). Then `cd` into the project and run `git init` there.

</details>

### P5. Shallow CI

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** shallow clone

A CI job uses `git clone --depth 1` and then runs `git log --oneline v1.2.0..HEAD` to build release notes. It fails. Why?

<details>
<summary>Answer</summary>

A depth-1 clone contains only the latest commit. Tags are fetched only when they point into the downloaded history, so `v1.2.0` (an older commit) is missing, and so are the commits between it and `HEAD`. Fetch more history (`git fetch --unshallow --tags`, or clone with enough depth and `--tags`) before computing the range.

</details>
