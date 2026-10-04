# Binding and Method Resolution — Interview Questions

## Conceptual

### Q1. Explain how Java decides which method to call for `ref.m(arg)`.

<details>
<summary>Answer</summary>

Two stages. At compile time, the compiler looks at the declared type of `ref`, collects accessible methods named `m`, picks the applicable overload using the declared type of `arg` (exact/widening, then boxing, then varargs; then the most specific), and records that signature. At run time, if `m` is a static, private or `super` call, exactly that method runs; otherwise the JVM starts at the actual class of the object `ref` points to and walks up the hierarchy to the first method that overrides the recorded signature, falling back to the most specific interface default method.

</details>

### Q2. What is the difference between static binding and dynamic binding? Give examples of each.

<details>
<summary>Answer</summary>

Static binding fixes the target at compile time from declared types: overload selection, static methods, private methods, `super.m()` calls, constructors and field access. Dynamic binding chooses the target at run time from the object's class: calls to overridable instance methods. Example: `Parent p = new Child(); p.staticM()` runs `Parent.staticM()` (static binding) while `p.instanceM()` runs `Child.instanceM()` (dynamic binding).

</details>

### Q3. Why does Java use the argument's declared type rather than its runtime type to pick an overload?

<details>
<summary>Answer</summary>

Overload resolution happens entirely at compile time, when only declared types are known, so the program's meaning is fixed and checkable by the compiler (including ambiguity errors). Java dispatches dynamically only on the receiver (single dispatch). Choosing by runtime types of arguments (multiple dispatch) would need a runtime search on every call; when that behaviour is needed, patterns like Visitor emulate double dispatch.

</details>

### Q4. If a class inherits a method from its superclass and a default method with the same signature from an interface, which runs?

<details>
<summary>Answer</summary>

The class method. Runtime lookup searches the class hierarchy first; interface defaults are used only if no class in the chain provides an implementation. Among defaults, a more specific interface (a sub-interface that overrides the default) wins; unrelated conflicting defaults must be resolved by overriding.

</details>

### Q5. Is `super.method()` dynamically dispatched?

<details>
<summary>Answer</summary>

No. `super.method()` is a non-virtual call to the direct superclass's implementation, chosen at compile time. However, any calls that implementation makes on `this` are ordinary virtual calls and can dispatch back to the subclass's overrides.

</details>

## Applied

### Q6. What does this print?

```java
class Shape {
    String area(Shape s) {
        return "Shape.area(Shape)";
    }
}

class Square extends Shape {
    String area(Square s) {
        return "Square.area(Square)";
    }

    @Override
    String area(Shape s) {
        return "Square.area(Shape)";
    }
}

public class ResolveQuestion {
    public static void main(String[] args) {
        Shape s = new Square();
        Square q = new Square();
        System.out.println(s.area(q));
        System.out.println(q.area(s));
        System.out.println(q.area(q));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Square.area(Shape)
Square.area(Shape)
Square.area(Square)
```

1. Through `Shape`, only `area(Shape)` exists; at run time `Square` overrides it.
2. Through `Square` with a `Shape`-declared argument, only `area(Shape)` applies; `Square`'s override runs.
3. Through `Square` with a `Square` argument, `area(Square)` is most specific.

</details>

### Q7. What does this print?

```java
class Parent {
    static String id() {
        return "P";
    }

    private String secret() {
        return "p-secret";
    }

    String show() {
        return id() + "/" + secret() + "/" + kind();
    }

    String kind() {
        return "parent";
    }
}

class Child extends Parent {
    static String id() {
        return "C";
    }

    String secret() {
        return "c-secret";
    }

    @Override
    String kind() {
        return "child";
    }
}

public class MixedBinding {
    public static void main(String[] args) {
        Parent p = new Child();
        System.out.println(p.show());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
P/p-secret/child
```

Inside `Parent.show()`, `id()` is a static call bound to `Parent.id()`, and `secret()` is a call to `Parent`'s private method (non-virtual). Only `kind()` is a virtual call, dispatched to `Child.kind()`.

</details>
