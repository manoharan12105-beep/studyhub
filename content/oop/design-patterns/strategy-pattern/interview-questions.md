# Strategy — Interview Questions

## Conceptual

### Q1. What is the Strategy pattern?

<details>
<summary>Answer</summary>

A behavioral pattern that encapsulates each algorithm of a family in its own class behind a common interface, so the algorithm can be chosen and swapped at runtime. The context holds a strategy and delegates to it. Example: a checkout uses a `DeliveryFeeStrategy`; standard, free-above-threshold and surge pricing are interchangeable implementations.

</details>

### Q2. How does Strategy relate to the Open/Closed Principle?

<details>
<summary>Answer</summary>

The context is closed for modification — it depends only on the strategy interface — and the system is open for extension because new algorithms are added as new strategy classes. It replaces `switch` statements that would have to be edited for every new variant.

</details>

### Q3. Give examples of Strategy in the JDK.

<details>
<summary>Answer</summary>

`Comparator` (passed to `sort`, `TreeMap`, `PriorityQueue`), the functional interfaces used by streams (`Predicate`, `Function`), `RejectedExecutionHandler` for thread pools, and `java.text`/`java.time` formatters chosen by the caller.

</details>

### Q4. Strategy vs Template Method?

<details>
<summary>Answer</summary>

Template Method fixes the algorithm's skeleton in a base class and lets subclasses override individual steps — variation by inheritance, fixed at compile time. Strategy replaces the whole algorithm (or a whole step) with an object passed in — variation by composition, switchable at runtime. Strategy is generally more flexible; Template Method is simpler when the skeleton must be enforced and variants are few.

</details>

### Q5. Strategy vs State?

<details>
<summary>Answer</summary>

Same structure; different intent. In Strategy the client picks an algorithm and strategies are independent of each other. In State the context's behaviour changes as its internal state changes, and state objects themselves trigger transitions to other states.

</details>

### Q6. How do lambdas change the Strategy pattern in Java?

<details>
<summary>Answer</summary>

A strategy interface with a single method is a functional interface, so simple strategies can be written as lambdas or method references (`(value, km) -> 25`, `Comparator.comparing(Employee::salary)`) instead of named classes. Named classes remain useful when a strategy has state, configuration, multiple methods, or deserves its own tests and name.

</details>

## Applied

### Q7. How would you implement different shipping-cost rules per country, configurable without redeploying?

<details>
<summary>Answer</summary>

Define `ShippingCostStrategy`, implement the rule types (flat, weight-based, free-above, zone-based) as configurable classes, and build a map from country to a configured strategy at startup from configuration (database or properties). The checkout looks up the strategy for the order's country and delegates. A new rule type needs a new class; a new country or changed parameters need only configuration.

</details>
