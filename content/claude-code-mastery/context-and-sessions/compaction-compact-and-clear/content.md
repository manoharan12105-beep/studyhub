# Context Compaction, /compact and /clear

**Module:** Context Windows, Sessions and Checkpoints · **Interview priority:** Core

## Definition

**Compaction** replaces the conversation history with a structured **summary** so a session can continue after its context window fills. Claude Code does it automatically near the limit (**auto-compaction**), and you can trigger it with **`/compact`**, optionally telling it what to keep. **`/clear`** is different: it starts a new conversation with empty context; the old conversation stays saved and can be resumed.

## Why It Matters

- A full context window does not end your session — compaction lets it continue. But a summary is lossy: details you did not ask it to keep may disappear.
- Choosing between `/compact`, `/clear` and a new session is a daily decision that affects quality and cost.
- Knowing what survives compaction tells you where to put information that must persist.

## How It Works

As the context approaches the limit, Claude Code first **clears older tool outputs**, then **summarizes the conversation**. Your requests and key code snippets are preserved; detailed instructions from early in the conversation may be lost.

```text
before compaction                               after compaction
┌───────────────────────────────┐              ┌───────────────────────────────┐
│ system prompt, output style   │ ── stays ──► │ system prompt, output style   │
│ CLAUDE.md, unscoped rules     │ ─ re-read ─► │ CLAUDE.md, unscoped rules     │
│ auto memory                   │ ─ re-read ─► │ auto memory                   │
│ 140 messages, 30 file reads,  │ summarize ─► │ structured summary            │
│ 9 test runs, rules loaded     │              │ + up to 5 recently read files │
│ by paths:, skill bodies       │              │ + invoked skills (capped)     │
└───────────────────────────────┘              └───────────────────────────────┘
```

## What Survives Compaction

From the official context-window documentation:

| Content | After compaction |
|---------|------------------|
| System prompt and output style | Still apply |
| Project-root `CLAUDE.md` and unscoped rules | Re-injected from disk |
| Auto memory | Re-injected from disk |
| Git status snapshot | A fresh one is read |
| The plan written in plan mode | Re-injected from disk |
| Rules with `paths:` frontmatter, nested `CLAUDE.md` files | Reload on demand when matching files are touched again |
| Files Claude read or edited | Up to five re-read, most recently modified first (files over 5,000 tokens come back as a path reference) |
| Invoked skill bodies | Re-injected, capped at 5,000 tokens per skill and 25,000 in total; oldest dropped first |
| Background commands and subagents | Keep running; Claude is reminded which ones |
| Context that hooks added earlier | Summarized with the rest of the conversation |
| `SessionStart` hooks matching `compact` | Run again; their output is added |
| Instructions you typed in chat | **Only what the summary keeps** |

The lesson: anything that must survive belongs in a **file** that is re-read — `CLAUDE.md`, an unscoped rule, the plan, auto memory — or in a `SessionStart` hook with the `compact` matcher. Chat-only instructions are at the summary's mercy.

## /compact with Focus Instructions

```text
/compact focus on the BUG-101 fix: keep the reproduction command, the root cause in PriceCalculator, the files changed and the test results
```

A focused summary keeps what *you* choose instead of what the automatic pass guesses is important. Run it **before** starting a long new phase of the same task, while the important details are still fresh.

You can also give permanent guidance in `CLAUDE.md`:

```markdown
# Compact instructions
When compacting, keep the list of modified files, the exact test commands and any decisions about database migrations.
```

Other controls:

| Control | Effect |
|---------|--------|
| `/rewind` → **Summarize from here** | Compress from a chosen message forward; earlier messages stay intact |
| `/rewind` → **Summarize up to here** | Compress everything before a message; recent messages stay intact |
| `/autocompact 500k` | Set how full the window gets before auto-compaction (model-dependent limits) |
| `/btw <question>` | Ask a side question whose answer never enters the conversation history |

If a single huge file or tool output refills the context immediately after every summary, Claude Code stops auto-compacting after a few attempts and shows an error rather than looping.

## /clear

`/clear` starts a new conversation with empty context. The previous conversation is saved — `/clear auth-investigation` labels it for the `/resume` picker, and the rewind menu offers `/resume <id> (previous session)` until you exit.

