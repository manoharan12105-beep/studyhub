# Human Approval for Tool Actions — Practice

### P1. What happened?

**Difficulty:** Easy · **Type:** Behavior

In the lesson's demo, how many refunds have been executed right after the chat ends, before anyone approves?

<details>
<summary>Answer</summary>

None — the tool only created the pending request `apr-1`.

</details>

### P2. Separation of duties

**Difficulty:** Easy · **Type:** MCQ

Who may approve a refund requested in learner `s-42`'s chat?

- A) The model
- B) Learner `s-42`
- C) An authorised staff member other than `s-42`
- D) Anyone who has the request id

<details>
<summary>Answer</summary>

**Answer:** C) An authorised staff member other than `s-42`

</details>

### P3. Fix the tool

**Difficulty:** Medium · **Type:** Code analysis

```java
// Illustrative fragment
@Tool(description = "Refund an order")
String refund(String orderId, BigDecimal amount) {
    payments.refund(orderId, amount);
    return "Refunded";
}
```

<details>
<summary>Answer</summary>

The model can execute an irreversible payment directly, for any order (no ownership check, no identity), any amount, with no approval or audit, and the description encourages it to claim success. Replace with a `requestRefund` tool that takes the learner id from `ToolContext`, validates ownership and amount, stores a pending request and says approval is required; execute only from an approval service with role checks and exactly-once semantics.

</details>

### P4. Exactly once in SQL

**Difficulty:** Medium · **Type:** Coding

Write the SQL update that marks a pending refund as executed only if it is still pending, and explain how the Java code uses the result.

<details>
<summary>Answer</summary>

```sql
-- Illustrative
UPDATE refund_request
SET status = 'EXECUTED', approved_by = :approver, approved_at = now()
WHERE id = :id AND status = 'PENDING';
```

If the update count is 1, this call won the race: perform the refund in the same transaction (or via an outbox). If it is 0, the request was already handled — return "not pending" and do nothing.

</details>

### P5. Approval fatigue

**Difficulty:** Hard · **Type:** Scenario

Staff approve 400 AI-requested actions per day and approve 99% within seconds. What does this suggest and what do you change?

<details>
<summary>Answer</summary>

Approvals have become a rubber stamp. Classify actions by risk: auto-approve clearly low-risk ones by policy (with audit and sampling), require approval only above thresholds or for unusual patterns, show approvers the evidence and the policy result, measure reversals and complaints, and periodically review samples of auto-approved actions.

</details>
