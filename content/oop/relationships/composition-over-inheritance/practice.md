# Composition over Inheritance — Practice

### P1. Spot the misuse

**Difficulty:** Easy · **Type:** MCQ

Which is the clearest misuse of inheritance?

- A) `class FileNotFoundException extends IOException`
- B) `class Stack<E> extends ArrayList<E>`
- C) `class Circle extends Shape` where `Shape` is abstract with `area()`
- D) `class SavingsAccount extends Account` where every account rule applies to savings accounts

<details>
<summary>Answer</summary>

**Answer:** B) `class Stack<E> extends ArrayList<E>`

**Explanation:** A stack is not a general list; extending `ArrayList` exposes index-based insertion and removal that break LIFO. A stack should hold a list (or `ArrayDeque`) and expose only `push`, `pop` and `peek`.

</details>

### P2. Count the classes

**Difficulty:** Medium · **Type:** Conceptual

Notifications vary by channel (email, SMS, push) and by urgency handling (normal, retry-until-delivered). How many concrete classes are needed with inheritance (one class per combination) versus composition (channel and retry policy as separate parts)? What happens when WhatsApp is added?

<details>
<summary>Answer</summary>

**Answer:** Inheritance: 3 × 2 = 6 classes; WhatsApp adds 2 more (8). Composition: 3 channels + 2 policies = 5 classes; WhatsApp adds 1 (6).

**Explanation:** With composition, dimensions add instead of multiply.

</details>

### P3. Refactor to composition

**Difficulty:** Medium · **Type:** Coding

```java
class Logger {
    void log(String message) {
        System.out.println(message);
    }
}

class TimestampLogger extends Logger {
    @Override
    void log(String message) {
        super.log("[12:00] " + message);
    }
}

class UppercaseLogger extends Logger {
    @Override
    void log(String message) {
        super.log(message.toUpperCase());
    }
}
```

A timestamped **and** uppercase logger is now required. Redesign with composition so any combination is possible without new subclasses.

<details>
<summary>Hint</summary>

Make every logger implement one interface, and let a logger wrap another logger.

</details>

<details>
<summary>Answer</summary>

```java
interface Log {
    void log(String message);
}

class ConsoleLog implements Log {
    public void log(String message) {
        System.out.println(message);
    }
}

class TimestampLog implements Log {
    private final Log next;

    TimestampLog(Log next) {
        this.next = next;
    }

    public void log(String message) {
        next.log("[12:00] " + message);
    }
}

class UppercaseLog implements Log {
    private final Log next;

    UppercaseLog(Log next) {
        this.next = next;
    }

    public void log(String message) {
        next.log(message.toUpperCase());
    }
}
```

`new TimestampLog(new UppercaseLog(new ConsoleLog())).log("started")` prints `[12:00] STARTED`.

**Explanation:** Each behaviour wraps any other `Log`, so combinations are built at runtime — the Decorator pattern.

</details>

### P4. Composition output

**Difficulty:** Hard · **Type:** Output-based

```java
public class SwappablePart {

    interface Engine {
        String start();
    }

    static class PetrolEngine implements Engine {
        public String start() {
            return "vroom";
        }
    }

    static class ElectricEngine implements Engine {
        public String start() {
            return "hum";
        }
    }

    static class Car {
        private Engine engine;

        Car(Engine engine) {
            this.engine = engine;
        }

        void replaceEngine(Engine engine) {
            this.engine = engine;
        }

        String drive() {
            return "Car goes " + engine.start();
        }
    }

    public static void main(String[] args) {
        Engine shared = new PetrolEngine();
        Car a = new Car(shared);
        Car b = new Car(shared);
        b.replaceEngine(new ElectricEngine());
        System.out.println(a.drive());
        System.out.println(b.drive());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
Car goes vroom
Car goes hum
```

**Explanation:** `replaceEngine` changes only `b`'s field; `a` still refers to the petrol engine. (Sharing one engine between two cars is aggregation, not composition — in a composition design each car would own its own engine.)

</details>
