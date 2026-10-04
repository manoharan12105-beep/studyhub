# Binding and Method Resolution

> [!NOTE]
> **Advanced topic.** This topic explains precisely how Java decides which method a call executes — the reasoning behind most output-based OOP questions. Study [Polymorphism](../../pillars/polymorphism/content.md), [Method Overloading](../../pillars/method-overloading/content.md) and [Method Overriding](../../pillars/method-overriding/content.md) first.

## Definition

**Method resolution** is the process of turning a call such as `shape.draw(canvas)` into one specific method body. Java does it in two stages:

1. **Compile time — method selection:** the compiler uses **static (declared) types** to choose a **method signature** (which overload) and an **invocation mode** (static, non-virtual, virtual, interface).
2. **Run time — method lookup:** for virtual and interface calls, the JVM uses the **runtime class of the receiver object** to find the implementation that overrides the chosen signature.

**Binding** is the name for connecting a call to a body: **static (early) binding** if it is fixed at compile time, **dynamic (late) binding** if it depends on the runtime object.

## Why It Matters

Almost every tricky OOP output question is answered by this procedure. Learning it once removes the guesswork from overloading-plus-overriding puzzles, static method hiding, private methods, `super` calls, default methods and constructor dispatch.

## Key Terms

| Term | Meaning |
|------|---------|
| **Reference type** (static type) | The declared type of the expression the method is called on: `Animal` in `Animal a = new Dog()` |
| **Object type** (runtime class) | The class the object was created from: `Dog` |
| **Method signature** | Name + parameter types. The return type is **not** part of it |
| **Applicable method** | A method whose parameters can accept the arguments under the current phase's conversions |
| **Most specific method** | Among applicable methods, the one whose parameter types could be passed to all others |
| **Compile-time declaration** | The method the compiler selected; the JVM looks for overrides of exactly this |
| **Invocation mode** | `static` (static methods), non-virtual (`private` methods, `super.m()` calls, constructors), virtual (other instance methods), interface |

## How Java Resolves a Method Call

### Compile time

1. **Pick the type to search.** For `expr.m(...)`, the static type of `expr`. For an unqualified `m(...)`, the enclosing class. For `super.m(...)`, the direct superclass. For `TypeName.m(...)`, that type (only static methods qualify).
2. **Collect candidates** named `m` that are **accessible** from the calling code and have a compatible number of parameters — including inherited ones.
3. **Find applicable methods** in phases: (1) exact/widening, no boxing, no varargs; (2) add boxing/unboxing; (3) add varargs. Stop at the first phase with any applicable method.
4. **Choose the most specific** one; if none is most specific → compile-time "ambiguous" error.
5. **Record** the chosen signature and its invocation mode in the bytecode. Argument types are now fixed forever.

### Run time

6. **Evaluate the receiver** expression, then the **arguments**, left to right.
7. If the mode is not static and the receiver is `null` → `NullPointerException` (after the arguments were evaluated).
8. **Locate the body:**
   - **static** → the selected method; the receiver value is ignored.
   - **non-virtual** (`private`, `super.m()`) → exactly the selected method.
   - **virtual / interface** → start at the receiver's runtime class and walk **up** the superclass chain to the first method that **overrides** the selected signature. If no class provides one, use the most specific **default** method from the interfaces.

## What Binds Statically and What Binds Dynamically

| Member access | Binding | Decided by |
|---------------|---------|------------|
| Choice among **overloads** | Static | Static types of arguments |
| **Instance** method, non-private, non-static | Dynamic | Runtime class of receiver |
| `final` instance method | Dynamic in principle, but only one implementation can exist | — |
| **`static`** method | Static | Reference type (hiding, not overriding) |
| **`private`** method | Static | The class whose code makes the call |
| **`super.method()`** | Static | The direct superclass's implementation |
| **Constructor** | Static | `new ClassName(...)` |
| **Field** access | Static | Reference type |

## Progressive Examples

Each example lists **what the compiler knows** and **what the runtime object is**.

### Level 1 — Overriding

```java
class Animal {
    String sound() {
        return "...";
    }
}

class Dog extends Animal {
    @Override
    String sound() {
        return "Woof";
    }
}

public class Level1 {
    public static void main(String[] args) {
        Animal a = new Dog();
        System.out.println(a.sound());
    }
}
```

**Output:**

```text
Woof
```

Compiler: `Animal` has `sound()` → virtual call to `sound()`. Runtime: object is `Dog` → `Dog.sound()`.

### Level 2 — Overloads chosen by static argument types

```java
class Printer {
    String print(Object o) {
        return "Printer.print(Object)";
    }

    String print(String s) {
        return "Printer.print(String)";
    }
}

class FancyPrinter extends Printer {
    @Override
    String print(Object o) {
        return "FancyPrinter.print(Object)";
    }
}

public class Level2 {
    public static void main(String[] args) {
        Printer p = new FancyPrinter();
        Object text = "hello";
        System.out.println(p.print(text));
        System.out.println(p.print("hello"));
    }
}
```

