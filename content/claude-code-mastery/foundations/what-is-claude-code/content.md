# What Is Claude Code?

**Module:** Foundations, Installation and Modes · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and the official documentation at code.claude.com/docs (October 2026). Claude Code changes often; when a detail matters, confirm it with `claude --version` and the docs for your version.

## Definition

**Claude Code** is Anthropic's agentic coding tool. You run it in a project directory, describe a task in plain language, and Claude reads files, searches the code, edits files, runs shell commands such as your build and tests, and reports back. Claude Code is the program around the model: it gives the model **tools**, manages what the model sees (the **context**), and asks you for permission before risky actions.

The word **agentic** means the model does not just answer once. It chooses an action, sees the result, and decides the next action, many times in a row, until the task is done or it needs you.

## Why It Matters

- Engineering work is mostly *reading and verifying*, not typing. A tool that can open twenty files, run the tests and read the failure saves the slow parts — if you control it well.
- The same power that makes it useful makes it risky. Claude Code can run any command your user account can run. Knowing what it can access and how permissions work is part of using it professionally.
- Teams now expect developers to explain *how* they use AI tools safely: what they let run, how they review, how they verify. That is what this subject teaches.

## How It Works

Claude Code works in a loop with three phases that blend together: **gather context**, **take action**, **verify results**.

```text
            ┌──────────────────────────────────────────────────────────┐
 your task  │  gather context   →   take action   →   verify results   │
 ─────────► │  read, search,        edit files,       run tests/build,  │ ──► summary
            │  run git log          run commands      read the output   │
            │        ▲                                        │         │
            │        └──────────── not done yet ──────────────┘         │
            └──────────────────────────────────────────────────────────┘
                 you can interrupt (Esc) or redirect at any point
```

Two parts power the loop:

| Part | Role |
|------|------|
| **Model** | A Claude model reasons about the task and decides which tool to call next |
| **Tools** | Built-in tools that act: read and edit files, search (`Glob`, `Grep`), run shell commands (`Bash`, or PowerShell on Windows without Git Bash), fetch web pages, spawn subagents, ask you questions |

Claude Code — the **harness** around the model — runs the tools, applies your permission rules, loads your instructions (`CLAUDE.md`), and keeps the conversation inside the model's **context window**.

When you say *"fix the failing tests"*, a typical loop is: run the test suite → read the failure → search for the class → read it → edit it → run the tests again → report. Each tool result feeds the next decision.

## What Claude Code Can Access

When you start `claude` in a directory, it can work with:

