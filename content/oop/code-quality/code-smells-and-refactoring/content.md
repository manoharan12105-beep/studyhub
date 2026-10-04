# Code Smells and Refactoring

## Definition

A **code smell** is a surface symptom in code that *often* indicates a deeper design problem — a long method, a class that changes for many reasons, a `switch` repeated everywhere. A smell is not a bug; the code works, but it is harder to understand and change than it should be.

**Refactoring** is changing the internal structure of code **without changing its observable behaviour**, in small, safe steps, to remove smells. Each step (extract a method, move a method, introduce a value object) keeps the program working, ideally verified by tests after every step.

## Why It Matters

- Smells are how design problems become visible in day-to-day work; recognising them is the first step to fixing SOLID, coupling and cohesion issues.
- Interview "review this code" questions are smell-spotting exercises.
- Refactoring in small behaviour-preserving steps is how real teams improve legacy code without rewriting it.

## Catalogue of Common OOP Smells

| Smell | Symptom | Underlying problem | Typical refactoring |
|-------|---------|--------------------|---------------------|
| **God Class / God Object** | One huge class (`OrderManager`) that knows and does everything | Low cohesion, high coupling, SRP violation | Extract Class by responsibility; move behaviour to data owners |
| **Long Method** | A method you must scroll to read; comments separating "sections" | Several things at several levels of abstraction | Extract Method; Replace Temp with Query |
| **Long Parameter List** | `book(a, b, c, d, e, f, g)` | Missing concepts; data clumps | Introduce Parameter Object; Preserve Whole Object; Builder |
| **Feature Envy** | A method uses another object's data more than its own | Behaviour in the wrong class | Move Method to the data owner |
| **Shotgun Surgery** | One change requires small edits in many classes | A responsibility is scattered | Move Method / Move Field to gather it in one place |
| **Divergent Change** | One class changes for many different reasons | Several responsibilities in one class | Extract Class per reason to change |
| **Primitive Obsession** | Strings and ints for emails, money, phone numbers, statuses | Missing value types; validation duplicated | Replace Primitive with Value Object / Enum |
| **Data Clumps** | The same 3–4 fields or parameters always appear together | A missing concept | Extract Class / Introduce Parameter Object |
| **Refused Bequest** | Subclass ignores or throws for inherited methods | Wrong IS-A relationship (LSP violation) | Replace Inheritance with Delegation; split the hierarchy |
| **Switch-heavy design** | The same `switch`/`if-else` on a type code in several places | Missing polymorphism (OCP violation) | Replace Conditional with Polymorphism; Strategy/State |
| **Duplicate Code** | Same logic copy-pasted | One piece of knowledge in several places (DRY) | Extract Method / Extract Class / Pull Up Method |
| **Tight Coupling** | `new` of concrete infrastructure inside business code; getter chains | Hard to change and test | Introduce Interface; Inject Dependency; Hide Delegate |
| **Low Cohesion** | Methods using disjoint subsets of fields; `Utils` classes | Unrelated responsibilities together | Extract Class; move methods to their concepts |

Shotgun Surgery and Divergent Change are opposites: the first is **one change → many classes**, the second is **one class → many kinds of change**. Both point to responsibilities being split along the wrong lines.

## Refactoring Safely

1. Make sure behaviour is covered by tests (or write characterization tests that capture current behaviour).
2. Make **one small** structural change.
3. Compile and run the tests.
4. Commit, then repeat.

Refactoring is not adding features; mixing the two in one step makes failures hard to diagnose. IDEs automate the common steps (rename, extract method, move, introduce parameter), which makes them reliable.

## Long Method → Extract Method

**Bad code**

```java
String statement(java.util.List<long[]> lines, String customer) {   // {quantity, pricePaise}
    // compute subtotal
    long subtotal = 0;
    for (long[] line : lines) {
        subtotal += line[0] * line[1];
    }
    // apply bulk discount
    long discount = subtotal > 1_000_000 ? subtotal * 5 / 100 : 0;
    // tax
    long tax = (subtotal - discount) * 18 / 100;
    // format
    return customer + ": subtotal=" + subtotal + " discount=" + discount
            + " tax=" + tax + " total=" + (subtotal - discount + tax);
}
```

**Problem:** four responsibilities at different levels, separated by comments; each rule is hard to find, reuse and test.

**Refactoring:** Extract Method for each commented block; name the method after the comment.

**Better design**

