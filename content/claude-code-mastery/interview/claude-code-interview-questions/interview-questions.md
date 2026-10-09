# Claude Code Interview Questions — Interview Questions

## Beginner

### Q1. What is Claude Code?

**Style:** What

<details>
<summary>Answer</summary>

An agentic coding tool from Anthropic that works in your repository from the terminal, IDE extensions, desktop app or web. It reads code, edits files and runs commands in a loop toward a goal, within permission rules you set, and asks before risky actions by default.

</details>

### Q2. How is Claude Code different from autocomplete or a chat assistant?

**Style:** Comparison

<details>
<summary>Answer</summary>

It acts: it searches the codebase, edits multiple files, runs builds and tests, reads the results and iterates. A chat assistant answers and waits; autocomplete suggests the next lines. That power is why permissions, verification and review matter.

</details>

### Q3. What are Claude Code's permission modes?

**Style:** What

<details>
<summary>Answer</summary>

`default` (Manual: prompts before edits and commands), `acceptEdits` (auto-accepts file edits and common filesystem commands), `plan` (read-only exploration and a plan), `auto` (a classifier reviews actions), `dontAsk` (denies anything not pre-approved) and `bypassPermissions` (skips checks; isolated environments only). Shift+Tab cycles modes in a session.

</details>

### Q4. What is CLAUDE.md?

**Style:** What

<details>
<summary>Answer</summary>

A Markdown file of project instructions loaded into every session: build commands, conventions, rules, definition of done. It can exist at user, project and directory level and import other files. It's guidance the model reads — not enforced.

</details>

### Q5. What does /compact do, and how is it different from /clear?

**Style:** Comparison

<details>
<summary>Answer</summary>

`/compact` summarizes the conversation so far (optionally with focus instructions) and continues with the summary; detail is lost. `/clear` starts a fresh conversation for a new task, keeping project instructions. Use compact to continue one task, clear to switch tasks.

</details>

### Q6. Is "YOLO mode" a Claude Code feature?

**Style:** Misconception

<details>
<summary>Answer</summary>

No. It's community slang for running without permission checks (`bypassPermissions` or `--dangerously-skip-permissions`). `--permission-mode yolo` is rejected by the CLI. Skipping checks belongs only in disposable, isolated environments.

</details>

### Q7. How do you undo a change Claude made?

**Style:** How

<details>
<summary>Answer</summary>

Within the session, `/rewind` (or Esc twice) restores code and/or conversation to a checkpoint for edits made through Claude's file tools. For anything else — Bash side effects, older work, other sessions — use Git: `git diff`, `git restore`, `git stash`, revert commits.

</details>

## Intermediate

### Q8. How do permission rules work?

**Style:** How

<details>
<summary>Answer</summary>

Rules in settings are `allow`, `ask` or `deny`, written like `Bash(./mvnw test *)`, `Edit(/pom.xml)` or `Read(.env)`. Deny wins over ask, ask over allow. Rules from managed, CLI, local, project and user settings merge; managed settings can't be overridden. Bash rules match command text, so they cover usual spellings, not every way to run a program.

</details>

### Q9. What's the difference between project and local settings?

**Style:** Comparison

<details>
<summary>Answer</summary>

`.claude/settings.json` is committed and shared with the team; `.claude/settings.local.json` is personal and gitignored. Local settings take precedence over project settings; lists like permission rules merge. User settings (`~/.claude/settings.json`) apply to all your projects.

</details>

### Q10. What is a hook, and when would you use one instead of CLAUDE.md?

**Style:** Comparison

<details>
<summary>Answer</summary>

A hook is a command (or HTTP call, prompt, etc.) Claude Code runs at a lifecycle event such as PreToolUse, PostToolUse, SessionStart or Stop. Use it when a rule must hold every time — blocking edits to secrets or applied migrations, running a formatter — because CLAUDE.md is only guidance.

</details>

### Q11. Which hook exit code blocks an action?

**Style:** What

<details>
<summary>Answer</summary>

Exit code 2: for PreToolUse it blocks the tool call and shows stderr to Claude. Exit 0 is success (stdout may be added as context for some events); other non-zero codes are non-blocking errors. Hooks can also return JSON with decisions such as `permissionDecision: "deny"` or `"ask"`.

</details>

### Q12. What is MCP?

**Style:** What

<details>
<summary>Answer</summary>

The Model Context Protocol: an open protocol for connecting tools and data sources to AI applications. An MCP server exposes tools (and optionally resources and prompts) over stdio or HTTP; Claude Code is the client. Tools appear as `mcp__<server>__<tool>` and go through permission checks.

</details>

### Q13. What are MCP server scopes in Claude Code?

**Style:** What

<details>
<summary>Answer</summary>

