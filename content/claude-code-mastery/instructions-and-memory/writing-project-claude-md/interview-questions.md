# Creating a Useful Project CLAUDE.md — Interview Questions

## Beginner

### Q1. What would you put in a project CLAUDE.md for a Spring Boot service?

**Style:** What

<details>
<summary>Answer</summary>

Exact commands (build, single test class, run), conventions that differ from defaults (records for DTOs, constructor injection, money as cents), database migration rules, testing rules, secret handling, and a definition of done with an executable check. Not: things Claude can read from the code, standard Java conventions or long documentation.

</details>

### Q2. Why keep CLAUDE.md short?

**Style:** Why

<details>
<summary>Answer</summary>

It loads into every session, so every line costs context, and long files reduce adherence — rules get lost among other text. The docs suggest under 200 lines per file; procedures belong in skills and area-specific rules in path-scoped rule files.

</details>

## Intermediate

### Q3. What makes an instruction effective?

**Style:** How

<details>
<summary>Answer</summary>

It is concrete, verifiable and located: "Run `./mvnw -B verify`" rather than "test your changes"; "schema changes go in a new V<n> migration" rather than "be careful with the database". Non-obvious rules include a short reason. Emphasis is reserved for the one rule that keeps being missed.

</details>

### Q4. What is a definition of done and why include it?

**Style:** Why

<details>
<summary>Answer</summary>

The checks a change must pass before it counts as finished: the build and tests pass, new behaviour has tests, the diff contains only what the task needs, the summary lists what was and wasn't verified, and who commits. It gives Claude a check it can run and a consistent reporting standard, so "done" means verified rather than plausible.

</details>

### Q5. What happens with contradictory instructions?

**Style:** What happens if

<details>
<summary>Answer</summary>

Claude may follow either — unpredictably. Contradictions often hide across files (user vs project, root vs nested, rules vs CLAUDE.md). Resolve by deciding and deleting the losing rule, or by stating the exception explicitly.

</details>

## Advanced

### Q6. Claude repeatedly fixes failing tests by editing assertions. How do you address it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Add explicit rules: a bug fix starts with a test that fails because of the bug, and never weaken or delete assertions to pass. Make reviewing test changes part of the definition of done and of your diff review; optionally add a reviewer subagent or skill that flags assertion changes. Treat a changed expected value as suspicious until justified by the specification.

</details>

### Q7. How do you keep a team's CLAUDE.md healthy over a year?

**Style:** Workflow design

<details>
<summary>Answer</summary>

Review it in pull requests like code; add a line when a mistake repeats or a review comment recurs; delete lines that are stale or derivable; periodically check for conflicts with nested files, rules and personal files (`/doctor prompt-audit` on recent versions helps); keep it under a size budget by moving procedures into skills and area rules into `.claude/rules/`.

</details>
