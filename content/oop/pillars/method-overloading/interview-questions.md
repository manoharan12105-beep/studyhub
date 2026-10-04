# Method Overloading — Interview Questions

## Conceptual

### Q1. What is method overloading?

<details>
<summary>Answer</summary>

Defining multiple methods with the same name but different parameter lists (number, types or order of types). The compiler chooses the method from the static types of the arguments, so it is compile-time polymorphism. Example: `print(int)`, `print(String)`, `print(Object)`.

</details>

### Q2. Can we overload methods by changing only the return type?

<details>
<summary>Answer</summary>

No. The signature used for overloading is the name plus parameter types; the return type is not part of it. Two methods differing only in return type are a duplicate definition (compile-time error). The compiler could not choose between them for a call whose result is ignored.

</details>

### Q3. Can we overload `main`? Can we overload static methods?

<details>
<summary>Answer</summary>

Yes to both. Any number of `main` overloads may exist, but the JVM only launches `public static void main(String[] args)`. Static methods are overloaded exactly like instance methods; what static methods cannot do is be overridden.

</details>

### Q4. How does the compiler pick between overloads when the argument type does not match exactly?

<details>
<summary>Answer</summary>

In three phases: first it looks for methods applicable by exact match or widening (primitive widening like `int → long`, or subclass to superclass), without boxing or varargs; if none, it allows boxing and unboxing; if still none, it allows varargs. Among the applicable methods of the winning phase it picks the most specific one; if none is most specific, the call is ambiguous and does not compile. So widening beats boxing, and boxing beats varargs.

</details>

### Q5. What happens when you call an overloaded method with `null`?

<details>
<summary>Answer</summary>

`null` is compatible with every reference parameter, so all reference overloads are applicable. The compiler picks the most specific one: with `m(Object)` and `m(String)`, `m(String)` is chosen. With `m(String)` and `m(StringBuilder)` — unrelated types — neither is more specific, so `m(null)` is an ambiguous-call compile error. A cast such as `m((String) null)` resolves it.

</details>

### Q6. What is the overload trap with `List<Integer>.remove`?

<details>
<summary>Answer</summary>

`List` has `remove(int index)` and `remove(Object o)`. For `list.remove(1)` the argument is an `int`, which matches `remove(int)` in phase 1 without boxing, so it removes the element at **index** 1. To remove the value 1, call `list.remove(Integer.valueOf(1))`.

</details>

## Applied

### Q7. What does this print?

```java
public class WideningVsBoxing {

    static void show(long x) {
        System.out.println("long " + x);
    }

    static void show(Integer x) {
        System.out.println("Integer " + x);
    }

    static void show(Object x) {
        System.out.println("Object " + x);
    }

    public static void main(String[] args) {
        byte b = 10;
        show(b);
        show(20);
        show(30L);
        show(Integer.valueOf(40));
        show(5.5);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
long 10
long 20
long 30
Integer 40
Object 5.5
```

`byte` and `int` widen to `long` in phase 1, which beats boxing. `30L` matches `long` exactly. An `Integer` matches `Integer` exactly. A `double` cannot widen to `long`, so phase 2 boxes it to `Double`, which matches `Object`.

</details>

### Q8. What does this print? And what happens if you add the call `sum(Integer.valueOf(1), 2);`?

```java
public class VarargsQuestion {

    static void sum(int a, int b) {
        System.out.println("two ints");
    }

    static void sum(int... values) {
        System.out.println("varargs of " + values.length);
    }

    static void sum(Integer a, Integer b) {
        System.out.println("two Integers");
    }

    public static void main(String[] args) {
        sum(1, 2);
        sum(1, 2, 3);
        sum(Integer.valueOf(1), Integer.valueOf(2));
        sum();
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
two ints
varargs of 3
two Integers
varargs of 0
```

`sum(1, 2)` matches exactly in phase 1, so varargs is never considered. Three arguments and zero arguments fit only the varargs method. Two `Integer` arguments match `sum(Integer, Integer)` exactly in phase 1.

Adding `sum(Integer.valueOf(1), 2)` makes the program **fail to compile** ("reference to sum is ambiguous"). Phase 1 finds nothing: `sum(int, int)` would need unboxing and `sum(Integer, Integer)` would need boxing. In phase 2 both become applicable, and neither is more specific — `int` and `Integer` are not subtypes of each other. Lesson: avoid overloads that differ only by primitive vs wrapper types.

</details>

### Q9. What does this print?

```java
class Base {
    void process(Object o) {
        System.out.println("Base.process(Object)");
    }
}

class Derived extends Base {
    void process(String s) {
        System.out.println("Derived.process(String)");
    }
}

public class HierarchyOverload {
    public static void main(String[] args) {
        Base b = new Derived();
        b.process("data");
        ((Derived) b).process("data");
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Base.process(Object)
Derived.process(String)
```

Through a `Base` reference the only candidate is `process(Object)`; `Derived` does not override it (it adds a different overload), so `Base`'s version runs. After the cast, the compiler sees both overloads and picks the more specific `process(String)`.

</details>
