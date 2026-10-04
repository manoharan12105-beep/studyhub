# Encapsulation

## Definition

**Encapsulation** means bundling an object's data with the methods that operate on that data, and **restricting direct access** to the data so that it can change only through those methods. In Java this usually means `private` fields plus a deliberate set of public methods that keep the object valid.

Interview version: *encapsulation = data + behaviour in one unit, with the data hidden so the object can protect its own rules (invariants).*

## Why It Matters

Without encapsulation, any code anywhere can put an object into a nonsensical state, and every rule must be re-checked by every caller. With encapsulation:

- **Rules live in one place.** "Balance never below the overdraft limit" is checked once, inside `withdraw`.
- **Internals can change safely.** Store money as `long` paise instead of `double` rupees, and no caller notices.
- **Bugs are localised.** If a field has a bad value, only the class's own methods could have put it there.
- **Thread safety becomes possible.** You can synchronise access only if all access goes through your methods.

## Data Hiding

**Data hiding** is the part of encapsulation that makes fields inaccessible from outside, typically with `private`. Encapsulation is the broader idea: hiding the data **and** providing the behaviour that operates on it. A class with private fields but a public setter for every field hides the data technically, yet still lets callers do anything — it is poorly encapsulated.

## Access Modifiers

Java has four access levels. From most to least restrictive:

| Modifier | Same class | Same package | Subclass in another package | Any other class |
|----------|-----------|--------------|-----------------------------|-----------------|
| `private` | Yes | No | No | No |
| *(none)* package-private | Yes | Yes | No | No |
| `protected` | Yes | Yes | Yes (through inheritance — see below) | No |
| `public` | Yes | Yes | Yes | Yes |

### `private`

Visible only inside the top-level class that contains the declaration (including its nested classes). The default choice for fields.

### Default (package-private)

No keyword. Visible to every class in the same package. Useful for collaborators that work together inside one package without being part of the public API (tests in the same package can use them too).

### `protected`

Visible in the same package **and** in subclasses in other packages. The cross-package rule is narrower than many expect: a subclass in another package can access a protected **instance** member only through a reference of **its own type** (or a subtype of it), not through an arbitrary reference to the superclass.

```java
// file: com/shop/core/Item.java
package com.shop.core;

public class Item {
    protected double basePrice;
}

// file: com/shop/sale/SaleItem.java
package com.shop.sale;

import com.shop.core.Item;

public class SaleItem extends Item {
    void apply(SaleItem other, Item plain) {
        basePrice = basePrice * 0.9;    // OK: inherited member of this object
        other.basePrice = 0;            // OK: reference of type SaleItem
        // plain.basePrice = 0;         // compile-time error: Item reference from another package
    }
}
```

`protected` also makes the member part of the contract with every future subclass, so it is harder to change than `private`. Prefer `private` fields with `protected` methods when subclasses need a hook.

### `public`

Visible everywhere. Public members are your API — once others depend on them, changing them is expensive.

### Where modifiers apply

| Element | Allowed modifiers |
|---------|-------------------|
| Top-level class / interface | `public` or package-private only |
| Fields, methods, constructors, nested types | All four |
| Interface methods | `public` (implicit) or `private` (Java 9+) |
| Local variables | None (access modifiers make no sense in a method body) |

## Getters

A **getter** (`getBalance()`) returns a field's value. Getters are fine for data callers genuinely need, but do not add them automatically:

- Expose **what callers need**, not every field. A `Password` object should offer `matches(String attempt)`, not `getHash()`.
- A getter that returns a **mutable object** gives the caller a handle to your internals (see *Exposing Mutable Objects*).

## Setters

A **setter** (`setBalance(x)`) assigns a field. Blind setters undo encapsulation: `account.setBalance(-1_000_000)` is no better than a public field. Prefer:

