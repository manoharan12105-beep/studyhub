# OOP with Exceptions — Practice

### P1. Checked or unchecked?

**Difficulty:** Easy · **Type:** MCQ

Which of these is a checked exception?

- A) `NullPointerException`
- B) `IllegalStateException`
- C) `IOException`
- D) `ArithmeticException`

<details>
<summary>Answer</summary>

**Answer:** C) `IOException`

**Explanation:** It extends `Exception` but not `RuntimeException`. The others are `RuntimeException` subclasses.

</details>

### P2. Which handler runs?

**Difficulty:** Easy · **Type:** Output-based

```java
public class WhichHandler {
    public static void main(String[] args) {
        try {
            Object text = "42";
            Integer number = (Integer) text;
            System.out.println(number);
        } catch (NumberFormatException e) {
            System.out.println("format");
        } catch (RuntimeException e) {
            System.out.println("runtime: " + e.getClass().getSimpleName());
        } finally {
            System.out.println("done");
        }
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
runtime: ClassCastException
done
```

**Explanation:** Casting a `String` to `Integer` throws `ClassCastException`, which is a `RuntimeException` but not a `NumberFormatException`.

</details>

### P3. Design a custom exception

**Difficulty:** Medium · **Type:** Coding

Write an unchecked `SeatUnavailableException` for a ticket-booking system that carries the show id and seat number and supports an optional cause.

<details>
<summary>Answer</summary>

```java
class SeatUnavailableException extends RuntimeException {
    private final String showId;
    private final String seat;

    SeatUnavailableException(String showId, String seat) {
        this(showId, seat, null);
    }

    SeatUnavailableException(String showId, String seat, Throwable cause) {
        super("Seat " + seat + " is not available for show " + showId, cause);
        this.showId = showId;
        this.seat = seat;
    }

    String showId() {
        return showId;
    }

    String seat() {
        return seat;
    }
}
```

**Explanation:** A clear name, a useful message built once, context fields with accessors (so callers need not parse the message), immutable state, and a constructor that preserves a cause.

</details>

### P4. Fix the handler

**Difficulty:** Medium · **Type:** Code analysis

```java
String loadTemplate(String name) {
    try {
        return Files.readString(Path.of("templates", name));
    } catch (Exception e) {
        return null;
    }
}
```

List the problems and rewrite it.

<details>
<summary>Answer</summary>

**Problems:** it catches every exception (including bugs such as an invalid path argument), discards the cause and message, and returns `null`, which callers will forget to check — the failure surfaces later as a confusing `NullPointerException`.

**Better:**

```java
String loadTemplate(String name) {
    try {
        return Files.readString(Path.of("templates", name));
    } catch (IOException e) {
        throw new TemplateNotFoundException("cannot read template " + name, e);
    }
}
```

where `TemplateNotFoundException` is a domain exception. If a missing template is a normal case, return `Optional<String>` instead and let callers decide.

</details>

### P5. Interface exceptions

**Difficulty:** Hard · **Type:** Design

You are designing `interface FileStore { byte[] read(String path); }` with implementations for local disk, S3-like object storage and an in-memory test fake. What exception contract would you give `read`, and why?

<details>
<summary>Answer</summary>

**Answer:** Declare an abstraction-level exception — for example `FileStoreException` (checked or unchecked, consistently with the codebase) with subclasses like `FileNotFoundInStoreException` — and have each implementation translate its own failures (`IOException`, HTTP errors, SDK exceptions) into it, preserving the cause.

**Why:** callers depend only on `FileStore`; they must not need to know about disk or network exceptions. And because overrides cannot add new checked exceptions, the interface has to declare a contract general enough for every implementation.

</details>
