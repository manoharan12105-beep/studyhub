# Delegation, Tool Calls, Cost and Latency

**Module:** Advanced Context and Workflow Engineering · **Interview priority:** Frequently asked

> [!NOTE]
> **Checked against:** Claude Code v2.1.289, *Manage costs effectively*, *Model configuration* and *Fast mode* (October 2026). Cost figures and ratios come from that documentation; no cost measurements were made for this lesson, and prices change — check current pricing before quoting numbers.

## Definition

An **efficient agent workflow** reaches a verified result with the fewest tokens, tool calls and minutes that the task actually needs. The main levers are **what you ask** (specific prompts), **who does the work** (main conversation, subagent, team), **which model and effort level** run it, and **how much context** every request carries.

## Why It Matters

- Claude Code sends the conversation with every request; a long, unfocused session pays for its history again and again (mostly at cached rates, but not for free).
- Delegation, teams, high effort and fast mode all trade money for something — isolation, parallelism, quality or speed. Knowing the exchange rate avoids paying for nothing.
- Fewer, better tool calls are also faster: each round trip is latency.

## How It Works

```text
cost ≈ (context per request) × (number of requests) × (price of the model/mode)
             │                        │                        │
   CLAUDE.md, tools, history   tool calls, retries,     model, effort (thinking
   files read, outputs         subagents, teammates     tokens), fast mode
```

Every lever reduces one factor, often at the expense of another.

## One Agent or Delegation?

| Situation | Choose | Why |
|-----------|--------|-----|
| Small, targeted change | Main conversation | Lowest overhead and latency |
| Wide search with a short answer | Subagent (Explore) | Verbose reads stay out of your context |
| Verbose output (tests, logs) | Subagent | Only the summary returns |
| Independent investigations | Parallel subagents | Wall-clock time ≈ slowest one |
| Side task needing the conversation | Fork (`/subtask`) | Shares the prompt cache; no re-explaining |
| Workers must debate | Agent team (experimental) | Highest cost — the docs cite roughly 7× the tokens of a standard session when teammates run in plan mode |

Delegation isn't free: each subagent sends its own requests, and a non-fork subagent starts without context, so it may re-read files you already read.

## Reducing Unnecessary Tool Calls

| Wasteful | Efficient |
|----------|-----------|
| "Improve this codebase" | "Add a null check for discountCode in PriceCalculator.totalCents and a test" |
| Claude greps and opens ten candidate files | Name the file, or use code intelligence for go-to-definition |
| Full test suite after every edit | The relevant test while iterating; the full build at the end |
| Reading a 10,000-line log | A hook or `grep` that returns only `ERROR` lines |
| Rediscovering the architecture each session | A short codebase-overview skill or CLAUDE.md section |
| Re-trying a failing approach | Stop early (Esc), `/rewind`, re-prompt with what you learned |

## Models, Effort and Fast Mode

| Lever | What it changes | When it's worth it |
|-------|-----------------|--------------------|
| Model (`/model`) | Capability and price per token | Sonnet-class for most coding; Opus-class for hard architecture/reasoning; Haiku-class for simple subagent tasks |
| Effort (`/effort low … max`) | How much the model thinks (thinking tokens are billed as output) | Lower for routine edits; higher for tricky debugging |
| Fast mode (`/fast`) | Same Opus model, up to 2.5× faster output, higher price per token | Interactive iteration where waiting costs more than tokens; enabling it mid-conversation re-prices the whole context once |
| Subagent model (`model: haiku`) | Cheaper workers | Searches, summaries, simple checks |

Fast mode and effort are different levers: fast mode keeps quality and costs more; lower effort costs less and may reduce quality on complex tasks.

## Cost and Latency of Subagents and Teams

| Mechanism | Token cost | Latency | Notes |
|-----------|-----------|---------|-------|
| Main conversation | Baseline | Lowest for small tasks | Context grows with the session |
| Subagent | Its own requests + summary in yours | Startup to gather context | Saves *your* context, not total tokens |
| Fork | Shares the prompt cache | Fast start | Inherits the whole conversation |
| Parallel subagents | Sum of each | ≈ the slowest | Reports add to your context |
| Agent team | Scales with active teammates | Coordination overhead | Experimental; keep small; shut down idle teammates |

## Syntax and Configuration

```text
/usage                         # where tokens went; flags habits worth changing
/context                       # what each request carries
/model sonnet                  # switch model
/effort low                    # less thinking for routine work
/fast                          # toggle fast mode (Opus only)
```

```yaml
---
name: log-summarizer
description: Summarizes long Maven or application logs into the first error and its cause. Use for logs over a few hundred lines.
tools: Read, Grep
model: haiku
---

Return only: the first ERROR line, its stack trace's first project frame, and one sentence on the likely cause.
```

## Real-World Example

For BUG-101 on orderdesk, an efficient session looks like: one specific prompt naming the issue file and the reproduction requirement; Claude runs one test class (not the suite) while iterating; one full `./mvnw -B verify` at the end; no subagents (the task is small and sequential). An inefficient one — "something's wrong with orders, look around" — reads every class, runs the whole suite after each edit and spawns reviewers for a three-line fix.

## Step-by-Step Walkthrough

1. Make the request specific: file, behaviour, check to run.
2. Decide the worker: main thread unless isolation, verbosity or parallelism justifies delegation.
3. Pick the model and effort for the task, not by habit.
4. Iterate with focused checks; run the full build once at the end.
5. `/clear` between unrelated tasks.
6. Review `/usage` weekly and change the habits it flags.

## Common Mistakes

- Spawning subagents for small sequential tasks.
- Max effort and the largest model for routine edits.
- Turning on fast mode deep into a long conversation (the one-time re-pricing is largest then).
- Leaving agent teammates idle.
- Long all-day sessions across unrelated tasks.

## Security Considerations

- Cheaper isn't safer: a smaller model in a subagent still needs restricted tools.
- Cost limits (`--max-budget-usd`, `--max-turns`, CI timeouts) are also safety limits for unattended runs.
- Don't paste large files with secrets "to save tool calls".

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Usage much higher than expected | Long context, cache misses after breaks, subagents, teammates | `/usage` breakdown; clear, delegate less, shut down teammates |
| Slow responses on simple edits | High effort or large model | Lower effort / smaller model |
| Many file reads per question | Vague prompts, no code navigation | Name files; add a codebase-overview skill |

## Trade-offs

| Lever | Saves | Costs |
|-------|-------|-------|
| Subagent | Main context | Total tokens, startup latency |
| Lower effort | Tokens, time | Quality on hard problems |
| Fast mode | Wall-clock time | Money |
| Specific prompts | Tool calls | Your thinking up front |

## Interview Takeaways

- Cost ≈ context × requests × price; every lever trades one for another.
- Delegate for isolation, verbosity or parallelism — not by default.
- Model, effort and fast mode are separate levers.

## Key Takeaways

- Be specific; run focused checks; clear between tasks.
- Match model and effort to the task.
- Measure with `/usage` and `/context` instead of guessing.
