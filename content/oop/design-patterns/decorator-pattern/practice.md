# Decorator — Practice

### P1. Identify the decorator

**Difficulty:** Easy · **Type:** MCQ

Which JDK construct is a decorator?

- A) `Arrays.asList(array)`
- B) `new BufferedReader(new FileReader("a.txt"))`
- C) `List.of(1, 2, 3)`
- D) `Integer.valueOf(5)`

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** `BufferedReader` wraps another `Reader` and adds buffering while keeping the `Reader` interface. A is an adapter; C and D are static factory methods.

</details>

### P2. Predict the output

**Difficulty:** Medium · **Type:** Output-based

```java
public class TextDecorators {

    interface Text {
        String render();
    }

    record Plain(String value) implements Text {
        public String render() {
            return value;
        }
    }

    record Bold(Text inner) implements Text {
        public String render() {
            return "**" + inner.render() + "**";
        }
    }

    record Bracketed(Text inner) implements Text {
        public String render() {
            return "[" + inner.render() + "]";
        }
    }

    public static void main(String[] args) {
        System.out.println(new Bold(new Bracketed(new Plain("sale"))).render());
        System.out.println(new Bracketed(new Bold(new Plain("sale"))).render());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
**[sale]**
[**sale**]
```

**Explanation:** The outermost decorator's work wraps everything inside it, so the order of wrapping changes the result.

</details>

### P3. Write a decorator

**Difficulty:** Medium · **Type:** Coding

Given `interface Notifier { void send(String to, String msg); }`, write a `QuietHoursNotifier` decorator that drops messages when a supplied `boolean quietHours()` check returns true and otherwise delegates.

<details>
<summary>Answer</summary>

```java
import java.util.function.BooleanSupplier;

interface Notifier {
    void send(String to, String msg);
}

class QuietHoursNotifier implements Notifier {
    private final Notifier inner;
    private final BooleanSupplier quietHours;

    QuietHoursNotifier(Notifier inner, BooleanSupplier quietHours) {
        this.inner = inner;
        this.quietHours = quietHours;
    }

    @Override
    public void send(String to, String msg) {
        if (quietHours.getAsBoolean()) {
            return;                                  // suppressed during quiet hours
        }
        inner.send(to, msg);
    }
}
```

**Explanation:** It implements the same interface and wraps any `Notifier` (email, SMS, or another decorator). The time check is injected so it can be tested.

</details>
