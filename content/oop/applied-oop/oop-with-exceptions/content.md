# OOP with Exceptions

## Definition

In Java, an **exception is an object**: an instance of a class in the `Throwable` hierarchy, carrying state (message, cause, stack trace) and behaviour. Exception handling therefore uses ordinary OOP mechanisms — **inheritance** to classify errors, **polymorphism** to catch families of errors with one handler, **encapsulation** to hide low-level failures behind a layer's abstraction, and **custom exception classes** to express domain-specific failures.

## Why It Matters

- Exceptions are part of a method's **contract**, just like its parameters and return type.
- Badly designed exceptions leak implementation details (`SQLException` thrown from a business method), lose the original cause, or are silently swallowed.
- Interview questions: checked vs unchecked, custom exceptions, exception rules in overriding, exception chaining, `catch` order.

## Exceptions as Objects

```java
public class ExceptionsAreObjects {

    public static void main(String[] args) {
        try {
            Integer.parseInt("12a");
        } catch (NumberFormatException e) {                      // e is an ordinary object
            System.out.println(e.getClass().getSimpleName());
            System.out.println(e.getMessage());
            System.out.println(e instanceof IllegalArgumentException);   // its superclass
            System.out.println(e instanceof RuntimeException);
        }
    }
}
```

**Output:**

```text
NumberFormatException
For input string: "12a"
true
true
```

Useful members of `Throwable`: `getMessage()`, `getCause()`, `getStackTrace()`, `printStackTrace()`, `addSuppressed()`/`getSuppressed()`, and constructors taking `(String message, Throwable cause)`.

## The Exception Hierarchy

```text
                    Throwable
                   ▲         ▲
                Error      Exception
       (JVM problems:        ▲            ▲
   OutOfMemoryError,   IOException,   RuntimeException  ← unchecked
   StackOverflowError) SQLException,    ▲   ▲    ▲
                       (checked)        │   │    IllegalArgumentException
                                        │   │         ▲
                                        │   │    NumberFormatException
                                        │   IllegalStateException
                                   NullPointerException
```

| Category | Classes | Checked by compiler? | Meaning |
|----------|---------|----------------------|---------|
| **Checked exceptions** | `Exception` and subclasses **except** `RuntimeException` | Yes — must be caught or declared with `throws` | Recoverable conditions outside the program's control (I/O, network, missing file) |
| **Unchecked exceptions** | `RuntimeException` and subclasses | No | Programming errors or violated preconditions (null, bad argument, illegal state) |
| **Errors** | `Error` and subclasses | No | Serious JVM problems an application should not try to handle |

## Polymorphism in `catch`

A `catch (IOException e)` handles `IOException` **and every subclass** (`FileNotFoundException`, `EOFException`, …) — the same IS-A substitution as anywhere else.

Rules that follow:

- Catch blocks are tried **in order**; put **more specific** types first. A subclass catch after its superclass catch is unreachable — a **compile-time error**.
- **Multi-catch** handles unrelated types in one block: `catch (IOException | TimeoutException e)`. The alternatives cannot be subclasses of each other.

```java
try {
    readConfig();
} catch (Exception e) {
    // handles everything
} catch (IOException e) {       // compile-time error: already caught by Exception above
}
```

## Checked vs Unchecked

| | Checked | Unchecked |
|--|---------|-----------|
| Extends | `Exception` (not `RuntimeException`) | `RuntimeException` |
| Compiler forces handling | Yes | No |
| Typical cause | External conditions the caller can reasonably handle | Bugs / violated preconditions |
| Examples | `IOException`, `SQLException`, `InterruptedException` | `NullPointerException`, `IllegalArgumentException`, `IllegalStateException`, `ArithmeticException` |
| Effect on API | Every caller must catch or declare | Callers handle only if they want |

Guideline:

