# Human Approval for Tool Actions

**Module:** Spring AI: Advanced · **Interview priority:** Frequently asked · **Checked against:** Spring AI 2.0.1 · Spring Boot 4.1.1 · JDK 21

## Learning Objectives

- Decide which AI-initiated actions need a human in the loop.
- Implement the "request, then approve" pattern: the model can only propose; people approve; code executes.
- Re-validate and authorise at approval time, and make execution exactly-once.
- Compare in-chat user confirmation with staff approval and with a user-controlled tool loop.

## Definition

**Human approval** (human-in-the-loop) means an action proposed by a model is executed only after an authorised person confirms it. The model's tool does not perform the irreversible action — it **records a request**. A separate, ordinary application path (an approval screen, an endpoint, a workflow step) executes it after checks.

| Approval style | Who confirms | Use for |
|----------------|--------------|---------|
| User confirmation | The same user, via an explicit UI step | Sending an email, booking a slot, cancelling own enrolment |
| Staff approval | A different, authorised person | Refunds, account changes, anything costly or risky |
| Policy auto-approval | Rules in code, with audit | Low-risk actions under thresholds |

## Why It Matters

Models can be wrong, confused or manipulated by prompt injection. Letting them trigger refunds, deletions or messages directly turns every one of those failures into a real-world incident (OWASP LLM06, Excessive Agency). Approval keeps the speed of AI for drafting and the accountability of people for decisions — and it gives you an audit trail.

## How It Works

```text
user ─▶ ChatClient ─▶ model calls requestRefund(order, amount)
                         └─ tool stores PendingRefund(PENDING), returns "waiting for approval"
staff ─▶ approval endpoint ─▶ ApprovalService.approve(id, approver)
                         ├─ still PENDING?        (exactly once)
                         ├─ approver ≠ requester? (separation of duties)
                         ├─ business rules hold?  (re-validated now, not trusted from the model)
                         └─ PaymentService.refund(...) ─▶ EXECUTED + audit
```

Design rules:

- The tool description says the action needs approval, so the model tells the user the truth ("requested", not "refunded").
- Identity of the requester comes from `ToolContext`; the approver's from Spring Security.
- Validate at request time **and** at approval time — data may have changed, and the model chose the arguments.
- Status transitions are atomic (PENDING → EXECUTED/REJECTED); a second approval is rejected.

## Example

A refund tool that only requests; an approval service that enforces separation of duties, limits and exactly-once execution:

```java
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.example.studyai.lab.ScriptedChatModel;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;

public class HumanApprovalDemo {

    enum Status { PENDING, EXECUTED, REJECTED }

    record PendingRefund(String id, String learnerId, String orderId, BigDecimal amount, Status status) {
        PendingRefund with(Status newStatus) {
            return new PendingRefund(id, learnerId, orderId, amount, newStatus);
        }
    }

    /** The irreversible action. Only the approval service may call it. */
    static class PaymentService {
        final List<String> executed = new ArrayList<>();

        void refund(String orderId, BigDecimal amount) {
            executed.add(orderId + ":" + amount);
        }
    }

    /** Stores requested actions; executes them only after a human approves. */
    static class ApprovalService {
        private final Map<String, PendingRefund> pending = new ConcurrentHashMap<>();
        private final PaymentService payments;
        private int nextId = 1;

        ApprovalService(PaymentService payments) {
            this.payments = payments;
        }

        synchronized String request(String learnerId, String orderId, BigDecimal amount) {
            String id = "apr-" + nextId++;
            pending.put(id, new PendingRefund(id, learnerId, orderId, amount.setScale(2, RoundingMode.HALF_UP), Status.PENDING));
            return id;
        }

        synchronized String approve(String id, String approver) {
            PendingRefund p = pending.get(id);
            if (p == null || p.status() != Status.PENDING) {
                return "rejected: " + id + " is not pending";
            }
            if (approver.equals(p.learnerId())) {
                return "rejected: requester cannot approve their own refund";
            }
            if (p.amount().compareTo(new BigDecimal("100")) > 0) {     // re-check business rules at approval time
                pending.put(id, p.with(Status.REJECTED));
                return "rejected: amount above the 100.00 limit";
            }
            payments.refund(p.orderId(), p.amount());
            pending.put(id, p.with(Status.EXECUTED));
            return "executed: refund of " + p.amount() + " for " + p.orderId();
        }
    }

    /** What the model can do: ask for a refund, never perform one. */
    static class RefundTools {
        private final ApprovalService approvals;

        RefundTools(ApprovalService approvals) {
            this.approvals = approvals;
        }

        @Tool(description = "Request a refund for one of the current learner's orders. A staff member must approve it.")
        String requestRefund(@ToolParam(description = "Order id such as ord-1001") String orderId,
                             @ToolParam(description = "Amount in EUR") BigDecimal amount, ToolContext context) {
            String learnerId = (String) context.getContext().get("learnerId");
            String id = approvals.request(learnerId, orderId, amount);
            return "Refund request " + id + " created and waiting for staff approval. Nothing has been refunded yet.";
        }
    }

    public static void main(String[] args) {
        PaymentService payments = new PaymentService();
        ApprovalService approvals = new ApprovalService(payments);

        ScriptedChatModel model = new ScriptedChatModel()
                .replyWithToolCall("requestRefund", "{\"orderId\":\"ord-1001\",\"amount\":49.00}")
                .reply("I've requested the refund; a staff member will review it shortly.");
        String answer = ChatClient.create(model).prompt()
                .user("I was charged twice for ord-1001, please refund 49 euros")
                .tools(new RefundTools(approvals))
                .toolContext(Map.of("learnerId", "s-42"))
                .call().content();

        System.out.println("assistant: " + answer);
        System.out.println("refunds executed after the chat: " + payments.executed);
        System.out.println(approvals.approve("apr-1", "s-42"));
        System.out.println(approvals.approve("apr-1", "staff-7"));
        System.out.println(approvals.approve("apr-1", "staff-7"));
        System.out.println("refunds executed: " + payments.executed);
    }
}
```

