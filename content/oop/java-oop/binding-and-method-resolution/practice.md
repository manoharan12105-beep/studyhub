# Binding and Method Resolution — Practice

### P1. Static or dynamic?

**Difficulty:** Easy · **Type:** MCQ

Which call is bound dynamically?

- A) `Math.max(1, 2)`
- B) `super.toString()` inside an override
- C) `list.size()` where `list` is declared as `List<String>`
- D) A call to a `private` helper method

<details>
<summary>Answer</summary>

**Answer:** C) `list.size()`

**Explanation:** It is an interface (virtual) call; the actual list class decides. The others are static, non-virtual `super` and private calls.

</details>

### P2. Overload across levels

**Difficulty:** Medium · **Type:** Output-based

```java
class Sender {
    String send(Object message) {
        return "Sender:Object";
    }
}

class EmailSender extends Sender {
    String send(String message) {
        return "EmailSender:String";
    }
}

public class SendQuestion {
    public static void main(String[] args) {
        Sender s = new EmailSender();
        EmailSender e = new EmailSender();
        System.out.println(s.send("hi"));
        System.out.println(e.send("hi"));
        System.out.println(e.send(42));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Sender:Object
EmailSender:String
Sender:Object
```

**Explanation:** `EmailSender.send(String)` is an overload, invisible through a `Sender` reference. Through `EmailSender`, `"hi"` picks the more specific `send(String)`; `42` (boxed to `Integer`) only fits `send(Object)`.

</details>

### P3. Default vs class

**Difficulty:** Medium · **Type:** Output-based

```java
interface Named {
    default String name() {
        return "interface";
    }
}

class Base {
    public String name() {
        return "base";
    }
}

class Thing extends Base implements Named { }

public class DefaultVsClass {
    public static void main(String[] args) {
        Named n = new Thing();
        System.out.println(n.name());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
base
```

**Explanation:** Classes win over interface defaults: `Thing` inherits `Base.name()`, which implements `Named.name()`.

</details>

### P4. Full trace

**Difficulty:** Hard · **Type:** Output-based

```java
class X {
    String call(X other) {
        return "X(X)";
    }

    String run(X other) {
        return call(other);
    }
}

class Y extends X {
    @Override
    String call(X other) {
        return "Y(X)";
    }

    String call(Y other) {
        return "Y(Y)";
    }
}

public class TraceQuestion {
    public static void main(String[] args) {
        Y y = new Y();
        X x = y;
        System.out.println(x.call(y));
        System.out.println(y.call(y));
        System.out.println(y.run(y));
    }
}
```

<details>
<summary>Hint</summary>

Inside `X.run`, what is the declared type of `other`, and which overloads does class `X` know about?

</details>

<details>
<summary>Answer</summary>

**Output:**

```text
Y(X)
Y(Y)
Y(X)
```

**Explanation:** (1) Through `X`, only `call(X)` exists; the `Y` object overrides it. (2) Through `Y`, `call(Y)` is the most specific. (3) `run` is declared in `X`; its body was compiled against `X`, where `other` is an `X` and only `call(X)` exists — so the signature is `call(X)`, which dispatches to `Y.call(X)`. The overload `call(Y)` is never considered inside `X`'s code.

</details>