- **Intention-revealing methods** that enforce rules: `deposit(amount)`, `withdraw(amount)`, `changeEmail(newEmail)`.
- **No setter at all** for values fixed after construction (`id`, `createdAt`) — make them `final`.

## Controlled Mutation

**Controlled mutation** means every state change goes through a method that checks it. The object chooses which changes are possible.

```java
public class ControlledMutation {

    static class BankAccount {
        private final String accountNumber;
        private long balancePaise;                    // money as whole paise avoids double rounding
        private static final long OVERDRAFT_LIMIT_PAISE = 0;

        BankAccount(String accountNumber, long openingPaise) {
            if (accountNumber == null || accountNumber.isBlank()) {
                throw new IllegalArgumentException("account number required");
            }
            if (openingPaise < 0) {
                throw new IllegalArgumentException("opening balance cannot be negative");
            }
            this.accountNumber = accountNumber;
            this.balancePaise = openingPaise;
        }

        void deposit(long paise) {
            requirePositive(paise);
            balancePaise += paise;
        }

        void withdraw(long paise) {
            requirePositive(paise);
            if (balancePaise - paise < -OVERDRAFT_LIMIT_PAISE) {
                throw new IllegalStateException("insufficient funds in " + accountNumber);
            }
            balancePaise -= paise;
        }

        long balancePaise() {
            return balancePaise;
        }

        private static void requirePositive(long paise) {
            if (paise <= 0) {
                throw new IllegalArgumentException("amount must be positive: " + paise);
            }
        }
    }

    public static void main(String[] args) {
        BankAccount account = new BankAccount("SB-1001", 50_000);
        account.deposit(20_000);
        account.withdraw(30_000);
        System.out.println("Balance: " + account.balancePaise());

        try {
            account.withdraw(100_000);
        } catch (IllegalStateException e) {
            System.out.println("Rejected: " + e.getMessage());
        }
        try {
            account.deposit(-5);
        } catch (IllegalArgumentException e) {
            System.out.println("Rejected: " + e.getMessage());
        }
        System.out.println("Balance unchanged: " + account.balancePaise());
    }
}
```

**Output:**

```text
Balance: 40000
Rejected: insufficient funds in SB-1001
Rejected: amount must be positive: -5
Balance unchanged: 40000
```

## Validation Inside Objects

Validate **where the data enters** the object: constructors and mutating methods. Then every other method can trust the fields.

- Reject bad input early with `IllegalArgumentException` (bad argument) or `IllegalStateException` (operation not allowed in the current state).
- `Objects.requireNonNull(value, "message")` for mandatory references.
- Do not leave validation to callers ("the UI already checks it") — other callers will not.

## Invariants

An **invariant** is a condition that must be true for every object of the class whenever no method is executing. Examples:

| Class | Invariant |
|-------|-----------|
| `BankAccount` | balance ≥ −overdraft limit |
| `DateRange` | start ≤ end |
| `Fraction` | denominator ≠ 0, stored in lowest terms |
| `Order` | total equals the sum of its line amounts |

Encapsulation is what makes invariants **enforceable**: the constructor establishes them, and each public method preserves them. If a field is public, the class can no longer promise anything about it.

## Defensive Copying

A **defensive copy** is a copy made when mutable data crosses the object's boundary, so outside code cannot change the object's internals.

- **Copy in:** when a constructor or method receives a mutable object (a list, an array, a `java.util.Date`), store a copy.
- **Copy out:** when a getter returns mutable internal data, return a copy or an unmodifiable view.
- Validate **after** copying in, so the caller cannot change the data between your check and your copy.

## Exposing Mutable Objects

The most common encapsulation leak: private field, but the getter hands out the internal mutable object.