**Output:**

```text
assistant: I've requested the refund; a staff member will review it shortly.
refunds executed after the chat: []
rejected: requester cannot approve their own refund
executed: refund of 49.00 for ord-1001
rejected: apr-1 is not pending
refunds executed: [ord-1001:49.00]
```

### Code walkthrough

- After the chat, **nothing was refunded** — the tool only created `apr-1`. The model's reply matches reality because the tool result said so.
- The learner (`s-42`) could not approve their own request; a staff member could.
- A second approval of the same request was rejected — exactly-once execution, so a double click or a retried request cannot refund twice.
- The amount limit is checked at approval time inside the service, not trusted from the model's arguments. Money uses `BigDecimal` with an explicit scale.
- In a real application `ApprovalService` persists requests in the database (with the original conversation id for context), `approve` runs in a transaction with a status check (`UPDATE … WHERE status = 'PENDING'`), and the approver comes from Spring Security with a role check.

### Alternative: pause the loop yourself

With a user-controlled tool loop ([The Tool-Calling Loop](../../spring-ai-tools-and-advisors/tool-calling-loop/content.md)), the application can inspect `response.hasToolCalls()`, see that the model wants a sensitive tool, persist the conversation and the proposed call, ask for confirmation, and only then run `ToolCallingManager.executeToolCalls(...)`. This keeps the model's exact proposal but requires storing and resuming the conversation. The request-tool pattern above is simpler and works with the default `ChatClient` loop.

## Common Mistakes and Troubleshooting

- **A "confirm" step inside the conversation.** "Are you sure? (yes)" typed into chat can be produced by injection or misunderstood; confirmation must be a real UI action bound to the specific request.
- **Tool description says "refunds the order".** The model then tells the user the refund happened.
- **Approving the model's arguments blindly.** Show the approver the request, the evidence (order, payment) and the policy result.
- **No idempotency.** Network retries or double clicks execute twice.
- **Approval fatigue.** If everything needs approval, people click "approve" without reading — auto-approve clearly low-risk actions by policy and focus humans on real decisions.

## Production Considerations

- Audit: who requested (user, conversation), what the model proposed, who approved or rejected, when, and the result.
- Expire stale requests; notify users of decisions.
- Keep thresholds and policies in configuration and review them.
- Measure: approval rate, time to decision, reversals — they show whether the AI proposals are useful.

## Common Interview Traps

- **"Tell the model in the system prompt to ask before refunding."** That is not a control; the code must make execution impossible without approval.
- **"Approval means the action is safe."** Re-validate at execution time; the world may have changed.
- **"Human-in-the-loop slows everything."** Apply it only to risky actions; automate low-risk ones with policy.

## Key Takeaways

- Models propose; people approve; code executes.
- Request tools store PENDING actions and tell the truth; approval services re-validate, enforce separation of duties and execute exactly once.
- Identity from `ToolContext` (requester) and Spring Security (approver); full audit trail.
- Use approval for irreversible or costly actions, policy for low-risk ones.

## Official References

- [Spring AI Tool Calling: user-controlled tool execution](https://docs.spring.io/spring-ai/reference/api/tools.html)
- [OWASP Top 10 for LLM Applications: Excessive Agency](https://genai.owasp.org/llm-top-10/)
- Related: [Validating and Authorising Tool Calls](../../spring-ai-tools-and-advisors/tool-validation-and-authorization/content.md) · [Agentic Workflows](../agentic-workflows/content.md) · [AI Application Security](../../spring-ai-production/ai-application-security/content.md)