- Use a **checked** exception when the caller can **reasonably recover** and you want the compiler to make sure they think about it (retry, choose another file).
- Use an **unchecked** exception for **programming errors** and for failures most callers cannot handle locally.
- Many modern frameworks (Spring, JPA) prefer unchecked exceptions because checked exceptions propagate through every layer's signatures and encourage empty `catch` blocks. Both styles are defensible; be consistent within a codebase.

## Custom Exceptions

Create a custom exception when a failure is meaningful in your **domain** and callers may want to handle it specifically, or when it should carry extra data.

```java
public class CustomExceptionDemo {

    // Domain exception carrying useful state
    static class InsufficientFundsException extends Exception {
        private final long shortfallPaise;

        InsufficientFundsException(String accountId, long shortfallPaise) {
            super("Account " + accountId + " is short by " + shortfallPaise + " paise");
            this.shortfallPaise = shortfallPaise;
        }

        long shortfallPaise() {
            return shortfallPaise;
        }
    }

    static class Account {
        private final String id;
        private long balancePaise;

        Account(String id, long balancePaise) {
            this.id = id;
            this.balancePaise = balancePaise;
        }

        void withdraw(long amountPaise) throws InsufficientFundsException {
            if (amountPaise <= 0) {
                throw new IllegalArgumentException("amount must be positive");   // programming error: unchecked
            }
            if (amountPaise > balancePaise) {
                throw new InsufficientFundsException(id, amountPaise - balancePaise);   // business case: checked
            }
            balancePaise -= amountPaise;
        }
    }

    public static void main(String[] args) {
        Account account = new Account("SB-42", 10_000);
        try {
            account.withdraw(4_000);
            account.withdraw(9_000);
        } catch (InsufficientFundsException e) {
            System.out.println(e.getMessage());
            System.out.println("Offer an overdraft of " + e.shortfallPaise());
        }
    }
}
```

**Output:**

```text
Account SB-42 is short by 3000 paise
Offer an overdraft of 3000
```

### Designing exception classes

- **Name** it after the problem, ending in `Exception`: `PaymentDeclinedException`, not `PaymentError2`.
- **Extend** the most fitting type: `RuntimeException` for unchecked, `Exception` for checked, or an existing JDK exception when the meaning matches (`IllegalArgumentException`, `IllegalStateException`, `UnsupportedOperationException`) — often no custom class is needed at all.
- **Provide constructors** with a message and with a message plus `cause`, so callers can chain.
- **Carry context** as fields (`shortfallPaise`, `orderId`) rather than forcing callers to parse the message.
- Keep exceptions **immutable** (final fields, no setters).
- A small **hierarchy** per domain area lets callers choose granularity: `PaymentException` ← `PaymentDeclinedException`, `PaymentGatewayTimeoutException`.

## Encapsulation of Error Handling: Exception Translation

A layer should throw exceptions that make sense **at its level of abstraction**. If a `CustomerService` lets an `SQLException` escape, every caller is coupled to the fact that a SQL database is used. Instead, **translate** the low-level exception into a higher-level one and keep the original as the **cause** (exception chaining):

```java
import java.io.IOException;

public class ExceptionTranslation {

    // Domain-level exception: callers do not know or care how storage works
    static class StorageException extends RuntimeException {
        StorageException(String message, Throwable cause) {
            super(message, cause);                       // keep the root cause
        }
    }

    // Low-level code that fails with an I/O problem
    static String readFromDisk(String key) throws IOException {
        throw new IOException("disk not mounted");
    }

    static class ProfileRepository {
        String load(String userId) {
            try {
                return readFromDisk("profile-" + userId);
            } catch (IOException e) {
                throw new StorageException("could not load profile " + userId, e);   // translate
            }
        }
    }

    public static void main(String[] args) {
        try {
            new ProfileRepository().load("u7");
        } catch (StorageException e) {
            System.out.println(e.getMessage());
            System.out.println("caused by: " + e.getCause().getMessage());
        }
    }
}
```

**Output:**

```text
could not load profile u7
caused by: disk not mounted
```

