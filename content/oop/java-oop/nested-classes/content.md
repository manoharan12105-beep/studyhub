# Nested Classes

## Definition

A **nested class** is a class declared inside another class (or inside a method or expression). Java has four kinds:

| Kind | Declared | Needs an instance of the outer class? |
|------|----------|----------------------------------------|
| **Static nested class** | As a `static` member of a class | No |
| **Inner class** (non-static member class) | As a non-static member of a class | Yes — each inner object is tied to an outer object |
| **Local class** | Inside a method or block, with a name | Tied to the enclosing method call (and the outer object, if in an instance method) |
| **Anonymous class** | Inside an expression, without a name | Same as a local class |

Inner, local and anonymous classes are collectively called **inner classes** in the language specification.

## Why It Matters

- Nested classes keep helper types **next to the only code that uses them** and can access the outer class's private members — stronger encapsulation than a separate top-level class.
- They are the standard shape of builders (`Pizza.Builder`), linked-structure nodes (`LinkedList.Node`), map entries (`Map.Entry`) and iterators.
- Interviews ask about the four kinds, how to instantiate each, `Outer.this`, captured variables, lambdas vs anonymous classes, and memory leaks from inner classes.

## Static Nested Classes

A **static nested class** behaves like a top-level class that happens to live inside another class's namespace. It has **no** reference to an outer instance, so it cannot use the outer class's instance members directly — but it **can** access the outer class's `private` static members, and private instance members through an outer object.

```java
public class StaticNestedDemo {

    static class Pizza {
        private final String size;
        private final boolean cheese;

        private Pizza(Builder builder) {               // only the builder can create pizzas
            this.size = builder.size;
            this.cheese = builder.cheese;
        }

        @Override
        public String toString() {
            return size + (cheese ? " with cheese" : " plain");
        }

        static class Builder {                         // static nested: no Pizza instance needed
            private String size = "medium";
            private boolean cheese;

            Builder size(String size) {
                this.size = size;
                return this;
            }

            Builder cheese() {
                this.cheese = true;
                return this;
            }

            Pizza build() {
                return new Pizza(this);                // can call Pizza's private constructor
            }
        }
    }

    public static void main(String[] args) {
        Pizza pizza = new Pizza.Builder().size("large").cheese().build();
        System.out.println(pizza);
    }
}
```

**Output:**

```text
large with cheese
```

Use a static nested class whenever the nested type **does not need** an outer instance. It is the default choice.

## Inner Classes

An **inner class** (non-static member class) object is always associated with an **instance of the outer class**. It can access all of that outer object's members, including private ones.

```java
import java.util.Iterator;
import java.util.NoSuchElementException;

public class InnerClassDemo {

    static class Countdown implements Iterable<Integer> {
        private final int start;

        Countdown(int start) {
            this.start = start;
        }

        @Override
        public Iterator<Integer> iterator() {
            return new CountdownIterator();            // implicitly this.new CountdownIterator()
        }

        private class CountdownIterator implements Iterator<Integer> {   // inner class
            private int current = start;               // reads the OUTER object's field

            @Override
            public boolean hasNext() {
                return current > 0;
            }

            @Override
            public Integer next() {
                if (!hasNext()) {
                    throw new NoSuchElementException();
                }
                return current--;
            }
        }
    }

    public static void main(String[] args) {
        for (int n : new Countdown(3)) {
            System.out.print(n + " ");
        }
        System.out.println("liftoff");
    }
}
```

**Output:**

```text
3 2 1 liftoff
```

### Creating an inner object from outside

```java
Outer outer = new Outer();
Outer.Inner inner = outer.new Inner();     // needs an outer instance
```

### `Outer.this`

Inside an inner class, `this` is the inner object. The enclosing outer object is `Outer.this` — needed when names are shadowed:

```java
public class ShadowingDemo {

    private String name = "outer";

    class Inner {
        private String name = "inner";

        void show(String name) {
            System.out.println(name);                       // parameter
            System.out.println(this.name);                  // inner field
            System.out.println(ShadowingDemo.this.name);    // outer field
        }
    }

    public static void main(String[] args) {
        ShadowingDemo outer = new ShadowingDemo();
        ShadowingDemo.Inner inner = outer.new Inner();
        inner.show("parameter");
    }
}
```

**Output:**

```text
parameter
inner
outer
```

### Memory consideration

Every inner-class object holds a hidden reference to its outer object. If the inner object lives long (registered as a listener, stored in a cache, submitted to a thread pool), it keeps the **whole outer object** reachable — a common memory leak. If the nested class does not use the outer instance, make it `static`.

