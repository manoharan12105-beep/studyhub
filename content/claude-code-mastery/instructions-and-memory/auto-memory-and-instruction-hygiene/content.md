# Auto Memory and Instruction Hygiene

**Module:** Project Instructions, Rules and Memory · **Interview priority:** Frequently asked

## Definition

**Auto memory** is a set of notes Claude writes **for itself** as you work — your preferences, corrections you gave, project context it cannot derive from the code — stored per repository on your machine and loaded into future sessions. **Instruction hygiene** is the practice of keeping all instruction sources — `CLAUDE.md` files, rules, auto memory, skills — accurate, non-duplicated, non-conflicting and small.

## Why It Matters

- Auto memory lets Claude learn from corrections without you editing files — and can quietly preserve a wrong or outdated "fact".
- Instructions now come from many places. Without hygiene, the same rule appears three times in three versions, and Claude follows whichever it weighs most.
- Every always-loaded line costs context in every session. Unused or stale instructions are pure cost.

## How It Works

```text
~/.claude/projects/<project>/memory/        (derived from the Git repository: all worktrees share it)
├── MEMORY.md            index, one line per memory  ── first 200 lines or 25 KB load every session
├── user_role.md         type: user        ┐
├── feedback_testing.md  type: feedback    ├─ topic files, read on demand with normal file tools
└── project_release.md   type: project     ┘
```

Claude saves four kinds of notes, recorded as a `type` in each file's frontmatter:

| Type | Example |
|------|---------|
| `user` | "Developer prefers explanations with a minimal code example." |
| `feedback` | "Corrected: run the single test class, not the whole suite, while iterating." |
| `project` | "Release freeze until 2026-10-20; payments integration owned by the finance team." |
| `reference` | "Incidents are tracked in the INC project of the issue tracker." |

Claude skips what it can derive from the codebase and what `CLAUDE.md` already says, and does not save something every session. When you see "Saved 2 memories" or "Recalled 2 memories", it is writing or reading that directory.

## Auto Memory vs CLAUDE.md

| | `CLAUDE.md` | Auto memory |
|---|---|---|
| Who writes it | You | Claude |
| Content | Instructions and rules | Learnings, preferences, context |
| Shared | Project file via Git | Machine-local only; not shared, not in cloud sessions |
| Loaded | Whole file(s) every session | `MEMORY.md` index (first 200 lines / 25 KB); topic files on demand |
| Survives compaction | Project root file re-read | Re-read |

When you say *"remember that the API tests need a local Redis"*, Claude saves it to **auto memory**. To change the shared project instructions, say *"add this to CLAUDE.md"* or edit the file.

## Controlling Auto Memory

| Action | How |
|--------|-----|
| See and edit memories | `/memory` → open the auto memory folder; files are plain Markdown |
| Toggle it | `/memory` toggle (saves `autoMemoryEnabled` in user settings) |
| Off for one project | `"autoMemoryEnabled": false` in the project's settings |
| Off by environment | `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` |
| Store elsewhere | `autoMemoryDirectory` (absolute or `~/` path) |

Auto memory is on by default in local sessions. Subagents do not see the main conversation's auto memory (except forks); a subagent can have its own via its `memory` field.

## Managing Memory Quality

Memory is only useful if it is true. Review it like any other configuration:

| Problem | Example | Fix |
|---------|---------|-----|
| Stale | "Use Java 17" after the upgrade to 21 | Delete or edit the file; tell Claude the new fact |
| Wrong generalization | A one-off "skip tests this time" saved as a preference | Delete it; say explicitly that it was a one-off |
| Duplicate of CLAUDE.md | Same rule in both, slightly different | Keep the project rule in `CLAUDE.md`; delete the memory |
| Belongs to the team | A project rule only you have in memory | Move it into `CLAUDE.md` so teammates get it |
| Sensitive | A customer email or token noted in memory | Delete it; never let secrets into the conversation |

Claude Code reminds Claude to shorten `MEMORY.md` when it nears the load limits; content past the limit is dropped at the next load.

## Preventing Instruction Duplication and Conflicts

Instructions can come from: managed `CLAUDE.md`, user `CLAUDE.md`, project and nested `CLAUDE.md`, `CLAUDE.local.md`, user and project rules, auto memory, skill content, subagent prompts, output styles — and your prompt. A rule should live in **exactly one** place:

