# Creating a Useful Project CLAUDE.md — Practice

### P1. Keep or cut?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** include/exclude

Which line belongs in orderdesk's CLAUDE.md?

- A) "The project has a package called `com.example.orderdesk.order`."
- B) "Money is `long` cents (`subtotalCents`), never `double`."
- C) "Write clean, maintainable code."
- D) "Java classes use PascalCase names."

<details>
<summary>Answer</summary>

**Answer:** B) "Money is `long` cents (`subtotalCents`), never `double`."

A is discoverable from the code; C is self-evident and unverifiable; D is a standard Java convention Claude already knows. B is a project decision that prevents a real mistake.

</details>

### P2. Make it verifiable

**Difficulty:** Easy · **Type:** Configuration · **Concepts:** specific rules

Rewrite "Make sure tests pass" as a verifiable rule for orderdesk.

<details>
<summary>Answer</summary>

"Run `./mvnw -B verify` before reporting a change as done; it must pass." It names the exact command and the pass condition.

</details>

### P3. Spot the conflict

**Difficulty:** Medium · **Type:** Debugging · **Concepts:** contradictions

Project CLAUDE.md: "Constructor injection only." Your `~/.claude/CLAUDE.md`: "Prefer field injection with @Autowired for brevity." Claude's code alternates between both styles. Explain and fix.

<details>
<summary>Answer</summary>

Both files load and are concatenated; when instructions conflict, Claude may follow either. Remove the personal rule (or scope it to your personal projects outside this repository). Project conventions belong in the project file, and personal preferences must not contradict them.

</details>

### P4. The weakened test

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** testing rules

Asked to fix BUG-101, Claude changes `assertEquals(2_500, …)` to `assertThrows(NullPointerException.class, …)` and reports "tests pass". Which CLAUDE.md rule would have prevented this, and what else should back it up?

<details>
<summary>Answer</summary>

"A bug fix starts with a test that fails because of the bug" and "Never delete, skip or weaken an existing assertion to make the build pass." Back it up with diff review (a changed assertion in a test file is a red flag) and, if needed, a skill or reviewer subagent that checks test changes explicitly. CLAUDE.md guides; review verifies.

</details>

### P5. Write a definition of done

**Difficulty:** Medium · **Type:** Workflow design · **Concepts:** definition of done

Write a four-line definition of done for a Spring Boot team that reviews and commits changes itself.

<details>
<summary>Answer</summary>

```markdown
## Definition of done
- `./mvnw -B verify` passes.
- New behaviour and every bug fix have tests.
- `git diff` contains only changes the task needs.
- Summarize changed files, tests added and anything not verified; do not commit or push.
```

</details>

### P6. Migration rule

**Difficulty:** Medium · **Type:** Configuration · **Concepts:** Flyway rules

Claude added `paid_at` by editing `V1__create_orders.sql`. Write the CLAUDE.md lines that prevent this and explain why editing V1 is harmful.

<details>
<summary>Answer</summary>

```markdown
- Schema changes go in a new `src/main/resources/db/migration/V<n>__<description>.sql`.
- Never edit an existing migration; V1 is already applied in every environment.
```

Flyway records applied migrations with checksums. Editing V1 changes its checksum (validation fails in every environment where V1 already ran) and the new column would never be added there. A new V2 migration is applied forward everywhere.

</details>

### P7. Too long

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** size, skills, rules

Your CLAUDE.md is 600 lines: commands, conventions, a 200-line deployment runbook and 150 lines of frontend rules for `web/`. Claude ignores rules. Restructure it.

<details>
<summary>Answer</summary>

Keep commands, conventions, migration and secret rules and the definition of done in CLAUDE.md (under ~200 lines). Move the deployment runbook into a skill (loads only when invoked; set `disable-model-invocation: true` if deploying is a deliberate act). Move frontend rules to `.claude/rules/frontend.md` with `paths: ["web/**"]` so they load only when Claude touches frontend files. Long files dilute every rule; progressive loading keeps each session focused.

</details>

### P8. Guidance vs enforcement

**Difficulty:** Hard · **Type:** Security · **Concepts:** layered controls

For each rule, decide whether CLAUDE.md alone is enough or what must back it: (a) "Use records for DTOs"; (b) "Do not read `.env`"; (c) "Do not push to main"; (d) "Never edit applied migrations".

<details>
<summary>Answer</summary>

(a) CLAUDE.md is enough — a style choice caught in review.
(b) Needs a `Read(./.env)` deny rule — secrets must not depend on model judgement.
(c) Needs an ask or deny rule for `git push` and server-side branch protection on GitHub.
(d) CLAUDE.md plus a PreToolUse hook that blocks edits to existing `V*.sql` files (Lab 09), because one mistake breaks every environment.

</details>
