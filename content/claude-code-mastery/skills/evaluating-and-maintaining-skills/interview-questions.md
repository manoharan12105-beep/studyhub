# Evaluating and Maintaining Skills — Interview Questions

## Beginner

### Q1. How do you know a skill is working?

**Style:** How

<details>
<summary>Answer</summary>

Check two things separately: it is invoked on the prompts it should be (and not on near misses), and results with it are better than without it. Run realistic prompts in fresh sessions with the skill on and off and compare.

</details>

## Intermediate

### Q2. What tools show what skills cost?

**Style:** What

<details>
<summary>Answer</summary>

`/context` shows the Skills listing's size, `/doctor` estimates its cost and top contributors, `/skill-doctor` (v2.1.252+) shows per-skill cost and usage and flags never-used skills, `/skills` sorts by token count, and `claude plugin details` projects a plugin's cost.

</details>

### Q3. When would you use claude plugin eval?

**Style:** When

<details>
<summary>Answer</summary>

For skills shipped in a plugin when you want a repeatable measurement: it runs eval cases with and without the plugin, scores them with graders (including whether the Skill tool was used) and can fail CI below a threshold. It runs real sessions as you, so only on plugins you trust, and it costs model usage.

</details>

## Advanced

### Q4. Your organization has 60 skills and complaints that Claude "ignores" some. Diagnose.

**Style:** Debugging

<details>
<summary>Answer</summary>

Likely the listing is over its budget and descriptions are being dropped (least-used first), removing the keywords Claude matches on; or descriptions overlap. Check `/context` and the debug log warning, run `/skill-doctor`, retire unused skills, set rarely used ones to `"name-only"`, make manual workflows `disable-model-invocation`, deduplicate overlapping skills and front-load key use cases in descriptions — then re-test triggering.

</details>

### Q5. How do you keep skills from going stale?

**Style:** Design

<details>
<summary>Answer</summary>

Treat them as code: review changes under `.claude/skills/` with owners, update them in the same pull request that renames commands, classes or files they reference, keep a small eval set and re-run it after changes, and review usage periodically to delete what nobody uses.

</details>
