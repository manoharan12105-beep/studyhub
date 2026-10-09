# Lab 04: Build a Useful Project Instruction File

**Lab:** 04 · **Module:** Project Instructions and Memory · **Difficulty:** Intermediate · **Verification:** Partially tested — every command in the reference CLAUDE.md was run on orderdesk (JDK 21); whether Claude follows the file needs your own model session and was not run.

## Objective

Replace orderdesk's one-line `CLAUDE.md` with a short, **verifiable** file covering the Java version, conventions, testing, migrations, secrets, build commands and a definition of done — and check that each instruction is true and useful.

## Prerequisites

- *Lab Setup* completed; Claude Code signed in.
- The lesson *Writing a Project CLAUDE.md*.

## Scenario

orderdesk's `CLAUDE.md` says "Java project. Write good code and add tests." Claude has to rediscover the build command, the money convention and the migration rules every session — and sometimes guesses wrong.

## Starting State

```markdown
# orderdesk

Java project. Write good code and add tests.
```

```bash
git switch -c lab04-claude-md
```

## Instructions

### Step 1: Let Claude draft, then cut

```bash
claude
```

```text
/init
```

**Expected result:** Claude analyzes the repository and proposes a `CLAUDE.md`. Accept it into the working tree, then read it critically: delete anything generic ("write clean code"), anything Claude would do anyway, and anything you can't verify.

### Step 2: Write the essentials

Edit until it covers these, each as a concrete, checkable statement:

| Topic | Question it must answer |
|-------|-------------------------|
| Commands | How do I build, run one test class, run the app? |
| Conventions | Money type? Injection style? DTO style? Error responses? |
| Database | Where do schema changes go? What must never be edited? |
| Testing | What comes first in a bug fix? Which test style for which code? |
| Secrets | What must never appear in code or prompts? |
| Definition of done | What evidence ends a task? Who commits? |

A reference version (compare after writing your own):

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

### Step 3: Verify every factual line

Run each command the file names:

```bash
./mvnw -B verify
./mvnw -q test -Dtest=PriceCalculatorTest
```

**Output** (on the starter, `verify` summary):

```text
[ERROR] Tests run: 7, Failures: 0, Errors: 1, Skipped: 0
[INFO] BUILD FAILURE
```

The commands work (the failure is BUG-101). On the fixed reference solution, the same `./mvnw -B verify` printed `Tests run: 13, Failures: 0, Errors: 0` and `BUILD SUCCESS`, and `./mvnw -q test -Dtest=PriceCalculatorTest` printed nothing — `-q` hides output when tests pass.

Check the conventions against the code: `grep -rn "@Autowired" src/main` prints nothing; `subtotalCents` is a `long`; `ddl-auto: validate` is in `application.yml`. Remove any line that isn't true of the code — a false instruction is worse than none.

### Step 4: Check that it loaded

Start a fresh session in the project:

```text
/memory
/context
```

**Expected result:** `/memory` lists `./CLAUDE.md`; `/context` shows it under Memory files with its token count.

### Step 5: Test the instructions

Ask questions whose answers must come from the file:

```text
How do I run only the PriceCalculator tests? How should a new "refund" endpoint report an
order that can't be refunded? Where does a new column go?
```

**Expected result:** `./mvnw -q test -Dtest=PriceCalculatorTest`; `ResponseStatusException` with 409; a new `V<n>__…sql` migration. A wrong answer means an instruction is unclear — rewrite it, start a new session, ask again.

## Verification

- ☐ `CLAUDE.md` is under about 60 lines and every line is specific.
- ☐ Every command in it ran.
- ☐ Every convention in it matches the code.
- ☐ A fresh session answers the three questions from the file.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Claude ignores a rule | Vague wording or buried in a long file | Make it concrete; move it up; consider a hook for must-hold rules |
| File not listed in `/memory` | Wrong name/location, or session started elsewhere | `CLAUDE.md` at the project root; start Claude there |
| `/init` overwrote your edits | Ran it after editing | Use Git to compare and restore |

## Security Notes

- CLAUDE.md is committed and read by every session: no secrets, internal hostnames or customer data.
- "Do not read `.env` files" is an instruction, not a control — Lab 08 adds deny rules that enforce it.

## Cleanup

Commit the file on your branch if you like it (`git add CLAUDE.md && git commit -m "docs: useful CLAUDE.md"`), or `git restore CLAUDE.md` to return to the starter text.

## Completion Checklist

- ☐ Weak file replaced with a specific one.
- ☐ All factual lines verified.
- ☐ Behaviour checked in a fresh session.

## Follow-up Challenges

- Move the "Database and migrations" section into `.claude/rules/migrations.md` with `paths: src/main/resources/db/migration/**` and confirm with `/memory` when it loads.
- Add a `CLAUDE.local.md` with a personal preference and confirm it's gitignored.
