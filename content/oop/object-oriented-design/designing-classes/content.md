# Designing Classes from Requirements

## Definition

**Object-oriented design (OOD)** is the activity of turning requirements into a set of classes — each with clear **responsibilities**, **relationships** and **interfaces** — that together implement the required behaviour and can absorb future change. This topic answers the practical question: *"How do I convert a problem statement into classes?"*

## Why It Matters

- Low-level design (LLD) and machine-coding rounds ask exactly this: "Design a parking lot / library / vending machine."
- Interviewers judge the **process** as much as the result: clarifying requirements, choosing entities, assigning responsibilities, justifying relationships and trade-offs.
- Without a process, designs tend to become one huge `Manager` class with data-bag entities around it.

## The Process at a Glance

```text
 1. Clarify requirements        → functional + non-functional, scope, assumptions
 2. Identify entities           → nouns that carry data or rules
 3. Identify responsibilities   → what each must KNOW and DO
 4. Assign responsibilities     → to the class that owns the needed data
 5. Identify relationships      → IS-A, HAS-A (aggregation/composition), uses
 6. Introduce abstractions      → interfaces where behaviour varies or crosses a boundary
 7. Manage dependencies         → inject abstractions; keep the core free of infrastructure
 8. Check design principles     → SOLID, cohesion, coupling, encapsulation
 9. Apply patterns (if needed)  → only where a known problem appears
10. Walk through scenarios      → validate with use cases and extension requests, then code
```

Each step is explained below with one running example.

**Running example — "Course enrolment":**
*Students enrol in courses. Each course has a capacity. If a course is full, the student joins a waitlist and is enrolled automatically when a seat frees up. Students can drop courses. Course fees depend on the student category (regular, scholarship, staff). Students are notified by email or SMS when enrolment succeeds.*

## 1. Identify Requirements

Separate and clarify:

| Kind | From the example | Questions to ask |
|------|------------------|------------------|
| **Functional** | enrol, drop, waitlist, auto-enrol, fee calculation, notification | Can a student enrol twice? Is the waitlist first-come-first-served? Max courses per student? |
| **Non-functional** | (not stated) | How many users? Concurrent enrolments for the last seat? Persistence? |
| **Out of scope** | payments, timetables, grades | Confirm explicitly so the design stays focused |

Write down assumptions: "waitlist is FIFO", "one notification channel per student".

## 2. Identify Entities

Underline **nouns**; keep those that hold data or rules the system must manage.

| Candidate | Keep? | Reason |
|-----------|-------|--------|
| Student | Yes | Identity, category, notification preference |
| Course | Yes | Capacity, enrolled students, waitlist |
| Enrolment | Yes | Links a student to a course; may later hold date, status, fee |
| Waitlist | Yes, as part of `Course` | Its rules (FIFO, auto-promotion) are about one course |
| Fee | As a policy | Varies by category → behaviour, not just data |
| Notification | As a service | Varies by channel; crosses a system boundary |
| Email, SMS | As implementations | Details behind an abstraction |
| Seat | No | Capacity is a number; no seat-specific rules |

Nouns that represent **varying behaviour** (fee rules, channels) become **interfaces/strategies**; nouns that are just attributes (seat, name) become **fields**.

## 3. Identify Responsibilities

For each class, list what it must **know** and **do**. A light-weight tool is the **CRC card** (Class – Responsibilities – Collaborators):

```text
┌──────────────── Course ────────────────┬── Collaborators ──┐
│ knows code, title, capacity            │ Student           │
│ knows enrolled students, waitlist      │                   │
│ enrols a student or waitlists them     │                   │
│ drops a student and promotes the next  │                   │
└────────────────────────────────────────┴───────────────────┘
┌──────────── EnrolmentService ──────────┬── Collaborators ──┐
│ coordinates enrol / drop use cases     │ Course, Student   │
│ computes fee via policy                │ FeePolicy         │
│ triggers notifications                 │ Notifier          │
└────────────────────────────────────────┴───────────────────┘
```

## 4. Assign Responsibilities

The most useful rule: **give a responsibility to the class that has the information needed to fulfil it** (often called the *Information Expert* guideline).

- "Is the course full?" → `Course` knows capacity and enrolled count.
- "Who is next on the waitlist?" → `Course` owns the waitlist.
- "What fee does this student pay?" → depends on the student's category → a `FeePolicy` chosen by category.
- "Send a confirmation" → not the course's business → a `Notifier`.