**Output:**

```text
FancyPrinter.print(Object)
Printer.print(String)
```

| Call | Compiler picks | Runtime finds |
|------|----------------|---------------|
| `p.print(text)` | `text` is declared `Object` → `print(Object)` | `FancyPrinter` overrides `print(Object)` → its version |
| `p.print("hello")` | `String` argument → most specific `print(String)` | `FancyPrinter` does **not** override `print(String)` → `Printer`'s version |

### Level 3 — Similar signature, different parameter type: overload, not override

```java
class Base {
    String m(long x) {
        return "Base.m(long)";
    }
}

class Derived extends Base {
    String m(int x) {                      // different parameter type: a new overload
        return "Derived.m(int)";
    }
}

public class Level3 {
    public static void main(String[] args) {
        Base b = new Derived();
        Derived d = new Derived();
        System.out.println(b.m(5));
        System.out.println(d.m(5));
        System.out.println(d.m(5L));
    }
}
```

**Output:**

```text
Base.m(long)
Derived.m(int)
Base.m(long)
```

Through `Base`, only `m(long)` exists; `Derived.m(int)` does not override it, so `Base.m(long)` runs. Through `Derived`, both are candidates: for `5` (an `int`), `m(int)` is exact; for `5L`, only `m(long)` applies.

### Level 4 — Static methods: hidden, bound by reference type

```java
class Config {
    static String source() {
        return "Config.source";
    }

    String describe() {
        return "describe -> " + source();            // unqualified static call inside Config
    }
}

class TestConfig extends Config {
    static String source() {                          // hides Config.source()
        return "TestConfig.source";
    }
}

public class Level4 {
    public static void main(String[] args) {
        Config c = new TestConfig();
        System.out.println(c.source());
        System.out.println(((TestConfig) c).source());
        System.out.println(c.describe());
    }
}
```

**Output:**

```text
Config.source
TestConfig.source
describe -> Config.source
```

The static call inside `Config.describe()` was bound to `Config.source()` when `Config` was compiled. No runtime lookup happens for static methods.

### Level 5 — Private methods: bound to the calling class

```java
class Account {
    private String type() {
        return "generic";
    }

    String label() {
        return "Account(" + type() + ")";            // non-virtual call to Account.type()
    }
}

class SavingsAccount extends Account {
    String type() {                                  // unrelated method, not an override
        return "savings";
    }
}

public class Level5 {
    public static void main(String[] args) {
        Account a = new SavingsAccount();
        System.out.println(a.label());
        System.out.println(new SavingsAccount().type());
    }
}
```

**Output:**

```text
Account(generic)
savings
```

Change `private` to package-private in `Account` and the first line becomes `Account(savings)` — the call becomes virtual and `SavingsAccount.type()` now overrides it.

### Level 6 — `super` calls and virtual calls inside the parent

```java
class Report {
    String header() {
        return "REPORT";
    }

    String render() {
        return header() + " | body";                 // virtual: uses the object's header()
    }
}

class SalesReport extends Report {
    @Override
    String header() {
        return "SALES";
    }

    @Override
    String render() {
        return super.render() + " | totals";         // non-virtual: runs Report.render()
    }
}

public class Level6 {
    public static void main(String[] args) {
        Report r = new SalesReport();
        System.out.println(r.render());
    }
}
```

**Output:**

```text
SALES | body | totals
```

`super.render()` jumps to `Report.render()` without a lookup — but inside it, `header()` is an ordinary virtual call on `this`, which is still the `SalesReport` object.

### Level 7 — Interface default methods vs class methods

```java
interface Greeter {
    default String greet() {
        return "Hello from Greeter";
    }
}

interface PoliteGreeter extends Greeter {
    @Override
    default String greet() {
        return "Good day from PoliteGreeter";
    }
}

class BaseService {
    public String greet() {
        return "Hi from BaseService";
    }
}

class ServiceA implements Greeter, PoliteGreeter { }

class ServiceB extends BaseService implements PoliteGreeter { }

public class Level7 {
    public static void main(String[] args) {
        Greeter a = new ServiceA();
        Greeter b = new ServiceB();
        System.out.println(a.greet());
        System.out.println(b.greet());
    }
}
```

**Output:**

```text
Good day from PoliteGreeter
Hi from BaseService
```

