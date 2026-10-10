# Git Configuration: Levels, Identity and Defaults — Interview Questions

## Beginner

### Q1. What are the configuration levels in Git, and which takes precedence?

**Style:** What

<details>
<summary>Answer</summary>

System (all users, Git's `etc/gitconfig`), global (your user, `~/.gitconfig`) and local (one repository, `.git/config`). The most specific wins: local overrides global, which overrides system.

</details>

### Q2. Why must you set `user.name` and `user.email` before committing?

**Style:** Why

<details>
<summary>Answer</summary>

Every commit permanently stores an author name and email taken from these settings. Wrong or guessed values end up in history, and GitHub attributes commits to accounts by email.

</details>

## Intermediate

### Q3. How do you use a different email for work repositories?

**Style:** How

<details>
<summary>Answer</summary>

Set it locally inside each work repository (`git config user.email work@company.example`), or add an `includeIf "gitdir:~/work/"` section to `~/.gitconfig` that includes a file with the work identity for every repository under that folder.

</details>

### Q4. Your commits on GitHub show a grey avatar and aren't linked to your profile. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

GitHub links commits by the author email. The email in those commits (`git log --format='%ae'`) is not a verified email on your account. Add it to your account, or set `user.email` to an account email (or your GitHub no-reply address) for future commits.

</details>

## Advanced

### Q5. How do you find out why Git uses a particular setting value?

**Style:** Debugging

<details>
<summary>Answer</summary>

`git config --show-origin --show-scope <key>` shows the effective value with the file and level it comes from; `git config --list --show-origin` lists every value from every file, so you can spot a local override or an `includeIf` file.

</details>