Warning signs of wrong assignment: a service that pulls five getters out of an object to make a decision the object could make itself (**Feature Envy**, see [Code Smells and Refactoring](../../code-quality/code-smells-and-refactoring/content.md)); entities with only getters/setters (**anaemic model**).

## 5. Identify Relationships

| Relationship | Kind | Why |
|--------------|------|-----|
| Course → Student (enrolled, waitlist) | Association (aggregation) | Students exist independently of any course |
| Student → category | Attribute (enum) | A fixed set of values |
| EnrolmentService → FeePolicy, Notifier | Dependency on abstractions (injected) | Behaviour varies; external boundary |
| ScholarshipFee → FeePolicy | Realization (implements) | One variant of the fee rule |

Prefer **HAS-A** unless an IS-A relationship is permanent and substitutable ([Composition over Inheritance](../../relationships/composition-over-inheritance/content.md)). Choose navigability deliberately — here `Course` knows its students, but `Student` does not need a list of courses yet.

## 6. Introduce Interfaces and Abstraction

Add an interface when **behaviour varies** or when the code **crosses a boundary** you want to isolate or fake:

- `FeePolicy` — regular / scholarship / staff (variation).
- `Notifier` — email / SMS (variation + external boundary).

Do **not** add interfaces for `Course` or `Student` just in case; they have one implementation and no boundary.

## 7. Composition and Dependency Management

- The core (`Course`, `Student`) has **no** dependency on email, SMS or databases.
- `EnrolmentService` receives `FeePolicy` choices and a `Notifier` through its constructor ([Dependency Injection](../../design-principles/dependency-injection/content.md)).
- One composition root wires concrete implementations.

## 8. Check Extensibility, Testability, Cohesion and Coupling

| Check | Question | Example answer |
|-------|----------|----------------|
| High cohesion | Can each class be described without "and"? | `Course` manages its seats and waitlist — one concept |
| Low coupling | Does each class know only what it needs? | The service knows two interfaces, not email libraries |
| Extensibility (OCP) | New category or channel without editing existing classes? | New `FeePolicy` / `Notifier` implementation |
| Testability | Can the service be tested without email? | Pass a recording fake notifier |
| Encapsulation | Can outside code break invariants? | Enrolled list is private; only `enrol`/`drop` change it |

## 9. Apply Design Patterns — Only Where They Fit

- Varying fee rules → **Strategy** ([Strategy](../../design-patterns/strategy-pattern/content.md)).
- "Notify interested parties when a seat frees up" could later use **Observer**.
- Creating the right `FeePolicy` for a category could use a simple map or **Factory**.

Patterns follow problems; never start from a pattern list.

## 10. Validate With Scenarios, Then Code

Walk each use case through the classes ("student enrols in a full course → `Course.enrol` returns WAITLISTED → service notifies…"). Then implement:

