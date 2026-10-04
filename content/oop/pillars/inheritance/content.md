# Inheritance

## Definition

**Inheritance** lets a class (the **subclass**, child or derived class) be defined as a specialised version of another class (the **superclass**, parent or base class). The subclass automatically has the superclass's accessible fields and methods, can add new ones, and can **override** inherited methods to change their behaviour. In Java a class inherits with `extends`; it models an **IS-A** relationship.

## Why It Matters

- **Reuse:** common state and behaviour are written once in the superclass.
- **Substitutability:** a `SavingsAccount` can be used wherever an `Account` is expected, which is what makes runtime polymorphism possible.
- **Interview weight:** constructor order, `super`, field hiding vs overriding, why Java has no multiple class inheritance, and "inheritance vs composition" are among the most asked OOP questions.

Inheritance is also the most **misused** OOP feature. Knowing when *not* to use it is part of knowing it.

## `extends` and the IS-A Relationship

```java
public class InheritanceBasics {

    static class Vehicle {
        protected final String registration;
        private int odometerKm;                       // private: not accessible in subclasses

        Vehicle(String registration) {
            this.registration = registration;
        }

        void drive(int km) {
            odometerKm += km;
        }

        int odometerKm() {
            return odometerKm;
        }

        String describe() {
            return "Vehicle " + registration;
        }
    }

    static class Truck extends Vehicle {              // Truck IS-A Vehicle
        private final int capacityTons;

        Truck(String registration, int capacityTons) {
            super(registration);                      // initialise the Vehicle part first
            this.capacityTons = capacityTons;
        }

        @Override
        String describe() {
            return super.describe() + " (truck, " + capacityTons + " t)";   // extend, not replace
        }
    }

    public static void main(String[] args) {
        Truck truck = new Truck("TN-45-AB-1234", 12);
        truck.drive(120);                             // inherited method
        truck.drive(30);
        System.out.println(truck.describe());
        System.out.println("Odometer: " + truck.odometerKm());
    }
}
```

**Output:**

```text
Vehicle TN-45-AB-1234 (truck, 12 t)
Odometer: 150
```

**IS-A test:** "Every `Truck` is a `Vehicle`" — true, and every rule that holds for vehicles must hold for trucks. If the sentence sounds wrong, or only true "sometimes", inheritance is probably the wrong tool (see *Inheritance Pitfalls*).

What a subclass gets:

| Member of the superclass | Inherited? |
|--------------------------|------------|
| `public` and `protected` fields/methods | Yes |
| Package-private members | Yes, only if the subclass is in the same package |
| `private` fields/methods | **Not inherited** (they still exist inside the object and are used through inherited methods, as `odometerKm` is above) |
| Constructors | **Never inherited** |
| Static members | Accessible through the subclass name, but not overridden (they are hidden) |

## Types of Inheritance

```text
 Single            Multilevel             Hierarchical            Multiple (classes)
                                                                  ✗ not allowed in Java
 Vehicle           Vehicle                     Vehicle             Camera     Phone
    ▲                 ▲                     ▲     ▲     ▲              ▲         ▲
    │                 │                     │     │     │              └────┬────┘
  Truck             Truck                 Car   Bike  Truck              SmartPhone
                      ▲
                      │
                  TipperTruck
```

| Type | Meaning | Java |
|------|---------|------|
| **Single** | One class extends one class | `class Truck extends Vehicle` |
| **Multilevel** | A chain: C extends B extends A | `class TipperTruck extends Truck` |
| **Hierarchical** | Several classes extend the same class | `Car`, `Bike`, `Truck` all extend `Vehicle` |
| **Multiple** | One class extends several classes | **Not allowed** for classes; a class may **implement** many interfaces |
| **Hybrid** | A mix of the above | Only possible with interfaces for the "multiple" part |

Every class without an `extends` clause implicitly extends `java.lang.Object`, so all Java class hierarchies form a single tree rooted at `Object`.

## Why Java Does Not Support Multiple Class Inheritance

Suppose `SmartPhone extends Camera, Phone` were allowed and both parents had a `powerOn()` method and a `batteryLevel` field:

```text
            Device
          (powerOn, batteryLevel)
           ▲            ▲
        Camera        Phone          both override powerOn()
           ▲            ▲
           └─ SmartPhone ┘           which powerOn()? one batteryLevel or two?
```

This is the **diamond problem**:

1. **Ambiguous behaviour:** which inherited `powerOn()` should `smartPhone.powerOn()` run?
2. **Ambiguous state:** does a `SmartPhone` contain one copy of `Device`'s fields or two?
3. **Constructor chaining:** which parent constructor runs first, and how many times does `Device()` run?

Java's designers avoided these problems for classes. Multiple inheritance **of type** is still available through interfaces: a class can implement any number of interfaces. Interfaces have no instance fields, so the state question disappears; for `default` methods, Java has explicit conflict rules (the class must override and may call a specific parent with `Camera.super.powerOn()`). Details: [Interfaces](../interfaces/content.md).

## Constructor Execution Order

