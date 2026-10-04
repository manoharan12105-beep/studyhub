# Method Overriding

## Definition

**Method overriding** is when a subclass (or a class implementing an interface) provides its own implementation of an inherited **instance** method with the **same signature**. When the method is called on an object, the version from the object's actual class runs — **runtime polymorphism** through dynamic method dispatch.

## Why It Matters

- Overriding is how subclasses **specialise** behaviour while callers keep using the general type.
- The compiler enforces a precise set of rules (return type, access, exceptions, `static`, `final`, `private`). "Is this a valid override?" questions test every one of them.
- Getting a signature slightly wrong silently creates an **overload** instead of an override — one of the most common real bugs, especially with `equals`.

## The Rules of Overriding

A method `m` in subclass `S` overrides method `m` in superclass `P` when all of these hold:

| # | Rule | Violation gives |
|---|------|-----------------|
| 1 | Same **name** and same **parameter types** in the same order | A new overload, not an override (silent unless `@Override` is present) |
| 2 | **Return type**: identical for primitives and `void`; for reference types, the same type **or a subtype** (covariant return) | Compile-time error |
| 3 | **Access**: same or **wider** (`protected` → `public` is fine; `public` → `protected` is not) | Compile-time error |
| 4 | **Checked exceptions**: may throw the same, narrower (subclasses), fewer, or none — but **no new or broader** checked exceptions. Unchecked exceptions are unrestricted. | Compile-time error |
| 5 | The parent method must be an **instance** method that is **visible** to the subclass and **not `final`** | Compile-time error (`final`, static/instance mix) or a new unrelated method (`private`, inaccessible package-private) |

Modifiers such as `synchronized`, `strictfp` and `native` are not part of the contract and may differ. A subclass may even re-declare an inherited concrete method as `abstract` (if the subclass is abstract).

## Basic Example with `@Override` and `super`

```java
public class OverridingBasics {

    static class Account {
        protected long balancePaise;

        Account(long balancePaise) {
            this.balancePaise = balancePaise;
        }

        long monthlyFeePaise() {
            return 5_000;
        }

        String statement() {
            return getClass().getSimpleName() + " fee=" + monthlyFeePaise();
        }
    }

    static class PremiumAccount extends Account {
        PremiumAccount(long balancePaise) {
            super(balancePaise);
        }

        @Override
        long monthlyFeePaise() {
            // reuse the parent's rule and adjust it
            return balancePaise >= 10_000_000 ? 0 : super.monthlyFeePaise() / 2;
        }
    }

    public static void main(String[] args) {
        Account[] accounts = {
            new Account(1_000_000),
            new PremiumAccount(1_000_000),
            new PremiumAccount(20_000_000)
        };
        for (Account account : accounts) {
            System.out.println(account.statement());
        }
    }
}
```

**Output:**

```text
Account fee=5000
PremiumAccount fee=2500
PremiumAccount fee=0
```

### Always use `@Override`

`@Override` asks the compiler to confirm that the method really overrides something. Without it, a typo or wrong parameter type creates a new method and nobody notices:

```java
class Book {
    private final String isbn;

    Book(String isbn) {
        this.isbn = isbn;
    }

    @Override
    public boolean equals(Book other) {     // compile-time error: method does not override a supertype method
        return other != null && isbn.equals(other.isbn);
    }
}
```

Without `@Override` this compiles as an **overload** of `equals`, and `HashSet`, `List.contains` and `Objects.equals` — which call `equals(Object)` — never use it. The correct signature is `public boolean equals(Object o)`.

## Covariant Return Types

Since Java 5, an overriding method may return a **subtype** of the overridden method's return type. Callers using the parent type still get something compatible; callers using the subclass type get a more precise type without casting.

```java
public class CovariantReturn {

    static class Document {
        Document copy() {
            return new Document();
        }

        String kind() {
            return "document";
        }
    }

    static class Invoice extends Document {
        @Override
        Invoice copy() {                     // covariant: Invoice is a subtype of Document
            return new Invoice();
        }

        @Override
        String kind() {
            return "invoice";
        }

        String invoiceNumber() {
            return "INV-42";
        }
    }

    public static void main(String[] args) {
        Invoice original = new Invoice();
        Invoice duplicate = original.copy();          // no cast needed
        System.out.println(duplicate.invoiceNumber());

        Document asDocument = original;
        Document copied = asDocument.copy();          // still dispatches to Invoice.copy()
        System.out.println(copied.kind());
    }
}
```

**Output:**

```text
INV-42
invoice
```

Covariance applies only to **reference** return types. `int` cannot be overridden to `long`, and `void` must stay `void`. JDK example: classes that override `Object.clone()` commonly return their own type.

## Access Modifier Rules

An override may keep or **widen** visibility, never narrow it:

| Parent method | Allowed in the override |
|---------------|-------------------------|
| `public` | `public` |
| `protected` | `protected`, `public` |
| package-private | package-private, `protected`, `public` (subclass must be in the same package to override) |
| `private` | Not overridable — the subclass method is unrelated |