| What | Detail |
|------|--------|
| **Your project** | Files in the directory you started in and below. Files elsewhere need your permission or an added directory (`--add-dir`, `/add-dir`) |
| **Your terminal** | Any command your user account can run: build tools, `git`, package managers, scripts. Most commands ask for approval first, depending on the permission mode |
| **Your Git state** | Current branch, uncommitted changes, recent history |
| **Your instructions** | `CLAUDE.md` files (or a repository's `AGENTS.md`) loaded at the start of every session |
| **Auto memory** | Notes Claude saved in earlier sessions for this repository |
| **Extensions you add** | MCP servers, skills, subagents, hooks, plugins |

It does **not** automatically see other repositories on your machine, your browser, your company's internal systems or the internet, unless you give it a tool or a permission that reaches them.

> [!IMPORTANT]
> Claude Code acts with **your** operating-system permissions. Permission prompts and rules decide what runs *without asking*; once you approve a shell command, that command can touch anything your account can touch.

## Where Claude Code Runs

The loop and tools are the same everywhere; what changes is where the code executes and how you interact.

| Surface | Where commands run |
|---------|--------------------|
| Terminal CLI (`claude`) | Your machine |
| VS Code extension, JetBrains plugin, desktop app | Your machine |
| Claude Code on the web (claude.ai/code) | A cloud VM managed by Anthropic, on a GitHub repository you connect |
| Claude Code GitHub Action | A GitHub Actions runner |

This subject focuses on the **terminal CLI**, with notes where the IDE integrations differ.

## Claude Code vs Web-Based Claude

"Web-based Claude" here means the Claude chat apps (claude.ai in a browser, or the desktop and mobile chat apps).

| Aspect | Claude chat app | Claude Code |
|--------|-----------------|-------------|
| What it sees | What you paste, upload or connect | Your repository on disk, your terminal output, your Git state |
| What it can do | Answer, write and explain; work with files you give it | Edit your files in place, run your build and tests, use Git |
| Feedback loop | You copy code back and run it yourself | Claude runs the check itself and iterates on the result |
| Project knowledge | Whatever you share in the conversation | `CLAUDE.md`, rules, auto memory, skills loaded automatically |
| Main risk | Copying an unverified answer | Running or changing something you did not review |

The chat app is good for discussing an idea, learning a concept or drafting text. Claude Code is built for changing a codebase and proving the change works.

> [!NOTE]
> **Claude Code on the web** is not the same as the chat app: it runs Claude Code itself, in a cloud VM, against a GitHub repository. The names are similar; the capabilities are those of Claude Code.

## Claude Code vs IDE-Based AI Assistance

IDE-based assistants range from inline completion (suggesting the next lines as you type) to editor chat panels and editor agents that can change several files. Rather than ranking products — they change every month — compare along the dimensions that matter:

| Dimension | Inline completion | Claude Code |
|-----------|-------------------|-------------|
| Unit of work | The next few lines at your cursor | A task: "add an endpoint with tests" |
| Context | The open file and nearby code | Whatever it chooses to read across the repository, plus your instructions |
| Execution | None — you run things | Runs builds, tests and Git, then reacts to the output |
| Control | You accept or reject each suggestion | Permission modes, rules and hooks decide what runs without asking |
| Best at | Fast typing of code you already understand | Multi-step changes, investigations, refactors with verification |

They combine well: Claude Code has a VS Code extension and a JetBrains plugin, and many developers keep inline completion for typing while giving Claude Code whole tasks.

## Real-World Example

A team's checkout API returns HTTP 500 for orders without a discount code. With Claude Code, a developer:

1. Starts `claude` in the repository and pastes the error and the request that fails.
2. Asks Claude to reproduce it with a failing test before changing anything.
3. Reviews the one-line fix and the new test Claude proposes.
4. Lets Claude run `./mvnw verify` and reads the result.
5. Reviews `git diff`, then commits it themselves.

The value is not that Claude typed one line. It is that the reproduction, the fix, the regression test and the verification happened in one controlled loop, and the developer reviewed evidence instead of guessing.

## Common Mistakes

- Treating Claude Code like a search engine that is always right. It can misread code; ask for evidence (file and line, test output).
- Starting it in your home directory "to be able to reach everything". Start it in the project; add directories only when needed.
- Assuming it remembers yesterday's conversation. Each session starts fresh; persistent knowledge goes into `CLAUDE.md` (and auto memory).
- Approving commands without reading them because "it's the AI's job".

## Security Considerations

- Any approved shell command runs as you. Read commands before approving, especially ones that delete, install, push or deploy.
- Files Claude reads — a README, an issue, a web page — can contain instructions written to manipulate an AI (**prompt injection**). Treat untrusted content with care; permissions and review are your defence.
- Secrets in your project (`.env` files, keys) are readable unless you deny them. The permissions module shows how.

## Trade-offs

| Benefit | Cost |
|---------|------|
| Whole tasks done with verification | You must review more code, faster |
| Works across the repository | Reading many files consumes context and tokens |
| Runs real commands | Real commands have real side effects |

## Interview Takeaways

- Define Claude Code as an **agentic coding tool** that uses tools in a loop (gather → act → verify), not as autocomplete.
- Name what it can access and that it runs with your permissions.
- Contrast it with chat apps (no local execution) and inline completion (no task-level loop), without claiming competitors "can't" do things.

## Key Takeaways

- Claude Code = a model + tools + a harness that manages permissions, instructions and context.
- It reads, edits, runs commands and verifies — on your machine, with your permissions.
- The chat app discusses; Claude Code changes a codebase and proves it.
- Your job shifts to giving clear tasks, controlling what runs and reviewing evidence.
