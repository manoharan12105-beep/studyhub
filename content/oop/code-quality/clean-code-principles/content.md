# Clean Code Principles for OOP

## Definition

**Clean code** is code that other people (including your future self) can read, understand and change safely. For object-oriented code, it means classes and methods with clear names and single purposes, objects that protect their own state and behaviour, and dependencies that are few and explicit.

> [!IMPORTANT]
> Everything here is a **principle** or **guideline**, not an absolute rule. Each section ends with when it is reasonable to bend it. Judgement — readability for the team, the size of the system, how often the code changes — always wins over mechanical rule-following.

## Why It Matters

- Code is read far more often than it is written; reading cost dominates maintenance.
- Most OOP design problems surface first as small readability problems: a vague name, a long method, a getter chain.
- Interviewers often ask candidates to review or refactor code; naming these principles shows you can reason about quality.

## Meaningful Names

| Unclear | Clear | Why |
|---------|-------|-----|
| `int d;` | `int daysSinceLastLogin;` | Says what and which unit |
| `List<Order> list1;` | `List<Order> pendingOrders;` | Says which ones |
| `void process()` | `void approveLoan()` | Says what it does |
| `class DataManager` | `class InvoiceRepository` | Says the responsibility |
| `boolean flag` | `boolean isExpired` | Reads as a question |

Guidelines: classes are nouns (`Invoice`, `PaymentGateway`); methods are verbs (`calculateTotal`, `cancel`); booleans read as predicates (`isActive`, `hasStock`); avoid encodings and noise words (`strName`, `InvoiceData`, `InvoiceInfo`); use domain vocabulary the business uses.

*Bend it:* short names are fine in tiny scopes (`i` in a loop, `e` for a caught exception).

## Small Classes

A class should be small in **responsibilities**, not necessarily in lines: one reason to change ([Single Responsibility](../../design-principles/single-responsibility-principle/content.md)). Signs a class is too big: a vague name (`Manager`, `Helper`), dozens of fields used by different subsets of methods, and changes for unrelated reasons.

## Small Methods

A method should do **one thing** at **one level of abstraction**:

```java
// Mixed levels: business steps next to string fiddling
void register(String rawEmail, String password) {
    String email = rawEmail.trim().toLowerCase();
    if (!email.contains("@") || email.indexOf('@') != email.lastIndexOf('@')) {
        throw new IllegalArgumentException("bad email");
    }
    // ... hashing, saving, emailing inline ...
}

// One level: each line is a step with a name
void register(String rawEmail, String password) {
    Email email = Email.parse(rawEmail);
    PasswordHash hash = passwordHasher.hash(password);
    User user = users.save(new User(email, hash));
    welcomeNotifier.welcome(user);
}
```

*Bend it:* a 30-line method that reads top to bottom as one clear algorithm can be better than ten tiny methods the reader must jump between.

## Avoiding God Classes

A **god class** knows and does too much (`ApplicationManager`, `CommonService`). It attracts every change, has high coupling and low cohesion, and is hard to test. Split by responsibility and push behaviour into the objects that own the data. See [Code Smells and Refactoring](../code-smells-and-refactoring/content.md) and [OOP Anti-Patterns](../oop-anti-patterns/content.md).

## Avoiding Long Parameter Lists

```java
// Hard to call correctly: which long is which?
Booking book(String hotelId, String guestName, String phone, LocalDate checkIn,
             LocalDate checkOut, int adults, int children, boolean breakfast) { /* ... */ }
```

Remedies:

- **Parameter object:** group values that travel together — `DateRange stay`, `GuestDetails guest`, `Occupancy occupancy`. Often these become real domain types with validation (`DateRange` checks start ≤ end).
- **Builder** for many optional values ([Builder](../../design-patterns/builder-pattern/content.md)).
- Pass the object that **owns** the data instead of its pieces.

*Bend it:* three or four clear, differently typed parameters are fine.

## Encapsulation and Unnecessary Getters/Setters

Generating a getter and setter for every field turns objects into data bags and spreads their rules across callers. Expose **behaviour**; add getters only for data callers truly need; add setters rarely.

```java
// Data bag + logic outside
if (account.getBalance() >= amount) {
    account.setBalance(account.getBalance() - amount);
}

// Behaviour inside
account.withdraw(amount);
```

*Bend it:* DTOs, records and framework-mapped classes at system boundaries are meant to be plain data.

## Avoiding Boolean Parameter Abuse

```java
report.export(true, false);          // what do true and false mean?
```

A boolean parameter usually means the method does **two things** (control coupling). Prefer:

- Two methods: `exportAsPdf()` / `exportAsCsv()`.
- An enum: `export(Format.PDF, Delivery.DOWNLOAD)`.
- A strategy object: `export(pdfFormatter)`.

*Bend it:* a single boolean that is obvious at the call site (`setVisible(true)`) is fine.

## Favour Composition

Reuse by holding and delegating to objects rather than extending classes, unless the IS-A relationship is real and the base class is designed for extension. See [Composition over Inheritance](../../relationships/composition-over-inheritance/content.md).

## Dependency Inversion

Business code should depend on abstractions (`PaymentGateway`) supplied from outside, not create infrastructure (`new RazorpayClient()`). See [Dependency Inversion Principle](../../design-principles/dependency-inversion-principle/content.md).

## Defensive Programming

Code that **fails fast** with a clear message is easier to debug than code that limps on with bad data.