```java
String statement(java.util.List<long[]> lines, String customer) {
    long subtotal = subtotal(lines);
    long discount = bulkDiscount(subtotal);
    long tax = gst(subtotal - discount);
    return format(customer, subtotal, discount, tax);
}

long subtotal(java.util.List<long[]> lines) {
    long total = 0;
    for (long[] line : lines) {
        total += line[0] * line[1];
    }
    return total;
}

long bulkDiscount(long subtotal) {
    return subtotal > 1_000_000 ? subtotal * 5 / 100 : 0;
}

long gst(long taxable) {
    return taxable * 18 / 100;
}

String format(String customer, long subtotal, long discount, long tax) {
    return customer + ": subtotal=" + subtotal + " discount=" + discount
            + " tax=" + tax + " total=" + (subtotal - discount + tax);
}
```

The top method now reads like the comments did. The next step would be noticing **Primitive Obsession** (`long[]` lines, `long` money) and the **Divergent Change** of pricing vs formatting.

## Feature Envy → Move Method

**Bad code**

```java
class Address {
    String line1;
    String city;
    String pinCode;
}

class ShippingLabelPrinter {
    String label(Address a) {                       // only uses Address's data
        return a.line1 + "\n" + a.city + " - " + a.pinCode;
    }

    boolean isLocal(Address a) {
        return a.pinCode.startsWith("620");           // knows Address's format rules
    }
}
```

**Problem:** the printer "envies" `Address`: its methods use another class's fields, and any change to the address format breaks code elsewhere. `Address` is a data bag.

**Refactoring:** Move Method into the class that owns the data; make the fields private.

**Better design**

```java
final class Address {
    private final String line1;
    private final String city;
    private final String pinCode;

    Address(String line1, String city, String pinCode) {
        this.line1 = line1;
        this.city = city;
        this.pinCode = pinCode;
    }

    String formatForLabel() {
        return line1 + "\n" + city + " - " + pinCode;
    }

    boolean isWithinPinPrefix(String prefix) {
        return pinCode.startsWith(prefix);
    }
}
```

## Primitive Obsession → Value Object

**Bad code**

```java
class Customer {
    String email;              // any string accepted
    String phone;              // "98765", "abc", "+91 98..."  — all accepted
    double balance;            // money as double: rounding errors
}
// Validation of email and phone copied into every service that receives them.
```

**Problem:** domain concepts are plain primitives, so validation and formatting rules are duplicated (Shotgun Surgery), invalid values travel through the system, and parameters of the same primitive type are easy to swap (`register(phone, email)` compiles).

**Refactoring:** Replace Primitive with Value Object — a small immutable type that validates itself.

**Better design**

```java
import java.util.Locale;
import java.util.Objects;

public class ValueObjectDemo {

    record Email(String value) {
        Email {
            Objects.requireNonNull(value, "email");
            value = value.trim().toLowerCase(Locale.ROOT);
            int at = value.indexOf('@');
            if (at <= 0 || at != value.lastIndexOf('@') || at == value.length() - 1) {
                throw new IllegalArgumentException("invalid email: " + value);
            }
        }
    }

    record Money(long paise) {
        Money {
            if (paise < 0) {
                throw new IllegalArgumentException("negative money");
            }
        }

        Money plus(Money other) {
            return new Money(paise + other.paise);
        }

        @Override
        public String toString() {
            return String.format("Rs %d.%02d", paise / 100, paise % 100);
        }
    }

    public static void main(String[] args) {
        Email email = new Email("  Kavin@Example.COM ");
        System.out.println(email.value());
        System.out.println(new Money(12_050).plus(new Money(99)));
        try {
            new Email("not-an-email");
        } catch (IllegalArgumentException e) {
            System.out.println(e.getMessage());
        }
    }
}
```

**Output:**

```text
kavin@example.com
Rs 121.49
invalid email: not-an-email
```

Validation lives in one place, invalid values cannot exist, and `register(Phone, Email)` cannot be called with the arguments swapped.

## Data Clumps → Parameter Object

**Bad code**

```java
long price(String hotelId, java.time.LocalDate checkIn, java.time.LocalDate checkOut, int adults, int children) { return 0; }
boolean available(String hotelId, java.time.LocalDate checkIn, java.time.LocalDate checkOut, int adults, int children) { return false; }
```

**Problem:** `checkIn`/`checkOut` and `adults`/`children` always travel together; each method re-validates them (is checkout after check-in?), and calls are error-prone.

**Better design**