| Kind of instruction | Home |
|---------------------|------|
| Applies to every task in this repository | Project `CLAUDE.md` |
| Applies to one area of the repository | Path-scoped rule |
| A procedure used sometimes | Skill |
| Your personal style across projects | User `CLAUDE.md` or user rule |
| Your environment for this project | `CLAUDE.local.md` |
| Something Claude learned from you | Auto memory (promote to `CLAUDE.md` if the team needs it) |
| Must never be violated | Settings or a hook — not text |

On recent versions (**Status:** Version-dependent, v2.1.283+), `/doctor prompt-audit` asks Claude to check `CLAUDE.md`, `CLAUDE.local.md`, `AGENTS.md`, rules, skills, commands, subagents and output styles for outdated or conflicting content and proposes edits without changing files until you ask.

## Keeping Instructions Small and Relevant

- **Delete what Claude can derive** — directory layouts, dependency lists, architecture overviews it can read. (`/doctor` proposes such trims for a checked-in `CLAUDE.md`.)
- **Scope** area rules with `paths`.
- **Move procedures** into skills; their bodies load only when used.
- **Prefer one sharp line** over a paragraph.
- **Measure** with `/context`; startup warnings appear when files exceed the recommended size.

## Real-World Example

After three months, a developer's orderdesk sessions start oddly: Claude insists on Java 17 syntax and skips integration tests. `/memory` shows two stale memories — "project targets Java 17" (true before the upgrade) and "skip MockMvc tests while iterating" (a one-off from a slow afternoon, generalized). Deleting both and adding "Java 21" to the shared `CLAUDE.md` fixes the behaviour for the developer and ensures teammates never had the problem.

## Step-by-Step Walkthrough

1. Run `/memory`, open the auto memory folder and read `MEMORY.md`.
2. For each entry: still true? personal or team? already in `CLAUDE.md`?
3. Delete stale or wrong entries; move team facts into `CLAUDE.md`.
4. List every instruction source (`/context` shows loaded memory files) and search for duplicates.
5. Run `/doctor prompt-audit` if your version supports it; review proposed edits.
6. Re-check monthly, or whenever behaviour changes without a code change.

## Common Mistakes

- Telling Claude to "remember" a team rule — it stays on your machine only.
- Never looking at auto memory, then being surprised by stale behaviour.
- Fixing one copy of a duplicated rule and leaving the other.
- Letting `MEMORY.md` grow past its load limit, silently dropping the tail.
- Using memory for secrets or customer data.

## Security Considerations

- Memory files are plain text under `~/.claude/projects/`; anything in them is loaded into future contexts. Keep secrets and personal data out.
- A repository can set `autoMemoryDirectory` in its settings; it is honoured under the same workspace-trust rule as hooks — another reason to review an untrusted repository's `.claude/` folder.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Behaviour changed though code and CLAUDE.md did not | New or stale memory | `/memory`, review recent memory files |
| A memory seems ignored | It is in a topic file not referenced well in `MEMORY.md`, or past the 200-line/25 KB limit | Shorten the index; one line per memory |
| Teammate lacks a behaviour you rely on | It lives in your auto memory | Promote it to `CLAUDE.md` |
| Toggle shows "can't be turned on here" | Background session or one started by another Claude Code session | Run `claude` directly in a terminal and toggle there |

## Trade-offs

| Auto memory on | Auto memory off |
|----------------|-----------------|
| Learns your corrections automatically | Fully predictable, file-driven instructions |
| Can preserve wrong generalizations | You re-teach preferences or write them down |
| Machine-local differences between teammates | Same behaviour for everyone from `CLAUDE.md` |

## Interview Takeaways

- Auto memory = Claude-written, machine-local notes (user, feedback, project, reference), index loaded each session.
- Distinguish it from `CLAUDE.md`: who writes, who shares, how it loads.
- Describe a hygiene routine: one home per rule, review memory, promote team facts, keep files small, audit for conflicts.

## Key Takeaways

- Auto memory learns from you but can be stale or wrong — review it with `/memory`.
- Team rules go in `CLAUDE.md`; personal learnings may live in memory.
- Every instruction in exactly one place; hard rules in settings or hooks.
- Small, current, conflict-free instructions are followed better and cost less.
