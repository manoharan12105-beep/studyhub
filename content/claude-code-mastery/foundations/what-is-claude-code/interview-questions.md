# What Is Claude Code? — Interview Questions

## Beginner

### Q1. What is Claude Code?

**Style:** What

<details>
<summary>Answer</summary>

Claude Code is Anthropic's agentic coding tool. It runs in a project directory (terminal, IDE extension, desktop app or cloud), and Claude uses tools to read and search files, edit code, run shell commands such as builds and tests, and verify the result, repeating until the task is done. Claude Code is the harness around the model: it provides the tools, applies permission rules and loads project instructions.

</details>

### Q2. What does "agentic" mean in this context?

**Style:** What

<details>
<summary>Answer</summary>

The model works in a loop: it chooses an action, a tool executes it, the result returns to the model, and it decides the next action. For a bug fix that means gather context (run tests, read code), act (edit), verify (run tests again), and repeat if needed. A non-agentic assistant answers once and leaves execution to you.

</details>

### Q3. What can Claude Code access when you start it in a repository?

**Style:** How

<details>
<summary>Answer</summary>

Files in the working directory and below; your terminal (any command your account can run, usually after approval); your Git state; `CLAUDE.md` instructions and auto memory; and any extensions you configured — MCP servers, skills, subagents, hooks. Other directories need `--add-dir` or approval. It runs with your operating-system permissions, so approved commands can reach anything you can.

</details>

## Intermediate

### Q4. How is Claude Code different from using Claude in a chat app?

**Style:** Comparison

<details>
<summary>Answer</summary>

The chat app works with what you paste or upload and you run the code yourself. Claude Code works on the repository in place, runs your build and tests, and iterates on the output; it also loads project instructions automatically. So the chat app is for discussion and drafting; Claude Code is for changing a codebase with verification. Claude Code on the web is still Claude Code — it runs in a cloud VM on a GitHub repository.

</details>

### Q5. How does it differ from inline code completion in an IDE?

**Style:** Comparison

<details>
<summary>Answer</summary>

Inline completion predicts the next lines at the cursor; you stay responsible for running and verifying. Claude Code takes a whole task, reads across the repository, executes commands and reacts to their output, under permission modes and rules. They complement each other; many developers use completion for typing and Claude Code for multi-step changes.

</details>

### Q6. What is the "harness" and why does the distinction matter?

**Style:** Why

<details>
<summary>Answer</summary>

The harness is Claude Code itself: the program that runs tools, enforces permissions, manages context and loads instructions. It matters because enforcement lives there. A `CLAUDE.md` line saying "never read .env" is only guidance to the model; a `Read(./.env)` deny rule is enforced by the harness whatever the model decides.

</details>

## Advanced

### Q7. A teammate wants to run Claude Code from their home directory so it "can access all projects". What do you say?

**Style:** Scenario

<details>
<summary>Answer</summary>

Start it in the project directory instead. Starting in home widens what the file tools can read without prompting (including dotfiles and other repositories' secrets), loads unrelated context, and — per the docs — workspace trust accepted in your home directory is not even saved. If a task needs a second repository, add just that directory with `--add-dir` or `/add-dir`. Least privilege applies to agents too.

</details>

### Q8. What is your mental model for working safely with Claude Code?

**Style:** Follow-up

<details>
<summary>Answer</summary>

Treat it as a capable colleague with your keyboard: give clear tasks and context, decide what may run without asking (mode and rules), keep risky operations behind prompts or hooks, make it prove changes with tests, and review the diff before committing. Prompt instructions guide; permission rules, hooks, the sandbox, Git, tests and code review enforce — each covering a different failure.

</details>