- Validate inputs at public boundaries: `Objects.requireNonNull(customer, "customer")`, range checks → `IllegalArgumentException`.
- Reject operations in the wrong state → `IllegalStateException`.
- Use **guard clauses** instead of deep nesting.
- Make invalid states unrepresentable: enums instead of strings, value objects (`Email`, `Money`) that validate themselves, immutable objects.
- Make defensive copies of mutable inputs and outputs ([Encapsulation](../../pillars/encapsulation/content.md)).

```java
long withdraw(long amountPaise) {
    if (amountPaise <= 0) {
        throw new IllegalArgumentException("amount must be positive: " + amountPaise);   // guard
    }
    if (frozen) {
        throw new IllegalStateException("account is frozen");                            // guard
    }
    if (amountPaise > balancePaise) {
        throw new IllegalStateException("insufficient funds");
    }
    balancePaise -= amountPaise;                                                          // main path, not nested
    return balancePaise;
}
```

*Bend it:* inside a module, private methods can trust inputs already validated at the boundary; re-checking everything everywhere adds noise.

## Tell, Don't Ask

**Tell** an object what to do, instead of **asking** for its data and making the decision outside.

```java
// Ask: the caller decides using the object's data
if (order.getStatus() == Status.PLACED && order.getItems().size() > 0) {
    order.setStatus(Status.SHIPPED);
}

// Tell: the object decides, using its own data and rules
order.ship();     // throws IllegalStateException if it cannot be shipped
```

Benefits: rules live in one place, the object's internals can change, and callers stay simple. This is encapsulation applied to method design.

*Bend it:* reports, UI rendering and queries legitimately ask for data; the principle targets **decisions that change state**.

## Law of Demeter (Principle of Least Knowledge)

A method should only talk to its **immediate friends**: `this`, its parameters, objects it creates, and its own fields — not to objects returned by them ("don't talk to strangers").

```java
// Violation: a "train wreck" that knows the structure of three other classes
String city = order.getCustomer().getProfile().getAddress().getCity();

// Better: ask the nearest object for what you need
String city = order.shippingCity();          // Order delegates internally
```

The **Principle of Least Knowledge** is the same idea stated generally: each unit should know as little as possible about the structure of others. Violations create coupling to internal structure — if `Profile` is removed, every chain breaks.

*Bend it:* chaining on **fluent APIs and value objects** is fine (`builder.name("x").age(3).build()`, `stream.filter(...).map(...)`, `date.plusDays(1).getDayOfWeek()`) — each call returns an object you were meant to use, not internal structure.

## DRY — Don't Repeat Yourself

Every piece of **knowledge** (a business rule, a calculation, a constant) should have one authoritative place. If the GST rate appears in five files, a rate change needs five edits and one will be missed.

*Bend it:* DRY is about knowledge, not identical-looking text. Two pieces of code that look the same but change for different reasons (a customer discount and an employee discount that happen to both be 10%) should **not** be merged — that couples unrelated rules. Premature abstraction to remove duplication is often worse than a little duplication.

## KISS — Keep It Simple

Choose the simplest design that meets today's requirements clearly: a `switch` over three stable cases, a plain class instead of a framework, a list instead of a custom tree. Complexity must justify itself.

## YAGNI — You Aren't Gonna Need It

Do not build features, extension points or configurability for requirements that do not exist yet. Speculative abstractions cost effort now, add indirection, and usually guess the future wrong. When the need arrives, refactor — well-tested, clean code is easy to extend.

KISS and YAGNI balance SOLID: SOLID tells you *how* to make code extensible; KISS and YAGNI tell you *when not to bother*.

## Principles vs Absolute Rules

| Principle | Typical guideline | Reasonable exception |
|-----------|-------------------|----------------------|
| Small methods | Do one thing | A clear linear algorithm in one place |
| No getters/setters | Expose behaviour | DTOs, records, framework entities |
| Law of Demeter | No getter chains | Fluent APIs, builders, streams, immutable values |
| DRY | One place per rule | Similar code that changes for different reasons |
| SOLID interfaces | Depend on abstractions | Stable, simple classes with one implementation |
| No boolean parameters | Split methods | Obvious single flags (`setEnabled(true)`) |

## Real-World Examples

- Code reviews in professional teams routinely flag vague names, long parameter lists, getter chains and duplicated rules.
- Static analysis tools (Checkstyle, PMD, SonarQube and similar) detect long methods, deep nesting and duplicated code — but deciding *how* to fix them is design work.
- Value objects (`Email`, `PhoneNumber`, `Money`) in backend code remove repeated validation and long primitive parameter lists.

## Common Misconceptions

- **"Clean code means short code."** Clear code sometimes needs more lines.
- **"Every method must be under N lines."** Size is a signal, not the goal.
- **"Comments make code clean."** Good names and structure first; comments explain *why*, not *what*.
- **"DRY means never write similar code twice."** It means one source of truth for each piece of knowledge.
- **"YAGNI means never designing for change."** It means not building for imagined change.

## Key Takeaways

- Names reveal intent; classes have one responsibility; methods do one thing at one level.
- Prefer behaviour over getters/setters, parameter objects over long lists, enums/strategies over boolean flags.
- Fail fast with guard clauses and self-validating types.
- Tell, Don't Ask and the Law of Demeter keep knowledge of internals local.
- DRY applies to knowledge; KISS and YAGNI stop over-engineering.
- Treat all of these as principles that need judgement, not absolute rules.
