# Remotes, origin and Remote-Tracking Branches — Interview Questions

## Beginner

### Q1. What is `origin` in Git?

**Style:** What

<details>
<summary>Answer</summary>

The default name `git clone` gives to the remote repository you cloned from. It's only a name for a URL stored in `.git/config`; you can rename it or add other remotes such as `upstream`.

</details>

### Q2. What is the difference between a local and a remote repository?

**Style:** Comparison

<details>
<summary>Answer</summary>

The local repository is the full repository on your machine where you commit, branch and merge. A remote is another copy — typically on GitHub — that you synchronise with using fetch, pull and push. Both hold complete history; the remote is the team's shared copy.

</details>

## Intermediate

### Q3. What is a remote-tracking branch like `origin/main`?

**Style:** What

<details>
<summary>Answer</summary>

A read-only reference in your repository recording where `main` on the remote `origin` pointed at your last fetch, pull or push. It doesn't update by itself and you can't commit to it; it's what `git status` compares against when it says "ahead" or "behind".

</details>

### Q4. How do you switch an existing clone from HTTPS to SSH?

**Style:** How

<details>
<summary>Answer</summary>

`git remote set-url origin git@github.com:your-org/gradebook.git`, then check with `git remote -v` and test with `ssh -T git@github.com`. No re-clone is needed.

</details>

## Advanced

### Q5. Explain the refspec `+refs/heads/*:refs/remotes/origin/*`.

**Style:** What happens internally

<details>
<summary>Answer</summary>

It's the default fetch rule for `origin`: for every branch on the remote (`refs/heads/*`), update the matching ref under `refs/remotes/origin/*` locally. The leading `+` allows non-fast-forward updates, so if someone force-pushes a remote branch, your remote-tracking branch is updated anyway (and the fetch output shows `(forced update)`).

</details>
