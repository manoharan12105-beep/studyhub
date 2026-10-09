# Evaluating and Maintaining Skills — Practice

### P1. What does triggering prove?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** evaluation

Your new skill loaded on all five test prompts. What have you shown?

- A) The skill improves results
- B) Claude finds the skill for those prompts — not yet that it helps or that it stays quiet on other prompts
- C) The skill is safe
- D) The description is the right length

<details>
<summary>Answer</summary>

**Answer:** B) Claude finds the skill for those prompts — not yet that it helps or that it stays quiet on other prompts

Usefulness needs a with/without comparison, and over-triggering needs should-not-trigger prompts.

</details>

### P2. Fresh sessions

**Difficulty:** Easy · **Type:** Scenario · **Concepts:** baseline

Why should you test a skill in a fresh session rather than the one you wrote it in?

<details>
<summary>Answer</summary>

The authoring session already contains your intent, examples and corrections, so Claude can succeed even when the skill's written instructions are incomplete. A fresh session sees only what the skill says.

</details>

### P3. Turn it off for the baseline

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** skillOverrides

Write the settings fragment that hides the project skill `java-review` completely for a baseline run, and say which file `/skills` would save it to.

<details>
<summary>Answer</summary>

```json
{
  "skillOverrides": {
    "java-review": "off"
  }
}
```

`/skills` saves it to `.claude/settings.local.json`, which is not shared with the team. Remove it after the baseline run.

</details>

### P4. Near-miss prompts

**Difficulty:** Medium · **Type:** Workflow design · **Concepts:** should-not-trigger

Write three prompts that should **not** trigger `sql-review` but are close enough to test it.

<details>
<summary>Answer</summary>

For example: "Explain what Flyway does in this project", "Which database does the test profile use?", "Rename the `customerEmail` field in the response DTO". They mention databases or fields but involve no SQL or migration change to review.

</details>

### P5. Shrinking the listing

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** context cost

`/context` shows a large Skills row and some descriptions are cut. A teammate proposes doubling `skillListingBudgetFraction`. What would you do first, and why?

<details>
<summary>Answer</summary>

Run `/skill-doctor` to find never-used and expensive skills, turn those off or to `"name-only"`, make manual workflows `disable-model-invocation: true`, and shorten descriptions. Raising the budget spends more context on every turn of every session; removing dead weight fixes the cause.

</details>

### P6. Stale skill

**Difficulty:** Hard · **Type:** Failure diagnosis · **Concepts:** maintenance

The team renamed `PriceCalculatorTest` to `PricingServiceTest`. What happens to the `regression-test` skill, and how would you catch this class of problem in future?

<details>
<summary>Answer</summary>

Its step 1 still names `PriceCalculatorTest`, so Claude may look for a missing class, create a new file with the old name, or waste turns searching. Catch it by reviewing `.claude/skills/` in pull requests that rename classes or commands (a `CODEOWNERS` entry or a checklist item), and by re-running the skill's trigger and result checks periodically.

</details>

### P7. Plugin or project?

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** sharing

Your `java-review` skill is now wanted by six Spring Boot repositories. Compare copying it into each repository with packaging it as a plugin.

<details>
<summary>Answer</summary>

Copies are simple and can be tuned per repository, but drift apart and each fix must be repeated. A plugin gives one versioned source, can carry evals (`claude plugin eval` with a no-plugin baseline), and appears as `/plugin-name:java-review`; the cost is a marketplace or install step and less per-repository tuning. Repository-specific rules can stay in each repository's CLAUDE.md, which the plugin skill already tells Claude to apply.

</details>