Reason: code holding a parent reference has been promised it can call the method. If a subclass could narrow access, `Parent p = new Child(); p.method()` would break that promise. Interface methods are implicitly `public`, so implementations must be declared `public`.

## Exception Rules

The override must not surprise a caller who handles only the exceptions the parent declares.

```java
import java.io.FileNotFoundException;
import java.io.IOException;

class DataSource {
    String read() throws IOException {
        return "data";
    }
}

class FileSource extends DataSource {
    @Override
    String read() throws FileNotFoundException {   // OK: narrower checked exception
        return "file data";
    }
}

class MemorySource extends DataSource {
    @Override
    String read() {                                // OK: no checked exception at all
        return "memory data";
    }
}

class SafeSource extends DataSource {
    @Override
    String read() throws IllegalStateException {   // OK: unchecked exceptions are unrestricted
        return "safe data";
    }
}
```

Not allowed:

```java
class NetworkSource extends DataSource {
    @Override
    String read() throws Exception {               // compile-time error: Exception is broader than IOException
        return "network data";
    }
}
```

Equally, if the parent method declares **no** checked exceptions, the override cannot add any. Constructors are different: they are not overridden, so a subclass constructor may declare any exceptions, but it must handle or declare whatever the superclass constructor it calls throws.

## What Cannot Be Overridden

| Method kind | What happens if the subclass declares the same signature | Why |
|-------------|-----------------------------------------------------------|-----|
| `final` instance method | Compile-time error | `final` forbids overriding |
| `static` method | **Hides** the parent method (if the subclass method is also static); bound by reference type | Static methods do not take part in dynamic dispatch |
| Instance method overriding a `static` one, or static "overriding" an instance one | Compile-time error | Mixing is forbidden |
| `private` method | New, unrelated method; `@Override` would be an error | Private methods are not visible to subclasses |
| Package-private method, subclass in another package | New, unrelated method | Not visible across packages |
| Constructor | Not applicable | Constructors are not inherited |

### Private methods are not overridden

```java
class Parent {
    private String secret() {
        return "Parent secret";
    }

    String reveal() {
        return secret();                  // statically bound to Parent.secret()
    }
}

class Child extends Parent {
    String secret() {                     // a new method, not an override
        return "Child secret";
    }
}

public class PrivateNotOverridden {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.println(p.reveal());
        System.out.println(new Child().secret());
    }
}
```

**Output:**

```text
Parent secret
Child secret
```

`Parent.reveal()` calls `Parent`'s private method directly; the `Child` method with the same name is invisible to it. If `secret()` in `Parent` were package-private or more visible, the first line would print `Child secret`.

### Static methods are hidden

Covered with examples in [Static Members](../../fundamentals/static-members/content.md#static-methods-are-hidden-not-overridden). Rule of thumb: `Parent p = new Child(); p.staticMethod()` always runs `Parent`'s version.

## `final` Methods

`final` on a method means "this behaviour is part of the class's contract and must not change in subclasses". Uses: template methods whose step order must stay fixed, security-relevant checks, and methods called from constructors. `final` methods can still be **overloaded** and **inherited**; they just cannot be overridden.

## Overriding vs Overloading

| | Overriding | Overloading |
|--|-----------|-------------|
| Parameters | Same | Different |
| Return type | Same or covariant | Free |
| Access | Same or wider | Free |
| Checked exceptions | Same, narrower or fewer | Free |
| Inheritance required | Yes | No |
| `static`/`private`/`final` | Cannot be overridden | Can be overloaded |
| Binding | Runtime (object type) | Compile time (argument static types) |
| `@Override` applies | Yes | No |

## Real-World Examples

- `toString()`, `equals()`, `hashCode()` from `Object` are overridden in almost every value class.
- `Thread.run()`, `Comparable.compareTo()`, `Runnable.run()`, `Comparator.compare()`.
- Frameworks call your overrides: a servlet's `doGet`, JUnit lifecycle methods, an `AbstractList` subclass's `get` and `size`.

## Common Misconceptions

- **"A static method with the same signature overrides."** It hides.
- **"A private method can be overridden."** It is invisible to subclasses; a same-named method is unrelated.
- **"The override may throw any exception."** It cannot add or broaden **checked** exceptions.
- **"The return type must match exactly."** Reference return types may be covariant.
- **"`@Override` is optional, so it does not matter."** It is optional, but it turns silent overload bugs into compile errors.
- **"Overriding happens at compile time because the compiler checks it."** The compiler checks validity; the choice of implementation happens at runtime.

## Key Takeaways

- Override = same signature in a subclass, chosen at runtime by the object type.
- Return type: same or covariant subtype. Access: same or wider. Checked exceptions: same, narrower, fewer or none.
- `final` methods cannot be overridden; `static` methods are hidden; `private` methods are not inherited, so they cannot be overridden.
- Use `super.method()` to extend the parent behaviour.
- Always annotate with `@Override`.
