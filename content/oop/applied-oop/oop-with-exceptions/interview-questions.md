# OOP with Exceptions — Interview Questions

## Conceptual

### Q1. What is the difference between checked and unchecked exceptions?

<details>
<summary>Answer</summary>

Checked exceptions are subclasses of `Exception` other than `RuntimeException`; the compiler requires callers to catch them or declare them with `throws`. They represent recoverable conditions outside the program's control (`IOException`). Unchecked exceptions are `RuntimeException` and its subclasses; the compiler does not force handling. They usually indicate programming errors or violated preconditions (`NullPointerException`, `IllegalArgumentException`). `Error`s are also unchecked but signal JVM-level problems.

</details>

### Q2. How do you create a custom exception? When should you?

<details>
<summary>Answer</summary>

Extend `Exception` (checked) or `RuntimeException` (unchecked), and provide constructors taking a message and optionally a cause, calling `super(message, cause)`. Add fields for context (`orderId`, `shortfall`) and keep them immutable. Create one when a failure is meaningful in the domain and callers may handle it specifically, or when it should carry data. If a standard exception (`IllegalArgumentException`, `IllegalStateException`) already describes the problem, use it.

</details>

### Q3. What is exception chaining (wrapping) and why is it important?

<details>
<summary>Answer</summary>

Throwing a new, higher-level exception while passing the original as its cause: `throw new StorageException("load failed", e)`. It lets a layer hide its implementation details (encapsulation) while keeping the root cause and its stack trace available via `getCause()` for debugging. Throwing a new exception without the cause destroys that information.

</details>

### Q4. Why should you not catch `Exception` (or `Throwable`) broadly?

<details>
<summary>Answer</summary>

It catches everything, including programming errors you cannot sensibly handle (`NullPointerException`) and, for `Throwable`, JVM `Error`s. Broad catches tend to hide bugs, especially when combined with empty or log-only handlers. Catch the specific exceptions you can handle; let others propagate to a single top-level handler that logs and reports them.

</details>

### Q5. What rules apply to exceptions when overriding methods?

<details>
<summary>Answer</summary>

The overriding method may declare the same checked exceptions, narrower ones, fewer, or none — but not new or broader checked exceptions, because callers using the parent type only handle what the parent declares. Unchecked exceptions are unrestricted. Consequently, interfaces should declare abstraction-level exceptions that every implementation can live with.

</details>

### Q6. Why does the order of `catch` blocks matter?

<details>
<summary>Answer</summary>

Catch blocks are tried in order and a handler for a superclass also catches all its subclasses. If a superclass catch comes first, a later subclass catch can never run, and the compiler reports it as unreachable. Order handlers from most specific to most general.

</details>

## Applied

### Q7. A `UserService.register()` method lets a `java.sql.SQLIntegrityConstraintViolationException` propagate when an email is already used. What is wrong and how would you improve it?

<details>
<summary>Answer</summary>

The service leaks its persistence technology: callers (controllers, other services) now depend on SQL details, and switching storage would change the service's contract. The message is also meaningless to the business layer. Catch it in the repository or service and throw a domain exception such as `EmailAlreadyRegisteredException(email)` with the original as cause; the web layer can map that to a clear "409 Conflict" response. Better still, check for an existing email first and keep the constraint violation as a safety net.

</details>

### Q8. What does this print?

```java
public class CatchOrder {

    static void risky(int n) throws Exception {
        if (n == 1) {
            throw new IllegalArgumentException("bad argument");
        }
        if (n == 2) {
            throw new java.io.FileNotFoundException("missing.txt");
        }
        throw new Exception("generic");
    }

    public static void main(String[] args) {
        for (int n = 1; n <= 3; n++) {
            try {
                risky(n);
            } catch (RuntimeException e) {
                System.out.println("runtime: " + e.getMessage());
            } catch (java.io.IOException e) {
                System.out.println("io: " + e.getMessage());
            } catch (Exception e) {
                System.out.println("other: " + e.getMessage());
            }
        }
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
runtime: bad argument
io: missing.txt
other: generic
```

`IllegalArgumentException` is a `RuntimeException`; `FileNotFoundException` is an `IOException`; the plain `Exception` falls to the last handler. Each exception goes to the first catch whose type it IS-A.

</details>
