# Git Configuration: Levels, Identity and Defaults — Practice

### P1. Which value wins?

**Difficulty:** Easy · **Type:** Output prediction · **Concepts:** precedence

`~/.gitconfig` sets `user.email = priya@example.com`; the repository's `.git/config` sets `user.email = priya.work@example.com`. Inside that repository, what does `git config user.email` print?

- A) `priya@example.com`
- B) `priya.work@example.com`
- C) Both values, one per line
- D) An error about a duplicate key

<details>
<summary>Answer</summary>

**Answer:** B) `priya.work@example.com`

Local configuration overrides global configuration.

</details>

### P2. First-time setup

**Difficulty:** Easy · **Type:** Command · **Concepts:** identity, default branch

Write the commands that set your name to "Arjun Mehta", your email to `arjun@example.com` and the default branch for new repositories to `main`, for every repository on your account.

<details>
<summary>Answer</summary>

```bash
git config --global user.name "Arjun Mehta"
git config --global user.email "arjun@example.com"
git config --global init.defaultBranch main
```

</details>

### P3. Empty commit message

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** core.editor

After `git config --global core.editor code`, every `git commit` (without `-m`) aborts with "Aborting commit due to empty commit message." immediately. Why, and what is the fix?

<details>
<summary>Answer</summary>

`code` starts VS Code and returns at once, so Git reads the message file before you have typed anything. Use `git config --global core.editor "code --wait"` so the command waits until you close the tab.

</details>

### P4. Where does it come from?

**Difficulty:** Medium · **Type:** Command · **Concepts:** show-origin

A commit was made with the email `old@example.com`, but `~/.gitconfig` contains your new email. Which single command shows the effective `user.email` in this repository together with the file that sets it?

<details>
<summary>Answer</summary>

`git config --show-origin user.email` (add `--show-scope` to see the level). A local `.git/config` override, or a file included by `includeIf`, is the usual culprit.

</details>