```java
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

record Stay(LocalDate checkIn, LocalDate checkOut) {
    Stay {
        if (!checkOut.isAfter(checkIn)) {
            throw new IllegalArgumentException("check-out must be after check-in");
        }
    }

    long nights() {
        return ChronoUnit.DAYS.between(checkIn, checkOut);
    }
}

record Occupancy(int adults, int children) {
    Occupancy {
        if (adults < 1 || children < 0) {
            throw new IllegalArgumentException("invalid occupancy");
        }
    }
}
```

Now `price(String hotelId, Stay stay, Occupancy occupancy)` — and behaviour such as `nights()` has a natural home.

## Switch-Heavy Design → Replace Conditional with Polymorphism

**Bad code**

```java
class Employee {
    String type;            // "MANAGER", "ENGINEER", "INTERN"
    long baseSalary;

    long bonus() {
        switch (type) {
            case "MANAGER": return baseSalary / 5;
            case "ENGINEER": return baseSalary / 10;
            default: return 0;
        }
    }

    int leaveDays() {
        switch (type) {
            case "MANAGER": return 30;
            case "ENGINEER": return 24;
            default: return 12;
        }
    }
}
```

**Problem:** every new employee type means finding and editing every `switch` (Shotgun Surgery, OCP violation); a typo in `type` compiles.

**Refactoring:** Replace Type Code with an enum (or classes), then move each branch into the type.

**Better design**

```java
enum EmployeeType {
    MANAGER(5, 30), ENGINEER(10, 24), INTERN(0, 12);

    private final int bonusDivisor;       // 0 means no bonus
    private final int leaveDays;

    EmployeeType(int bonusDivisor, int leaveDays) {
        this.bonusDivisor = bonusDivisor;
        this.leaveDays = leaveDays;
    }

    long bonus(long baseSalary) {
        return bonusDivisor == 0 ? 0 : baseSalary / bonusDivisor;
    }

    int leaveDays() {
        return leaveDays;
    }
}
```

When the variants differ in **behaviour**, not just numbers, use an interface with one class per variant ([Strategy](../../design-patterns/strategy-pattern/content.md)); when behaviour depends on a changing status, use [State](../../design-patterns/state-pattern/content.md).

## Refused Bequest → Replace Inheritance with Delegation

**Bad code:** `class AuditTrail extends ArrayList<String>` that overrides `remove`, `set` and `clear` to throw, because audit entries must never change.

**Problem:** callers see a full `List` API, most of which fails at runtime (LSP violation); the class is coupled to `ArrayList` internals.

**Better design**

```java
import java.util.ArrayList;
import java.util.List;

final class AuditTrail {
    private final List<String> entries = new ArrayList<>();   // delegate, do not inherit

    void record(String entry) {
        entries.add(entry);
    }

    List<String> entries() {
        return List.copyOf(entries);
    }
}
```

The class exposes only the two operations it supports. See [Composition over Inheritance](../../relationships/composition-over-inheritance/content.md).

## God Class, Shotgun Surgery and Divergent Change Together

A typical legacy `OrderManager` shows all three: it handles pricing, payments, emails and persistence (**God Class**), changes for every team's requests (**Divergent Change**), and yet adding a new tax rule still needs edits in `OrderManager`, `InvoicePrinter` and `ReportJob` because tax code was copied (**Shotgun Surgery**). The cure is the same: identify responsibilities, **Extract Class** for each, **Move Method** so each rule lives once with the data it uses, and connect the pieces through interfaces.

## Real-World Examples

- IDE refactorings (Rename, Extract Method, Move, Change Signature, Introduce Parameter Object) are used daily in professional Java work.
- Static analysis tools report smells such as long methods, duplicated blocks, complex conditionals and large classes; developers decide the refactoring.
- Value objects for `Money`, `Email` and ids are a common outcome of refactoring backend code.

## Common Misconceptions

- **"A smell is a bug."** It is a design warning; the code may work perfectly.
- **"Refactoring means rewriting."** It is many small behaviour-preserving steps.
- **"Every smell must be removed."** Some code is stable and rarely touched; refactor where change happens.
- **"Refactoring without tests is fine if you are careful."** Tests (or at least characterization tests) are what make refactoring safe.

## Key Takeaways

- Smells signal design problems: god classes, long methods/parameter lists, feature envy, shotgun surgery, divergent change, primitive obsession, data clumps, refused bequest, switch-heavy code, duplication, tight coupling, low cohesion.
- Refactoring changes structure without changing behaviour, in small tested steps.
- Key moves: Extract Method/Class, Move Method, Introduce Parameter Object, Replace Primitive with Value Object, Replace Conditional with Polymorphism, Replace Inheritance with Delegation.
- Refactor where the code changes; leave stable, rarely-touched code alone.
