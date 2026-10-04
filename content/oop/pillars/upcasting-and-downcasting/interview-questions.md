# Upcasting and Downcasting — Interview Questions

## Conceptual

### Q1. What is upcasting and downcasting?

<details>
<summary>Answer</summary>

Upcasting is referring to a subclass object through a superclass or interface type (`Animal a = new Dog();`). It is implicit and always safe. Downcasting is converting that reference back to the subclass type (`Dog d = (Dog) a;`). It needs an explicit cast and is verified at runtime — if the object is not actually a `Dog`, a `ClassCastException` is thrown. Neither changes the object; only the reference's type changes.

</details>

### Q2. After upcasting, which version of an overridden method is called?

<details>
<summary>Answer</summary>

The subclass (object's) version. Upcasting restricts which methods you can **call** to those declared in the reference type, but dynamic dispatch still runs the implementation from the object's actual class.

</details>

### Q3. When does a downcast fail at compile time, and when at runtime?

<details>
<summary>Answer</summary>

At compile time when the types can never be related: casting between unrelated classes (`(String) animal`), or casting a `final` class to an interface it does not implement. At runtime when the types are related but the actual object is not an instance of the target type (`Animal a = new Cat(); (Dog) a`) — `ClassCastException`.

</details>

### Q4. What does `instanceof` return for `null`?

<details>
<summary>Answer</summary>

`false`, without throwing. That is why `if (obj instanceof Dog d)` is also a null check. Casting `null` (`(Dog) null`) is allowed and yields `null`.

</details>

### Q5. What is pattern matching for `instanceof`?

<details>
<summary>Answer</summary>

A Java 16 feature: `if (obj instanceof Dog dog) { dog.fetch(); }` tests the type and, if it matches, declares a variable of that type already cast. The variable is in scope only where the match is guaranteed (including after a negated test that returns early). It removes the redundant cast and the risk of casting to the wrong type.

</details>

### Q6. Why are arrays covariant but generics invariant?

<details>
<summary>Answer</summary>

Arrays were designed covariant (`String[]` is an `Object[]`) before generics existed; to stay type-safe, the JVM checks every array store at runtime and throws `ArrayStoreException` on a wrong type. Generics are erased at runtime, so such a runtime check is impossible; instead, `List<String>` is not a `List<Object>` at compile time, catching the error before running. Wildcards (`? extends`, `? super`) provide controlled flexibility.

</details>

## Applied

### Q7. What does this print?

```java
class Parent {
    String name() {
        return "parent";
    }
}

class Child extends Parent {
    @Override
    String name() {
        return "child";
    }
}

public class CastQuestion {
    public static void main(String[] args) {
        Object o = new Child();
        Parent p = (Parent) o;
        System.out.println(p.name());
        System.out.println(o instanceof Parent);
        System.out.println(o instanceof Child);
        Object s = "text";
        try {
            Parent bad = (Parent) s;
            System.out.println(bad.name());
        } catch (ClassCastException e) {
            System.out.println("ClassCastException");
        }
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
child
true
true
ClassCastException
```

`p` refers to a `Child`, so `child` prints. A `Child` is an instance of both `Parent` and `Child`. The cast of a `String` to `Parent` compiles (the static type is `Object`) but fails at runtime.

</details>

### Q8. Your code has `if (shape instanceof Circle) ... else if (shape instanceof Square) ...` in several places. What would you suggest?

<details>
<summary>Answer</summary>

Move the type-specific behaviour into the types: declare the operation (for example `area()` or `draw()`) in `Shape` and override it in each subclass, then call `shape.area()`. This removes the casts, puts each shape's logic in one class, and makes adding a shape a one-class change. If the set of shapes is deliberately fixed and the operation does not belong in the shapes, a `sealed` hierarchy with pattern matching (or the Visitor pattern) gives compiler-checked exhaustiveness.

</details>
