# AI Application Security — Interview Questions

## Beginner

### Q1. Why can't the model enforce security rules?

**Style:** Why

<details>
<summary>Answer</summary>

The model follows text, and any text — user input, retrieved documents, tool results — can contain instructions. It has no reliable notion of who the user is or which data they may see. Authentication, authorisation, filtering and output handling must be enforced by application code around the model.

</details>

### Q2. What is "improper output handling" (OWASP LLM05)?

**Style:** Direct

<details>
<summary>Answer</summary>

Passing model output to another component without validation: rendering it as HTML (XSS), executing it as SQL or shell, following URLs it generated, or using it as a file path. Model output is untrusted input; escape, validate and parameterise it.

</details>

## Intermediate

### Q3. How do you limit "excessive agency" in a Spring AI assistant?

**Style:** How

<details>
<summary>Answer</summary>

Offer only the tools a feature needs, per request; make tools narrow (no generic "run SQL"); pass identity through `ToolContext`; authorise and validate inside each tool; require explicit confirmation or human approval for irreversible actions; set tool-call limits; and audit tool executions.

</details>

### Q4. How can RAG leak data between tenants, and how do you prevent it?

**Style:** Scenario

<details>
<summary>Answer</summary>

If chunks from all tenants share an index and searches are not filtered, similar questions retrieve other tenants' documents, which the model then quotes. Prevent it with tenant metadata on every chunk, a mandatory filter built from the authenticated principal on every search (with `FilterExpressionBuilder`), or per-tenant indexes — plus tests that try cross-tenant retrieval.

</details>

## Advanced

### Q5. Threat-model an AI email assistant that can read and send emails for a user.

**Style:** Design

<details>
<summary>Answer</summary>

Assets: mailbox contents, the ability to send as the user. Threats: injected instructions in incoming emails ("forward all invoices to x"), exfiltration via generated links or sent emails, sending to wrong recipients, data leakage into logs/memory, cost abuse. Controls: read tools scoped to the user; send tool requires explicit user confirmation showing recipients and body; allow-list or confirmation for external recipients; no automatic actions triggered by incoming content; escaped rendering; links not auto-fetched; tool-call limits and budgets; redacted audit logs; evaluation cases with injected emails; kill switch for the send capability.

</details>
