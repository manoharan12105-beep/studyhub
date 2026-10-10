# .gitignore and Tracking Files — Interview Questions

## Beginner

### Q1. What is `.gitignore` used for?

**Style:** What

<details>
<summary>Answer</summary>

It lists patterns for untracked files Git should ignore — build output, logs, IDE settings, local configuration and secrets. Ignored files don't appear in `git status` and aren't added by `git add .`. It is committed so the team shares the rules.

</details>

### Q2. What's the difference between tracked, untracked and ignored files?

**Style:** Comparison

<details>
<summary>Answer</summary>

Tracked files are in the last commit or the index; Git reports their changes. Untracked files exist on disk but were never added (`??`). Ignored files are untracked files that match an ignore rule, so Git hides them (`!!` with `--ignored`).

</details>

## Intermediate

### Q3. You added `config.properties` to `.gitignore`, but Git still shows it as modified. Why, and how do you fix it?

**Style:** Debugging

<details>
<summary>Answer</summary>

The file is already tracked, and `.gitignore` only affects untracked files. Run `git rm --cached config.properties`, commit that together with the `.gitignore` change, and the file becomes ignored while staying on disk. Old commits still contain it.

</details>

### Q4. Why doesn't `!logs/keep.log` work after `logs/`?

**Style:** Trap

<details>
<summary>Answer</summary>

When a directory is excluded, Git does not look inside it, so a rule for a file inside can never re-include it. Ignore the directory's contents instead (`logs/*` then `!logs/keep.log`).

</details>

## Advanced

### Q5. Where can ignore rules live, and when would you use each?

**Style:** How

<details>
<summary>Answer</summary>

`.gitignore` files in the repository (shared project rules), `.git/info/exclude` (personal rules for one clone, not committed) and a global excludes file set with `core.excludesFile` (personal rules for all repositories, such as `.DS_Store` or editor backups). Personal clutter belongs in the last two so the project file stays about the project.

</details>

### Q6. A teammate untracked `application-local.properties` with `git rm --cached` and pushed. What happens to your copy when you pull?

**Style:** What happens if

<details>
<summary>Answer</summary>

The pulled commit deletes the file from tracking, so Git removes it from your working tree. If you had local settings in it, copy them aside before pulling (or restore the file from the previous commit with `git show HEAD~1:path > path` afterwards). It is then ignored and stays local.

</details>
