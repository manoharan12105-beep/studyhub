# Human Approval for Tool Actions — Interview Questions

## Beginner

### Q1. Which tool actions should require human approval?

**Style:** Direct

<details>
<summary>Answer</summary>

Irreversible, costly or high-impact actions: payments and refunds, deletions, account or permission changes, messages sent on someone's behalf, actions affecting other users. Read-only and easily reversible low-risk actions can run directly or be auto-approved by policy.

</details>

### Q2. How can a model "request" an action without performing it?

**Style:** How

<details>
<summary>Answer</summary>

Its tool stores a pending request (with requester, arguments and status) and returns a message saying it awaits approval. A separate approval path — an endpoint used by an authorised person — re-checks and executes it.

</details>

## Intermediate

### Q3. What must the approval step check?

**Style:** How

<details>
<summary>Answer</summary>

That the request is still pending (exactly once), that the approver is authorised and is not the requester (separation of duties), and that business rules still hold with current data (amount limits, order status, ownership). Then execute in a transaction and record an audit entry.

</details>

### Q4. Why isn't "ask the user to type yes" a sufficient confirmation?

**Style:** Why

<details>
<summary>Answer</summary>

Chat text can be produced or manipulated (prompt injection, copied text, misunderstanding) and is not bound to a specific action. A confirmation must be an explicit UI action tied to the stored request id and its exact parameters, processed by application code.

</details>

## Advanced

### Q5. Design approval for an AI assistant that can cancel subscriptions and issue credits.

**Style:** Design

<details>
<summary>Answer</summary>

Tools: `requestCancellation` and `requestCredit` store pending actions with customer id from `ToolContext`, conversation id and the model's arguments; descriptions say approval is needed. Policy engine auto-approves cancellations the customer confirms in a dedicated UI dialog and credits under a small threshold; larger credits go to a staff queue. Approval endpoint: role check, separation of duties, re-validation (subscription active, credit within limits), atomic status update, idempotent execution, audit, notifications, expiry of stale requests. Metrics on approvals, rejections and time to decision; evaluation cases where injection attempts try to trigger credits.

</details>
