# What Is a Context Window?

**Module:** Context Windows, Sessions and Checkpoints · **Interview priority:** Core

## Definition

The **context window** is everything the model can see at once while it decides its next step, measured in **tokens** (roughly word pieces). In Claude Code it holds the system instructions, your `CLAUDE.md` files, auto memory, the list of available skills and MCP tools, the whole conversation so far, and every file content and command output Claude has read in this session.

If something is not in the context window, the model does not know it — even if it is sitting in a file on your disk.

## Why It Matters

- The official best-practices guide calls the context window "the most important resource to manage": model performance **degrades as context fills**, and Claude may start forgetting earlier instructions or making more mistakes.
- Tokens cost money or plan usage. A session that has read 40 files sends a lot of context with every new message.
- Most "Claude ignored my instruction" problems are context problems: the instruction was never loaded, or it was summarized away.

## How It Works

```text
context window (one session)
┌──────────────────────────────────────────────────────────────────────┐
│ loaded at start: system prompt · CLAUDE.md files · auto memory        │
│                  (first 200 lines / 25 KB of MEMORY.md) · skill       │
│                  descriptions · MCP tool names · git status snapshot  │
├──────────────────────────────────────────────────────────────────────┤
│ grows as you work: your messages · Claude's replies · tool calls ·    │
│                    file contents read · command output · rules that   │
│                    load when matching files are touched               │
├──────────────────────────────────────────────────────────────────────┤
│ near the limit: older tool output is cleared, then the conversation   │
│                 is summarized (compaction) — next lesson              │
└──────────────────────────────────────────────────────────────────────┘
```

Each new message sends the accumulated context to the model again. **Prompt caching** makes repeated content cheaper, but a bigger context still means more work per message.

**Status:** Version-dependent — the window size depends on the model. Some current models support a 1 million token context window; see the model configuration docs for which models and plans, and `/context` for your session's actual numbers.

## Conversation History vs Repository Context

These are easy to confuse:

| | Repository (on disk) | Context window (in the model) |
|---|---|---|
| Contains | Every file, every commit | Only what was loaded or read this session |
| Lifetime | Permanent (Git) | One session; summarized when full |
| Changes when | Files are edited | Claude reads something, you type something |
| Size limit | Your disk | The model's token limit |

So "Claude knows my codebase" is only partly true: it knows the parts it read *in this session*, plus your instructions. A 500-file repository is not "in context"; Claude finds and reads what the task needs.

**Git history** is on disk too: Claude sees a short git status snapshot at start and can run `git log` or `git blame` when it needs history — that output then enters the context.

## Context Consumption

What tends to use the most context in a Java project:

| Source | Why it is large | Cheaper alternative |
|--------|-----------------|---------------------|
| Full Maven output | Thousands of lines of logs and stack frames | Ask for the failing tests only, or run one test class |
| Reading big files whole | A 2,000-line class | Point to the method; @-mention a specific file |
| Repeated exploration | Re-reading the same files after each correction | Keep findings in a short notes file or `CLAUDE.md` |
| MCP tool results | Large JSON responses | Narrow queries; Claude Code warns above 10,000 tokens per tool output |
| Long-lived sessions | Every earlier step is still there | `/clear` between unrelated tasks |
| Subagent results | Summaries return to your context | Ask subagents for short, specific reports |

Startup content costs something too: every line of `CLAUDE.md`, every skill description and every MCP server's tool names load at the start of each session. That is why later modules keep instructions small.

## Why Long Sessions Lose Detail

1. **Dilution:** the model attends to everything in the window; a decision made 150 messages ago competes with thousands of lines of later output.
2. **Compaction:** near the limit, Claude Code clears old tool output and then summarizes the conversation. Requests and key code are preserved; detailed early instructions may not be.
3. **Accumulated wrong turns:** failed attempts stay in context and can pull Claude back toward them.

The docs' advice: if you have corrected Claude more than twice on the same issue in one session, `/clear` and start fresh with a better prompt that includes what you learned.

## Measuring with /context

Run `/context` at any time. It shows the current usage as a coloured grid by category (system, memory files, tools, messages), lists which `CLAUDE.md` and memory files loaded, and suggests optimizations such as context-heavy tools or memory bloat. `/usage` shows session cost and plan usage.

## Real-World Example

You debug a failing build for an hour in one session. Claude has read 25 files, the full output of six Maven runs and two MCP database queries. Now it suggests a fix you rejected 40 minutes ago. The cause is not "the AI got worse"; the context is full of old attempts and logs. Better: `/clear`, then a fresh prompt — *"Test X fails with Y (stack trace below). We already ruled out A and B because … Reproduce with a single test run, then fix."* The new session starts small and focused.

## Common Mistakes

- Treating the repository as if it were all in context.
- Pasting entire logs when the failing test name and the first stack trace would do.
- Running one session all day across unrelated tasks.
- Putting long reference documents in `CLAUDE.md`, so every session pays for them.
- Assuming an instruction typed early in a long session is still respected after compaction.

## Security Considerations

- Everything in the context is sent to the model provider under your account's data terms. Do not read secrets into context "just to check them"; deny them instead (Module 4).
- Content Claude reads — issue text, web pages, MCP results — enters the same context as your instructions. That is how prompt injection reaches the model; permissions and review limit what it can cause.

## Troubleshooting

| Symptom | Likely context cause | Action |
|---------|---------------------|--------|
| Claude forgets a constraint you stated early | Summarized away or diluted | Put durable constraints in `CLAUDE.md`; restate before a big step |
| Claude repeats a rejected approach | Old attempts still in context | `/clear` and restate what is ruled out |
| Responses get slower and costlier | Large context per message | `/context`; `/clear` or `/compact` |
| Claude does not know a file you edited | It read the old version before your change | Ask it to re-read the file (Claude Code also adds a note when a file it read changes on disk) |

## Trade-offs

| More context | Less context |
|--------------|--------------|
| Claude sees more connections | Faster, cheaper, more focused |
| Fewer repeated reads | Must re-establish facts (use `CLAUDE.md`) |
| Higher risk of dilution and lost instructions | Risk of missing a relevant file |

## Interview Takeaways

- Define the context window and list what loads at start versus what accumulates.
- Distinguish repository, Git history and context: on disk versus loaded this session.
- Explain why long sessions degrade and how you manage it: focused sessions, targeted reads, `/clear`, `/context`, durable facts in `CLAUDE.md`.

## Key Takeaways

- If it is not in the context window, the model does not know it.
- Startup content (instructions, memory, skill and tool listings) plus everything read this session fills the window.
- Performance degrades as context fills; compaction summarizes and can drop detail.
- Measure with `/context`; keep sessions focused; put durable facts in files, not in chat.
