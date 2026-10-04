# Composition over Inheritance

## Definition

**Composition over inheritance** is the design guideline: *to reuse or vary behaviour, prefer giving an object a part (HAS-A) that it delegates to, rather than making it a subclass (IS-A).* Use inheritance when the IS-A relationship is real and the superclass was designed for extension; otherwise compose.

**Delegation** is the mechanism: the outer object forwards a call to the part, possibly adding its own logic before or after.

## Why It Matters

Inheritance is the first reuse tool beginners learn, and it creates problems that only appear as systems grow:

- **Tight coupling:** a subclass depends on the superclass's implementation, not only its contract (the fragile base class problem).
- **Fixed at compile time:** an object cannot change its superclass at runtime.
- **Unwanted inheritance:** the subclass gets every public method of the parent, wanted or not.
- **Class explosion:** variation along several independent dimensions multiplies subclasses.

Composition avoids all four. It is also the foundation of many design patterns — Strategy, Decorator, State, Bridge, Composite, Proxy.

## The Class Explosion Problem

Reports vary by **content** (sales, inventory) and by **output format** (PDF, Excel):

```text
 Inheritance:                                  Composition:
 Report                                        Report ──has──▶ Formatter
  ├── SalesPdfReport                             ├── SalesReport       ├── PdfFormatter
  ├── SalesExcelReport                           └── InventoryReport   └── ExcelFormatter
  ├── InventoryPdfReport
  └── InventoryExcelReport                     2 reports + 2 formats = 4 classes.
                                               CSV adds 1 class; a new report adds 1.
 2 reports × 2 formats = 4 classes.
 CSV adds 2 classes; a new report adds 3.
```

Every new dimension (say, delivery by email or download) multiplies the inheritance tree again, while composition just adds one more part. This is the problem the [Bridge](../../design-patterns/bridge-pattern/content.md) pattern addresses.

## Refactoring from Inheritance to Composition

### Bad design: behaviour chosen by subclassing

```java
class Employee {
    protected final String name;
    protected final long monthlySalary;

    Employee(String name, long monthlySalary) {
        this.name = name;
        this.monthlySalary = monthlySalary;
    }

    long monthlyPay() {
        return monthlySalary;
    }

    int paidLeaveDays() {
        return 24;
    }
}

class PartTimeEmployee extends Employee {
    private final long hourlyRate;
    private final int hours;

    PartTimeEmployee(String name, long hourlyRate, int hours) {
        super(name, 0);                          // a salary that means nothing for this subclass
        this.hourlyRate = hourlyRate;
        this.hours = hours;
    }

    @Override
    long monthlyPay() {
        return hourlyRate * hours;
    }

    @Override
    int paidLeaveDays() {                        // override just to switch the feature off
        return 0;
    }
}

class Contractor extends Employee {
    private final long hourlyRate;
    private final int hours;

    Contractor(String name, long hourlyRate, int hours) {
        super(name, 0);
        this.hourlyRate = hourlyRate;
        this.hours = hours;
    }

    @Override
    long monthlyPay() {                          // same hourly logic, duplicated
        return hourlyRate * hours;
    }

    @Override
    int paidLeaveDays() {                        // same "no leave" rule, duplicated
        return 0;
    }
}
```

### Problem

- Hourly pay and "no paid leave" are duplicated: inheritance can share code only **down one branch** of the tree.
- Subclasses inherit a `monthlySalary` field they cannot use and override methods just to disable them — signs that the IS-A relationship is shaky.
- When a contractor becomes full-time, the object cannot change its class. The program must create a new `Employee` and copy data, breaking every reference to the old object.
- A new dimension (say, a different bonus scheme) would multiply subclasses again.

### Better design: compose policies

```java
interface PayPolicy {
    long monthlyPay();
}

interface LeavePolicy {
    int paidLeaveDays();
}

class FixedSalary implements PayPolicy {
    private final long monthlySalary;

    FixedSalary(long monthlySalary) {
        this.monthlySalary = monthlySalary;
    }

    public long monthlyPay() {
        return monthlySalary;
    }
}

class HourlyPay implements PayPolicy {
    private final long hourlyRate;
    private final int hours;

    HourlyPay(long hourlyRate, int hours) {
        this.hourlyRate = hourlyRate;
        this.hours = hours;
    }

    public long monthlyPay() {
        return hourlyRate * hours;
    }
}

class StandardLeave implements LeavePolicy {
    public int paidLeaveDays() {
        return 24;
    }
}

class NoPaidLeave implements LeavePolicy {
    public int paidLeaveDays() {
        return 0;
    }
}

class Employee {
    private final String name;
    private PayPolicy payPolicy;                 // HAS-A
    private LeavePolicy leavePolicy;             // HAS-A

    Employee(String name, PayPolicy payPolicy, LeavePolicy leavePolicy) {
        this.name = name;
        this.payPolicy = payPolicy;
        this.leavePolicy = leavePolicy;
    }

    String summary() {                           // delegation to the parts
        return name + ": pay=" + payPolicy.monthlyPay() + ", leave=" + leavePolicy.paidLeaveDays();
    }

    void convertToFullTime(long monthlySalary) { // same object, new behaviour
        this.payPolicy = new FixedSalary(monthlySalary);
        this.leavePolicy = new StandardLeave();
    }
}

public class CompositionOverInheritance {
    public static void main(String[] args) {
        Employee anitha = new Employee("Anitha", new FixedSalary(60_000), new StandardLeave());
        Employee ravi = new Employee("Ravi", new HourlyPay(400, 60), new NoPaidLeave());

        System.out.println(anitha.summary());
        System.out.println(ravi.summary());

        ravi.convertToFullTime(45_000);
        System.out.println(ravi.summary());
    }
}
```

