# OOP with Testing — Interview Questions

## Conceptual

### Q1. What makes a class easy to unit test?

<details>
<summary>Answer</summary>

It can be constructed in isolation, its collaborators are injected (usually through the constructor) and typed as interfaces, it has no hidden dependencies on global state, time, randomness or I/O, it has a small focused responsibility, and its behaviour is observable through return values or state. Those properties let a test substitute fakes and check results deterministically.

</details>

### Q2. How does dependency injection improve testability?

<details>
<summary>Answer</summary>

When a class receives its dependencies instead of creating them with `new`, a test can pass in test doubles — a fake repository, a fixed clock, a recording email sender — and test the class's logic in isolation, quickly and without external systems. Without injection the class is welded to real implementations.

</details>

### Q3. What is the difference between a stub, a fake and a mock?

<details>
<summary>Answer</summary>

A stub returns predefined answers to calls (an exchange-rate provider that always returns 83). A fake is a working, simplified implementation (an in-memory repository). A mock is configured with expectations and verifies how it was called (e.g. "send was called once with this address"), usually created by a library. All are test doubles that replace real collaborators.

</details>

### Q4. Why is `LocalDate.now()` inside business logic a testing problem, and how do you fix it?

<details>
<summary>Answer</summary>

The method's behaviour then depends on the real date, so date-dependent rules cannot be tested reliably (a Monday-only rule fails on Tuesdays). Inject a `java.time.Clock` and call `LocalDate.now(clock)`; production passes `Clock.systemDefaultZone()`, tests pass `Clock.fixed(...)`.

</details>

### Q5. How do SOLID principles relate to testability?

<details>
<summary>Answer</summary>

SRP keeps classes small so tests are focused; OCP means new behaviour comes in new classes, leaving existing tests untouched; LSP lets one contract test run against all implementations; ISP makes interfaces small and easy to fake; DIP creates the abstraction seams where test doubles plug in. Testable code and SOLID code tend to be the same code.

</details>

## Applied

### Q6. How would you test this method?

```java
class InvoiceService {
    double finalAmount(double amount) {
        double rate = new TaxRateApiClient().fetchRate("TN");   // network call
        return amount + amount * rate;
    }
}
```

<details>
<summary>Answer</summary>

As written it cannot be unit-tested without the network. Refactor: introduce `interface TaxRateProvider { double rateFor(String state); }`, inject it through `InvoiceService`'s constructor, and have the API client implement it. In tests, pass a stub returning a known rate (say 0.18) and assert that `finalAmount(100)` returns 118. Separately, a few integration tests can verify the real API client.

</details>

### Q7. Should private methods be unit-tested directly?

<details>
<summary>Answer</summary>

Generally no. Test them through the public methods that use them; private methods are implementation details and tests that reach into them break whenever the internals are refactored. If a private method contains so much logic that it seems to need its own tests, that logic probably deserves its own class with a public API (often a sign the original class has too many responsibilities).

</details>
