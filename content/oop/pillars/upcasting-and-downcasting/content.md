# Upcasting and Downcasting

## Definition

**Casting** an object reference changes the **type through which you view an object** — never the object itself.

- **Upcasting:** converting a subclass reference to a superclass (or interface) type — `Animal a = new Dog();`. Implicit and always safe.
- **Downcasting:** converting a superclass reference back to a subclass type — `Dog d = (Dog) a;`. Requires an explicit cast and is **checked at runtime**; if the object is not really of that type, Java throws `ClassCastException`.
- **`instanceof`** tests whether an object is an instance of a type (class, subclass or interface), so a downcast can be made safely.

## Why It Matters

Upcasting is what makes polymorphism usable: collections of `Shape`, parameters of type `PaymentMethod`, return types of `List`. Downcasting is the escape hatch for getting back subclass-specific behaviour — and a frequent source of runtime crashes and design smells. Interviews test both the compile-time rules (which casts compile) and the runtime rules (which casts fail).

## Upcasting

```java
Dog dog = new Dog();
Animal animal = dog;            // implicit upcast: every Dog IS-A Animal
Object object = dog;            // also an upcast
```

After upcasting:

- The **object is unchanged**: it is still a `Dog`, with all its fields.
- The **reference type** limits what you can call: only members declared in `Animal` (or `Object`).
- Overridden methods still run the **`Dog`** versions — that is runtime polymorphism.

Upcasting happens automatically in assignments, method arguments (`feed(dog)` where `feed(Animal a)`), return statements and collections (`List<Animal>.add(dog)`).

## Downcasting

```java
Animal animal = new Dog();
Dog dog = (Dog) animal;         // explicit downcast: compiles, and succeeds at runtime
dog.fetch();                    // subclass-only method is reachable again

Animal other = new Cat();
Dog wrong = (Dog) other;        // compiles, but throws ClassCastException at runtime
```

The compiler allows the second cast because an `Animal` reference *might* point to a `Dog`. Only at runtime does the JVM see that the object is a `Cat`.

## Compile-Time Rules for Casts

The compiler rejects casts that can **never** succeed:

| Cast | Compiles? | Why |
|------|-----------|-----|
| `(Dog) animalRef` | Yes | `Dog` is a subclass of `Animal`; the object might be a `Dog` |
| `(Animal) dogRef` | Yes (redundant) | Upcast |
| `(String) animalRef` | **No** — "incompatible types" | `String` and `Animal` are unrelated classes; no object can be both |
| `(Runnable) animalRef` where `Animal` is not `final` | Yes | Some subclass of `Animal` could implement `Runnable` |
| `(Runnable) stringRef` | **No** | `String` is `final` and does not implement `Runnable` |
| `(Dog) objectRef` | Yes | Every class extends `Object` |

## Runtime Behaviour: `ClassCastException`

At runtime the JVM checks the **actual object**. The cast succeeds if the object is an instance of the target type or of any subtype of it; otherwise `ClassCastException`.

```java
public class CastingAtRuntime {

    static class Animal {
        String sound() {
            return "...";
        }
    }

    static class Dog extends Animal {
        @Override
        String sound() {
            return "Woof";
        }

        String fetch() {
            return "fetching the ball";
        }
    }

    static class Puppy extends Dog {
        @Override
        String sound() {
            return "Yip";
        }
    }

    static class Cat extends Animal {
        @Override
        String sound() {
            return "Meow";
        }
    }

    public static void main(String[] args) {
        Animal[] animals = { new Dog(), new Puppy(), new Cat() };
        for (Animal animal : animals) {
            System.out.print(animal.sound() + " -> ");
            try {
                Dog dog = (Dog) animal;               // works for Dog and Puppy
                System.out.println(dog.fetch());
            } catch (ClassCastException e) {
                System.out.println("not a Dog: ClassCastException");
            }
        }
    }
}
```

**Output:**

```text
Woof -> fetching the ball
Yip -> fetching the ball
Meow -> not a Dog: ClassCastException
```

A `Puppy` can be cast to `Dog` because a `Puppy` IS-A `Dog`.

## `instanceof`

`x instanceof T` is `true` when `x` refers to an object of type `T` or any subtype of `T`.

| Expression | Result |
|------------|--------|
| `new Puppy() instanceof Dog` | `true` |
| `new Dog() instanceof Puppy` | `false` |
| `new Dog() instanceof Object` | `true` |
| `null instanceof Dog` | `false` — never throws |
| `"text" instanceof Integer` | Compile-time error (inconvertible types) |

### Pattern matching for `instanceof` (Java 16+)

The test and the cast can be combined. The **binding variable** (`dog` below) is in scope only where the test is definitely true:

