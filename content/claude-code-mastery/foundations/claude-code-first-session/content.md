# First Session: Explore an Existing Repository

**Module:** Foundations, Installation and Modes · **Interview priority:** Frequently asked

## Definition

A **session** is one conversation with Claude Code, tied to the directory you started it in. Your first session in an unfamiliar repository should be **exploration**: building an accurate picture of the code — structure, build, tests, conventions, risky areas — before anything is changed.

## Why It Matters

- On a new team you will be asked to change code you did not write. Claude Code can read a repository much faster than you can, which makes onboarding faster — *if* you check what it tells you.
- An exploration session is low risk: reading needs no approval in the default mode, and nothing changes on disk.
- The questions you learn to ask here are the same ones you ask before every task later: "where is it?", "how is it tested?", "what could break?".

## How It Works

```text
cd orderdesk ─► claude ─► ask questions ─► Claude reads/searches (Read, Glob, Grep, git log)
                                 ▲                         │
                                 └── follow-ups, @files ◄──┘  answers with file paths
                                                              you open the files and check
```

Reading files and searching are read-only actions. In the default **Manual** mode they run without prompts inside the working directory; commands that change things ask first. (Module 1's [Claude Modes](../claude-modes/content.md) lesson explains every mode; on recent versions an interactive session may start in **auto** mode — the status bar under the prompt shows which mode is active.)

## Starting and Ending a Session

| Command | What it does |
|---------|--------------|
| `claude` | Start an interactive session in the current directory |
| `claude "explain this project"` | Start interactive mode with a first prompt |
| `claude -n orderdesk-onboarding` | Start with a session name you can resume by |
| `claude --permission-mode plan` | Start in plan mode: explore and propose, no edits |
| `claude -c` | Continue the most recent conversation in this directory |
| `claude -r` | Pick a previous conversation to resume |

Inside a session:

| Input | Effect |
|-------|--------|
| `/help` | Show commands |
| `?` on an empty prompt | Toggle the shortcut help |
| `Esc` | Stop Claude mid-action; the work so far is kept and you can redirect |
| `/exit`, or `Ctrl+D` twice | End the session |
| `Ctrl+C` | Interrupt; on an empty prompt, a second press exits |

> [!TIP]
> Start Claude Code **in the repository root**, not in your home directory. The starting directory decides which files are readable without prompts and which `CLAUDE.md` and settings load.

The first time you run Claude Code in a folder, it shows a **workspace trust** dialog. Accept it only for code you trust: a repository's settings can configure hooks and other behaviour (Module 4).

## Asking Good Exploration Questions

Ask the questions you would ask a senior engineer on the team. Work from broad to specific:

```text
what does this project do, and how is it structured? name the main packages and entry points
```

```text
how do I build and test it? which command runs the tests, and is there a database?
```

```text
trace what happens when someone calls GET /api/orders/{id}, file by file
```

```text
where would a change to discount pricing go, and which tests cover it?
```

**Expected behaviour:** Claude reads `pom.xml`, the `README`, configuration and source files, and answers with file paths. For the trace question, it should name the controller method, the repository call and the price calculation, in order.

Prompts that work well name a **scope** (a package, an endpoint), ask for **file paths** and ask for the **evidence** (the test name, the command).

## Reading, Editing and Running

Even in an exploration session, know what each kind of action does:

| Action | Tool | In Manual mode |
|--------|------|----------------|
| Read a file, list files, search | Read, Glob, Grep | Runs without asking (inside the working directories) |
| Read-only shell commands (`ls`, `git log`, `git status`, …) | Bash | Built-in read-only set runs without asking |
| Edit or create a file | Edit, Write | Asks you |
| Other shell commands (`./mvnw test`, `npm install`) | Bash | Asks you |

Running the tests in an exploration session is useful and safe for most projects — but it *executes code*. Read the command before approving.

## Shell Mode, @ Mentions and Images

| Input | What it does |
|-------|--------------|
| `@src/main/java/com/example/orderdesk/order/PriceCalculator.java` | Mentions a file; Claude reads it before answering. `@` triggers path autocomplete |
| `! git status` | **Shell mode**: runs the command directly, without Claude, and adds the command and its output to the conversation |
| Paste a screenshot (`Ctrl+V`, `Alt+V` on Windows) | Adds an image, such as an error dialog |
| `cat build.log \| claude -p "explain the failure"` | Pipes content into a one-off, non-interactive run |

Shell mode is handy when *you* want to run something and let Claude see the result, without asking Claude to run it.

## What to Check Before Trusting an Answer

Claude's explanations are usually right and occasionally confidently wrong — for example, describing a class that was renamed, or assuming a framework default your project overrides. Before you rely on an answer:

1. **Open the files it names.** Does the method exist and do what it says?
2. **Ask for evidence.** "Which test proves that?" "Show me the line."
3. **Run the check.** If it says "the tests pass", read the test output yourself.
4. **Watch for hedging and gaps.** "Probably" and "typically" mean it inferred rather than read.

## Real-World Example

On day one at a company you get the `orderdesk` repository and a ticket: *"Orders without a discount code fail."* A good first session:

```text
explain how an order's total is calculated, with file paths. do not change anything yet.
```

```text
which tests cover PriceCalculator? run only those tests and tell me what fails.
```

**Expected behaviour:** Claude names `PriceCalculator.totalCents`, the `PriceCalculatorTest` class, asks to run the tests, and reports the failing test with its exception. You confirm by reading the test and the stack trace yourself. Only then do you move to fixing — in [Lab 05](../../labs/cc-lab-05-debug-failing-test/content.md).

## Step-by-Step Walkthrough

1. `cd` into the repository root and run `claude -n <repo>-onboarding`.
2. Accept the trust dialog only if you trust the repository.
3. Ask for structure, build and test commands, and the request flow of one important endpoint.
4. Open each file Claude names; correct it when it is wrong ("`OrderService` doesn't exist; the logic is in the controller").
5. Ask Claude to run one read-only or test command; read the output yourself.
6. Write the useful facts (build command, test command, gotchas) into your notes — or into `CLAUDE.md` (Module 3).
7. `/exit`. The session is saved; `claude -r` can bring it back.

## Common Mistakes

- Asking "fix the bug" before understanding the code.
- Accepting a confident summary without opening a single file.
- Pasting huge logs instead of the relevant part or a file path.
- Approving `./mvnw` commands without noticing they also run integration tests against a real database.
- Keeping one endless session for a whole day of unrelated questions — context fills with noise (Module 2).

## Security Considerations

- The trust dialog is a real decision: an untrusted repository can carry project settings, hooks and MCP servers.
- Exploration reads files — including secrets if your project has them. Deny rules (Module 4) keep `.env` and key files out of reach.
- Running tests executes repository code on your machine. In an unfamiliar repository, read the build file first.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Claude cannot see a file you mention | It is outside the working directory | Start in the repository root, or `/add-dir` the other directory |
| Answers are about the wrong project | Started in the wrong directory | `/exit`, `cd`, start again |
| A command keeps asking for approval | Manual mode prompts for non-read-only commands | Approve once, or add a permission rule later (Module 4) |
| Claude describes code that does not exist | Inference instead of reading | Ask it to show the file and line; @-mention the file |

## Trade-offs

| Approach | Benefit | Cost |
|----------|---------|------|
| Long exploration session | Deep shared understanding | Context fills; earlier detail may be summarized away |
| Short focused sessions | Clean context per question | Repeat some setup each time (solve with `CLAUDE.md`) |
| Letting Claude run tests | Real evidence | Executes code; can be slow or touch services |

## Interview Takeaways

- Describe how you onboard to an unfamiliar repository with Claude Code: explore read-only, ask for file paths and evidence, verify by opening files and running tests.
- Name the input shortcuts (`@` files, `!` shell mode, `Esc` to interrupt) and the session commands (`-c`, `-r`, `-n`, `/exit`).
- Emphasize that you check claims instead of trusting summaries.

## Key Takeaways

- Start in the repository root; accept trust only for code you trust.
- Explore before changing: structure, build, tests, one request flow.
- Reading is free of prompts in Manual mode; edits and most commands ask.
- `@` mentions files, `!` runs shell commands yourself, `Esc` interrupts.
- Every important claim gets checked against the code or a test run.
