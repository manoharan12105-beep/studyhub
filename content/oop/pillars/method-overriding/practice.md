# Method Overriding — Practice

### P1. Valid override?

**Difficulty:** Easy · **Type:** MCQ

Parent: `public void start()`. Which subclass declaration is a valid override?

- A) `void start()`
- B) `public int start()`
- C) `public void start()`
- D) `public static void start()`

<details>
<summary>Answer</summary>

**Answer:** C) `public void start()`

**Explanation:** A narrows access, B changes a `void` return type, D tries to make a static method from an instance method (compile-time error).

</details>

### P2. Overload or override?

**Difficulty:** Easy · **Type:** Conceptual

Parent: `void draw(int size)`. Child: `void draw(long size)`. Is the child method an override?

<details>
<summary>Answer</summary>

**Answer:** No, it is an overload.

**Explanation:** The parameter type differs. Adding `@Override` would turn this into a compile-time error, revealing the mistake.

</details>

### P3. Dispatch through super

**Difficulty:** Medium · **Type:** Output-based

```java
class Engine {
    String start() {
        return "engine";
    }
}

class TurboEngine extends Engine {
    @Override
    String start() {
        return "turbo+" + super.start();
    }
}

class RaceEngine extends TurboEngine {
    @Override
    String start() {
        return "race+" + super.start();
    }
}

public class EngineChain {
    public static void main(String[] args) {
        Engine e = new RaceEngine();
        TurboEngine t = new TurboEngine();
        System.out.println(e.start());
        System.out.println(t.start());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
race+turbo+engine
turbo+engine
```

**Explanation:** The object type picks the starting override; each `super.start()` moves one level up.

</details>

### P4. Private method trap

**Difficulty:** Medium · **Type:** Output-based

```java
class Machine {
    private String mode() {
        return "manual";
    }

    String status() {
        return "mode=" + mode();
    }
}

class Robot extends Machine {
    public String mode() {
        return "auto";
    }
}

public class PrivateTrap {
    public static void main(String[] args) {
        Machine m = new Robot();
        System.out.println(m.status());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
mode=manual
```

**Explanation:** `Machine.mode()` is private, so `Robot.mode()` does not override it. The call inside `status()` binds statically to `Machine`'s private method.

</details>

### P5. Exceptions in overrides

**Difficulty:** Hard · **Type:** Code analysis

```java
import java.io.IOException;
import java.sql.SQLException;

class Repository {
    void save() throws IOException { }
}

class SqlRepository extends Repository {
    @Override
    void save() throws SQLException { }
}
```

Does it compile? Explain, and propose a fix that keeps SQL errors visible to callers.

<details>
<summary>Hint</summary>

Is `SQLException` a subclass of `IOException`?

</details>

<details>
<summary>Answer</summary>

**Answer:** No. `SQLException` is a checked exception unrelated to `IOException`, so the override adds a new checked exception.

**Fix:** catch the `SQLException` inside `save()` and wrap it in an exception the contract allows — for example `throw new IOException("save failed", e)` — or redesign the contract so `Repository.save()` declares a storage-neutral exception (such as a custom `RepositoryException`) that every implementation can throw. Wrapping keeps the original cause in the stack trace.

</details>
