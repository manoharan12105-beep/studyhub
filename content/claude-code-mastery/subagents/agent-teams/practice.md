# Agent Teams and Collaboration — Practice

### P1. Status

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** experimental features

Which statement about agent teams in Claude Code v2.1.289 is correct?

- A) They are on by default
- B) They are experimental and enabled with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- C) They replace subagents
- D) They work in `claude -p` scripts

<details>
<summary>Answer</summary>

**Answer:** B) They are experimental and enabled with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

They need an interactive session and sit alongside subagents.

</details>

### P2. Team or subagents?

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** choosing

Choose team or subagents: (a) run tests and report failures; (b) three investigators who must argue about which of three hypotheses explains an intermittent bug; (c) summarize five modules independently.

<details>
<summary>Answer</summary>

(a) Subagent — focused, result only. (b) Team — workers need to challenge each other. (c) Subagents — independent work, only the summaries matter.

</details>

### P3. Inherited danger

**Difficulty:** Medium · **Type:** Security · **Concepts:** permissions

You start the lead with `--dangerously-skip-permissions` "just for the lead". What permission mode do teammates get?

<details>
<summary>Answer</summary>

They skip permissions too: teammates start with the lead's mode, and a lead running with `--dangerously-skip-permissions` passes that to all teammates. Don't run a team that way outside an isolated environment.

</details>

### P4. Who approved the plan?

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** plan approval

A teammate spawned while the lead was in plan mode reports "plan approved, implementing". Did you approve it?

<details>
<summary>Answer</summary>

No. The lead session approves teammate plans automatically when the request arrives. The teammate's edits and commands still go through permission prompts, but if the plan matters, ask to see it before implementation or review the result carefully.

</details>

### P5. Overwrites

**Difficulty:** Medium · **Type:** Failure diagnosis · **Concepts:** file conflicts

Two teammates both edited `OrderController.java`; one teammate's changes disappeared. Why, and how do you plan the next team task?

<details>
<summary>Answer</summary>

Teammates don't merge each other's edits — two agents editing the same file overwrite each other. Split work so each teammate owns different files (for example one owns `Order.java`, one owns the tests), or do same-file work in a single session.

</details>

### P6. Resumed session

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** limitations

After `claude --resume`, the lead keeps messaging "teammate-security", which doesn't respond. What is happening?

<details>
<summary>Answer</summary>

Resuming doesn't restore in-process teammates — a documented limitation. The lead is messaging a teammate that no longer exists. Tell the lead to spawn new teammates (with full context in their spawn prompts).

</details>

### P7. Unexpected team

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** naming

With teams enabled for an experiment last week, you now notice ordinary delegation sometimes shows teammates in the panel and token use is higher. Explain and fix.

<details>
<summary>Answer</summary>

While teams are enabled, a subagent that Claude names launches as a teammate, and Claude can name subagents on its own. Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` to `0` in the settings file that enabled it (and check project, local, `--settings` and managed sources, which can override user settings).

</details>
