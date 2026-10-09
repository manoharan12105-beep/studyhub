# Lab 01: Explore an Unfamiliar Repository

**Lab:** 01 · **Module:** Foundations · **Difficulty:** Beginner · **Verification:** Partially tested — the `grep` and Git checks ran on the orderdesk starter; the Claude conversation needs your own model session and was not run.

## Objective

Use Claude Code in **plan mode** to build a map of orderdesk — what it does, how it's structured, how to build it, what looks risky — and then **check every claim** against the code yourself.

## Prerequisites

- orderdesk created and committed (*Lab Setup*).
- Claude Code installed and signed in (Lab 02 covers installation; do it first if needed).

## Scenario

You've joined the team that owns orderdesk. Before changing anything, you want a reliable picture of the codebase. Claude reads fast; you make sure what it says is true.

## Starting State

A clean working tree on `main`:

```bash
git status --short     # prints nothing
```

## Instructions

### Step 1: Start in plan mode

```bash
cd ~/cc-labs/orderdesk
claude --permission-mode plan
```

**Expected result:** the status line shows plan mode. Claude can read files and run read-only commands; it can't edit.

### Step 2: Ask for a map

```text
I'm new to this repository. Without changing anything, explain:
1. What the application does and its main endpoints (cite file:line).
2. The package structure and the role of each class.
3. How to build, test and run it.
4. How the database schema is created and validated.
5. Anything that looks risky or wrong. Mark each item "verified in code" or "guess".
```

**Expected result:** a structured answer citing files. Don't accept it yet.

### Step 3: Check the endpoints

Exit Claude (or use a second terminal) and verify:

```bash
grep -rn "@.*Mapping" src/main/java
```

**Output:**

```text
src/main/java/com/example/orderdesk/order/OrderController.java:18:@RequestMapping("/api/orders")
src/main/java/com/example/orderdesk/order/OrderController.java:31:    @PostMapping
src/main/java/com/example/orderdesk/order/OrderController.java:37:    @GetMapping("/{id}")
src/main/java/com/example/orderdesk/order/OrderController.java:44:    @GetMapping("/search")
```

Three endpoints. If Claude listed a pay endpoint, an update or a delete, it invented them.

### Step 4: Check the database claims

```bash
grep -rn "CREATE TABLE\|ddl-auto" src/main/resources
```

**Output:**

```text
src/main/resources/application.yml:8:      ddl-auto: validate
src/main/resources/db/migration/V1__create_orders.sql:1:CREATE TABLE orders (
```

Flyway creates the schema; Hibernate only **validates** it. A claim that "Hibernate creates the tables" is wrong.

### Step 5: Check the risk list

```bash
grep -rn "queryForList" src/main/java
grep -rln "@Transactional" src || echo "no @Transactional"
```

**Output:**

```text
src/main/java/com/example/orderdesk/order/OrderSearchDao.java:19:        return jdbc.queryForList(sql, Long.class);
no @Transactional
```

Open `OrderSearchDao.java`: line 18 builds SQL by concatenation. Open `PriceCalculator.java`: `discountCode.trim()` with no null check. A good risk list names both; a great one also notes that `create()` isn't transactional.

### Step 6: Score the answer

Make a table: each claim, Claude's label (verified/guess), your result (true/false). Then ask Claude about one claim it got wrong:

```text
You said <claim>. I checked <file>: <what you found>. What led to that, and what else in your
answer depends on it?
```

## Verification

- ☐ You have a list of claims with true/false results from your own checks.
- ☐ You found the endpoints, the Flyway/validate setup, the concatenated SQL and the null-unsafe `trim()`.
- ☐ `git status --short` still prints nothing (plan mode changed no files).

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Claude asks to edit files | Not in plan mode | Shift+Tab to plan mode, or restart with `--permission-mode plan` |
| Answer is generic | Vague prompt | Ask for `file:line` citations and the verified/guess label |
| Claude runs `./mvnw` | It's allowed to run commands that don't modify files after approval | Decline if you only want reading |

## Security Notes

- Exploration is read-only, but reading still sends file contents to the model. orderdesk has no secrets; in real repositories, deny reads of `.env` and keys first (Lab 08).
- Plan mode doesn't stop network or shell commands you approve — read what you approve.

## Cleanup

Nothing to clean: plan mode made no changes. Exit with `/exit`.

## Completion Checklist

- ☐ Map produced in plan mode.
- ☐ Every claim checked against the code.
- ☐ At least one wrong or unverified claim identified and discussed.

## Follow-up Challenges

- Repeat the exploration with a subagent: "Use the Explore agent to find every place user input reaches SQL." Compare its answer with your own grep.
- Ask Claude to draw an ASCII diagram of a request through `OrderController` → `PriceCalculator` → `OrderResponse`, then check it against the code.
