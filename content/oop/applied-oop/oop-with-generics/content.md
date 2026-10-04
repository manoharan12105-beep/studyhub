# OOP with Generics

## Definition

**Generics** let classes, interfaces and methods take **type parameters** (`<T>`), so one piece of code works with many types while the compiler still checks types. `List<String>` is a list that the compiler knows contains only strings. In OOP terms, generics are **parametric polymorphism**: the same code, written once, used safely with different types — alongside the subtype polymorphism of inheritance and interfaces.

## Why It Matters

- **Type safety:** errors move from runtime (`ClassCastException`) to compile time.
- **Reuse without casts:** a `Repository<T, ID>` or `Cache<K, V>` is written once for every entity or value type.
- **Expressive APIs:** bounded types and wildcards say exactly what a method accepts (`max` of anything comparable, `addAll` from any compatible source).
- Interview topics: generic class vs method, bounded types, `? extends` vs `? super`, PECS, why `List<Dog>` is not a `List<Animal>`, type erasure.

## Before Generics

```java
List items = new ArrayList();          // raw type: holds Object
items.add("pen");
items.add(42);                         // nothing stops this
String first = (String) items.get(1);  // compiles, ClassCastException at runtime
```

With `List<String>`, `items.add(42)` does not compile and `items.get(0)` needs no cast. Raw types still exist for backward compatibility; never use them in new code.

## Generic Classes

```java
public class GenericClassDemo {

    static final class Pair<A, B> {                    // two type parameters
        private final A first;
        private final B second;

        Pair(A first, B second) {
            this.first = first;
            this.second = second;
        }

        A first() {
            return first;
        }

        B second() {
            return second;
        }

        <C> Pair<A, C> withSecond(C newSecond) {       // generic method inside a generic class
            return new Pair<>(first, newSecond);
        }

        @Override
        public String toString() {
            return "(" + first + ", " + second + ")";
        }
    }

    public static void main(String[] args) {
        Pair<String, Integer> stock = new Pair<>("Notebook", 40);     // diamond <> infers types
        String name = stock.first();                                    // no cast needed
        int count = stock.second();                                     // auto-unboxing
        Pair<String, Boolean> flagged = stock.withSecond(count < 50);
        System.out.println(stock + " " + flagged + " " + name.length());
    }
}
```

**Output:**

```text
(Notebook, 40) (Notebook, true) 8
```

Conventional names: `T` (type), `E` (element), `K`/`V` (key/value), `R` (result), `ID`, `S`/`U` (more types).

## Generic Interfaces

A generic interface defines a contract parameterised by type; implementations fix or keep the parameter.

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class GenericInterfaceDemo {

    interface Repository<T, ID> {
        void save(ID id, T entity);
        Optional<T> findById(ID id);
        List<T> findAll();
    }

    static class InMemoryRepository<T, ID> implements Repository<T, ID> {   // stays generic
        private final Map<ID, T> store = new HashMap<>();

        public void save(ID id, T entity) {
            store.put(id, entity);
        }

        public Optional<T> findById(ID id) {
            return Optional.ofNullable(store.get(id));
        }

        public List<T> findAll() {
            return new ArrayList<>(store.values());
        }
    }

    record Customer(String name) { }

    static class CustomerRepository extends InMemoryRepository<Customer, Integer> { }   // fixes the types

    public static void main(String[] args) {
        Repository<Customer, Integer> customers = new CustomerRepository();
        customers.save(1, new Customer("Gowri"));
        customers.save(2, new Customer("Imran"));
        System.out.println(customers.findById(2).map(Customer::name).orElse("none"));
        System.out.println(customers.findById(9).isPresent());
        System.out.println(customers.findAll().size());
    }
}
```

**Output:**

```text
Imran
false
2
```

This is the shape of Spring Data's `CrudRepository<T, ID>`: one generic contract, many entity types.

## Generic Methods

A **generic method** declares its own type parameters before the return type. The compiler usually **infers** them from the arguments.

```java
static <T> T firstOrDefault(List<T> items, T fallback) {
    return items.isEmpty() ? fallback : items.get(0);
}

