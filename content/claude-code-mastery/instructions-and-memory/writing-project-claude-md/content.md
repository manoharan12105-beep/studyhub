# Creating a Useful Project CLAUDE.md

**Module:** Project Instructions, Rules and Memory · **Interview priority:** Core

## Definition

A **useful project `CLAUDE.md`** is a short file of facts and rules that Claude cannot reliably infer from the code but needs in every session: exact commands, conventions that differ from defaults, constraints on risky areas, and a **definition of done** — the checks a change must pass before Claude may call it finished.

## Why It Matters

- Quality comes from specificity. "Write good code and add tests" changes nothing; "a bug fix starts with a test that fails because of the bug" changes behaviour.
- Every line costs context in every session, and long files reduce adherence. The skill is choosing **what to leave out**.
- A good definition of done turns "looks finished" into "verified": the same checks every time.

## How It Works

Claude reads the file at the start of each session and applies it when relevant. Rules work best when they are:

| Quality | Weak | Strong |
|---------|------|--------|
| Concrete | "Format code properly" | "4-space indentation, no tabs" |
| Verifiable | "Test your changes" | "Run `./mvnw -B verify` before reporting done" |
| Located | "Keep files organized" | "Schema changes go in a new `src/main/resources/db/migration/V<n>__<description>.sql`" |
| Justified when non-obvious | "Don't use H2 features" | "Tests use H2; the schema must stay portable to PostgreSQL" |

## What to Include and Exclude

From the official best practices, adapted:

| Include | Exclude |
|---------|---------|
| Commands Claude can't guess (wrapper, single test, run) | Anything Claude learns by reading the code |
| Conventions that differ from language defaults | Standard Java conventions Claude already knows |
| Testing rules and preferred test types | Long API documentation (link to it, or make it a skill) |
| Repository etiquette (branches, commits, PRs) | Information that changes every week |
| Architectural decisions and their reasons | File-by-file descriptions of the codebase |
| Gotchas and environment quirks | "Write clean code" and other self-evident advice |

For each line ask: *would removing this cause Claude to make mistakes?* If not, cut it.

## A Java/Spring Boot Example

This is the `CLAUDE.md` of the `orderdesk` sample project after [Lab 04](../../labs/cc-lab-04-project-instructions/content.md). Every command in it was run on the project.

```markdown
# orderdesk

Order management REST API: Spring Boot 4.1, Java 21, Maven Wrapper, H2 in-memory database, Flyway, JUnit 5.

## Commands
- Build and run all tests: `./mvnw -B verify`
- One test class: `./mvnw -q test -Dtest=PriceCalculatorTest`
- Run the app on port 8080: `./mvnw spring-boot:run`

## Code conventions
- Java 21. Request and response DTOs are records (`CreateOrderRequest`, `OrderResponse`).
- Constructor injection only; no `@Autowired` fields in production code.
- Money is `long` cents (`subtotalCents`), never `double`.
- 4-space indentation, no tabs. Keep classes under 400 lines.
- Controllers report errors with `ResponseStatusException`: 404 for unknown ids, 409 for invalid state changes.

## Database and migrations
- Schema changes go in a new `src/main/resources/db/migration/V<n>__<description>.sql`.
- Never edit an existing migration; V1 is already applied in every environment.
- `spring.jpa.hibernate.ddl-auto` stays `validate`: a new entity field without a migration fails startup.
- `JdbcTemplate` SQL uses `?` parameters, never string concatenation.

## Testing
- A bug fix starts with a test that fails because of the bug.
- Pure logic gets unit tests (`PriceCalculatorTest`); endpoints get `@SpringBootTest` + MockMvc tests (`OrderControllerTest`).
- Never delete, skip or weaken an existing assertion to make the build pass.

## Secrets
- No secrets in code, tests, logs or this file. Configuration comes from environment variables.
- Do not read `.env` files.

## Definition of done
- `./mvnw -B verify` passes.
- New behaviour and every bug fix have tests.
- `git diff` contains only changes the task needs.
- The summary lists changed files, tests added, and anything not verified.
- Do not commit or push; the developer reviews and does that.
```

Why each section earns its place:

| Section | Mistake it prevents |
|---------|---------------------|
| Commands | Running a global `mvn` that is not installed, or the whole suite when one class would do |
| Conventions | `double` money, field injection, inconsistent error handling |
| Migrations | Editing V1 (breaks every environment where it ran), entity fields without migrations (startup failure) |
| Testing | "Fixing" a bug without a reproducing test; deleting a failing assertion |
| Secrets | Secrets in code or in context |
| Definition of done | "Done" without running the build; scope creep in the diff; unannounced commits |

