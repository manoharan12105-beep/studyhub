# OOP Anti-Patterns — Practice

### P1. Identify the anti-pattern

**Difficulty:** Easy · **Type:** MCQ

`class Order { getters and setters only }` and `class OrderService { 30 methods implementing every order rule }`.

- A) God object only
- B) Anaemic domain model
- C) Singleton abuse
- D) Refused bequest

<details>
<summary>Answer</summary>

**Answer:** B) Anaemic domain model

**Explanation:** Data and behaviour are separated; `OrderService` may also be drifting toward a god object.

</details>

### P2. Pattern or overkill?

**Difficulty:** Medium · **Type:** Scenario

For each, say whether the pattern is justified: (a) a Builder for a `Point(int x, int y)`; (b) a Strategy for shipping cost with four courier rules that change every quarter; (c) an Abstract Factory for UI widgets in an app with one theme and no plans for another; (d) Observer for sending order events to analytics, email and inventory services.

<details>
<summary>Answer</summary>

**Answer:** (a) Overkill — two required fields; use a constructor or record. (b) Justified — real, changing variation. (c) Overkill today — one family; introduce it when a second theme is real. (d) Justified — several independent listeners; the order module should not know them.

</details>

### P3. Fix the singleton

**Difficulty:** Hard · **Type:** Design

`TaxRates.getInstance().rateFor(state)` is called in 25 classes. Tax rates now differ per tenant, and tests need fixed rates. Describe a migration away from the global singleton without a big-bang rewrite.

<details>
<summary>Answer</summary>

1. Extract `interface TaxRateProvider { BigDecimal rateFor(String state); }` and make the existing singleton implement it.
2. Add constructor parameters of type `TaxRateProvider` to classes one at a time; in production wiring pass `TaxRates.getInstance()` so behaviour is unchanged.
3. In tests, pass a fake provider with fixed rates.
4. When all callers are migrated, remove the static `getInstance()` and create the provider in the composition root.
5. Add a `TenantTaxRateProvider` implementation selected per tenant.

**Why:** each step is small and behaviour-preserving, and global access disappears gradually.

</details>
