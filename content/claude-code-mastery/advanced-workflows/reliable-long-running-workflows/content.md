# Long-Running Tasks, Failure Recovery and Workflow Quality

**Module:** Advanced Context and Workflow Engineering · **Interview priority:** Awareness

> [!NOTE]
> **Checked against:** Claude Code v2.1.289, *Best practices*, *Checkpointing* and the commands reference (October 2026). Recovery commands were covered with real runs in the context-and-sessions module; this lesson combines them into a workflow and doesn't add new captured output.

## Definition

A **long-running task** is work that spans many turns, compactions or sessions — a multi-file feature, a migration across modules, a large refactor. A **reliable workflow** for it survives interruptions and wrong turns: it records progress outside the conversation, verifies each step, and has a known way back from every failure. **Workflow quality** is measured with evidence about outcomes, not with how productive the session felt.

## Why It Matters

- Long sessions accumulate stale context, compaction loses detail, and one wrong assumption early can poison hours of work.
- Checkpoints undo file edits made by Claude's edit tools, not everything: Bash side effects, remote actions and some subagent edits aren't covered. Git is the durable safety net.
- Without measurement, teams can't tell whether a workflow change helped or just felt better.

## How It Works

```text
plan (in a file) ──► step 1 ──verify──► commit ──► step 2 ──verify──► commit ──► …
                       │                              │
                  wrong turn?                   session ends?
                  /rewind or git restore        resume: plan file + git log + tests tell
                                                where you are (not the chat history)
```

The durable state lives in **files and commits**: the plan, the code, the tests, the history. The conversation is disposable.

## Running Long Tasks in Checkpoints

| Practice | Why |
|----------|-----|
| Write the plan to a file (`docs/plans/feat-7.md`) with a checklist | Survives `/clear`, compaction and new sessions |
| One step = one verifiable change | Each step has a test or command that proves it |
| Commit after each verified step (on a branch) | A durable restore point you can diff, revert or bisect |
| Name sessions (`/rename`) and resume them (`/resume`) | Return to the conversation when it helps |
| Compact with a focus (`/compact keep the plan and failing tests`) | Keep what matters when context is full |
| Parallel streams in separate worktrees (`claude --worktree`) | No file conflicts between sessions |

`/goal <condition>` keeps Claude working across turns until the condition holds (for example "`./mvnw -B verify` passes and every item in docs/plans/feat-7.md is checked"); a Stop hook can enforce a check deterministically.

## Recovering from Failures

| Failure | Recovery | Not this |
|---------|----------|----------|
| Claude went the wrong way in the last few turns | Esc to stop; `/rewind` to a checkpoint (code and/or conversation) | Arguing with it for ten turns |
| Two corrections failed | `/clear`; restart with a better prompt that includes what you learned | Piling corrections into a polluted context |
| Unwanted file changes after a commit point | `git diff`; `git restore <file>` or `git restore -p` | `git reset --hard` with uncommitted work you need |
| A Bash command changed state (database, files outside edits) | Undo it explicitly; checkpoints don't cover it | Expecting `/rewind` to revert it |
| Session crashed or ended | `claude --resume` / `--continue`; read the plan file and `git log` | Reconstructing from memory |
| Build broke somewhere in 15 commits | `git bisect run <test>` | Reading every diff |

> [!WARNING]
> Destructive Git commands (`git reset --hard`, `git clean -fd`, `git checkout -- .`) discard work permanently. Before running one, run `git status` and `git stash` anything you may need. Never run them on a shared branch or in a directory you haven't inspected.

## Designing Reliable Agent Workflows

| Principle | In practice |
|-----------|-------------|
| Make steps small and checkable | Each step names its test or command |
| Keep state outside the chat | Plan file, commits, issue comments |
| Verify continuously | Focused tests per step, full build at milestones, hooks for must-hold rules |
| Fail loudly | Scripts check exit codes and `is_error`; hooks exit 2 with a reason |
| Limit blast radius | Branches, worktrees, permissions, sandboxes, no autonomous deploys |
| Know the way back | Checkpoint, commit, revert, bisect — before you need them |
| Keep humans at decision points | Plan approval, diff review, merge, deploy |