The secrets section is guidance only. Back it with a `Read(./.env)` deny rule (Module 4) — the file asks, the settings enforce.

## The Definition of Done

A definition of done is the most valuable part of a project `CLAUDE.md` because it gives Claude a **check it can run** and a **standard for reporting**. Good ones are:

- **Executable:** a command with a pass/fail result (`./mvnw -B verify`).
- **Scoped:** "only changes the task needs" keeps diffs reviewable.
- **Honest:** "list anything not verified" makes gaps visible instead of hidden.
- **Clear about authority:** who commits, who pushes, who merges.

## Unclear and Contradictory Instructions

**Unclear:**

```markdown
- Use proper error handling.
- Tests are important.
```

Claude cannot verify either line. Result: inconsistent behaviour that depends on the task. Rewrite as checkable rules (see the table in How It Works).

**Contradictory:**

```markdown
- Keep pull requests small; never change more than one module.
- When fixing a bug, also refactor nearby code to current conventions.
```

When two rules conflict, Claude may follow either one — and you cannot predict which. Conflicts also arise *across* files: a user `CLAUDE.md` saying "prefer field injection for brevity" fights the project rule "constructor injection only". Fix by deciding, then deleting the losing rule; if an exception is real, state it explicitly ("refactor only the method you fix").

**Overloaded emphasis:** marking every line `IMPORTANT` means nothing stands out. Emphasize the one rule Claude keeps missing.

## Syntax and Configuration

- Plain Markdown; headings and bullets beat paragraphs.
- Location: `./CLAUDE.md` or `./.claude/CLAUDE.md` in the repository root.
- `/init` drafts one from the codebase; with `CLAUDE_CODE_NEW_INIT=1` set, `/init` runs an interactive flow that can also propose skills and hooks.
- Target **under 200 lines**; files over the recommended size produce a warning at startup and in `/status`.
- Optional "Compact instructions" section to steer summaries (Module 2).

## Real-World Example

Before: orderdesk's `CLAUDE.md` said only *"Java project. Write good code and add tests."* In one session Claude ran `mvn verify` (not installed), fixed BUG-101 by changing the test's expected value, and added a nullable column by editing `V1__create_orders.sql`. After the rewrite above, the same requests produce: the wrapper command, a new failing test followed by a code fix, and a `V2__` migration — because each mistake has a specific rule.

## Step-by-Step Walkthrough

1. Run `/init` and read the draft.
2. Strike everything discoverable from code.
3. Add commands you have verified yourself — run each one.
4. Add conventions that differ from defaults, migration and secret rules.
5. Write a definition of done with an executable check.
6. Remove conflicts with your user-level file.
7. Commit; review future edits to it like code.
8. Each time Claude repeats a mistake, add or sharpen one line.

## Common Mistakes

- Writing an essay about the architecture that Claude could read from the code.
- Commands copied from another project that do not work here.
- Rules without a check ("be careful with migrations").
- Contradictions between project and user files.
- Never updating the file after the build changes.

## Security Considerations

- Never place credentials, tokens or internal hostnames that are secret in `CLAUDE.md`; it is committed and loaded into context.
- Instructions such as "Do not read `.env`" are not protection; pair them with deny rules and, for hard guarantees, hooks.
- Review changes to `CLAUDE.md` in pull requests — a malicious or careless edit changes how every teammate's agent behaves.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Claude still uses `double` for money | Rule missing, vague, or buried in a long file | Add a specific line; shorten the file |
| Claude asks things answered in CLAUDE.md | Phrasing is ambiguous | Rewrite with exact names and paths |
| Behaviour differs between teammates | Conflicting user-level files | Compare user files; move project rules into the project file |
| Startup warning about instruction size | File too long | Move procedures to skills, area rules to `.claude/rules/` |

## Trade-offs

| Choice | Benefit | Cost |
|--------|---------|------|
| Short, strict file | High adherence, low cost | Some context must be given per task |
| Long, complete file | Fewer per-task explanations | Lower adherence, higher cost every session |
| Rules in CLAUDE.md vs hooks | Easy to write and change | Not enforced |

## Interview Takeaways

- Show a concrete CLAUDE.md for a Spring Boot project and explain each section's purpose.
- Explain the include/exclude test and why short files are followed better.
- Describe how you resolve vague and contradictory instructions, and the role of a definition of done.

## Key Takeaways

- Commands, non-default conventions, risky-area rules and a definition of done — little else.
- Specific and verifiable beats vague; fewer lines beat more.
- Remove contradictions within and across files.
- Back important rules with permissions or hooks; CLAUDE.md asks, settings enforce.
