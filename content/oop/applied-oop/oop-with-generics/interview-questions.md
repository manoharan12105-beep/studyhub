# OOP with Generics — Interview Questions

## Conceptual

### Q1. What are generics and why are they used?

<details>
<summary>Answer</summary>

Generics add type parameters to classes, interfaces and methods (`List<E>`, `Map<K, V>`, `<T> T max(...)`). They let one implementation work for many types while the compiler checks that only the right types are used, removing casts and moving `ClassCastException`s from runtime to compile time.

</details>

### Q2. What is the difference between `List<? extends Number>` and `List<? super Integer>`?

<details>
<summary>Answer</summary>

`List<? extends Number>` is a list of some unknown subtype of `Number` (`Integer`, `Double`, …). You can read elements as `Number`, but cannot add anything except `null`, because the exact element type is unknown. `List<? super Integer>` is a list of `Integer` or one of its supertypes (`Number`, `Object`). You can add `Integer`s, but reading gives only `Object`. This is PECS: producers use `extends`, consumers use `super`.

</details>

### Q3. Why is `List<Integer>` not a subtype of `List<Number>`?

<details>
<summary>Answer</summary>

Because it would be unsafe: if a `List<Integer>` could be treated as a `List<Number>`, code could add a `Double` to it, and later reads expecting `Integer` would fail. Generics are therefore invariant. To accept lists of any numeric subtype for reading, use `List<? extends Number>`.

</details>

### Q4. What is type erasure, and what limitations does it cause?

<details>
<summary>Answer</summary>

The compiler enforces generic types and then erases them: type parameters become their bounds (or `Object`) in bytecode, with casts inserted where needed. At runtime `List<String>` and `List<Integer>` are the same class. Limitations: no `new T()` or `new T[]`, no `instanceof List<String>`, no primitive type arguments, no overloads differing only in type arguments, no use of `T` in static members, and no generic exception classes.

</details>

### Q5. What is a bounded type parameter? Give an example.

<details>
<summary>Answer</summary>

A type parameter restricted to a type and its subtypes, written `<T extends Bound>`, which lets the generic code call the bound's methods. Example: `static <T extends Comparable<T>> T max(List<T> items)` can call `compareTo`. Multiple bounds: `<T extends Number & Comparable<T>>`.

</details>

### Q6. When would you make a method generic instead of the whole class?

<details>
<summary>Answer</summary>

When the type parameter matters only for that operation and is not part of the object's state — for example utility methods like `Collections.max` or a converter method `<R> R mapTo(Function<T, R> f)`. Make the class generic when its fields or the types of many methods depend on the parameter (`Box<T>`, `Repository<T, ID>`).

</details>

## Applied

### Q7. Which lines compile?

```java
import java.util.ArrayList;
import java.util.List;

class WildcardQuiz {
    void test() {
        List<? extends Number> producer = new ArrayList<Integer>();
        Number n = producer.get(0);        // line 1
        producer.add(5);                   // line 2

        List<? super Integer> consumer = new ArrayList<Number>();
        consumer.add(5);                   // line 3
        Integer i = consumer.get(0);       // line 4
    }
}
```

<details>
<summary>Answer</summary>

Lines 1 and 3 compile; lines 2 and 4 do not. From an `extends` list you can read as the bound but not add; into a `super` list you can add `Integer`s, but reading yields only `Object`, so assigning to `Integer` needs a cast.

</details>

### Q8. Design a type-safe, generic `Cache` that loads missing values on demand. What would its API look like?

<details>
<summary>Answer</summary>

```java
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

class Cache<K, V> {
    private final Map<K, V> values = new HashMap<>();
    private final Function<? super K, ? extends V> loader;   // PECS: consumes K, produces V

    Cache(Function<? super K, ? extends V> loader) {
        this.loader = loader;
    }

    V get(K key) {
        return values.computeIfAbsent(key, loader);
    }
}
```

Usage: `Cache<String, Integer> lengths = new Cache<>(String::length);`. The wildcards let callers pass a more general loader (for example a `Function<Object, Integer>`). Keys should be immutable, and a production cache would need eviction and thread safety.

</details>
