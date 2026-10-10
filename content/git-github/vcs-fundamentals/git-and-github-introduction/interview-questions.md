# Git and GitHub: What They Are — Interview Questions

## Beginner

### Q1. What is the difference between Git and GitHub?

**Style:** Comparison

<details>
<summary>Answer</summary>

Git is a distributed version control tool that runs on your machine: it records commits, manages branches and merges, and needs no account or network. GitHub is a web platform that hosts Git repositories and adds collaboration features — pull requests, code review, issues, permissions, releases and GitHub Actions.

</details>

### Q2. Can you use Git without GitHub?

**Style:** What

<details>
<summary>Answer</summary>

Yes. Git is complete on its own: you can create repositories, commit, branch, merge and view history locally. You can also share through other hosts (GitLab, Bitbucket), a self-hosted server, or even a bare repository on a network drive.

</details>

## Intermediate

### Q3. Is a pull request a Git feature?

**Style:** Trap

<details>
<summary>Answer</summary>

No. A pull request is a hosting-platform feature (GitHub, Bitbucket; GitLab calls it a merge request) built around Git branches: a proposal to merge one branch into another, with discussion, review and CI checks. The merge itself is a Git operation the platform performs.

</details>

### Q4. How would you move a project from GitHub to GitLab?

**Style:** How

<details>
<summary>Answer</summary>

The Git history moves with ordinary Git commands: create an empty GitLab project, add it as a remote and push all branches and tags (`git push --all` and `git push --tags`, or a mirror push). Issues, pull requests, reviews and CI configuration are platform data — they need GitLab's import tool or manual migration, and GitHub Actions workflows must be rewritten as GitLab CI.

</details>

## Advanced

### Q5. Describe how Git and GitHub each contribute to a team's change-delivery process.

**Style:** Follow-up

<details>
<summary>Answer</summary>

Git supplies the change units (commits), parallel work (branches), integration (merge/rebase) and history tools (log, blame, bisect, revert). GitHub supplies the shared source of truth, access control, pull requests where changes are reviewed, branch protection that enforces review and passing checks, and Actions that build, test and deploy on push or merge.

</details>
