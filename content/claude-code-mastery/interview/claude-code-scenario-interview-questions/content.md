# Scenario, Security and Workflow Interview Questions

**Module:** Interview Preparation · **Interview priority:** Frequently asked

## Definition

Scenario questions describe a situation — a bug, an incident, a team decision — and ask what you would do, then push with follow-ups. This bank covers debugging with an agent, security incidents, workflow design and trade-offs for using Claude Code on a real team. Fundamentals are in [Claude Code Interview Questions](../claude-code-interview-questions/content.md).

## Why It Matters

Anyone can list features. Scenario answers show judgement: whether you collect evidence before acting, where you put humans in the loop, how you limit blast radius, and whether you can admit what a tool can't guarantee.

## How It Works

A structure that works for scenario answers:

```text
1. Clarify      What exactly happened? What's the impact? What changed recently?
2. Contain      Stop the damage first (revoke, disable, revert) — before root cause.
3. Evidence     Logs, traces, diffs, a reproducing test. No fixes on guesses.
4. Fix          The cause, with a regression test; small, reviewed change.
5. Prevent      Which layer should have caught it: instruction, permission, hook, CI, review?
6. Follow-ups   Name the trade-off and what you'd measure.
```

## Follow-Up Patterns

| Interviewer asks | They're checking |
|------------------|------------------|
| "What if the agent had done X?" | That your controls don't depend on the agent behaving |
| "How would you know?" | Evidence and observability |
| "What does that cost?" | Trade-off awareness (tokens, time, friction) |
| "Who approves that?" | Human decision points |
| "What can't that prevent?" | Honesty about limits |

## Common Mistakes

- Jumping to the fix before containing the problem.
- "We'd add a rule to CLAUDE.md" as the only prevention for a must-hold rule.
- Treating AI review or a hook as a guarantee.
- Answers with no evidence step.

## Interview Takeaways

- Clarify → contain → evidence → fix → prevent.
- Every prevention names a layer and its limit.
- Keep humans on commits, merges, deploys and secrets.

## Key Takeaways

- Judgement is shown through order of operations.
- Controls must work even if the agent misbehaves.
- Measure before and after changing a workflow.