static <K, V> Map<V, K> invert(Map<K, V> map) {
    Map<V, K> result = new HashMap<>();
    for (Map.Entry<K, V> entry : map.entrySet()) {
        result.put(entry.getValue(), entry.getKey());
    }
    return result;
}
```

Use a generic method when only one operation needs to be generic (utility methods like `Collections.max`, `List.of`, `Optional.of`); make the whole class generic when the type parameter describes the object's state.

## Bounded Type Parameters

An **upper bound** restricts `T` to a type and its subtypes, which lets the code call that type's methods:

```java
import java.util.List;

public class BoundedTypes {

    static <T extends Comparable<T>> T maxOf(List<T> items) {     // T must be comparable to itself
        T best = items.get(0);
        for (T item : items) {
            if (item.compareTo(best) > 0) {
                best = item;
            }
        }
        return best;
    }

    static <N extends Number> double total(List<N> numbers) {    // can call Number methods
        double sum = 0;
        for (N n : numbers) {
            sum += n.doubleValue();
        }
        return sum;
    }

    public static void main(String[] args) {
        System.out.println(maxOf(List.of("pear", "apple", "mango")));
        System.out.println(maxOf(List.of(4, 19, 7)));
        System.out.println(total(List.of(1, 2.5, 3L)));
    }
}
```

**Output:**

```text
pear
19
6.5
```

- Multiple bounds: `<T extends Number & Comparable<T>>` — at most one class, which must come first, then interfaces.
- `extends` is used for both classes and interfaces in bounds.

## Wildcards

A **wildcard** `?` stands for "some unknown type" in a **use** of a generic type (parameters, fields, variables), not in a declaration.

| Wildcard | Accepts | You can read as | You can add |
|----------|---------|-----------------|-------------|
| `List<?>` | A list of any type | `Object` | Only `null` |
| `List<? extends Number>` (**upper bound**) | `List<Number>`, `List<Integer>`, `List<Double>`, … | `Number` | Nothing (except `null`) |
| `List<? super Integer>` (**lower bound**) | `List<Integer>`, `List<Number>`, `List<Object>` | `Object` | `Integer` (and subtypes) |

Why can't you add to `List<? extends Number>`? It might really be a `List<Double>`; adding an `Integer` would corrupt it. Why can you add an `Integer` to `List<? super Integer>`? Whatever the real type is, it is `Integer` or a supertype, so an `Integer` fits.

## PECS: Producer Extends, Consumer Super

**PECS** is the rule for choosing a wildcard on a parameter:

- If the parameter **produces** values you read → `? extends T`.
- If the parameter **consumes** values you write into it → `? super T`.
- If it does both → plain `T`.

```java
import java.util.ArrayList;
import java.util.List;

public class PecsDemo {

    // source produces Ts (read) → extends; target consumes Ts (write) → super
    static <T> void copyAll(List<? extends T> source, List<? super T> target) {
        for (T item : source) {
            target.add(item);
        }
    }

    static double sum(List<? extends Number> numbers) {       // producer
        double total = 0;
        for (Number n : numbers) {
            total += n.doubleValue();
        }
        return total;
    }

    static void addDefaults(List<? super Integer> sink) {     // consumer
        sink.add(0);
        sink.add(100);
    }