A subclass constructor always runs a superclass constructor **first** — explicitly with `super(...)` or through the implicit `super()` the compiler inserts. So construction proceeds **top-down**: `Object` → `Vehicle` → `Truck`. Full rules and order with initialiser blocks: [Constructors and Initialization](../../fundamentals/constructors-and-initialization/content.md#initialization-order).

## The `super` Keyword

| Form | Meaning | Rule |
|------|---------|------|
| `super(args)` | Call a constructor of the direct superclass | First statement of a constructor only |
| `super.method(args)` | Call the superclass's version of a method, skipping this class's override | Usable in any instance method/constructor; only one level up (no `super.super`) |
| `super.field` | Access the superclass's field when this class hides it with a same-named field | Rarely needed if fields are private |

`super.method()` is how an override **extends** behaviour instead of copying it — as `Truck.describe()` does above.

## Method Inheritance and Overriding

Inherited methods can be used as-is, or **overridden**: the subclass declares a method with the same signature, and at runtime the object's class decides which version runs.

```java
class Notification {
    String channel() {
        return "generic";
    }
}

class SmsNotification extends Notification {
    @Override
    String channel() {
        return "sms";
    }
}
```

`Notification n = new SmsNotification(); n.channel()` returns `"sms"`. The full rules (return type, access, exceptions, `@Override`) are in [Method Overriding](../method-overriding/content.md).

## Field Hiding

Fields are **not** polymorphic. If a subclass declares a field with the same name as a superclass field, it **hides** it: the object then contains **both** fields, and which one an expression reads is decided by the **reference type** at compile time.

```java
class Parent {
    String name = "parent field";

    String getName() {
        return name;
    }
}

class Child extends Parent {
    String name = "child field";              // hides Parent.name

    @Override
    String getName() {
        return name;
    }
}

public class FieldHiding {
    public static void main(String[] args) {
        Parent ref = new Child();
        System.out.println(ref.name);              // field: reference type Parent decides
        System.out.println(ref.getName());         // method: object type Child decides
        System.out.println(((Child) ref).name);
    }
}
```

**Output:**

```text
parent field
child field
child field
```

Field hiding is legal but confusing; with private fields it never arises in practice.

## Method Hiding

A **static** method in a subclass with the same signature as a static method in the superclass **hides** it — it does not override it. The call is resolved by the reference type at compile time. See [Static Members](../../fundamentals/static-members/content.md#static-methods-are-hidden-not-overridden).

| | Overriding | Hiding |
|--|-----------|--------|
| Applies to | Instance methods | Static methods (and fields) |
| Decided by | Runtime object type | Compile-time reference type |
| Polymorphic | Yes | No |

## `final` Classes and Methods

| Declaration | Effect | Typical reason |
|-------------|--------|----------------|
| `final class Money` | Cannot be extended | Immutable value types (`String`, `Integer`), security-sensitive classes, classes not designed for extension |
| `final void process()` | Cannot be overridden | The algorithm must not change (for example a template method in [Template Method](../../design-patterns/template-method-pattern/content.md)) |
| `final` field | Assigned once | Covered in [Immutability](../../java-oop/immutability/content.md) |

```java
final class Rupee { }
class Paisa extends Rupee { }       // compile-time error: cannot inherit from final Rupee
```

## Protected Members

`protected` exposes a member to subclasses (in any package) and to the same package. Use it for **hooks** that subclasses are meant to call or override, not for fields:

```java
abstract class ReportGenerator {
    public final String generate() {                 // fixed algorithm
        return header() + body();
    }

    protected String header() {                      // hook: subclasses may override
        return "REPORT\n";
    }

    protected abstract String body();                // hook: subclasses must implement
}
```

The cross-package detail (access only through a reference of the subclass's type) is explained in [Encapsulation](../encapsulation/content.md#protected).

## Inheritance and Access Control

- A subclass **cannot reduce** the visibility of an overridden method (`public` in the parent cannot become `protected` in the child) — callers using a parent reference must still be able to call it. It may **widen** it (`protected` → `public`).
- `private` methods are invisible to the subclass, so a same-named method in the subclass is a **new** method, not an override.
- Package-private methods are overridable only by subclasses in the **same package**.

## Inheritance Pitfalls

| Pitfall | What goes wrong |
|---------|-----------------|
| **Inheriting for code reuse only** | `class Stack extends ArrayList` exposes `add(index, x)` and `remove(index)`, letting callers break LIFO order. (`java.util.Stack extends Vector` is a real example of this mistake.) |
| **IS-A that holds only sometimes** | `Square extends Rectangle` breaks code that sets width and height independently — a [Liskov Substitution](../../design-principles/liskov-substitution-principle/content.md) violation. |
| **Deep hierarchies** | Behaviour is spread across five levels; understanding one method means reading all of them. |
| **Subclass explosion** | `WindowsDarkButton`, `WindowsLightButton`, `MacDarkButton`, … — every new dimension multiplies classes. Composition (a button *has* a theme) fixes this. See [Bridge](../../design-patterns/bridge-pattern/content.md). |
| **Overridable methods called from constructors** | The override runs on a half-built object. |
| **Fragile base class** | See below. |

## Fragile Base Class Problem

The **fragile base class problem**: a subclass depends on **implementation details** of its superclass — such as which of its own methods it calls internally — so a seemingly safe change in the superclass silently breaks subclasses.

```java
import java.util.ArrayList;
import java.util.List;

public class FragileBaseClass {

    static class Basket {
        private final List<String> items = new ArrayList<>();

        void add(String item) {
            items.add(item);
        }

        void addAll(List<String> newItems) {
            for (String item : newItems) {
                add(item);                       // implementation detail: reuses add()
            }
        }

        int size() {
            return items.size();
        }
    }

    // Subclass written by another team: count every item ever added
    static class CountingBasket extends Basket {
        private int addedCount = 0;

        @Override
        void add(String item) {
            addedCount++;
            super.add(item);
        }

        @Override
        void addAll(List<String> newItems) {
            addedCount += newItems.size();
            super.addAll(newItems);              // super.addAll calls add(), which is overridden
        }

        int addedCount() {
            return addedCount;
        }
    }

    public static void main(String[] args) {
        CountingBasket basket = new CountingBasket();
        basket.addAll(List.of("rice", "dal", "oil"));
        System.out.println("size = " + basket.size() + ", counted = " + basket.addedCount());
    }
}
```

**Output:**

```text
size = 3, counted = 6
```

Each item is counted twice: once in `addAll` and again in the overridden `add` that `Basket.addAll` calls internally. If the subclass author "fixes" this by removing the count from `addAll`, the code breaks again the day `Basket.addAll` is changed to add items directly without calling `add`. The subclass is coupled to a detail that was never part of `Basket`'s contract.

**Remedies**

- **Composition:** `CountingBasket` *has a* `Basket` and forwards calls to it, counting in its own methods. It no longer depends on how `Basket` implements `addAll`. See [Composition over Inheritance](../../relationships/composition-over-inheritance/content.md) and [Decorator](../../design-patterns/decorator-pattern/content.md).
- **Design for inheritance or prohibit it:** document which methods call which overridable methods, or make the class/methods `final`.

## Composition vs Inheritance

| | Inheritance | Composition |
|--|-------------|-------------|
| Relationship | IS-A | HAS-A |
| Binding | Fixed at compile time | Can change at runtime (swap the part) |
| Coupling | Subclass depends on superclass internals | Depends only on the part's public interface |
| Encapsulation | Weakened (protected members, overridable internals) | Preserved |
| Reuse | All inherited members, wanted or not | Only what you delegate |

Full discussion: [Composition over Inheritance](../../relationships/composition-over-inheritance/content.md).

## When Inheritance Is Appropriate

- A genuine, permanent **IS-A** relationship where the subclass honours **every** behaviour promised by the superclass (Liskov substitution).
- The superclass was **designed for extension**: documented hooks, an abstract base class, or a framework class meant to be subclassed.
- You need **polymorphism** over a family of types that share real implementation (an abstract `Shape` with a shared `describe()`).
- Both classes are under the **same team's control**, so changes are coordinated.

## When Inheritance Should Be Avoided

- Only to **reuse code** — use composition or a helper.
- The relationship is **HAS-A** or **role-based** ("an `Employee` can be a `Manager` this year") — roles change; types do not.
- The subclass would have to **disable** or throw from inherited methods (a refused bequest).
- The superclass is from **another library** and not designed for extension.
- You would need inheritance in **more than one dimension** (platform × theme × size).

## Real-World Examples

- `ArrayList extends AbstractList`, which implements most of `List` in terms of a few abstract methods — designed-for-inheritance base class.
- Exceptions: `FileNotFoundException extends IOException extends Exception` — a clean IS-A hierarchy that lets `catch (IOException e)` handle all I/O errors.
- `java.util.Properties extends Hashtable<Object, Object>` — lets callers put non-`String` values into a properties object, a known design mistake that the documentation warns about.

## Common Misconceptions

- **"Private members are inherited."** They exist in the subclass object but are not inherited (not accessible by name).
- **"Constructors are inherited."** Never.
- **"A subclass field with the same name overrides the parent field."** Fields are hidden, never overridden; the reference type decides.
- **"Java has no multiple inheritance."** It has none for **classes**; it has multiple inheritance of **type** via interfaces.
- **"Inheritance is the best way to reuse code."** Composition is usually safer.
- **"`super.super.method()` reaches the grandparent."** No such syntax exists.

## Key Takeaways

- `extends` creates an IS-A relationship; the subclass gets accessible members and may override methods.
- Single, multilevel and hierarchical inheritance are allowed; multiple class inheritance is not (diamond problem). Interfaces provide multiple inheritance of type.
- Superclass constructors run first; `super(...)`, `super.method()`, `super.field` reach the parent.
- Methods are overridden (runtime); fields and static methods are hidden (compile time).
- `final` stops extension or overriding.
- Inheritance couples subclasses to superclass internals (fragile base class). Prefer composition unless the IS-A relationship is real and the base class was designed for it.