Use `/clear` when **switching to unrelated work**: old conversation crowds out the files you need next and costs tokens on every message. The startup content (CLAUDE.md, memory) loads again, so durable instructions are not lost.

## Preserving Important Decisions

| Information | Where to keep it |
|-------------|------------------|
| Project rules ("never edit applied migrations") | `CLAUDE.md` or `.claude/rules/` |
| The plan for a multi-step task | Plan mode's plan file, or a `PLAN.md` you ask Claude to maintain |
| Decisions and rejected approaches for this task | A short notes file in the repository (or the PR description draft) |
| Progress | Small Git commits on a branch |
| Personal corrections Claude should remember | Auto memory ("remember that …") |

## When to Compact vs Start Fresh

| Situation | Choose | Why |
|-----------|--------|-----|
| Same task, entering a new phase, context getting full | `/compact` with focus | Keeps the thread, frees space |
| Switching to an unrelated task | `/clear` | Nothing from before is useful |
| Corrected Claude more than twice on the same issue | `/clear` + a better prompt | Failed attempts are polluting the context |
| Want to try a different approach but keep the current one | `/branch` (Module 2, sessions) | Two independent paths |
| A verbose debugging detour is over | `/rewind` → Summarize from here | Compress only the detour |

## Real-World Example

You fixed BUG-101 in `orderdesk` after a long investigation and now want to add regression tests. The context is 80% full of Maven logs.

```text
/compact keep: root cause (PriceCalculator.totalCents called trim() on a null discountCode), the fix, the files changed, and the command ./mvnw -q test -Dtest=PriceCalculatorTest
```

Then: *"Add regression tests for a blank discount code and for rounding of 999 cents with SAVE10."* The summary carries the essentials; the logs are gone.

## Step-by-Step Walkthrough

1. Run `/context` and note the usage.
2. Before a new phase, run `/compact` with a focus sentence listing what must survive.
3. Ask Claude to restate the key facts; correct the summary if something is missing.
4. When the task is done, `/clear` before the next unrelated task.
5. If an instruction must survive every compaction, move it into `CLAUDE.md`.

## Common Mistakes

- Waiting for auto-compaction in the middle of a delicate change instead of compacting deliberately before it.
- Using `/compact` when the right move is `/clear` (unrelated task, polluted context).
- Thinking `/clear` deletes the conversation — it is saved and resumable.
- Relying on a chat instruction ("don't push") across compactions.
- Putting a rule in a `paths:`-scoped rule file and expecting it to persist after compaction even when no matching file is touched again.

## Security Considerations

- In auto mode, boundaries you state in conversation ("don't deploy") are read from the transcript on each check; a compaction can remove the message that stated them. For a hard guarantee, use a deny rule.
- Summaries are part of the session transcript stored under `~/.claude/projects/`. Anything sensitive that entered the conversation is in there too.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Instruction "forgotten" after compaction | Given only in chat, or in a path-scoped rule not reloaded | Move to project-root `CLAUDE.md` or an unscoped rule |
| Compaction error about thrashing | One huge file or output refills the window | Avoid reading that file whole; summarize it or delegate to a subagent |
| Summary misses key detail | Automatic pass guessed wrong | `/compact` with explicit focus; add a "Compact instructions" section to CLAUDE.md |
| After `/clear`, need the old conversation | — | `/resume`, or the `(previous session)` entry in `/rewind` |

## Trade-offs

| Option | Keeps | Loses | Cost |
|--------|-------|-------|------|
| Auto-compaction | Thread of the task | Whatever the summary omits | One summarization request |
| `/compact <focus>` | What you name | Everything else in detail | One summarization request |
| `/clear` | Startup files only | The whole conversation (still resumable) | Cheapest going forward |
| Larger context window | More raw history | Focus (dilution) | More tokens per message |

## Interview Takeaways

- Explain compaction (clear old tool output, then summarize) and list what is re-read from disk afterwards.
- Distinguish `/compact` (same conversation, summarized) from `/clear` (new conversation; old one saved).
- Show you persist decisions in files — CLAUDE.md, a plan, commits — not in chat.

## Key Takeaways

- Compaction keeps long sessions alive by summarizing; summaries lose detail.
- Project-root CLAUDE.md, unscoped rules, auto memory and the plan are re-read; chat instructions are not.
- `/compact <focus>` before a new phase; `/clear` between unrelated tasks.
- If it must survive, write it into a file.
