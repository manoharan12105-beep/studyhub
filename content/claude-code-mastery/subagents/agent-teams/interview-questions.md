# Agent Teams and Collaboration — Interview Questions

## Beginner

### Q1. What is an agent team?

**Style:** What

<details>
<summary>Answer</summary>

An experimental Claude Code feature where a lead session spawns teammate sessions. Each has its own context; they coordinate through a shared task list and direct messages, and you can talk to any teammate.

</details>

## Intermediate

### Q2. Subagents vs agent teams — when do you use each?

**Style:** Comparison

<details>
<summary>Answer</summary>

Subagents for focused tasks where only the result matters; they report back to the caller and cost less. Agent teams when workers need to share findings, challenge each other or own separate parts while coordinating — at significantly higher token cost and with experimental limitations.

</details>

### Q3. What are the main limitations of agent teams?

**Style:** What

<details>
<summary>Answer</summary>

Experimental and opt-in; interactive only; `/resume` and `/rewind` don't restore in-process teammates; task status can lag; slow shutdown; one team per session; no nested teams; fixed lead; permission mode set from the lead at spawn; split panes need tmux or iTerm2.

</details>

## Advanced

### Q4. What are the security implications of a team?

**Style:** Security

<details>
<summary>Answer</summary>

Every teammate is a full session in the lead's permission mode, so a bypassed lead means bypassed teammates. Teammate plans are approved automatically by the lead. Agent messages carry no user authority and can't relay denied actions, and in auto mode the classifier reviews inter-agent messages — but the real controls are still permission rules, hooks, sandboxing and keeping untrusted input away from write access.

</details>

### Q5. Your manager wants "an AI team that implements features in parallel". How do you respond?

**Style:** Scenario

<details>
<summary>Answer</summary>

Explain that teams are experimental and work best for research, review and competing hypotheses; parallel implementation suffers from same-file conflicts, coordination overhead and higher cost. Propose starting with read-only review teams or parallel subagents, splitting implementation by file ownership if tried, keeping human review and CI gates, and measuring cost and quality against a single-session baseline.

</details>
