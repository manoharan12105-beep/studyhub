# Coupling and Cohesion — Interview Questions

## Conceptual

### Q1. What are coupling and cohesion?

<details>
<summary>Answer</summary>

Coupling measures how much one module depends on another; cohesion measures how closely the elements within one module belong together. Good design has low (loose) coupling — modules interact through small, stable interfaces — and high cohesion — each class has one focused purpose. Together they make changes local and code easier to understand, test and reuse.

</details>

### Q2. Why is tight coupling a problem?

<details>
<summary>Answer</summary>

A change in one class forces changes in the classes coupled to it, so small changes ripple through the system; classes cannot be understood, tested or reused in isolation; and replacing an implementation (a database, a vendor) requires editing its users. Tight coupling also makes parallel development harder.

</details>

### Q3. How do interfaces and dependency injection reduce coupling?

<details>
<summary>Answer</summary>

An interface lets a class depend only on the operations it needs, not on a concrete class's identity or internals. Dependency injection removes the remaining tie — the class no longer creates its collaborator with `new` — so any implementation can be supplied, including test fakes. Together they turn content coupling into message coupling.

</details>

### Q4. Give examples of low cohesion.

<details>
<summary>Answer</summary>

A `Utils` class with tax, string, validation and Slack helpers (coincidental cohesion); a `StartupTasks` class that loads config, warms caches and emails admins because they happen at startup (temporal cohesion); an `OrderManager` that prices, persists, emails and renders PDFs. Signs: vague names, "and" in the description, methods using disjoint sets of fields.

</details>

### Q5. What is control coupling and how do you remove it?

<details>
<summary>Answer</summary>

One module passes a flag that controls another's internal logic — `export(report, true)` where `true` means "use PDF". Callers must know the callee's internals, and the callee grows `if` branches. Remove it by splitting methods (`exportPdf`, `exportCsv`) or by passing a strategy object (`export(report, pdfFormat)`).

</details>

## Applied

### Q6. How would you reduce the coupling in this method?

```java
class ShippingLabel {
    String print(Customer customer) {
        return customer.getProfile().getAddress().getLine1() + ", "
                + customer.getProfile().getAddress().getCity();
    }
}
```

<details>
<summary>Answer</summary>

It depends on `Customer`, `Profile` and `Address` and their structure (stamp coupling plus a Law of Demeter violation: a chain of getters). If `Profile` is restructured, the label breaks. Pass only what is needed — `print(Address address)` — or ask the object that owns the data for what you need: `customer.shippingAddress()` returning an `Address` with a `formatForLabel()` method. Then the label depends on one small type.

</details>

### Q7. Your team's `CommonService` is injected into 40 classes and has 70 methods. What do you do?

<details>
<summary>Answer</summary>

It is a low-cohesion hub with very high coupling: any change risks 40 classes. Group its methods by responsibility (pricing, notifications, document generation, etc.), extract cohesive classes or interfaces, and change each client to depend on the narrow one it uses (ISP). Do it incrementally: introduce the new interface, have `CommonService` delegate to the new class temporarily, and migrate clients one by one.

</details>
