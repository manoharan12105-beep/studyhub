# Interview Quick Reference

## One-Line Definitions

| Term | Definition |
|------|------------|
| Claude Code | Agentic coding tool that reads, edits and runs commands in your repo within permissions you set |
| Permission mode | What Claude may do without asking (`default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`) |
| CLAUDE.md | Project instructions loaded every session — guidance, not enforcement |
| Auto memory | Notes Claude keeps per project; first 200 lines / 25 KB of `MEMORY.md` load |
| Permission rule | `allow`/`ask`/`deny` pattern; deny > ask > allow |
| Hook | Command run at a lifecycle event; exit 2 blocks |
| MCP | Open protocol connecting tools/data to Claude; servers over stdio or HTTP |
| Skill | `SKILL.md` procedure; description listed, body on demand |
| Subagent | Worker with own context and tools; returns one result |
| Agent team | Experimental: lead + independent teammates + task list + messages |
| Checkpoint | Session snapshot of Claude's file edits; `/rewind` |
| `claude -p` | Non-interactive run: stdout + exit code |

## Distinctions

- **Instructions vs enforcement:** CLAUDE.md/skills guide; permissions/hooks/sandbox/server rules enforce.
- **Hooks vs MCP vs GitHub Actions:** lifecycle automation vs model tools vs CI on GitHub's runners.
- **Subagents vs teams:** report back vs collaborate; cheap vs costly; stable vs experimental.
- **Checkpoints vs Git:** session undo of file edits vs durable history.
- **`/compact` vs `/clear`:** continue with summary vs start fresh.
- **`dontAsk` vs `bypassPermissions`:** deny unapproved vs skip checks.
- **Fast mode vs effort:** faster Opus at higher price vs less thinking.
- **AI review vs CI:** advisory vs deterministic gate.

## Answer Framework

1. Define (one sentence).
2. Purpose (what problem).
3. Concrete detail (flag, file, exit code).
4. Limit or trade-off.
5. Your practice (orderdesk example).

## Scenario Framework

Clarify → contain → evidence → fix (with regression test) → prevent (which layer, and its limit).

## Numbers Worth Knowing

| Fact | Value |
|------|-------|
| Hook exit code that blocks | 2 |
| Stop-hook consecutive continuation cap | 8 |
| Auto memory loaded | First 200 lines or 25 KB of `MEMORY.md` |
| CLAUDE.md import depth | 4 hops |
| Concurrent subagents (default) | 20 |
| Subagent nesting depth (default) | 3 |
| Skill re-attach after compaction | 5,000 tokens each, 25,000 total |
| Checkpoint snapshots kept per session | 100 most recent |
| Piped stdin cap for `claude -p` | 10 MB |
| Fast mode speed-up | up to 2.5× (Opus only) |

## Red Flags Interviewers Listen For

- "The hook guarantees…", "AI review approves…", "We run in YOLO mode."
- No mention of tests, diffs or evidence.
- Secrets in prompts or config files.
- Agents committing, pushing or deploying without a human.
