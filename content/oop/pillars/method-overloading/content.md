# Method Overloading

## Definition

**Method overloading** is declaring several methods (or constructors) with the **same name** but **different parameter lists** — a different number of parameters, different parameter types, or a different order of types. The **compiler** chooses which one to call from the **static types** of the arguments. It is Java's form of **compile-time polymorphism**.

## Why It Matters

- **Convenience:** one meaningful name for one operation on different inputs — `println(int)`, `println(String)`, `println(Object)`; `Math.max(int, int)`, `Math.max(double, double)`.
- **Constructor flexibility:** `new ArrayList<>()`, `new ArrayList<>(100)`, `new ArrayList<>(otherList)`.
- **Interview traps:** overload resolution with widening, autoboxing, varargs and `null` is a favourite source of output-based and "does it compile?" questions.

## What Counts as Overloading

Two methods overload each other when they have the same name and **different signatures**. In Java a method's **signature** is its **name + parameter types** (in order).

| Change between the two methods | Valid overload? |
|-------------------------------|-----------------|
| Number of parameters | Yes — `area(int)` / `area(int, int)` |
| Parameter types | Yes — `area(int)` / `area(double)` |
| Order of parameter types | Yes — `log(String, int)` / `log(int, String)` (legal, but confusing) |
| **Only** the return type | **No** — compile-time error |
| **Only** parameter names | **No** — same signature |
| **Only** access modifier, `static`, or `throws` clause | **No** — same signature |
| Generic types that erase to the same type (`List<String>` / `List<Integer>`) | **No** — "name clash: same erasure" |

```java
class Calculator {
    int total(int a, int b) {
        return a + b;
    }

    long total(int a, int b) {            // compile-time error: already defined (return type is not part of the signature)
        return a + b;
    }
}
```

Why the return type cannot distinguish overloads: a call such as `calc.total(1, 2);` may ignore the result, so the compiler would have no way to choose.

## How the Compiler Chooses an Overload

The compiler resolves an overloaded call in **three phases**, stopping at the first phase that finds at least one applicable method:

| Phase | Conversions allowed for arguments | Example match for argument `5` (an `int`) |
|-------|-----------------------------------|-------------------------------------------|
| 1. Strict / loose without boxing | Exact type, **widening** primitive (`int → long → float → double`), widening reference (subclass → superclass) | `m(int)`, `m(long)`, `m(double)` |
| 2. With boxing/unboxing | Phase 1 + **autoboxing** (`int → Integer`) / unboxing, then widening reference | `m(Integer)`, `m(Object)`, `m(Number)` |
| 3. Varargs | Phase 2 + **variable arity** | `m(int...)`, `m(Object...)` |

If several methods are applicable in the winning phase, the compiler picks the **most specific** one (the one whose parameter types could be passed to all the others). If none is most specific, the call is **ambiguous** — a compile-time error.

Consequences worth memorising:

- **Widening beats boxing:** `m(long)` wins over `m(Integer)` for an `int` argument.
- **Boxing beats varargs:** `m(Integer)` wins over `m(int...)`.
- **Exact beats widening**, and a closer widening beats a farther one: for `int`, `m(long)` beats `m(double)`.
- No **narrowing** in method calls: `m(byte b)` does **not** accept the literal `5` (assignment `byte b = 5;` does, but method invocation does not).
- Boxing goes only to the **matching wrapper**: an `int` boxes to `Integer`, never to `Long` — so `m(Long)` does not accept `5`.

### Resolution examples

```java
public class OverloadResolution {

    static void m(long x)        { System.out.println("long"); }
    static void m(Integer x)     { System.out.println("Integer"); }
    static void m(int... x)      { System.out.println("int..."); }

    static void n(double x)      { System.out.println("double"); }
    static void n(Object x)      { System.out.println("Object"); }

    static void p(Object x)      { System.out.println("p(Object)"); }
    static void p(String x)      { System.out.println("p(String)"); }

    static void q(int a, int b)  { System.out.println("q(int, int)"); }
    static void q(int... a)      { System.out.println("q(int...)"); }

    static void r(char c)        { System.out.println("r(char)"); }
    static void r(int i)         { System.out.println("r(int)"); }

    public static void main(String[] args) {
        m(5);                     // phase 1: int → long (widening) beats boxing and varargs
        m(Integer.valueOf(5));    // exact match Integer
        m();                      // only varargs accepts zero arguments
        n(5);                     // phase 1: int → double widening; Object needs boxing (phase 2)
        n('A');                   // char → double widening
        n("text");                // only Object applies
        p(null);                  // String is more specific than Object
        Object o = "hello";
        p(o);                     // static type is Object: runtime type is ignored
        q(1, 2);                  // fixed arity found in phase 1; varargs never considered
        q(1, 2, 3);               // only varargs applies
        r('x');                   // exact match char
        r('x' + 1);               // char + int is an int expression
    }
}
```

**Output:**

```text
long
Integer
int...
double
double
Object
p(String)
p(Object)
q(int, int)
q(int...)
r(char)
r(int)
```

### Calls that do not compile

```java
class Ambiguity {
    static void a(String s) { }
    static void a(StringBuilder sb) { }

    static void b(Long value) { }

    static void c(byte value) { }

    static void test() {
        a(null);      // compile-time error: ambiguous — neither String nor StringBuilder is more specific
    }
}
```

