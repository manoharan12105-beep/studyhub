# What Are Subagents? Delegation and Context Isolation

**Module:** Subagents and Agent Teams · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and *Create custom subagents* (October 2026). Defaults such as fork mode, background running and the nesting depth changed several times during 2026; check your version's documentation if behaviour differs.

## Definition

A **subagent** is a separate Claude worker that the main conversation starts with the **Agent** tool. It has its **own context window**, its own system prompt and its own tool set, works on one delegated task, and returns **one result** to the conversation that started it. Its searches, file reads and command output stay in its context, not yours.

## Why It Matters

- Context is the scarcest resource in a session. Delegating "read 40 files and tell me where discounts are applied" keeps 40 files' worth of tokens out of your main conversation.
- A subagent can have **fewer tools** than the main conversation — a reviewer that cannot edit is safer than a reviewer told not to edit.
- Independent tasks can run **in parallel**.

## How It Works

```text
main conversation (your context)
   │  Agent tool: task message ("Find every place a discount is applied; report file:line")
   ▼
subagent (fresh context) ── reads, greps, runs allowed commands ──► many tokens, stay here
   │
   └──► one summary returns to the main conversation (and costs context there)
```

What a **non-fork** subagent starts with:

| Gets | Does not get |
|------|--------------|
| Its own system prompt (not the Claude Code system prompt) plus environment details | Your conversation history |
| The task message Claude writes when delegating | Skills you already invoked, files Claude already read |
| CLAUDE.md files and a Git status snapshot (except Explore and Plan) | Your auto memory and output style |
| Skills named in its `skills` field | — |

Because the subagent sees only the task message, **the quality of the delegation prompt decides the quality of the result**. If a rule matters for the task ("ignore `target/`"), restate it.

## Built-in Subagents

| Agent | Tools | Purpose | Notes |
|-------|-------|---------|-------|
| **Explore** | Read-only; Write and Edit denied | Fast search and code understanding | Skips CLAUDE.md and Git status; Claude asks for *quick*, *medium* or *very thorough*; one-shot (can't be resumed) |
| **Plan** | Read-only | Research during plan mode | Skips CLAUDE.md and Git status; one-shot |
| **general-purpose** | Every tool available to subagents | Multi-step work that explores and changes things | Loads CLAUDE.md |
| Helpers (`claude`, `statusline-setup`, `claude-code-guide`) | Varies | Used automatically for specific jobs | You rarely call them directly |

## When to Delegate

| Use the main conversation when | Use a subagent when |
|--------------------------------|---------------------|
| You need back-and-forth refinement | The work is self-contained and can return a summary |
| Planning, implementing and testing share a lot of context | The task produces verbose output you won't reference again (test logs, wide searches) |
| The change is small and targeted | You want tool restrictions (read-only review) |
| Latency matters — a fresh subagent must rebuild context | Several independent investigations can run in parallel |

For a quick question about something already in the conversation, `/btw` is cheaper: it sees your context, has no tools, and isn't added to history.

## Forks: Subagents That Inherit the Conversation

A **fork** is a subagent that starts with the **whole conversation so far**, the same system prompt, tools and model. Its own tool calls still stay out of your context; only its result returns. Start one yourself with `/subtask <task>` (v2.1.212+). Fork mode is on by default in interactive sessions (v2.1.232+), which also means subagents Claude spawns run **in the background**.

| | Fork | Non-fork subagent |
|---|---|---|
| Context | Full conversation history | Fresh, from the task message |
| System prompt and tools | Same as main session | From its definition |
| Prompt cache | Shared with main session (cheaper start) | Separate |

> [!NOTE]
> Don't confuse these with `/fork`, which (in v2.1.212+ with agent view on) copies the session into a new **background session**, or with `/branch`, which switches you into a copy. And `claude agents` on the command line manages background **sessions**, not subagent definitions.

## Syntax and Configuration

Ways to get a subagent to run:

```text
Use a subagent to run the test suite and report only the failing tests with their error messages.
```

```text
@"correctness-reviewer (agent)" review the change to PriceCalculator.java
```

```bash
# The whole session runs as that agent (its tools, model and system prompt)
claude --agent correctness-reviewer
```

To stop Claude delegating to a particular agent, deny it: `"deny": ["Agent(Explore)"]`. Denying `Agent` itself stops all delegation.

## Real-World Example

A typical scenario on orderdesk: asked "Why does GET /api/orders/{id} return 500?" in plan mode, Claude may delegate the research to **Explore** ("find where order responses are built and where discounts are computed"). Explore reads the controller, the calculator and the tests in its own context and returns a short report. A useful report names `OrderController.toResponse` and `PriceCalculator.totalCents` with line numbers — the two frames the real stack trace shows. The main conversation stays small enough to plan the fix, and you open those two locations before accepting the plan, because a summary is a claim, not proof.

## Step-by-Step Walkthrough

1. Identify the side task: wide search, log analysis, independent review.
2. Write the delegation as a self-contained task: goal, scope (files or packages), what to ignore, output format.
3. Ask Claude to use a subagent (or @-mention a specific one).
4. Watch it in the panel below the prompt or with `/tasks` (shows each subagent's model).
5. Check the returned claims (open the cited `file:line`) before acting on them.

## Common Mistakes

- Delegating work that needs your conversation's decisions — use the main thread or a fork.
- Vague delegation ("look into the bug") — the subagent can't ask you what you meant.
- Treating a subagent's summary as verified fact.
- Spawning many subagents that each return long reports — the reports land in your context.
- Expecting a subagent to follow your auto memory or output style.

## Security Considerations

- Restrict tools in the definition; a "please don't edit" instruction is not a control.
- Subagents may read untrusted text (issues, web pages). Claude Code scans their final reports for instruction-shaped text (v2.1.210+) and marks them as subagent output, but that is not a security boundary — permission rules and sandboxing still apply to whatever Claude does next.
- Background subagents surface permission prompts in your session; a "for the rest of the session" answer applies to everything, including the main conversation.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Subagent ignores a project rule | Explore/Plan skip CLAUDE.md, or the rule wasn't in the task | Restate the rule in the delegation |
| Result is generic | Delegation prompt lacked scope or goal | Name files, the question and the output format |
| Main context still grew a lot | Many or long subagent reports | Ask for short, structured reports |
| `Concurrent subagent limit reached` | 20 subagents already running (default) | Wait, or reduce parallelism |

## Trade-offs

| Benefit | Cost |
|---------|------|
| Keeps verbose work out of your context | Extra requests and tokens for the subagent itself |
| Tool restrictions per worker | Fresh subagents start without context (latency) |
| Parallel independent work | Results need checking and merging |

## Interview Takeaways

- A subagent = own context, own prompt, own tools, one result back.
- It sees the delegation message, not your conversation (except forks).
- Explore and Plan are read-only and skip CLAUDE.md; general-purpose can edit.
- Delegate self-contained, verbose or restricted work; keep iterative work in the main thread.

## Key Takeaways

- Delegate to protect your context, restrict tools, or parallelize.
- Write delegation prompts that stand on their own.
- Verify what comes back.
- Forks inherit the conversation; ordinary subagents don't.