```java
static String describe(Animal animal) {
    if (animal instanceof Dog dog) {             // test + cast + new variable
        return "Dog that is " + dog.fetch();
    }
    if (!(animal instanceof Cat cat)) {
        return "Some other animal";
    }
    return "Cat saying " + cat.sound();          // in scope: the negated test returned early
}
```

It removes the repeated cast, but it does not remove the underlying design question (below).

### `instanceof` vs `getClass()`

| Check | Matches | Typical use |
|-------|---------|-------------|
| `obj instanceof Dog` | `Dog` and every subclass (`Puppy`) | Casting safely; type-based logic |
| `obj.getClass() == Dog.class` | Exactly `Dog` only | Strict equality checks in `equals()` |

The choice matters in `equals()` — see [equals() and hashCode()](../../java-oop/equals-and-hashcode/content.md).

## Casting Never Changes the Object

```java
public class CastDoesNotChangeObject {

    static class Base {
        String who() {
            return "Base";
        }
    }

    static class Derived extends Base {
        @Override
        String who() {
            return "Derived";
        }
    }

    public static void main(String[] args) {
        Derived derived = new Derived();
        Base asBase = (Base) derived;                // upcast
        System.out.println(asBase.who());            // still the Derived implementation
        System.out.println(asBase.getClass().getSimpleName());
        System.out.println(asBase == derived);       // same object
    }
}
```

**Output:**

```text
Derived
Derived
true
```

Contrast with **primitive** casts, which do convert the value: `(int) 3.9` produces a new value `3`.

## Arrays Are Covariant, Generics Are Not

Java arrays are **covariant**: a `Dog[]` is a subtype of `Animal[]`. This allows a mistake the compiler cannot catch, so every array store is checked at runtime:

```java
public class ArrayCovariance {
    public static void main(String[] args) {
        Object[] items = new String[2];              // allowed: String[] is an Object[]
        items[0] = "fine";
        try {
            items[1] = 42;                           // compiles: items is an Object[]
        } catch (ArrayStoreException e) {
            System.out.println("ArrayStoreException: " + e.getMessage());
        }
    }
}
```

**Output:**

```text
ArrayStoreException: java.lang.Integer
```

Generics are **invariant**: `List<Dog>` is **not** a `List<Animal>`, so `List<Animal> animals = dogs;` does not compile. That rule prevents the same mistake at compile time. Wildcards (`List<? extends Animal>`) restore flexibility safely — see [OOP with Generics](../../applied-oop/oop-with-generics/content.md).

## When Downcasting Signals a Design Problem

A chain like this is a smell:

```java
if (payment instanceof UpiPayment upi) {
    upi.sendCollectRequest();
} else if (payment instanceof CardPayment card) {
    card.chargeCard();
}
```

Every new payment type means editing this code. Usually the fix is to move the behaviour into the type hierarchy (`payment.process()`), so callers never need to know the concrete type. Downcasting is legitimate when:

- implementing `equals(Object)`;
- working with APIs that return `Object` (older code, reflection, deserialisation);
- handling a **closed** set of types deliberately, such as `sealed` hierarchies with pattern matching ([Modern Java OOP Features](../../java-oop/modern-java-oop/content.md)).

## Comparison

| | Upcasting | Downcasting |
|--|-----------|-------------|
| Direction | Subclass → superclass/interface | Superclass/interface → subclass |
| Syntax | Implicit | Explicit `(Type)` |
| Safety | Always safe | May throw `ClassCastException` |
| Checked | At compile time | At compile time (possible?) and runtime (actual?) |
| Effect on accessible members | Narrows to the supertype's members | Widens to the subtype's members |
| Effect on object | None | None |

## Real-World Examples

- `List<String> names = new ArrayList<>();` — an upcast to an interface.
- `equals(Object o)` methods downcast after an `instanceof` or `getClass()` check.
- Servlet and framework APIs that return `Object` (`request.getAttribute("user")`) require a cast.
- Exception handling: `catch (IOException e)` receives a `FileNotFoundException` through an upcast reference.

## Common Misconceptions

- **"Casting converts the object into another type."** It changes only the reference's static type.
- **"A successful compile means the cast is safe."** Downcasts are checked again at runtime.
- **"`null instanceof X` throws."** It returns `false`; and casting `null` to any reference type succeeds.
- **"`List<Dog>` can be assigned to `List<Animal>`."** Generics are invariant.
- **"After upcasting, the parent's version of an overridden method runs."** The object's version runs.

## Key Takeaways

- Upcast: implicit and safe; you lose access to subclass-only members, not the object's behaviour.
- Downcast: explicit; compiler checks it is possible, runtime checks it is true (`ClassCastException`).
- Use `instanceof` (with pattern matching in Java 16+) before downcasting.
- Arrays are covariant (runtime `ArrayStoreException`); generics are invariant (compile-time safety).
- Frequent downcasting usually means behaviour belongs in the type hierarchy.
