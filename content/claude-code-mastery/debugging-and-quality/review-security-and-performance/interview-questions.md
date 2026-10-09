# Diff Inspection, Security Review and Performance Investigation — Interview Questions

## Beginner

### Q1. How do you prevent SQL injection in Java?

**Style:** How

<details>
<summary>Answer</summary>

Pass values as parameters — `PreparedStatement` placeholders or `JdbcTemplate` `?` arguments, or JPA parameters — never concatenate input into SQL text. Validate input too, but parameters are the defence.

</details>

## Intermediate

### Q2. How do you review an AI-written diff for security?

**Style:** How

<details>
<summary>Answer</summary>

Trace every input from source to sink (SQL, logs, files, responses), check validation and error handling, look for secrets and personal data, use a security review tool or reviewer for hints, and prove suspected issues with hostile-input tests before and after the fix.

</details>

### Q3. How do you investigate a slow endpoint?

**Style:** How

<details>
<summary>Answer</summary>

Reproduce and measure it (median of many runs), find where time goes (query plans, profiler, metrics), form one hypothesis, change one thing, and measure again with the same method. Don't add caches or rewrites without evidence.

</details>

## Advanced

### Q4. An agent proposes a performance fix with a confident speedup claim. How do you evaluate it?

**Style:** Scenario

<details>
<summary>Answer</summary>

Ask for the measurement method and raw numbers; reproduce them on the same machine with medians; check the plan or profile explains the change; check correctness and side effects (staleness, write cost); and re-measure in a production-like environment before claiming the gain.

</details>

### Q5. Why might AI-generated code introduce vulnerabilities that tests don't catch?

**Style:** Security

<details>
<summary>Answer</summary>

Models follow patterns in context, including insecure ones; normal tests use friendly input, so injections and data exposure pass them. Security needs hostile-input tests, review focused on data flow, and safe-by-construction APIs (parameters, validation, encoding).

</details>