```java
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;

public class CourseEnrolmentDesign {

    enum Category { REGULAR, SCHOLARSHIP, STAFF }

    enum Result { ENROLLED, WAITLISTED, ALREADY_PRESENT }

    record Student(String id, String name, Category category) { }

    // Entity with behaviour: owns capacity, enrolment and waitlist rules
    static class Course {
        private final String code;
        private final int capacity;
        private final long baseFeePaise;
        private final List<Student> enrolled = new ArrayList<>();
        private final Deque<Student> waitlist = new ArrayDeque<>();

        Course(String code, int capacity, long baseFeePaise) {
            if (capacity <= 0) {
                throw new IllegalArgumentException("capacity must be positive");
            }
            this.code = code;
            this.capacity = capacity;
            this.baseFeePaise = baseFeePaise;
        }

        Result enrol(Student student) {
            if (enrolled.contains(student) || waitlist.contains(student)) {
                return Result.ALREADY_PRESENT;
            }
            if (enrolled.size() < capacity) {
                enrolled.add(student);
                return Result.ENROLLED;
            }
            waitlist.addLast(student);
            return Result.WAITLISTED;
        }

        /** Drops a student; returns the student promoted from the waitlist, or null. */
        Student drop(Student student) {
            if (!enrolled.remove(student)) {
                waitlist.remove(student);
                return null;
            }
            Student next = waitlist.pollFirst();
            if (next != null) {
                enrolled.add(next);
            }
            return next;
        }

        String code() {
            return code;
        }

        long baseFeePaise() {
            return baseFeePaise;
        }
    }

    // Abstractions for what varies
    interface FeePolicy {
        long feePaise(Course course);
    }

    interface Notifier {
        void notify(Student student, String message);
    }

    // Coordinates use cases; depends only on abstractions
    static class EnrolmentService {
        private final Map<Category, FeePolicy> feePolicies;
        private final Notifier notifier;

        EnrolmentService(Map<Category, FeePolicy> feePolicies, Notifier notifier) {
            this.feePolicies = Map.copyOf(feePolicies);
            this.notifier = notifier;
        }

        void enrol(Student student, Course course) {
            Result result = course.enrol(student);
            if (result == Result.ENROLLED) {
                long fee = feePolicies.get(student.category()).feePaise(course);
                notifier.notify(student, "Enrolled in " + course.code() + ", fee " + fee);
            } else if (result == Result.WAITLISTED) {
                notifier.notify(student, "Waitlisted for " + course.code());
            }
        }

        void drop(Student student, Course course) {
            Student promoted = course.drop(student);
            if (promoted != null) {
                long fee = feePolicies.get(promoted.category()).feePaise(course);
                notifier.notify(promoted, "Moved from waitlist into " + course.code() + ", fee " + fee);
            }
        }
    }

    public static void main(String[] args) {          // composition root
        Map<Category, FeePolicy> fees = Map.of(
            Category.REGULAR, course -> course.baseFeePaise(),
            Category.SCHOLARSHIP, course -> course.baseFeePaise() / 2,
            Category.STAFF, course -> 0L
        );
        Notifier console = (student, message) -> System.out.println(student.name() + ": " + message);
        EnrolmentService service = new EnrolmentService(fees, console);

        Course java = new Course("JAVA101", 2, 300_000);
        Student arun = new Student("S1", "Arun", Category.REGULAR);
        Student banu = new Student("S2", "Banu", Category.SCHOLARSHIP);
        Student charu = new Student("S3", "Charu", Category.STAFF);

        service.enrol(arun, java);
        service.enrol(banu, java);
        service.enrol(charu, java);      // course full → waitlist
        service.drop(arun, java);        // Charu promoted automatically
    }
}
```

**Output:**

```text
Arun: Enrolled in JAVA101, fee 300000
Banu: Enrolled in JAVA101, fee 150000
Charu: Waitlisted for JAVA101
Charu: Moved from waitlist into JAVA101, fee 0
```

## Extension Scenarios to Test Your Design

| New requirement | Change needed |
|-----------------|---------------|
| WhatsApp notifications | New `Notifier` implementation; wiring change |
| Early-bird discount | New `FeePolicy` (or a decorator around existing ones) |
| Prerequisites for courses | `Course` gains a prerequisite rule; or an `EnrolmentRule` list checked by the service |
| Persistence | A `CourseRepository` interface used by the service; `Course` unchanged |
| Concurrent enrolment for the last seat | Make `Course.enrol`/`drop` atomic (synchronise on the course or use database locking) |

If a reasonable extension forces edits in many classes, revisit responsibilities.

## Real-World Interpretation

- In Spring Boot projects the same split appears as **entities** with behaviour, **services** coordinating use cases, **repositories** and **clients** behind interfaces.
- In interviews, talk while designing: state requirements and assumptions, list entities, sketch a class diagram ([UML Class Diagrams](../uml-class-diagrams/content.md)), explain each relationship, then code the core classes.

## Common Misconceptions

- **"Every noun becomes a class."** Nouns can be attributes, enum values or nothing at all.
- **"Start with design patterns."** Start with responsibilities; patterns emerge.
- **"Put logic in services, data in entities."** Rules about an object's own data belong in the object.
- **"A complete design must be drawn before coding."** Sketch, code the core, test scenarios, refine.
- **"More classes means better design."** Each class must earn its place with a responsibility.

## Key Takeaways

- Clarify requirements and scope first; record assumptions.
- Nouns → candidate entities; varying behaviour → interfaces; verbs → responsibilities.
- Assign each responsibility to the class with the needed information; coordinate use cases in thin services.
- Choose relationships by lifecycle and substitutability; prefer composition.
- Check cohesion, coupling, testability and extensibility; apply patterns only where they solve a visible problem.
- Validate with scenarios and extension requests.
