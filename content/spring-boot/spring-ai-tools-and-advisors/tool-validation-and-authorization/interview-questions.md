# Validating and Authorising Tool Calls — Interview Questions

## Beginner

### Q1. Why should a tool not take a `userId` parameter?

**Style:** Why

<details>
<summary>Answer</summary>

The model generates tool arguments from conversation text, so a user (or an injected instruction) can make it pass another user's id. Identity must come from the authenticated request and reach the tool through `ToolContext`, which the model never sees.

</details>

### Q2. What happens to a `ToolContext` map when the request is sent to the model?

**Style:** Direct

<details>
<summary>Answer</summary>

Nothing is sent: `ToolContext` is excluded from the tool's JSON schema and from the messages. It is passed only to the tool method when the application executes it.

</details>

## Intermediate

### Q3. Your system prompt says "Only show the user's own orders." Is that enough?

**Style:** Scenario

<details>
<summary>Answer</summary>

No. Instructions can be ignored or overridden by prompt injection. The `getOrder` tool must check that the order belongs to the `ToolContext` user and refuse otherwise. The system prompt reduces mistakes; the tool enforces the rule.

</details>

### Q4. What should a tool's exception message contain?

**Style:** How

<details>
<summary>Answer</summary>

A short, safe description the model can act on — "courseId must look like java-101", "You are not enrolled in db-201". By default a runtime exception's message becomes the tool result sent to the provider and may be repeated to the user, so no stack traces, SQL, internal ids or other users' data. Log details server-side.

</details>

## Advanced

### Q5. Design the security of a support assistant with `lookupOrder`, `updateAddress` and `refund` tools.

**Style:** Design

<details>
<summary>Answer</summary>

Authenticate in the controller and pass the customer id via `ToolContext`. Attach `lookupOrder` and `updateAddress` per request; attach `refund` only for authorised roles. Every tool calls the existing service layer, which checks ownership and validates arguments (order id format, address fields, refund amount ≤ order total). `updateAddress` and `refund` require explicit confirmation or human approval before execution. Tool calls are audited with redacted arguments, rate-limited per user, and limited per turn. Exception messages are generic. Tests cover cross-customer access and injection attempts without a real model.

</details>
