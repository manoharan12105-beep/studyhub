# Introduction to Object-Oriented Programming

## Definition

**Object-oriented programming (OOP)** organises a program as a set of **objects**. Each object bundles some **state** (data) with the **behaviour** (methods) that is allowed to change or use that state. Objects work together by calling each other's methods, and **classes** describe what each kind of object looks like.

In one interview sentence: *OOP models a system as collaborating objects that each own their data and expose behaviour, so that code is organised around responsibilities instead of around shared data.*

## Why It Matters

Small programs can be written as a list of steps. Large programs change for years, have many developers, and contain hundreds of rules about the same data. Problems that appear at that scale:

- **Shared data, scattered rules.** If every function can read and write a `balance` variable, the rule "balance never goes negative" has to be repeated in every function, and one forgotten check breaks it.
- **Ripple effects.** Changing how data is stored forces changes in every function that touches it.
- **Hard to extend.** Adding a new kind of thing (a new payment type, a new shape) means editing `if/else` chains all over the code.

OOP addresses these by putting the data and the rules that protect it in **one place** (the object), hiding the data behind methods, and letting new kinds of objects plug in without editing old code. These are the ideas behind the four pillars covered in the following topics.

## Procedural vs OOP

**Procedural programming** organises code as procedures (functions) that operate on data passed around or stored globally. **OOP** organises code as objects that own their data.

The same bank-account logic, written both ways:

```java
// OOP style: the object owns its data and its rules
class Account {
    private double balance;                       // only Account's own methods can touch this

    Account(double openingBalance) {
        this.balance = openingBalance;
    }

    void withdraw(double amount) {
        if (amount > balance) {
            System.out.println("OOP: insufficient funds");
            return;
        }
        balance -= amount;
    }

    double getBalance() {
        return balance;
    }
}

public class ProceduralVsOop {

    // Procedural style: data and functions are separate
    static double[] balances = {500.0, 100.0};      // anyone can change these

    static void withdrawProcedural(int accountIndex, double amount) {
        if (amount > balances[accountIndex]) {
            System.out.println("Procedural: insufficient funds");
            return;
        }
        balances[accountIndex] -= amount;
    }

    public static void main(String[] args) {
        withdrawProcedural(1, 300);
        balances[1] = -1000;                         // nothing stops this: the rule is bypassed
        System.out.println("Procedural balance: " + balances[1]);

        Account account = new Account(100);
        account.withdraw(300);
        // account.balance = -1000;                  // does not compile: balance is private to Account
        System.out.println("OOP balance: " + account.getBalance());
    }
}
```

**Output:**

```text
Procedural: insufficient funds
Procedural balance: -1000.0
OOP: insufficient funds
OOP balance: 100.0
```


| Aspect | Procedural | Object-oriented |
|--------|-----------|-----------------|
| Unit of organisation | Function / procedure | Object (data + behaviour) |
| Data | Often shared or passed around freely | Owned and hidden by the object |
| Where rules live | Wherever the data is used | Inside the object that owns the data |
| Adding a new kind of thing | Edit every `switch`/`if` on the kind | Add a new class implementing the same interface |
| Good fit | Scripts, numeric routines, small tools | Large systems with many interacting concepts |

> [!NOTE]
> Neither style is "always better". Java code mixes both: small static helper methods (`Math.max`) are procedural; domain logic (`Account`, `Order`) is usually object-oriented. Modern Java also adds functional features (lambdas, streams) on top.

## Objects: State, Behaviour and Identity

Every object has three properties:

| Property | Meaning | Java example for `Account a = new Account(100)` |
|----------|---------|-----------------------------------------------|
| **State** | The current values of its fields | `balance` is `100.0` |
| **Behaviour** | What it can do — its methods | `withdraw`, `getBalance` |
| **Identity** | What makes it *this* object and not another, even if the state is equal | its own place in memory; `a == b` compares identity |

Two accounts with the same balance have **equal state** but **different identity**: withdrawing from one does not affect the other. The distinction between identity and equality returns in [The Object Class](../../java-oop/java-object-class/content.md) and [equals() and hashCode()](../../java-oop/equals-and-hashcode/content.md).

## Classes

A **class** is the blueprint that says which fields and methods its objects have; an **object** (an *instance*) is one concrete thing built from the blueprint at runtime. One `Account` class, many `Account` objects. Details: [Classes and Objects](../classes-and-objects/content.md).

## Message Passing

Objects interact by **sending messages** — in Java, by calling a method on a reference: `account.withdraw(300)`.

- The **sender** only knows *what* it wants ("withdraw 300").
- The **receiver** decides *how* to do it, using its own state and rules.

