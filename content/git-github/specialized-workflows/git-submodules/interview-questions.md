# Git Submodules — Interview Questions

## Beginner

### Q1. What is a Git submodule?

**Style:** What

<details>
<summary>Answer</summary>

A Git repository embedded inside another at a fixed path and pinned to a specific commit. The parent stores a `.gitmodules` entry (path and URL) and a gitlink (a tree entry with mode 160000 holding the commit id), not the submodule's files.

</details>

## Intermediate

### Q2. You cloned a repository and the `libs/rubric` folder is empty. Why, and what do you run?

**Style:** Debugging

<details>
<summary>Answer</summary>

Submodules aren't checked out by a plain clone. Run `git submodule update --init --recursive` (or clone with `--recurse-submodules` next time).

</details>

### Q3. How do you update a submodule to its latest version for the whole team?

**Style:** How

<details>
<summary>Answer</summary>

`git submodule update --remote <path>` (or fetch and check out the desired commit inside the submodule), test, then commit the changed pointer in the parent repository and push. Teammates run `git submodule update` after pulling.

</details>

## Advanced

### Q4. When would you avoid submodules, and what would you use instead?

**Style:** Trade-off

<details>
<summary>Answer</summary>

When the shared code can be consumed as a versioned package — for Java, publish it as a Maven artifact and depend on a version; when modules change together, use a monorepo (Maven multi-module). Submodules add clone/update steps, detached HEADs inside the submodule, pointer commits and push-ordering pitfalls, which only pay off when you must pin and edit separately-developed source.

</details>
