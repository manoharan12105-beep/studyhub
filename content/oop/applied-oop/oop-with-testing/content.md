# OOP with Testing

> [!NOTE]
> This topic is about designing classes that are **easy to test**. It is not a JUnit or Mockito tutorial; the examples use plain Java so the ideas stand on their own.

## Definition

A class is **testable** when you can create it in isolation, give it controlled inputs and collaborators, run one behaviour, and check the result — quickly and deterministically. **Unit testing** checks one unit (usually one class or a small group) in isolation from slow or unpredictable dependencies such as databases, networks, clocks and random numbers. Testability is mostly a consequence of good OOP design: loose coupling, dependency injection, small responsibilities and immutability.

## Why It Matters

- Code that is hard to test is usually hard to change: the same coupling that blocks a test blocks reuse and modification.
- Interviewers ask "How would you test this class?" to check whether your design separates concerns.
- Backend frameworks (Spring) are built around constructor injection precisely so classes can be tested with fake collaborators.

## The Unit-Testing Idea

Every unit test follows **Arrange – Act – Assert**:

1. **Arrange:** create the object under test and its collaborators (often fakes).
2. **Act:** call the one behaviour being tested.
3. **Assert:** check the returned value, the object's new state, or what it asked its collaborators to do.

Good unit tests are **fast** (milliseconds), **isolated** (no shared state between tests), **repeatable** (same result every run), and **focused** (one behaviour each).

## What Makes a Class Hard to Test

```java
import java.time.DayOfWeek;
import java.time.LocalDate;

class SmtpEmailSender {
    void send(String to, String body) {
        // connects to a real mail server
    }
}

class ReminderService {
    private final SmtpEmailSender sender = new SmtpEmailSender();   // hard-wired dependency

    String sendWeeklyReminder(String email) {
        if (LocalDate.now().getDayOfWeek() != DayOfWeek.MONDAY) {    // hidden dependency on the real clock
            return "skipped";
        }
        sender.send(email, "Weekly reminder");                       // real email in every test run
        return "sent";
    }
}
```

| Problem | Effect on tests |
|---------|-----------------|
| `new SmtpEmailSender()` inside the class | Cannot replace it; every test sends real email (or fails without a mail server) |
| `LocalDate.now()` | The result depends on the day the test runs; Monday-only logic cannot be tested on Tuesday |
| Concrete class dependency | No seam to substitute a fake |

Other common obstacles: static calls to infrastructure (`Database.save(...)`), singletons with global state, long methods doing many things, logic hidden in constructors, and side effects without return values.

## Designing for Testability

### Depend on interfaces and inject dependencies

```java
import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

public class TestableReminderDemo {

    interface EmailSender {                                   // abstraction (seam)
        void send(String to, String body);
    }

    static class ReminderService {
        private final EmailSender sender;
        private final Clock clock;

        ReminderService(EmailSender sender, Clock clock) {    // constructor injection
            this.sender = sender;
            this.clock = clock;
        }

        String sendWeeklyReminder(String email) {
            if (LocalDate.now(clock).getDayOfWeek() != DayOfWeek.MONDAY) {
                return "skipped";
            }
            sender.send(email, "Weekly reminder");
            return "sent";
        }
    }

    // A hand-written fake that records what it was asked to do
    static class RecordingEmailSender implements EmailSender {
        final List<String> sentTo = new ArrayList<>();

        @Override
        public void send(String to, String body) {
            sentTo.add(to);
        }
    }

    static Clock fixedClock(String isoDate) {
        return Clock.fixed(Instant.parse(isoDate + "T09:00:00Z"), ZoneOffset.UTC);
    }

    static void check(boolean condition, String testName) {
        System.out.println((condition ? "PASS " : "FAIL ") + testName);
    }

    public static void main(String[] args) {
        // Test 1: on a Monday, one email is sent
        RecordingEmailSender fake = new RecordingEmailSender();                      // arrange
        ReminderService monday = new ReminderService(fake, fixedClock("2026-10-05")); // 5 Oct 2026 is a Monday
        String result = monday.sendWeeklyReminder("a@example.com");                  // act
        check(result.equals("sent") && fake.sentTo.equals(List.of("a@example.com")), // assert
              "sends on Monday");

        // Test 2: on any other day, nothing is sent
        RecordingEmailSender fake2 = new RecordingEmailSender();
        ReminderService tuesday = new ReminderService(fake2, fixedClock("2026-10-06"));
        check(tuesday.sendWeeklyReminder("a@example.com").equals("skipped") && fake2.sentTo.isEmpty(),
              "skips other days");
    }
}
```

