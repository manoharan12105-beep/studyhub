# Clean Code Principles for OOP — Interview Questions

## Conceptual

### Q1. What is "Tell, Don't Ask"?

<details>
<summary>Answer</summary>

Instead of asking an object for its data and deciding outside what to do with it, tell the object what you want and let it decide using its own data and rules. `order.ship()` (which validates its own status) rather than `if (order.getStatus() == PLACED) order.setStatus(SHIPPED)`. It keeps rules inside the object that owns the data — encapsulation applied to method design.

</details>

### Q2. What is the Law of Demeter?

<details>
<summary>Answer</summary>

Also called the Principle of Least Knowledge: a method should call methods only on itself, its fields, its parameters and objects it creates — not on objects obtained through them. `a.getB().getC().doX()` couples the caller to the internal structure of `A`, `B` and `C`. Ask `a` for what you need instead. Fluent APIs, builders and streams are not violations because they return objects intended for chaining.

</details>

### Q3. Explain DRY, KISS and YAGNI.

<details>
<summary>Answer</summary>

DRY: each piece of knowledge (rule, formula, constant) has one authoritative representation. KISS: prefer the simplest solution that clearly meets the requirements. YAGNI: do not build features or extension points until they are actually needed. DRY reduces inconsistency; KISS and YAGNI prevent over-engineering. DRY is about knowledge — similar-looking code that changes for different reasons should not be forced together.

</details>

### Q4. Why are boolean parameters often a code smell?

<details>
<summary>Answer</summary>

`export(report, true, false)` is unreadable at the call site, and a boolean flag usually means the method does two different things selected by the caller (control coupling). Use separate methods, an enum describing the option, or a strategy object.

</details>

### Q5. Are getters and setters bad?

<details>
<summary>Answer</summary>

Not inherently, but generating them for every field turns objects into data containers and moves their rules into callers, weakening encapsulation. Domain objects should expose behaviour (`withdraw`, `reschedule`) and only the getters callers truly need; setters should be rare. Plain data carriers — DTOs, records, framework-mapped classes — are the reasonable exception.

</details>

### Q6. How do you handle a method with eight parameters?

<details>
<summary>Answer</summary>

Group parameters that belong together into parameter objects or value types (`DateRange`, `GuestDetails`), which can also validate themselves; use a builder for many optional values; pass the object that owns the data instead of its pieces; and check whether the method does too much and should be split.

</details>

## Applied

### Q7. Review this code and suggest improvements.

```java
public void proc(Customer c, boolean f) {
    if (c != null) {
        if (c.getAccount() != null) {
            if (c.getAccount().getBalance() > 1000 && f) {
                c.getAccount().setBalance(c.getAccount().getBalance() - 100);
            }
        }
    }
}
```

<details>
<summary>Answer</summary>

Problems: meaningless names (`proc`, `c`, `f`); a boolean flag; deep nesting instead of guard clauses; a getter chain (Law of Demeter); the balance rule lives outside the account (Tell, Don't Ask); a magic number and fee; silently ignoring `null`.

Improved:

```java
public void chargeMonthlyFee(Customer customer) {
    Objects.requireNonNull(customer, "customer");
    customer.chargeMonthlyFee(MONTHLY_FEE_PAISE);   // Customer delegates to its Account, which applies its own rule
}
```

and inside `Account`: `void chargeFee(long fee) { if (balancePaise > MIN_BALANCE_FOR_FEE_PAISE) { balancePaise -= fee; } }`. The flag becomes a separate method or disappears, depending on what it meant.

</details>