```java
import java.util.ArrayList;
import java.util.List;

public class LeakyGetter {

    static class Team {
        private final List<String> members;

        Team(List<String> members) {
            this.members = members;                 // BAD: stores the caller's list
        }

        List<String> getMembers() {
            return members;                         // BAD: hands out the internal list
        }
    }

    static class SafeTeam {
        private final List<String> members;

        SafeTeam(List<String> members) {
            this.members = new ArrayList<>(members); // copy in
        }

        List<String> getMembers() {
            return List.copyOf(members);             // copy out (unmodifiable)
        }

        void addMember(String name) {                // the only way to change membership
            if (members.size() >= 5) {
                throw new IllegalStateException("team is full");
            }
            members.add(name);
        }
    }

    public static void main(String[] args) {
        List<String> input = new ArrayList<>(List.of("Anu", "Bala"));

        Team team = new Team(input);
        input.add("Intruder");                      // changes the team from outside
        team.getMembers().clear();                  // empties the team from outside
        System.out.println("Team: " + team.getMembers());

        List<String> input2 = new ArrayList<>(List.of("Anu", "Bala"));
        SafeTeam safe = new SafeTeam(input2);
        input2.add("Intruder");                     // no effect on safe
        try {
            safe.getMembers().clear();              // returned list is unmodifiable
        } catch (UnsupportedOperationException e) {
            System.out.println("Cannot modify the returned list");
        }
        System.out.println("SafeTeam: " + safe.getMembers());
    }
}
```

**Output:**

```text
Team: []
Cannot modify the returned list
SafeTeam: [Anu, Bala]
```

`List.copyOf` returns an unmodifiable copy; `Collections.unmodifiableList(members)` returns a read-only **view** (cheaper, but it reflects later internal changes). Either keeps callers from mutating your state.

## Immutable Fields

Mark fields `final` when they should never change after construction (`id`, `createdAt`, collaborators). `final` guarantees the **reference** is assigned exactly once — it says nothing about whether the referenced object is mutable. Combining `final` fields, no setters, and defensive copies produces fully **immutable** objects; see [Immutability](../../java-oop/immutability/content.md).

## JavaBeans

A **JavaBean** is a class following a naming convention used by tools and frameworks: a public no-arg constructor, private fields, and `getX()`/`setX()` (or `isX()` for `boolean`) accessors. Frameworks (older JSP/UI tools, some serialisation and ORM libraries) use reflection on these names.

| JavaBean convention | Encapsulation trade-off |
|---------------------|-------------------------|
| Public no-arg constructor | Object can exist in an incomplete, invalid state |
| Setter for every property | No invariants can be enforced across fields |
| Getter for every property | All internals become API |

Beans are fine for **data-transfer objects** at system boundaries (request/response bodies). For domain objects with rules, prefer constructors that establish validity and behaviour methods instead of setters. Modern Java offers **records** for simple data carriers ([Modern Java OOP Features](../../java-oop/modern-java-oop/content.md)).

## Encapsulation vs Abstraction

| | Encapsulation | Abstraction |
|--|---------------|-------------|
| Question it answers | *Who can touch this data?* | *What does the caller need to know?* |
| Focus | Protecting state and invariants | Hiding complexity behind a simpler model |
| Level | Implementation: inside a class | Design: what a type offers |
| Java tools | `private` fields, access modifiers, defensive copies | Interfaces, abstract classes, well-chosen method names |
| Example | `balance` is private; only `withdraw` changes it | `PaymentGateway.pay(amount)` hides whether it uses UPI, card or wallet |

They work together: abstraction decides **what** the public surface is; encapsulation ensures **nothing else** is reachable. See [Abstraction](../abstraction/content.md).

## Poor Encapsulation Examples

| Smell | Why it is poor |
|-------|----------------|
| `public` fields | Any code can break invariants |
| Getter + setter for every field | Same as public fields, with more typing |
| Getter returning an internal mutable collection or array | Callers mutate internals |
| Constructor storing a caller's mutable object | Caller mutates internals later |
| Validation done by callers | Each caller must remember; one forgets |
| `protected` fields "for subclasses" | Every subclass in every package can break invariants |