**Output:**

```text
PASS sends on Monday
PASS skips other days
```

What changed:

- The service depends on an **interface** (`EmailSender`), not a concrete SMTP class — [Dependency Inversion](../../design-principles/dependency-inversion-principle/content.md).
- Dependencies arrive through the **constructor** — [Dependency Injection](../../design-principles/dependency-injection/content.md). Production passes the real sender and `Clock.systemDefaultZone()`; tests pass a fake and a fixed clock.
- **Time** is a dependency like any other (`java.time.Clock`). The same applies to random numbers (`Random` with a seed, or an injected supplier) and ids (an `IdGenerator` interface).

## Test Doubles: Mocks, Stubs and Fakes

A **test double** is any object that stands in for a real collaborator in a test.

| Kind | What it does | Example |
|------|--------------|---------|
| **Dummy** | Passed but never used | A `null`-object logger to satisfy a constructor |
| **Stub** | Returns canned answers | `ExchangeRateProvider` that always returns 83.0 |
| **Fake** | A working lightweight implementation | `InMemoryUserRepository` backed by a `HashMap` |
| **Spy** | Records how it was called (often also stubs) | `RecordingEmailSender` above |
| **Mock** | Pre-programmed with expectations, verifies calls | Created with a mocking library: "expect `send` called once with this address" |

**Mocking** means replacing a dependency with a test double so the unit can be tested in isolation and so interactions can be verified. Libraries such as Mockito generate doubles automatically, but they work only because the class under test has a **seam**: an injectable dependency, usually typed as an interface.

Use doubles for **slow or external** collaborators (databases, HTTP, email, clocks). Do **not** mock simple value objects or the class you are testing; over-mocking makes tests fragile and tied to implementation details.

## Immutable Objects and Testing

Immutable objects are the easiest things to test:

- Construction validates once; a test only needs `new Money(…)` and an assertion.
- No hidden state changes between steps, so tests do not depend on call order.
- They can be shared between tests safely.
- `equals` by value (records) makes assertions simple: `assert result.equals(new Money(500, "INR"))`.

Pushing logic into **pure methods** on immutable values (input → output, no side effects) leaves only a thin layer of code that needs doubles at all.

## SOLID and Testability

| Principle | Effect on tests |
|-----------|-----------------|
| **Single Responsibility** | Small classes with one reason to change need few, focused tests |
| **Open/Closed** | New behaviour in new classes means old tests keep passing untouched |
| **Liskov Substitution** | Tests written against an interface can run against every implementation (contract tests) |
| **Interface Segregation** | Small interfaces are easy to fake — a fake implements two methods, not twenty |
| **Dependency Inversion** | Depending on abstractions creates the seams that doubles plug into |

## Checklist: Designing Classes That Are Easy to Test

- Pass dependencies in through the constructor; avoid `new` for collaborators inside business classes.
- Depend on interfaces for anything slow, external or nondeterministic (time, randomness, I/O).
- Avoid static mutable state and singletons holding state.
- Keep constructors simple: assign and validate, do not do I/O.
- Return values or observable state from methods, rather than only producing side effects.
- Keep classes small and focused; a test needing ten collaborators signals too many responsibilities.
- Separate decision logic (pure, easy to test) from orchestration (calling collaborators).

## Real-World Examples

- Spring Boot services with constructor injection are unit-tested by calling the constructor with fakes or Mockito mocks; no Spring context needed.
- Payment code depends on a `PaymentGateway` interface; tests use a fake gateway that can simulate success, decline and timeout.
- `Clock` injection makes "expire after 30 days" logic testable without waiting 30 days.

## Common Misconceptions

- **"Testability requires a framework."** It requires design: seams and injected dependencies. Frameworks only reduce boilerplate.
- **"Mock everything."** Mock slow or external collaborators; use real value objects and simple classes.
- **"Making a class testable makes it worse for production."** The same seams make it easier to change and extend.
- **"Private methods should be tested directly."** Test them through the public behaviour; if that is hard, the class may have too many responsibilities.

## Key Takeaways

- Testable = can be built in isolation with controlled collaborators and checked deterministically.
- Hard-wired `new`, static calls, hidden clocks and global state are the main obstacles.
- Constructor injection + interfaces create seams for test doubles (stubs, fakes, spies, mocks).
- Immutable values and pure methods need almost no setup to test.
- Applying SOLID usually makes classes testable as a side effect.
