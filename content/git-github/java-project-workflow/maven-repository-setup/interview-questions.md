# Setting Up a Maven Project Repository — Interview Questions

## Beginner

### Q1. Which files of a Maven project should be committed, and which ignored?

**Style:** What

<details>
<summary>Answer</summary>

Commit `pom.xml`, `src/` (main and test, code and resources), the Maven wrapper (`mvnw`, `mvnw.cmd`, `.mvn/wrapper/`), README, `.gitignore`, `.gitattributes` and the license. Ignore `target/`, IDE metadata (`.idea/`, `*.iml`, `.vscode/`, Eclipse files), logs, OS files and local configuration or secrets.

</details>

## Intermediate

### Q2. Why commit the Maven wrapper?

**Style:** Why

<details>
<summary>Answer</summary>

So everyone — developers and CI — builds with the same Maven version without installing it: `./mvnw -B verify`. The wrapper's properties file pins the version; the scripts download it on first use.

</details>

### Q3. CI on Linux fails with `./mvnw: Permission denied`, although it works on your Windows laptop. Why?

**Style:** Debugging

<details>
<summary>Answer</summary>

Windows file systems don't have an executable bit, so Git (with `core.filemode=false`) recorded `mvnw` as mode 100644. Run `git update-index --chmod=+x mvnw` and commit; `git show --summary` shows `mode change 100644 => 100755`.

</details>

## Advanced

### Q4. `target/` was committed months ago. How do you clean it up?

**Style:** Scenario

<details>
<summary>Answer</summary>

Add `target/` to `.gitignore`, run `git rm -r --cached target/` and commit — the files stay on disk but are no longer tracked. Old commits still contain them; only a coordinated history rewrite would shrink the repository, which is rarely worth it unless the size is a real problem.

</details>