## Refactoring Poor Encapsulation

**Bad design**

```java
import java.util.ArrayList;
import java.util.List;

class Order {
    public List<Double> itemPrices = new ArrayList<>();
    public double total;
    public String status;
}

class Checkout {                               // one of many callers
    void addPen(Order order) {
        order.itemPrices.add(499.0);
        order.total = order.total + 499.0;     // every caller must keep total in sync
        order.status = "SHIPED";               // typo accepted; an empty order can be "shipped"
    }
}
```

**Problem**

- `total` must always equal the sum of prices, but three different callers update it — one will forget.
- `status` accepts any string; the order of statuses (placed → shipped → delivered) is not enforced.
- Changing the representation (e.g. lines with quantity) breaks every caller.

**Better design**

```java
import java.util.ArrayList;
import java.util.List;

public class OrderRefactored {

    enum Status { PLACED, SHIPPED, DELIVERED }

    static class Order {
        private final List<Long> itemPricesPaise = new ArrayList<>();
        private Status status = Status.PLACED;

        void addItem(long pricePaise) {
            if (status != Status.PLACED) {
                throw new IllegalStateException("cannot add items after shipping");
            }
            if (pricePaise <= 0) {
                throw new IllegalArgumentException("price must be positive");
            }
            itemPricesPaise.add(pricePaise);
        }

        long totalPaise() {                       // derived, so it can never be out of sync
            long total = 0;
            for (long price : itemPricesPaise) {
                total += price;
            }
            return total;
        }

        void ship() {
            if (status != Status.PLACED || itemPricesPaise.isEmpty()) {
                throw new IllegalStateException("only a non-empty placed order can ship");
            }
            status = Status.SHIPPED;
        }

        Status status() {
            return status;
        }
    }

    public static void main(String[] args) {
        Order order = new Order();
        order.addItem(49_900);
        order.addItem(19_900);
        order.ship();
        System.out.println(order.status() + " total=" + order.totalPaise());
        try {
            order.addItem(100);
        } catch (IllegalStateException e) {
            System.out.println("Rejected: " + e.getMessage());
        }
    }
}
```

**Output:**

```text
SHIPPED total=69800
Rejected: cannot add items after shipping
```

**Why it is better**

- `total` is computed, so it cannot drift from the items.
- `Status` is an enum, so typos do not compile, and transitions happen only through `ship()`.
- The internal list is never exposed; the representation can change without touching callers.
- Every rule is in `Order`, so a reader finds all of them in one file.

## Real-World Examples

- `String` hides its internal byte array; you can read characters but never change them.
- `ArrayList` hides its backing array and `size` counter; `add` grows the array when needed.
- `LocalDate` exposes `plusDays(…)` (returning a new date) instead of a setter for the day.
- In Spring applications, entities with behaviour methods (`order.cancel()`) instead of public setters keep business rules out of controllers.

## Common Misconceptions

- **"Encapsulation = private fields + getters and setters."** Getters and setters for everything is the weakest form; encapsulation is about the object enforcing its own rules.
- **"`final` field = immutable data."** `final` fixes the reference; a `final List` can still be modified.
- **"`protected` is almost private."** It is visible to the whole package and to every subclass anywhere.
- **"Encapsulation is for security."** It protects program correctness from programming mistakes; it is not a security boundary (reflection can bypass access checks in many setups).
- **"Encapsulation and abstraction are the same."** Related, but encapsulation protects state; abstraction simplifies the interface.

## Key Takeaways

- Keep fields `private`; expose behaviour that keeps the object valid.
- Validate in constructors and mutators so invariants always hold.
- Prefer intention-revealing methods over blind setters; omit setters for fixed values.
- Make defensive copies of mutable inputs and outputs.
- Know the four access levels, including the cross-package restriction on `protected`.
- JavaBeans conventions suit DTOs, not rich domain objects.
