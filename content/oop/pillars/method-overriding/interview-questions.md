# Method Overriding — Interview Questions

## Conceptual

### Q1. What is method overriding? List its rules.

<details>
<summary>Answer</summary>

Providing a new implementation of an inherited instance method with the same signature in a subclass, so the object's class decides at runtime which version runs. Rules: same name and parameter types; same return type or a subtype (covariant, reference types only); same or wider access; no new or broader checked exceptions; the parent method must be a visible, non-final instance method. Static methods are hidden, private methods are not inherited, constructors are not overridden.

</details>

### Q2. What is a covariant return type?

<details>
<summary>Answer</summary>

An overriding method may declare a return type that is a subclass of the overridden method's return type. Example: `Document copy()` in the parent and `Invoice copy()` in `Invoice extends Document`. It is safe because an `Invoice` is a `Document`, and it saves callers a cast. It applies only to reference types, not primitives.

</details>

### Q3. Why can't an overriding method reduce visibility?

<details>
<summary>Answer</summary>

Because of substitutability. Code that has a parent reference may call the method wherever the parent's access allows. If a subclass made it more restrictive, calling it through the parent reference on a subclass object would violate access rules the compiler already approved. Widening is safe; narrowing is a compile-time error.

</details>

### Q4. What are the exception rules for overriding?

<details>
<summary>Answer</summary>

The overriding method may throw the same checked exceptions, subclasses of them, fewer of them, or none, and any unchecked exceptions. It cannot throw new checked exceptions or broader ones (for example `Exception` when the parent declares `IOException`), because callers written against the parent only handle what the parent declares.

</details>

### Q5. Can we override static methods? Private methods? Final methods?

<details>
<summary>Answer</summary>

- Static: no — a same-signature static method in the subclass hides the parent's; the reference type decides which runs.
- Private: no — they are not visible to subclasses; a same-named subclass method is unrelated and calls inside the parent still go to the parent's private method.
- Final: no — attempting it is a compile-time error.

</details>

### Q6. What is the purpose of `@Override`?

<details>
<summary>Answer</summary>

It tells the compiler that the method is intended to override a supertype method. If it does not (wrong parameter type, typo, static parent method), compilation fails. This catches bugs such as `equals(Book other)`, which would otherwise silently overload `equals(Object)` and be ignored by collections.

</details>

### Q7. Can a constructor be overridden?

<details>
<summary>Answer</summary>

No. Constructors are not inherited, so there is nothing to override. Each class declares its own constructors, which can be overloaded and chained with `this(...)` and `super(...)`.

</details>

## Applied

### Q8. Which overrides compile?

```java
import java.io.IOException;

class Base {
    protected Number value() throws IOException {
        return 1;
    }
}
```

In a subclass of `Base`, which of these compile?

- (a) `public Integer value() { return 2; }`
- (b) `Number value() throws IOException { return 3; }`
- (c) `protected Object value() { return 4; }`
- (d) `protected Number value() throws Exception { return 5; }`

<details>
<summary>Answer</summary>

Only **(a)**.

- (a) wider access, covariant return (`Integer` is a `Number`), no checked exception — valid.
- (b) package-private is narrower than `protected` — error.
- (c) `Object` is not a subtype of `Number` — error.
- (d) `Exception` is broader than `IOException` — error.

</details>

### Q9. What does this print?

```java
class Logger {
    void log(String msg) {
        System.out.println("LOG: " + msg);
    }

    final void logTwice(String msg) {
        log(msg);
        log(msg);
    }
}

class TimestampLogger extends Logger {
    @Override
    void log(String msg) {
        super.log("[t] " + msg);
    }
}

public class FinalCallsOverride {
    public static void main(String[] args) {
        Logger logger = new TimestampLogger();
        logger.logTwice("start");
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
LOG: [t] start
LOG: [t] start
```

`logTwice` is final (cannot be overridden) but it is inherited, and its calls to `log` are dynamically dispatched to `TimestampLogger.log`, which adds the prefix and delegates to `super.log`.

</details>

### Q10. A subclass method `public boolean equals(Employee e)` exists. What is wrong?

<details>
<summary>Answer</summary>

It overloads rather than overrides `Object.equals(Object)`. Collections and `Objects.equals` call `equals(Object)`, which still uses identity, so `list.contains(employee)` and `HashSet` lookups behave as if equality were never defined. Fix: `@Override public boolean equals(Object o)` with a type check, plus a matching `hashCode()`.

</details>