Local (default; this project, stored in `~/.claude.json`), project (`.mcp.json` in the repository, shared, needs each user's approval) and user (all your projects, `~/.claude.json`). Local overrides project overrides user for the same name.

</details>

### Q14. What is a skill?

**Style:** What

<details>
<summary>Answer</summary>

A folder with a `SKILL.md` (frontmatter plus instructions) that packages a procedure. Its name and description are always listed; the body loads when you run `/name` or Claude matches the description. Skills can take arguments, inject command output and pre-approve tools for that turn. Custom commands were merged into skills.

</details>

### Q15. What is a subagent?

**Style:** What

<details>
<summary>Answer</summary>

A separate Claude worker with its own context window, system prompt and tools that handles a delegated task and returns one result. Built-ins include Explore and Plan (read-only) and general-purpose. Custom ones are Markdown files in `.claude/agents/`; `tools` restricts what they can do.

</details>

### Q16. Subagents vs agent teams?

**Style:** Comparison

<details>
<summary>Answer</summary>

Subagents report back to the caller and cost less. Agent teams (experimental, opt-in with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) are independent sessions with a lead, a shared task list and direct messaging; they suit work that needs discussion and cost significantly more tokens.

</details>

### Q17. How does Claude Code run in CI?

**Style:** How

<details>
<summary>Answer</summary>

Headless with `claude -p` (output formats text/json/stream-json, `--bare` for reproducibility, explicit permission mode, turn and budget limits) or through the Claude Code GitHub Action (`anthropics/claude-code-action@v1`) in interactive (`@claude`) or automation (`prompt`) mode, authenticated with a repository secret.

</details>

### Q18. What does `--bare` do?

**Style:** What

<details>
<summary>Answer</summary>

It skips auto-discovery of hooks, skills, subagents, plugins, MCP servers, auto memory and CLAUDE.md, and authenticates only with `ANTHROPIC_API_KEY` or an `apiKeyHelper`. Scripts and CI get the same behaviour on every machine; you pass what you need explicitly.

</details>

### Q19. What is auto memory?

**Style:** What

<details>
<summary>Answer</summary>

Notes Claude writes for itself per project (in `MEMORY.md` and topic files under its memory directory) about things it learned — build quirks, preferences. The first 200 lines or 25 KB of `MEMORY.md` load each session. You can view and edit it with `/memory`, or turn it off.

</details>

## Advanced

### Q20. Why aren't hooks a security guarantee?

**Style:** Security

<details>
<summary>Answer</summary>

They run on what they're given and match what you wrote: a text-matching guard misses other spellings (`git -C . push --force`, scripts); a hook can fail open (missing `jq`); and some actions happen outside the matched tool. They're a strong layer for mistakes; sandboxing, server-side protections and human review cover the rest.

</details>

### Q21. What happens in a `claude -p` run in an untrusted repository?

**Style:** Security

<details>
<summary>Answer</summary>

No workspace trust dialog is shown; without `--bare`, the project's hooks run and `.mcp.json` servers connect, and invalid settings files are silently ignored. Only run `-p` in trusted directories, or use `--bare` and explicit configuration.

</details>

### Q22. How do permission modes interact with subagents?

**Style:** Trade-off

<details>
<summary>Answer</summary>

Without `permissionMode`, a subagent inherits the session's mode. If the session is in `bypassPermissions`, `acceptEdits` or auto mode, that mode wins over the subagent's setting. So read-only reviewers need a restricted `tools` list, not just `permissionMode: plan`.

</details>

### Q23. How do you keep context usage under control in a large repository?

**Style:** How

<details>
<summary>Answer</summary>

Short root CLAUDE.md with area rules in subdirectories or path-scoped rules; procedures in skills; start sessions in the package you're changing; `claudeMdExcludes` and Read deny rules for irrelevant or generated code; disable unused MCP servers; delegate verbose work to subagents; `/clear` between tasks; check `/context`.

</details>

### Q24. What does an MCP tool result mean for security?

**Style:** Security

<details>
<summary>Answer</summary>

Tool results enter Claude's context and can contain instructions (prompt injection). Servers run with your permissions. Install only trusted servers, scope tokens narrowly, keep secrets out of `.mcp.json`, require approval for write tools, and treat results from tickets, web pages or emails as untrusted data.

</details>

### Q25. How do you verify AI-generated changes?

**Style:** Workflow design

<details>
<summary>Answer</summary>

A reproducing test that was red and is now green; the full build output; the whole diff read, including tests (no weakened assertions); scope checked; invented APIs or config keys ruled out; behaviour checked where tests don't reach; and a summary stating what wasn't verified.

</details>

### Q26. Why might a project's `defaultMode: "auto"` be ignored?

**Style:** Debugging

<details>
<summary>Answer</summary>

Claude Code ignores `auto` and `bypassPermissions` as `defaultMode` when they come from project settings, so a cloned repository can't put you into a less supervised mode. Set it in user or local settings if you want it.

</details>

### Q27. A skill's description never matches. What do you check?

**Style:** Debugging

<details>
<summary>Answer</summary>

Whether the frontmatter parses (`claude plugin validate .claude/skills` — broken YAML loads the skill with empty metadata), whether the description uses the words users say with the key use case first, whether the listing budget drops descriptions (`/context`, `/skill-doctor`), and whether `disable-model-invocation` or `skillOverrides` hide it.

</details>

### Q28. What's the role of the Claude GitHub App's permissions vs the workflow's permissions?

**Style:** Security

<details>
<summary>Answer</summary>

Workflow `permissions:` scope the job's `GITHUB_TOKEN`; the action authenticates as the Claude GitHub App by default, whose installation permissions (accepted as a set) decide what its token can do. Restrict Claude via its allowed tools, consider a custom app, and protect branches.

</details>