**Output:**

```text
Anitha: pay=60000, leave=24
Ravi: pay=24000, leave=0
Ravi: pay=45000, leave=24
```

### Why it is better

- Each policy is written **once** and can be combined freely: hourly pay with standard leave is one constructor call, not a new subclass.
- New policies (`CommissionPay`) are new classes; `Employee` does not change (Open/Closed).
- Behaviour changes **at runtime** on the same object, so references held elsewhere (payroll, reports) stay valid.
- `Employee` depends only on two small interfaces, so each policy can be tested alone.

This is exactly the [Strategy](../../design-patterns/strategy-pattern/content.md) pattern.

## Delegation: Reusing a Class Without Extending It

To reuse an existing class (especially one you do not control), hold it and **forward** to it. The classic case is wrapping a collection to add behaviour:

```java
import java.util.ArrayList;
import java.util.List;

public class ForwardingExample {

    interface Inbox {
        void receive(String message);
        List<String> messages();
    }

    static class SimpleInbox implements Inbox {
        private final List<String> messages = new ArrayList<>();

        public void receive(String message) {
            messages.add(message);
        }

        public List<String> messages() {
            return List.copyOf(messages);
        }
    }

    // Adds spam filtering by delegation; works with ANY Inbox implementation
    static class SpamFilteringInbox implements Inbox {
        private final Inbox delegate;
        private int blocked = 0;

        SpamFilteringInbox(Inbox delegate) {
            this.delegate = delegate;
        }

        public void receive(String message) {
            if (message.toLowerCase().contains("lottery")) {
                blocked++;
                return;
            }
            delegate.receive(message);
        }

        public List<String> messages() {
            return delegate.messages();
        }

        int blocked() {
            return blocked;
        }
    }

    public static void main(String[] args) {
        SpamFilteringInbox inbox = new SpamFilteringInbox(new SimpleInbox());
        inbox.receive("Meeting at 10");
        inbox.receive("You won a LOTTERY");
        inbox.receive("Invoice attached");
        System.out.println(inbox.messages() + " blocked=" + inbox.blocked());
    }
}
```

**Output:**

```text
[Meeting at 10, Invoice attached] blocked=1
```

The filter depends only on the `Inbox` contract, so `SimpleInbox` can change its internals freely — the fragile base class problem does not arise. Wrapping an object that has the same interface is the [Decorator](../../design-patterns/decorator-pattern/content.md) pattern.

## Inheritance vs Composition

| Aspect | Inheritance | Composition |
|--------|-------------|-------------|
| Relationship | IS-A | HAS-A |
| Reuse | White-box: subclass sees protected internals | Black-box: only the part's public interface |
| Coupling | High; fragile base class risk | Low |
| Flexibility | Fixed at compile time | Parts can be swapped at runtime |
| Variation along several dimensions | Class explosion | Combine independent parts |
| Code to write | Less: methods are inherited automatically | More: forwarding methods |
| Polymorphism | Built in (subclass is a subtype) | Via shared interfaces |
| Testing | Must test through the hierarchy | Parts testable alone; easy to fake |

## When Inheritance Is Still the Right Choice

"Prefer" does not mean "never":

- A true, permanent IS-A where substitution holds everywhere (`IOException` → `FileNotFoundException`).
- Frameworks and abstract base classes **designed** for extension, with documented hooks (`AbstractList`, `HttpServlet`, a template method base class).
- Small, closed hierarchies within one module, maintained by one team.
- Sealed hierarchies modelling a fixed set of variants ([Modern Java OOP Features](../../java-oop/modern-java-oop/content.md)).

A practical approach: **define the type with an interface**, **share implementation with composition** (or an abstract skeletal class when it truly helps).

## Real-World Examples

- `java.util.HashSet` is implemented with a private `HashMap` (composition), not by extending it.
- `Collections.unmodifiableList(list)` and `Collections.synchronizedList(list)` wrap any list (delegation/decorator).
- `java.io` streams compose: `new BufferedReader(new InputStreamReader(socketStream))`.
- Spring services have their repositories and clients injected (HAS-A), rather than extending base service classes.
- Game engines use component systems: an entity *has* position, physics and rendering components instead of deep class trees.

## Common Misconceptions

- **"Composition over inheritance means inheritance is bad."** It means inheritance is a specialised tool, not the default reuse mechanism.
- **"Composition gives no polymorphism."** Combine it with interfaces: both the wrapper and the wrapped implement the same interface.
- **"Composition is just aggregation."** In this guideline, "composition" means any HAS-A + delegation, whether the part is owned (composition) or shared (aggregation).
- **"Composition always means more code."** Forwarding methods add lines, but remove duplicated overrides and subclass explosions.

## Key Takeaways

- Reuse and vary behaviour by holding parts and delegating, not by subclassing.
- Composition avoids fragile base classes, class explosion and inherited methods you do not want, and allows runtime changes.
- Pair composition with interfaces to keep polymorphism.
- Keep inheritance for genuine IS-A relationships and base classes designed for extension.
- Strategy, Decorator, State, Bridge and Proxy are composition in pattern form.