This is encapsulation applied to failures: the repository hides **how** it stores data, including how storage fails, while the chained cause keeps the full story for debugging.

## Abstraction and Exceptions

An interface's exceptions are part of its abstraction. Declare exceptions that every implementation can honestly throw:

```java
interface PaymentGateway {
    Receipt charge(Money amount) throws PaymentException;    // abstraction-level exception
}
```

Not `throws SocketTimeoutException, StripeApiException` — that ties the interface to one transport and one vendor. Implementations translate their specific failures into `PaymentException` subclasses.

## Exceptions in Overridden Methods

An override may throw the **same, narrower, fewer or no** checked exceptions, never new or broader ones; unchecked exceptions are unrestricted. So when designing a base type or interface, choose its checked exceptions carefully — implementations cannot add more. Details and examples: [Method Overriding](../../pillars/method-overriding/content.md#exception-rules).

## Exceptions and Constructors

- A constructor that throws means **no object is returned** — the cleanest way to make invalid objects impossible ([Encapsulation](../../pillars/encapsulation/content.md#validation-inside-objects)).
- Validate arguments first, before acquiring resources, so nothing leaks if validation fails.

## Good vs Bad Exception Design

| Bad | Why | Better |
|-----|-----|--------|
| `catch (Exception e) { }` | Swallows every failure, including bugs | Catch the specific type you can handle; otherwise let it propagate |
| `catch (IOException e) { throw new RuntimeException("failed"); }` | Loses the cause and stack trace | `throw new StorageException("failed to save order 17", e);` |
| Log and rethrow at every layer | The same error is logged many times | Log once, where it is finally handled |
| Exceptions for normal control flow (`try { map.get(k).x } catch (NullPointerException e)`) | Slow, obscures logic | Check conditions (`containsKey`, `Optional`) |
| `throws Exception` on public methods | Callers cannot tell what can go wrong | Declare specific exceptions |
| Returning `null` or `-1` to signal failure | Callers forget to check | Throw, or return `Optional` for "absent" results |
| Exposing `SQLException` from a service | Leaks the persistence technology | Translate at the boundary |
| `return` inside `finally` | Discards the exception | Never return from `finally` |

Use **try-with-resources** for anything `AutoCloseable`. If both the body and `close()` throw, the body's exception propagates and the close exception is attached as **suppressed** (`e.getSuppressed()`).

## Real-World Examples

- Spring's `DataAccessException` hierarchy translates vendor-specific SQL errors into a consistent, unchecked hierarchy (`DuplicateKeyException`, `DataIntegrityViolationException`).
- REST APIs map domain exceptions to HTTP status codes in one place (for example a global exception handler: `OrderNotFoundException` → 404).
- `java.io` uses a checked `IOException` hierarchy; `java.time` throws unchecked `DateTimeParseException` for bad input.

## Common Misconceptions

- **"Checked exceptions are better because they are safer."** They force handling, but also clutter every signature; unchecked exceptions are common in modern design.
- **"Catching `Exception` is a safe default."** It hides bugs and catches things you cannot handle.
- **"Custom exceptions are always needed."** Standard exceptions (`IllegalArgumentException`, `IllegalStateException`) cover most precondition failures.
- **"An overriding method can throw any exception."** Not new or broader checked exceptions.
- **"Errors and exceptions are the same."** `Error`s signal JVM-level problems and are not meant to be caught by applications.

## Key Takeaways

- Exceptions are objects in an inheritance hierarchy; `catch` is polymorphic — order handlers from specific to general.
- Checked = must handle or declare (recoverable); unchecked = `RuntimeException` (programming errors); `Error` = JVM problems.
- Custom exceptions: meaningful name, right superclass, message + cause constructors, context fields, immutable.
- Translate low-level exceptions at layer boundaries and keep the cause (exception chaining).
- Interfaces declare abstraction-level exceptions; overrides cannot add checked exceptions.
- Never swallow, never lose the cause, never use exceptions for normal flow.
