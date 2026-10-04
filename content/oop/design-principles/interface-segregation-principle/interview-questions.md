# Interface Segregation Principle — Interview Questions

## Conceptual

### Q1. What is the Interface Segregation Principle?

<details>
<summary>Answer</summary>

Clients should not be forced to depend on methods they do not use. Instead of one large interface, define smaller role-specific interfaces so each implementer provides only what it can support and each client depends only on what it calls. Example: split a `PaymentProvider` with `pay`, `refund`, `subscribe`, `emi` into `Payable`, `Refundable`, `Subscribable`, so cash-on-delivery implements only `Payable`.

</details>

### Q2. What problems does a "fat" interface cause?

<details>
<summary>Answer</summary>

Implementers must stub or throw for methods they cannot support (often violating LSP); clients are coupled to unrelated methods and affected by their changes; test doubles become large; and adding a method forces changes in every implementation.

</details>

### Q3. How is ISP related to SRP and LSP?

<details>
<summary>Answer</summary>

ISP is SRP applied to interfaces: each interface should serve one kind of client. It also prevents LSP violations, because when interfaces only contain what an implementer can honour, implementers no longer need to throw `UnsupportedOperationException` for inherited obligations.

</details>

### Q4. Can you over-apply ISP?

<details>
<summary>Answer</summary>

Yes. Splitting cohesive operations that are always used together, or creating one-method interfaces for every class regardless of clients, adds indirection without decoupling anything. Segregate according to actual client needs.

</details>

## Applied

### Q5. An `Employee` interface has `work()`, `attendMeeting()`, `approveLeave()` and `generatePayroll()`. Interns and contractors implement it with empty methods. Redesign it.

<details>
<summary>Answer</summary>

Split by role: `Worker` (`work()`), `MeetingParticipant` (`attendMeeting()`), `LeaveApprover` (`approveLeave()`), `PayrollProcessor` (`generatePayroll()`). An intern implements `Worker` and `MeetingParticipant`; a manager also implements `LeaveApprover`; a payroll officer implements `PayrollProcessor`. The leave workflow depends on `LeaveApprover`, so the compiler stops interns from being assigned as approvers.

</details>

### Q6. Your service depends on a third-party SDK client with 60 methods but uses only two. How does ISP guide you?

<details>
<summary>Answer</summary>

Define your own small interface with just the two operations your service needs (for example `SmsGateway.send(to, text)`), and write an adapter that implements it using the SDK. Your service depends on the narrow interface — it is easier to test with a fake, insulated from SDK changes, and the vendor can be replaced by writing another adapter. This combines ISP with the Adapter pattern and Dependency Inversion.

</details>