## Measuring Workflow Quality

| Measure | Evidence | Watch out for |
|---------|----------|---------------|
| Correctness | Escaped defects; regression tests added per bug | Counting only "tasks finished" |
| Rework | Reverted or heavily revised AI changes | Rework hidden in follow-up PRs |
| Review effort | Reviewer time; comments per PR | Rubber-stamp reviews looking "efficient" |
| Finding quality (AI review) | Validated vs rejected findings | Volume of findings as a success metric |
| Cost | `/usage`, `total_cost_usd`, CI minutes | Comparing tasks of different size |
| Lead time | Issue opened → merged | Speed gained by skipping verification |

Change one thing at a time (a new skill, a hook, a model), compare against a baseline of similar tasks, and keep changes that improve outcomes — not just speed.

## Syntax and Configuration

```text
/rename feat-7-pay-endpoint
/compact Keep docs/plans/feat-7.md status, failing test names and changed files.
/rewind
/goal ./mvnw -B verify passes and all items in docs/plans/feat-7.md are checked
```

```bash
claude --resume                  # pick a previous session
git log --oneline main..HEAD     # what this branch has done so far
git stash push -m "before experiment"
```

## Real-World Example

A multi-module change to orderdesk-style services — add `paid_at`, backfill, expose it in the API, update clients — is four checkable steps: migration (Flyway applies, tests pass), entity and mapping (startup validates), API (MockMvc tests), docs. With a plan file and a commit per step, an interrupted session resumes from the plan's next unchecked item and `git log`; a failed step is reverted alone. Done in one giant uncommitted session, the same interruption leaves a half-applied change and a summary in a conversation that may already be compacted.

## Step-by-Step Walkthrough

1. Plan in plan mode; save the plan as a checklist file in the branch.
2. For each item: implement, run its check, commit.
3. When context gets heavy: `/compact` with focus, or `/clear` and resume from the plan file.
4. When something goes wrong: stop early, choose the recovery from the table.
5. At the end: full build, diff review against the plan, PR with evidence.
6. Afterwards: record rework and defects to judge the workflow.

## Common Mistakes

- Plans that live only in the conversation.
- No commits until the end of a long task.
- Using destructive Git to "start over" without checking for uncommitted work.
- Measuring success by lines changed or tasks closed.
- Letting a long autonomous run continue after the first failed verification.

## Security Considerations

- Long autonomous runs widen exposure: keep permissions tight, use sandboxes or worktrees, cap turns and budget.
- Plan files and session transcripts may contain sensitive details; don't commit secrets into plans.
- Recovery steps that touch shared systems (databases, remote branches) need a human.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Claude forgets earlier decisions | Compaction or a new session | Keep decisions in the plan file; re-read it |
| `/rewind` didn't undo a change | Made by Bash or outside Claude's edit tools | Use Git or undo manually |
| Long run "finished" with failing tests | No gate on completion | `/goal` or a Stop hook running tests |
| Can't tell what's done | No checklist, no commits | Plan file + small commits |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Commit per step | Easy recovery, bisectable | More commits (squash on merge if preferred) |
| Plan file | Durable shared state | Must be kept current |
| `/goal` / Stop hooks | Work continues until verified | Extra turns; needs loop limits |

## Interview Takeaways

- State in files and commits, not in the chat.
- Small verified steps with a known way back.
- Measure outcomes — defects, rework, review effort, cost — not activity.

## Key Takeaways

- Plan file + commit per verified step makes long tasks resumable.
- Match the recovery tool to the failure; checkpoints aren't Git.
- Change workflows one variable at a time and measure.
