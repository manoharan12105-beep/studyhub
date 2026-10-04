# The Object Class — Interview Questions

## Conceptual

### Q1. What is the `Object` class? Name its important methods.

<details>
<summary>Answer</summary>

`java.lang.Object` is the superclass of every class; a class with no `extends` clause extends it implicitly, and arrays are objects too. Its methods: `equals`, `hashCode`, `toString`, `getClass`, `clone`, `finalize` (deprecated), and the monitor methods `wait`, `notify`, `notifyAll`. `getClass`, `wait`, `notify` and `notifyAll` are `final`; `clone` and `finalize` are `protected`.

</details>

### Q2. What is the difference between `==` and `equals()`?

<details>
<summary>Answer</summary>

`==` compares primitive values, or for references, whether both point to the same object (identity). `equals()` compares logical equality as defined by the class; `Object`'s default implementation is identity, so it behaves like `==` unless overridden. `String`, wrappers, collections and records override it to compare contents. Use `equals` (or `Objects.equals` when either side may be `null`) for value comparison.

</details>

### Q3. What does the default `toString()` return?

<details>
<summary>Answer</summary>

The fully qualified class name, `@`, and the object's hash code in hexadecimal — for example `com.shop.Order@1b6d3586`. It is meant to be overridden with a readable representation of the object's state.

</details>

### Q4. Why does `new Integer`-free code like `Integer a = 1000, b = 1000; a == b` print `false`, while the same with `100` prints `true`?

<details>
<summary>Answer</summary>

Autoboxing calls `Integer.valueOf`, which returns cached objects for −128 to 127 (by default). For 100 both variables reference the same cached object, so `==` (identity) is `true`. For 1000 two distinct objects are created, so `==` is `false`. `a.equals(b)` is `true` in both cases. Never compare wrapper objects with `==`.

</details>

### Q5. What is the difference between a shallow copy and a deep copy?

<details>
<summary>Answer</summary>

A shallow copy duplicates the object's fields, so reference fields in the copy point to the same objects as the original; mutating a shared part shows up in both. A deep copy also copies the referenced mutable objects (recursively as needed), so the copy is independent. `Object.clone()` is shallow; deep copies must be written explicitly, preferably with a copy constructor.

</details>

### Q6. Why is `clone()` considered problematic?

<details>
<summary>Answer</summary>

It depends on the `Cloneable` marker interface (which declares no `clone` method), is `protected` in `Object`, throws a checked `CloneNotSupportedException`, creates objects without running constructors (skipping validation), produces shallow copies by default, and conflicts with `final` fields that would need deep copying. Copy constructors or static factory methods are clearer and safer.

</details>

### Q7. What is the difference between `getClass()` and `instanceof`?

<details>
<summary>Answer</summary>

`obj.getClass()` returns the exact runtime class, so `obj.getClass() == Animal.class` is `false` for a `Dog`. `obj instanceof Animal` is `true` for `Animal` and all its subclasses, and `false` for `null`. In `equals`, `getClass()` makes subclass instances never equal to parent instances; `instanceof` allows subclass instances to be equal if they do not add state to the comparison.

</details>

## Applied

### Q8. What does this print?

```java
public class StringCompare {
    public static void main(String[] args) {
        String s1 = "java";
        String s2 = new String("java");
        String s3 = s2.intern();
        final String prefix = "ja";
        String s4 = prefix + "va";
        System.out.println((s1 == s2) + " " + (s1 == s3) + " " + (s1 == s4) + " " + s1.equals(s2));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
false true true true
```

`s2` is a new object. `intern()` returns the pooled instance, which is `s1`. `prefix` is a `final` local initialised with a constant, so `prefix + "va"` is a compile-time constant expression, folded to `"java"` and taken from the pool. `equals` compares contents.

</details>

### Q9. What does this print?

```java
public class ToStringCycle {

    static class Node {
        String name;
        Node next;

        Node(String name) {
            this.name = name;
        }

        @Override
        public String toString() {
            return name + "->" + (next == null ? "end" : next.name);
        }
    }

    public static void main(String[] args) {
        Node a = new Node("A");
        Node b = new Node("B");
        a.next = b;
        b.next = a;
        System.out.println(a + " | " + b);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
A->B | B->A
```

`toString` prints only the next node's **name**, not the next node itself, so the cycle does not cause recursion. Had it been `name + "->" + next`, printing `a` would call `b.toString()`, which calls `a.toString()`, and so on until `StackOverflowError`.

</details>
