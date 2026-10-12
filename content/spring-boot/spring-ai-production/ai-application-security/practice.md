# AI Application Security — Practice

### P1. Classify the risk

**Difficulty:** Easy · **Type:** MCQ

A user floods the assistant with 100,000-word inputs, multiplying the AI bill. Which OWASP LLM risk is this?

- A) LLM01 Prompt Injection
- B) LLM05 Improper Output Handling
- C) LLM07 System Prompt Leakage
- D) LLM10 Unbounded Consumption

<details>
<summary>Answer</summary>

**Answer:** D) LLM10 Unbounded Consumption

</details>

### P2. Safe rendering

**Difficulty:** Easy · **Type:** Behavior

The model returns `Click <b>here</b>`. After `HtmlUtils.htmlEscape`, what does the browser display when the result is inserted as HTML?

<details>
<summary>Answer</summary>

The literal text `Click <b>here</b>` — the tags are escaped to `&lt;b&gt;` and shown as characters, not interpreted as bold markup.

</details>

### P3. Find the vulnerabilities

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
@GetMapping("/report")
String report(@RequestParam String question) {
    String sql = chatClient.prompt()
            .system("Translate the question into SQL for the orders table. The user's tenant is in the question.")
            .user(question).call().content();
    return jdbcTemplate.queryForList(sql).toString();
}
```

<details>
<summary>Answer</summary>

Model output is executed as SQL (LLM05) — any statement, including `DELETE` or queries across tenants; tenant identity comes from the question (spoofable); no authentication or role check visible; no limits on rows or cost. Fix: never execute generated SQL directly — use tools that run fixed, parameterised queries scoped to the authenticated tenant; or, if text-to-SQL is essential, a read-only database role, a single-tenant view, statement validation, row limits and timeouts.

</details>

### P4. Secret in the prompt

**Difficulty:** Medium · **Type:** Debugging

A system prompt contains "Use API key sk-test-1234 when calling the inventory service". A user gets the model to print its instructions. What is wrong beyond the leak itself, and how should the design look?

<details>
<summary>Answer</summary>

The model was given a credential and the responsibility to use it — the model should never hold secrets or call services itself. The application should call the inventory service in a tool, with the key from configuration/secret manager, authorised per user. Rotate the leaked key, and assume system prompts can always be extracted (LLM07).

</details>

### P5. Security review checklist

**Difficulty:** Hard · **Type:** Design

Write a ten-point security checklist for releasing a new Spring AI feature.

<details>
<summary>Answer</summary>

1. Endpoint authenticated and authorised; request size and rate limited.
2. Identity from Spring Security; conversation ids server-generated.
3. Retrieval filtered by tenant/permission; isolation tests exist.
4. Tools minimal, per request, authorised via `ToolContext`, validated; approval for irreversible actions; call limits set.
5. Untrusted text passed as template parameters, delimited; no secrets or access rules in prompts.
6. Model output escaped/validated before rendering or use; links allow-listed.
7. Token budgets and output limits; cost alerts.
8. Logs and telemetry: metadata only, content options off, keyed-hash pseudonyms.
9. Evaluation set includes injection, exfiltration and must-refuse cases.
10. Dependencies, model versions and MCP servers pinned and reviewed; keys in a secret manager with rotation.

</details>