This is why OOP code reads as a conversation between objects: `order.place()`, `cart.total()`, `notifier.send(message)`. Because the receiver chooses the behaviour, different receivers can respond differently to the same message — which is **polymorphism**.

## The Four Pillars

| Pillar | One-line meaning | Problem it addresses | Topic |
|--------|------------------|----------------------|-------|
| **Encapsulation** | Keep data and the methods that guard it together; hide the data | Rules bypassed by outside code | [Encapsulation](../../pillars/encapsulation/content.md) |
| **Abstraction** | Expose *what* an object does, hide *how* | Callers depending on details that change | [Abstraction](../../pillars/abstraction/content.md) |
| **Inheritance** | Define a class as a specialised version of another (IS-A) and reuse its members | Duplicated code across related types | [Inheritance](../../pillars/inheritance/content.md) |
| **Polymorphism** | One interface, many implementations; the object's actual type decides the behaviour | `if/else` on types scattered through the code | [Polymorphism](../../pillars/polymorphism/content.md) |

Encapsulation and abstraction are about **hiding** (data and details). Inheritance and polymorphism are about **substituting** one type for another.

## Object Collaboration and Responsibility

Real behaviour usually needs several objects. A good design gives each object a clear **responsibility** — something it *knows* or something it *does* — and lets objects **collaborate** by delegating work to the one that owns the needed data.

Example: printing an order total.

```text
Checkout ──total()──▶ Cart ──for each line──▶ CartLine ──price()──▶ Product
                                          (quantity × product price)
```

- `Product` knows its price.
- `CartLine` knows a product and a quantity, so it computes the line amount.
- `Cart` knows its lines, so it sums them.
- `Checkout` asks the cart for the total; it never reaches into products itself.

Asking "who owns the data needed for this job?" is the core question of object-oriented design. See [Designing Classes from Requirements](../../object-oriented-design/designing-classes/content.md).

## Modelling Real-World Entities

OOP is often introduced as "model the real world". That is a useful starting point, with two caveats:

1. **Model the problem, not reality.** A library system needs `Book`, `Member` and `Loan`. It does not need a `Shelf` class unless shelves matter to the rules. Only the attributes and behaviour the software needs belong in the class.
2. **Some important classes are not physical things.** `Loan`, `Payment`, `Reservation`, `PricingPolicy`, `NotificationService` are concepts, events or roles — and they are often where most of the logic belongs.

A practical heuristic: **nouns** in the requirements are candidate classes, **verbs** are candidate methods, and **"has a" / "is a" phrases** suggest relationships. The heuristic gives a first draft that must then be refined.

## Is Java Purely Object-Oriented?

No. Java is strongly object-oriented, but not *pure*:

- **Primitive types** (`int`, `double`, `boolean`, …) are values, not objects. Wrapper classes (`Integer`) and autoboxing bridge the gap.
- **Static members** belong to the class, not to any object, so you can call `Math.max(1, 2)` without an object.

Everything else — strings, arrays, collections, exceptions, user-defined types — is an object, and every class ultimately extends `java.lang.Object`.

## Real-World Examples

- **Banking:** `Account`, `Customer`, `Transaction`, with rules such as overdraft limits kept inside `Account`.
- **E-commerce:** `Product`, `Cart`, `Order`, `Payment`; different payment methods implement one `PaymentMethod` interface.
- **Java's own libraries:** `ArrayList` and `LinkedList` both implement `List`; your code calls `list.add(x)` without caring which one it has.
- **GUI frameworks:** every button, label and window is an object reacting to messages such as "clicked" or "resize".

## Common Misconceptions

- **"OOP means using classes."** Putting procedural code inside a class with only static methods and public fields is still procedural. OOP is about objects owning data and behaviour.
- **"Inheritance is the main point of OOP."** Encapsulation and polymorphism give most of the value; inheritance is one way to get polymorphism and is often over-used (see [Composition over Inheritance](../../relationships/composition-over-inheritance/content.md)).
- **"An object is a class."** A class is the definition; objects are created from it at runtime.
- **"Every real-world noun must become a class."** Only concepts the software needs to reason about become classes.
- **"OOP code is always slower."** Method calls on objects are heavily optimised by the JVM; design clarity matters far more than this overhead in typical applications.

## Key Takeaways

- An object = state + behaviour + identity. A class is the blueprint for objects.
- OOP keeps data and the rules that protect it together, hiding the data behind methods.
- Objects interact by message passing (method calls); the receiver decides how to respond.
- Four pillars: encapsulation, abstraction, inheritance, polymorphism.
- Good OO design is about giving each object a clear responsibility and letting objects collaborate.
- Java is object-oriented but not pure: primitives and static members are not objects.