The same file would also fail for `b(5)` (an `int` cannot box to `Long`) and `c(5)` (no narrowing from `int` to `byte` in a method call). A cast fixes each: `a((String) null)`, `b(5L)`, `c((byte) 5)`.

## Overloading with Inheritance

Overloads can be spread across a hierarchy: a subclass inherits the superclass's overloads and may add new ones. The compiler considers only methods **visible in the reference type**:

```java
class Printer {
    void print(Object value) {
        System.out.println("Printer.print(Object): " + value);
    }
}

class TextPrinter extends Printer {
    void print(String value) {                     // a NEW overload, not an override
        System.out.println("TextPrinter.print(String): " + value);
    }
}

public class OverloadAcrossHierarchy {
    public static void main(String[] args) {
        TextPrinter tp = new TextPrinter();
        Printer p = tp;

        tp.print("hi");      // TextPrinter sees both overloads; String is most specific
        p.print("hi");       // Printer sees only print(Object); TextPrinter does not override it
        tp.print(42);        // only print(Object) accepts an Integer
    }
}
```

**Output:**

```text
TextPrinter.print(String): hi
Printer.print(Object): hi
Printer.print(Object): 42
```

`p.print("hi")` surprises many people: the object is a `TextPrinter`, but the compiler, looking at `Printer`, chose the signature `print(Object)`. At runtime, dynamic dispatch looks for an **override of `print(Object)`** in `TextPrinter` — there is none, so `Printer`'s version runs.

> [!WARNING]
> The classic version of this trap is `public boolean equals(Book other)`: it **overloads** `Object.equals(Object)` instead of overriding it, so collections (which call `equals(Object)`) ignore it. Always use `@Override`; the compiler then rejects the wrong signature. See [equals() and hashCode()](../../java-oop/equals-and-hashcode/content.md).

## Overloading Constructors

Constructors are overloaded the same way and usually chain to one main constructor with `this(...)`:

```java
class Pizza {
    private final String size;
    private final boolean extraCheese;

    Pizza() {
        this("medium");
    }

    Pizza(String size) {
        this(size, false);
    }

    Pizza(String size, boolean extraCheese) {
        this.size = size;
        this.extraCheese = extraCheese;
    }
}
```

When the number of optional parameters grows, overloaded constructors become hard to read ("telescoping constructors"); the [Builder](../../design-patterns/builder-pattern/content.md) pattern is the usual fix.

## Overloading Static and `main` Methods

- Static methods can be overloaded like instance methods (`Math.abs(int)`, `Math.abs(double)`).
- A static and an instance method may overload each other if their parameter lists differ; if the parameter lists are the same, it is a compile-time error.
- `main` can be overloaded; the JVM only starts `public static void main(String[])`. Other overloads are ordinary methods.

## Overloading vs Overriding

| | Overloading | Overriding |
|--|-------------|------------|
| Signature | Must **differ** | Must be the **same** |
| Where | Same class or across a hierarchy | Subclass of the declaring class (or implementing class) |
| Return type | Anything | Same, or a subtype (covariant) for reference types |
| Access modifier | Anything | Same or wider |
| `throws` | Anything | No new or broader checked exceptions |
| `static` methods | Can be overloaded | Cannot be overridden (only hidden) |
| `private` / `final` methods | Can be overloaded | Cannot be overridden |
| Resolved | Compile time | Runtime |
| Polymorphism | Compile-time | Runtime |

Details of overriding: [Method Overriding](../method-overriding/content.md).

## Good and Bad Uses

**Good:** overloads that do the **same thing** for different input representations (`append(int)`, `append(String)`), or convenience overloads that fill in defaults and delegate to one full version.

**Avoid:**

- Overloads with the **same number of parameters** whose types are related by boxing or inheritance (`remove(int index)` vs `remove(Object o)` on `List<Integer>` — `list.remove(1)` removes **index 1**, not the value 1).
- Overloads that **behave differently** in meaningful ways — use different names (`findById`, `findByEmail`) instead.
- Mixing varargs overloads with fixed-arity overloads of the same types.

## Real-World Examples

- `System.out.println` has overloads for every primitive, `char[]`, `String` and `Object`.
- `String.valueOf(int)`, `valueOf(double)`, `valueOf(char[])`, `valueOf(Object)`.
- `List.of()` has fixed-arity overloads for 0–10 elements plus a varargs version, avoiding array allocation for common cases.
- `List.remove(int)` vs `Collection.remove(Object)` — the well-known overload trap with `List<Integer>`.

## Common Misconceptions

- **"Different return types make an overload."** The parameter list must differ.
- **"Overload choice depends on the runtime type of the argument."** Only the static (declared) type counts.
- **"Boxing is tried before widening."** Widening (phase 1) comes first, boxing (phase 2) next, varargs last.
- **"A subclass method with the same name always overrides."** If the parameter types differ, it is a new overload.
- **"`null` always matches `Object`."** `null` matches any reference type, and the most specific applicable method wins — or the call is ambiguous.

## Key Takeaways

- Overloading = same name, different parameter lists; return type alone is not enough.
- The compiler picks the overload from the **static** argument types: phase 1 (exact/widening), phase 2 (boxing), phase 3 (varargs), then the most specific.
- Widening beats boxing beats varargs; no narrowing in calls; `int` boxes only to `Integer`.
- Only overloads visible in the reference type are candidates.
- Use `@Override` to avoid accidentally overloading `equals`.
