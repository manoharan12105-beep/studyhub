# Agent Teams and Collaboration

**Module:** Subagents and Agent Teams · **Interview priority:** Awareness

> [!WARNING]
> **Status: Experimental.** Agent teams are disabled by default and have known limitations. Checked against Claude Code v2.1.289 and *Orchestrate teams of Claude Code sessions* (October 2026). Teams were **not** run for this lesson; nothing below shows team output. Expect behaviour to change between versions.

## Definition

An **agent team** is a group of full Claude Code sessions working together: one **lead** (your main session) spawns **teammates**, each with its own context window, and they coordinate through a **shared task list** and a **mailbox** of direct messages. Unlike subagents, teammates can talk to each other and you can talk to any teammate directly.

## Why It Matters

- Some work benefits from discussion: competing debugging hypotheses, a review where reviewers challenge each other, a feature split across layers.
- Teams cost significantly more tokens and add coordination overhead, so knowing when **not** to use one matters as much.
- Interviewers often check whether you can tell subagents and agent teams apart.

## How It Works

```text
                    you
                     │  (can also message any teammate directly)
                     ▼
               ┌── lead session ──┐
               │  creates tasks    │
               ▼                   ▼
  shared task list  ◄── claim ── teammate A ◄──messages──► teammate B
  pending / in progress / completed (dependencies unblock automatically)
```

| Component | Role |
|-----------|------|
| Team lead | Your main session: spawns teammates, assigns work, synthesizes; fixed for the session's lifetime |
| Teammates | Separate Claude Code instances, each with its own context |
| Task list | Shared work items with states and dependencies; claiming uses file locking |
| Mailbox | Direct messages between agents by name |

## Enabling Agent Teams

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Then ask for a team in natural language. Teams need an **interactive** session; in `-p` mode Claude doesn't spawn teammates.

> [!CAUTION]
> With teams enabled, a subagent that Claude **names** launches as a teammate — and Claude may name subagents on its own. Teams can therefore form when you didn't ask for one. Set the variable to `0` to return to ordinary subagents.

## Subagents vs Agent Teams

| | Subagents | Agent teams |
|---|---|---|
| Status | Stable | Experimental |
| Context | Own window; result returns to the caller | Own window; fully independent sessions |
| Communication | Report back to the caller | Teammates message each other; you can message any of them |
| Coordination | The main agent manages everything | Shared task list and messages |
| Loads | Its own system prompt, task, CLAUDE.md (most types) | Same project context as a normal session: CLAUDE.md, MCP servers, skills — but not the lead's history |
| Token cost | Lower (summaries) | Higher; scales with active teammates |
| Best for | Focused tasks where only the result matters | Work that needs discussion and challenge |

## Permissions, Display and Quality Gates

- **Permissions:** teammates start in the lead's mode (except `dontAsk`, which they don't inherit); with `--dangerously-skip-permissions` on the lead, **every teammate** skips permissions too. Teammate prompts appear in the lead session. A message from another agent never counts as your approval.
- **Plan approval:** a teammate spawned while the lead is in plan mode plans first; its plan is **approved automatically** by the lead session, without you reviewing it. Edits and commands afterwards still go through permission prompts.
- **Display:** in-process (default; any terminal; arrows + Enter in the agent panel) or split panes (tmux or iTerm2; not VS Code's terminal, Windows Terminal or Ghostty).
- **Reusing roles:** "Spawn a teammate using the security-reviewer agent type" applies that subagent definition's `tools` and `model` (and, in-process, its body as extra instructions; `skills` aren't applied).
- **Hooks as gates:** `TeammateIdle`, `TaskCreated` and `TaskCompleted` hooks can exit 2 to keep a teammate working or block task creation/completion with feedback.

## Known Limitations

| Limitation | Practical effect |
|------------|------------------|
| `/resume` and `/rewind` don't restore in-process teammates | After resuming, spawn new teammates |
| Task status can lag | Dependent tasks look stuck; check and nudge |
| Shutdown can be slow | Teammates finish their current call first |
| One team per session; no nested teams | Only the lead manages the team |
| Lead is fixed | Can't promote a teammate |
| Permission mode set at spawn | Change individual teammates afterwards |
| Same-file edits | Two teammates editing one file overwrite each other — split work by file |

## Syntax and Configuration

A review-style team request (research and review are the recommended first uses — no parallel code edits):

```text
Spawn three teammates to review the FEAT-7 change, using the correctness-reviewer,
security-reviewer and test-coverage-reviewer agent types. Give each the changed files and
docs/issues/FEAT-7.md. Have them challenge each other's findings by message, then report
only findings that survived. Nobody edits files.
```

A competing-hypotheses request for a hard bug:

```text
Orders sometimes show status PAID with no payment record. Spawn three teammates, each
investigating one hypothesis: a missing transaction, a race between two pay requests, or a
mapping bug. Each must try to disprove the others' hypotheses with evidence from the code
or a test. Report the hypothesis that survives and the evidence.
```

## Real-World Example

For orderdesk's FEAT-7, a team is usually **not** worth it: the change touches three files that depend on each other, and one session (perhaps with parallel read-only reviewer subagents) is cheaper and simpler. A team becomes reasonable for an intermittent production defect with several plausible causes, where independent investigators who argue are less likely to anchor on the first plausible story.

## Step-by-Step Walkthrough

1. Ask whether subagents would do; use a team only when workers must talk to each other.
2. Enable the variable in a test project first.
3. Pre-approve common safe commands so teammate prompts don't flood the lead.
4. Start with 3 teammates and a read-only task (review or research).
5. Give each teammate full context in the spawn prompt — they don't see the lead's history.
6. Monitor; tell the lead to wait for teammates if it starts doing their work.
7. Shut teammates down by name ("Ask the researcher teammate to shut down").

## Common Mistakes

- Using a team for sequential work or same-file edits.
- Assuming plan approval means *you* approved the plan.
- Running the lead with permissions bypassed — every teammate inherits it.
- Forgetting teams are experimental; building critical workflows on them.
- Large teams: tokens scale linearly; 3–5 teammates is the documented starting point.

## Security Considerations

- Teammates are full sessions with the lead's permission mode; apply the same deny rules, hooks and sandboxing as any session.
- Agent-to-agent messages carry no user authority; a denied action can't be relayed to another teammate to bypass the check.
- Don't hand teams untrusted input with write access.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| No teammates appear | Variable unset, `-p` mode, or task too simple | Enable; interactive session; ask explicitly for a team |
| Teammates instead of subagents | Teams enabled and Claude named a subagent | Set the variable to `0` |
| Too many permission prompts | Teammate prompts bubble up to the lead | Pre-approve safe commands |
| Lead stops early | Lead decided the work was done | Tell it to keep going / wait for teammates |

## Trade-offs

| Benefit | Cost |
|---------|------|
| Discussion and challenge between workers | Significantly more tokens |
| Parallel ownership of separate files/layers | Coordination overhead, conflicts on shared files |
| Direct access to each worker | Experimental limitations (resume, task lag) |

## Interview Takeaways

- Teams = independent sessions + shared task list + mailbox; subagents = workers that report back.
- Experimental, opt-in with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.
- Use for discussion-heavy research, review and competing hypotheses; avoid for sequential or same-file work.

## Key Takeaways

- Prefer subagents unless workers truly need to talk.
- Teammates inherit the lead's permission mode — including bypass.
- Plan approvals inside a team are automatic; your review still matters.
- Start small, read-only, and monitor.