Runtime lookup searches **classes first**: `ServiceB` inherits `BaseService.greet()`, which wins over any default. `ServiceA` has no class implementation, so the most specific default (`PoliteGreeter`, which overrides `Greeter`'s) is used.

### Level 8 — Dispatch during construction

```java
class Widget {
    Widget() {
        System.out.println("init: " + name());       // virtual call from a constructor
    }

    String name() {
        return "widget";
    }
}

class Button extends Widget {
    private String label = "OK";

    Button() {
        System.out.println("button ready: " + name());
    }

    @Override
    String name() {
        return "button[" + label + "]";
    }
}

public class Level8 {
    public static void main(String[] args) {
        new Button();
    }
}
```

**Output:**

```text
init: button[null]
button ready: button[OK]
```

During `Widget()`, the object is already a `Button`, so `Button.name()` runs — before `label` is assigned.

### Level 9 — `null` receivers and evaluation order

```java
public class Level9 {

    static int calls = 0;

    static String util() {
        return "static ok";
    }

    String instanceMethod(int x) {
        return "instance " + x;
    }

    static int sideEffect() {
        calls++;
        return calls;
    }

    public static void main(String[] args) {
        Level9 ref = null;
        System.out.println(ref.util());                       // static: receiver value ignored
        try {
            ref.instanceMethod(sideEffect());                 // argument evaluated, then NPE
        } catch (NullPointerException e) {
            System.out.println("NPE after argument evaluation, calls = " + calls);
        }
    }
}
```

**Output:**

```text
static ok
NPE after argument evaluation, calls = 1
```

### Level 10 — Everything together

```java
class A {
    String f(A x) {
        return "A.f(A)";
    }

    String f(B x) {
        return "A.f(B)";
    }
}

class B extends A {
    @Override
    String f(A x) {
        return "B.f(A)";
    }

    String f(C x) {                                    // a new overload, only visible through B or C
        return "B.f(C)";
    }
}

class C extends B {
    @Override
    String f(B x) {
        return "C.f(B)";
    }
}

public class Level10 {
    public static void main(String[] args) {
        A ab = new B();
        A ac = new C();
        B bc = new C();
        C c = new C();

        System.out.println(ab.f(c));    // 1
        System.out.println(ac.f(ab));   // 2
        System.out.println(ac.f(c));    // 3
        System.out.println(bc.f(c));    // 4
        System.out.println(bc.f(bc));   // 5
    }
}
```

**Output:**

```text
A.f(B)
B.f(A)
C.f(B)
B.f(C)
C.f(B)
```

| # | Search type | Candidates | Selected signature (argument static type) | Runtime class | Runs |
|---|-------------|-----------|---------------------------------------------|---------------|------|
| 1 | `A` | `f(A)`, `f(B)` | `c` is `C` → both apply; `f(B)` more specific | `B` (no override of `f(B)`) | `A.f(B)` |
| 2 | `A` | `f(A)`, `f(B)` | `ab` is declared `A` → `f(A)` | `C` → inherits `B.f(A)` | `B.f(A)` |
| 3 | `A` | `f(A)`, `f(B)` | `C` argument → `f(B)` (`f(C)` is invisible through `A`) | `C` overrides `f(B)` | `C.f(B)` |
| 4 | `B` | `f(A)`, `f(B)`, `f(C)` | `C` argument → `f(C)` most specific | `C` does not override `f(C)` | `B.f(C)` |
| 5 | `B` | `f(A)`, `f(B)`, `f(C)` | `bc` is declared `B` → `f(B)` | `C` overrides `f(B)` | `C.f(B)` |

## A Checklist for Output Questions

1. Write down the **declared type** of the receiver and of each argument.
2. List the methods with that name **visible in the receiver's declared type** (inherited ones included; private ones only if the call is inside the declaring class).
3. Choose the overload: phase 1 → 2 → 3, then most specific. Ambiguous? Compile error.
4. Is the chosen method static, private, or called via `super`? Then that exact body runs.
5. Otherwise take the **object's runtime class** and search upward for an override of the chosen signature; classes before interface defaults.
6. Remember: fields never dispatch; constructors dispatch virtual calls on half-built objects; a `null` receiver throws only for non-static calls, after arguments are evaluated.

## Common Misconceptions

- **"The runtime picks the best overload for the actual argument objects."** Overloads are fixed at compile time.
- **"A subclass method with the same name and a wider/narrower parameter type overrides."** It overloads.
- **"`super.m()` disables polymorphism inside `m`."** Only that one call is non-virtual; calls made inside `m` on `this` are still virtual.
- **"Interface defaults beat inherited class methods."** Classes always win.
- **"Static calls on `null` throw."** They do not.

## Key Takeaways

- Compile time: search the receiver's **static type**, select the overload by **static argument types**, record signature + invocation mode.
- Run time: static/private/`super` calls run exactly the selected method; virtual calls look up an override of that signature starting from the **object's class**.
- Classes beat interface defaults; more specific defaults beat less specific ones.
- Use the six-step checklist for any output question.
