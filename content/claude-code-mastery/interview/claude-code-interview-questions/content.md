# Claude Code Interview Questions

**Module:** Interview Preparation · **Interview priority:** Core

> [!NOTE]
> **Checked against:** Claude Code v2.1.289 and the official documentation (October 2026). Claude Code changes often: in an interview, say which version or date your knowledge refers to when details matter.

## Definition

A cross-topic bank of Claude Code questions for developers: what it is, modes and permissions, context and sessions, CLAUDE.md and memory, hooks, MCP, skills, subagents and teams, Git and CI workflows, and the misconceptions interviewers like to probe. Scenario, security and workflow-design questions with follow-ups are in [Scenario, Security and Workflow Interview Questions](../claude-code-scenario-interview-questions/content.md).

## Why It Matters

Teams adopting AI coding agents want people who use them **safely and verifiably**. Interviewers listen for precise distinctions (instructions vs enforcement, subagents vs teams, checkpoints vs Git) and for evidence-driven habits — not for enthusiasm.

## How It Works

How to answer a Claude Code question:

```text
1. Define it in one sentence.          "A hook is a command Claude Code runs at a lifecycle event."
2. Say what problem it solves.         "Rules in CLAUDE.md are followed most of the time; hooks run every time."
3. Give one concrete detail.           "PreToolUse with exit code 2 blocks the tool call and shows stderr to Claude."
4. Add the limit or trade-off.         "It matches what it's given — a text-matching guard misses other spellings."
5. Tie it to your practice.            "We block edits to applied Flyway migrations with a PreToolUse hook."
```

Questions are grouped Beginner → Advanced, each with a style label: What, Why, How, Comparison, Scenario, Debugging, Security, Workflow design, Trade-off, Misconception.

## Distinctions Interviewers Probe

| Pair | The one-line difference |
|------|------------------------|
| Mode vs model vs effort | Mode = what Claude may do without asking; model = which Claude; effort = how much it thinks |
| CLAUDE.md vs hooks | Guidance the model reads vs code Claude Code executes every time |
| Hooks vs MCP vs GitHub Actions | Lifecycle automation vs tools for the model vs CI workflows on GitHub's runners |
| Skills vs CLAUDE.md | Procedures loaded on demand vs facts loaded every session |
| Subagents vs agent teams | Workers that report back vs experimental independent sessions that talk to each other |
| Checkpoints vs Git | Session-local undo of Claude's file edits vs durable, shared history |
| `/compact` vs `/clear` | Summarize and continue vs start fresh |
| Plan mode vs Manual mode | Read-only exploration vs prompts before edits and commands |
| `dontAsk` vs `bypassPermissions` | Deny anything not pre-approved vs skip permission checks |
| "YOLO mode" | Community slang for skipping permissions — not an official mode |

## Common Mistakes

- Answering with features instead of trade-offs.
- Claiming a mechanism "guarantees" safety (hooks, deny rules, AI review) — each is a layer.
- Quoting flags or settings you haven't checked; say "I'd confirm in the docs" instead.
- Forgetting verification: tests, diffs and evidence are the core of a good answer.

## Interview Takeaways

- Define → purpose → concrete detail → limit → your practice.
- Know the distinction table cold.
- Evidence and human approval points appear in every strong answer.

## Key Takeaways

- Precision beats buzzwords.
- Admit version dependence; Claude Code evolves quickly.
- Use the flashcards view of this topic for spaced revision.