(Before Java 16, inner classes could not declare `static` members other than constants; Java 16 removed that restriction.)

## Local Classes

A **local class** is declared inside a method body. It is visible only in that block and can use the method's **final or effectively final** local variables and parameters.

```java
static List<String> validate(List<String> emails, int maxLength) {
    class EmailCheck {                           // local class: used only in this method
        boolean ok(String email) {
            return email.contains("@") && email.length() <= maxLength;   // captures maxLength
        }
    }
    EmailCheck check = new EmailCheck();
    List<String> invalid = new ArrayList<>();
    for (String email : emails) {
        if (!check.ok(email)) {
            invalid.add(email);
        }
    }
    return invalid;
}
```

Local classes are uncommon; a private method or a lambda is usually simpler.

## Anonymous Classes

An **anonymous class** is declared and instantiated in a single expression. It either **extends a class** or **implements one interface**, and is used for one-off implementations.

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public class AnonymousClassDemo {

    interface Greeting {
        String greet(String name);
    }

    public static void main(String[] args) {
        Greeting formal = new Greeting() {                  // anonymous class implementing an interface
            private int count = 0;                          // anonymous classes can have state

            @Override
            public String greet(String name) {
                count++;
                return "Good morning, " + name + " (#" + count + ")";
            }
        };
        System.out.println(formal.greet("Ms. Lakshmi"));
        System.out.println(formal.greet("Mr. Raj"));

        List<String> names = new ArrayList<>(List.of("Vimal", "Ali", "Deepa"));
        names.sort(new Comparator<String>() {               // the pre-Java-8 style
            @Override
            public int compare(String a, String b) {
                return Integer.compare(a.length(), b.length());
            }
        });
        System.out.println(names);
    }
}
```

**Output:**

```text
Good morning, Ms. Lakshmi (#1)
Good morning, Mr. Raj (#2)
[Ali, Vimal, Deepa]
```

Rules: no name, so no constructor (use an instance initialiser `{ … }` or pass arguments to the superclass constructor: `new Thread("worker") { … }`); can implement only one interface; can capture effectively final locals.

### Anonymous class vs lambda

| | Anonymous class | Lambda |
|--|-----------------|--------|
| Target | Any class or interface | A **functional interface** only |
| Can have fields / several methods | Yes | No |
| `this` means | The anonymous object | The **enclosing** instance |
| Creates a new class file | Yes (`Outer$1.class`) | No dedicated class file (generated at runtime) |
| Verbosity | High | Low |

Prefer lambdas for functional interfaces (`names.sort(Comparator.comparingInt(String::length))`); use anonymous classes when you need state, several methods, or to extend a class.

## Anonymous Objects

Not a kind of class: an **anonymous object** is an object created without assigning it to a variable — `new Report().print();`. See [Classes and Objects](../../fundamentals/classes-and-objects/content.md#anonymous-objects).

## Comparison

| | Static nested | Inner | Local | Anonymous |
|--|---------------|-------|-------|-----------|
| Outer instance required | No | Yes | If in an instance method | If in an instance method |
| Access outer instance members | Only through a reference | Directly | Directly (in instance methods) | Directly (in instance methods) |
| Capture method locals | — | — | Effectively final only | Effectively final only |
| Has a name | Yes | Yes | Yes (local scope) | No |
| Access modifiers | Any | Any | None | None |
| Instantiation | `new Outer.Nested()` | `outer.new Inner()` | `new Local()` in the block | At declaration |
| Typical use | Builders, nodes, entries, helpers | Iterators, views over the outer object | Rare, method-specific helpers | One-off callbacks with state |

## Real-World Examples

- `Map.Entry` (a static nested interface), `AbstractMap.SimpleEntry` (static nested class).
- `ArrayList`'s iterator is an inner class reading the outer list's array and size.
- `HashMap.Node` is a static nested class.
- Builders: `HttpRequest.newBuilder()` returns a nested builder type.

## Common Misconceptions

- **"Static nested classes cannot access the outer class's private members."** They can (private static members directly; instance members through an object).
- **"An inner class can be created without an outer object."** It cannot; `outer.new Inner()` is required.
- **"Anonymous classes and lambdas are the same."** They differ in `this`, state and what they can implement.
- **"Inner classes are free."** Each instance keeps its outer object alive.

## Key Takeaways

- Four kinds: static nested, inner, local, anonymous.
- Default to **static** nested classes; use inner classes only when the nested object needs its outer instance.
- `Outer.this` reaches the enclosing object from an inner class.
- Local and anonymous classes capture only effectively final locals.
- Prefer lambdas over anonymous classes for functional interfaces.
- Long-lived inner objects can leak their outer objects.
