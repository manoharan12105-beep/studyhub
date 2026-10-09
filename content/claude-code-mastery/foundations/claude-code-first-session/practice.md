# First Session: Explore an Existing Repository — Practice

### P1. Where to start

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** working directory

You want to explore `~/work/orderdesk`. Where should you run `claude`?

- A) `~` (your home directory), so it can reach everything
- B) `~/work/orderdesk`, the repository root
- C) `~/work/orderdesk/src/main/java`, where the code is
- D) Anywhere; the directory does not matter

<details>
<summary>Answer</summary>

**Answer:** B) `~/work/orderdesk`, the repository root

The starting directory decides what is readable without prompts and which `CLAUDE.md` and settings load. Home is too broad; a source subfolder misses `pom.xml`, configuration and tests.

</details>

### P2. Shell mode

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** shell mode

What does typing `! git log --oneline -5` at the Claude Code prompt do?

- A) Asks Claude to explain git log
- B) Runs the command directly without Claude, and adds the command and its output to the conversation
- C) Disables the command
- D) Opens a new terminal

<details>
<summary>Answer</summary>

**Answer:** B) Runs the command directly without Claude, and adds the command and its output to the conversation

Shell mode runs your command without Claude interpreting or approving it, then Claude can respond to the output.

</details>

### P3. Better prompt

**Difficulty:** Easy · **Type:** Workflow design · **Concepts:** exploration prompts

Rewrite "how does this work?" into an exploration prompt that is likely to give a verifiable answer about orderdesk's order lookup.

<details>
<summary>Answer</summary>

For example: "Trace what happens when someone calls GET /api/orders/{id}: list each class and method in order with file paths, and name the test that covers it. Don't change anything."

It names a scope (one endpoint), asks for file paths and a test (evidence), and sets the boundary (read only).

</details>

### P4. Which actions prompt?

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** Manual mode

In Manual mode, which action asks for your approval?

- A) Reading `Order.java` in the working directory
- B) Searching the project for `PriceCalculator`
- C) Running `git status`
- D) Running `./mvnw test`

<details>
<summary>Answer</summary>

**Answer:** D) Running `./mvnw test`

Reads and searches inside the working directory, and the built-in set of read-only commands such as `git status`, run without prompts. Other shell commands — the build runs code — ask first.

</details>

### P5. Spot the unverified claim

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** verifying answers

Claude says: "Discounts are applied in `OrderService.applyDiscount`, which is covered by `OrderServiceTest`." You search and find no `OrderService`. What do you do next?

<details>
<summary>Answer</summary>

Treat the answer as inferred, not read. Tell Claude the class does not exist and ask it to search for where the total is computed and to show the file and line — for orderdesk that is `PriceCalculator.totalCents`, covered by `PriceCalculatorTest`. Asking for evidence turns a plausible guess into a checked fact.

</details>

### P6. Interrupt correctly

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** Esc, steering

While exploring, Claude starts reading the `target/` build output folder, file after file. What do you press, and what do you say?

<details>
<summary>Answer</summary>

Press `Esc` to stop the current action (the work so far is kept), then redirect: "Skip target/ — it is build output. Focus on src/main and src/test." You could also type the correction without stopping; queued messages are read after the running tool calls finish.

</details>

### P7. Trust dialog

**Difficulty:** Hard · **Type:** Security · **Concepts:** workspace trust

You clone a stranger's repository to evaluate a library and run `claude`. A trust dialog appears listing hooks and allow rules from the repository's `.claude/settings.json`. What do you do?

<details>
<summary>Answer</summary>

Do not accept it blindly. Read the repository's `.claude/settings.json` (and `.mcp.json`) first: hooks run shell commands on your machine, and allow rules would let commands run without prompts. If you only need to read the code, decline and read it yourself, or open it in a disposable container. Accept trust only for code you would be willing to run.

</details>

### P8. End-to-end exploration

**Difficulty:** Hard · **Type:** Workflow design · **Concepts:** exploration session

Write the four prompts, in order, you would use in a 20-minute first session on orderdesk before touching the bug "orders without a discount code fail".

<details>
<summary>Answer</summary>

1. "What does this project do and how is it structured? Name packages, entry points and the build tool."
2. "How do I build and run the tests? Is a database needed?"
3. "Explain how an order's total is calculated, with file paths and the tests that cover it. Don't change anything."
4. "Run only the PriceCalculator tests and summarize what fails, including the exception."

Then verify by opening `PriceCalculator.java` and the failing test yourself. Structure → build → the relevant flow → evidence of the bug.

</details>