    public static void main(String[] args) {
        List<Integer> ints = List.of(1, 2, 3);
        List<Number> numbers = new ArrayList<>();
        copyAll(ints, numbers);                               // Integer → Number list
        addDefaults(numbers);                                 // Integers into a List<Number>
        List<Object> objects = new ArrayList<>();
        addDefaults(objects);                                 // also fine: Object is a supertype
        System.out.println(numbers + " sum=" + sum(numbers) + " " + objects);
    }
}
```

**Output:**

```text
[1, 2, 3, 0, 100] sum=106.0 [0, 100]
```

JDK examples: `Collections.copy(List<? super T> dest, List<? extends T> src)`, `Collection.addAll(Collection<? extends E>)`, `Collections.max(Collection<? extends T>, Comparator<? super T>)`.

## Generics and Inheritance

Generic types are **invariant**: even though `Integer` is a subtype of `Number`, `List<Integer>` is **not** a subtype of `List<Number>`.

```java
List<Integer> ints = new ArrayList<>();
List<Number> nums = ints;              // compile-time error: incompatible types
```

If it were allowed, `nums.add(3.14)` would put a `Double` into a list of `Integer`s. Arrays allow this (and fail at runtime with `ArrayStoreException`); generics forbid it at compile time.

What **is** a subtype relationship:

| Relationship | Subtype? |
|--------------|----------|
| `ArrayList<String>` → `List<String>` → `Collection<String>` | Yes (same type argument, class hierarchy) |
| `List<Integer>` → `List<Number>` | No |
| `List<Integer>` → `List<? extends Number>` | Yes |
| `List<Number>` → `List<? super Integer>` | Yes |
| Any `List<X>` → `List<?>` | Yes |

Subclassing generic types: `class IntBox extends Box<Integer>` fixes the parameter; `class SortedBox<T extends Comparable<T>> extends Box<T>` keeps it (possibly with a tighter bound).

## Type Erasure (Awareness)

Generics are implemented by **erasure**: the compiler checks types, then replaces type parameters with their bounds (or `Object`) and inserts casts. At runtime, `List<String>` and `List<Integer>` are both just `List`.

Consequences:

| Not allowed / surprising | Reason |
|--------------------------|--------|
| `new T()`, `new T[10]` | The runtime does not know what `T` is (pass a `Supplier<T>` or `Class<T>` instead) |
| `obj instanceof List<String>` | Type arguments do not exist at runtime (`instanceof List<?>` is fine) |
| `List<int>` | Type arguments must be reference types; use `List<Integer>` |
| Overloads `m(List<String>)` and `m(List<Integer>)` | Same erasure → "name clash" compile error |
| `static T field;` in a generic class | Static members are shared by all parameterisations, so `T` is meaningless there |
| `catch (MyException<T> e)` / generic exception classes | Not allowed: the catch type must be known at runtime |

## Generics and OOP Design

- **Generic interfaces + implementations:** `Repository<T, ID>`, `Converter<S, T>`, `Validator<T>` — one abstraction, many types (Dependency Inversion with type safety).
- **Strategy with generics:** `Comparator<T>`, `Predicate<T>`, `Function<T, R>` are generic strategy interfaces.
- **Bounded types encode requirements:** `<T extends Comparable<T>>` says "I need to compare these" in the signature instead of a comment.
- **Builders and fluent APIs** use generic return types to keep chaining type-safe.
- **Do not over-generify:** a `Processor<A, B, C, D>` nobody can read is worse than two concrete classes.

## Real-World Examples

- Collections: `List<E>`, `Map<K, V>`, `Optional<T>`, `Stream<T>`.
- Spring: `ResponseEntity<T>`, `JpaRepository<T, ID>`.
- `Comparable<T>` lets `String` declare it is comparable only to `String`.

## Common Misconceptions

- **"`List<Integer>` is a `List<Number>`."** Generics are invariant; use `List<? extends Number>`.
- **"You can add numbers to `List<? extends Number>`."** You can only read from it.
- **"Generics exist at runtime."** They are erased (except in some metadata, such as declared field and method signatures, visible to reflection).
- **"`<T extends X>` only works for classes."** It works for interfaces too.
- **"Raw types are the same as `List<Object>`."** A raw `List` switches off generic type checking (you only get "unchecked" warnings). `List<Object>` is fully checked: it accepts any object, but a `List<String>` cannot be assigned to it.

## Key Takeaways

- Generic classes, interfaces and methods give type-safe reuse without casts.
- Bounds (`T extends X`) let you call `X`'s methods; multiple bounds with `&`.
- Wildcards: `?` unknown, `? extends T` read (producer), `? super T` write (consumer) — PECS.
- Generics are invariant; arrays are covariant.
- Erasure: no `new T()`, no `instanceof List<String>`, no primitive type arguments, no overloads with the same erasure.
