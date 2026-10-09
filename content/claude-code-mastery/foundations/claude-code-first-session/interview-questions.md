# First Session: Explore an Existing Repository — Interview Questions

## Beginner

### Q1. How do you start and end a Claude Code session?

**Style:** How

<details>
<summary>Answer</summary>

`cd` into the repository root and run `claude` (optionally `claude "first prompt"` or `claude -n name`). End with `/exit` or `Ctrl+D` twice. Sessions are saved, so `claude -c` continues the most recent one in that directory and `claude -r` opens a picker.

</details>

### Q2. What do `@` and `!` do at the prompt?

**Style:** What

<details>
<summary>Answer</summary>

`@path` mentions a file (with autocomplete) so Claude reads it before answering. `!` at the start enters shell mode: the command runs directly, without Claude, and its output is added to the conversation for Claude to respond to.

</details>

## Intermediate

### Q3. How would you use Claude Code to onboard to an unfamiliar codebase?

**Style:** Scenario

<details>
<summary>Answer</summary>

Start in the repository root, explore read-only (or in plan mode): ask for structure and entry points, build and test commands, and a trace of one important request with file paths. Open the files it cites, correct wrong claims, run the tests and read the output myself. Capture stable facts (commands, gotchas) in `CLAUDE.md` so later sessions start informed.

</details>

### Q4. Why ask Claude for file paths and tests instead of a summary?

**Style:** Why

<details>
<summary>Answer</summary>

A summary can be plausible and wrong — renamed classes, overridden defaults. File paths and test names are checkable evidence: I can open them in seconds. Asking for them also pushes Claude to read rather than infer.

</details>

### Q5. What runs without approval during exploration in Manual mode?

**Style:** What

<details>
<summary>Answer</summary>

Reads and searches inside the working directories, and a built-in set of read-only shell commands such as `ls`, `cat`, `grep`, `git status` and `git log`. Edits and other commands — including running the build — ask first. Other modes change this; auto mode, for example, has a classifier review actions instead of prompting.

</details>

## Advanced

### Q6. Claude's explanation conflicts with what you see in the code. How do you handle it?

**Style:** Debugging

<details>
<summary>Answer</summary>

Trust the code. Point Claude at the specific file (`@` mention) and the contradiction, ask it to re-read and cite lines. If the misunderstanding comes from outdated documentation or a misleading name, note it in `CLAUDE.md` so it does not recur. The lesson: Claude's statements are hypotheses until verified.

</details>

### Q7. Why does the starting directory matter beyond file access?

**Style:** Follow-up

<details>
<summary>Answer</summary>

It decides which `CLAUDE.md` files load (the directory and its parents, plus subdirectories on demand), which project settings, hooks and skills apply, which MCP servers from `.mcp.json` are offered, where session history is stored, and the trust decision. Starting in the wrong place gives Claude the wrong instructions and permissions.

</details>
