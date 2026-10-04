# Template Method

**Category:** Behavioral · **Interview priority:** Core

## Intent

Define the **skeleton of an algorithm** in a base-class method, deferring some **steps** to subclasses. Subclasses redefine certain steps without changing the algorithm's overall structure.

## The Problem

A college ERP imports data from uploaded files: student lists, fee payments, exam marks. Every import follows the same steps:

1. read rows,
2. skip blank rows,
3. validate each row (rules differ per import),
4. convert a row to a domain object (differs),
5. save valid objects,
6. print a summary (and optionally notify someone).

The order of steps and the error accounting must be identical for every import.

## Why the Naive Solution Fails

- Copy-pasting the workflow into `StudentImport`, `FeeImport` and `MarksImport` duplicates the loop, error counting and summary; a fix to one copy (say, trimming whitespace) is forgotten in the others.
- One big `importFile(type)` method with `switch (type)` in the validate and convert steps mixes all import types together.

## The Pattern Idea

Put the **invariant workflow** in a `final` method of an abstract base class — the **template method**. Express the varying steps as **abstract methods** (subclasses must implement them) and optional variations as **hook methods** (with a default, subclasses may override). The base class calls the steps; subclasses fill them in. This is the "Hollywood principle": *don't call us, we'll call you*.

## Structure

```text
 «abstract» CsvImporter<T>
 + importRows(rows): Summary   ← template method (final): fixed order of steps
 # validate(row): String       ← abstract step (null = valid, else error message)
 # convert(row): T             ← abstract step
 # save(T)                     ← abstract step
 # afterImport(summary)        ← hook (default: do nothing)
          ▲                         ▲
 StudentImporter            FeePaymentImporter     (concrete classes fill in steps)
```

| Participant | Role |
|-------------|------|
| AbstractClass | Defines the template method and the step methods |
| ConcreteClass | Implements abstract steps; optionally overrides hooks |

## Java Implementation

```java
import java.util.ArrayList;
import java.util.List;

public class TemplateMethodDemo {

    record Summary(int imported, int skipped, List<String> errors) { }

    abstract static class CsvImporter<T> {

        // Template method: final, so subclasses cannot change the order of steps
        public final Summary importRows(List<String> rows) {
            int imported = 0;
            int skipped = 0;
            List<String> errors = new ArrayList<>();
            for (String raw : rows) {
                String row = raw.trim();
                if (row.isEmpty()) {
                    skipped++;
                    continue;
                }
                String[] fields = row.split(",");
                String error = validate(fields);
                if (error != null) {
                    errors.add(row + " -> " + error);
                    continue;
                }
                save(convert(fields));
                imported++;
            }
            Summary summary = new Summary(imported, skipped, errors);
            afterImport(summary);
            return summary;
        }

        protected abstract String validate(String[] fields);   // step: must implement

        protected abstract T convert(String[] fields);         // step: must implement

        protected abstract void save(T item);                  // step: must implement

        protected void afterImport(Summary summary) {          // hook: optional
        }
    }

    record Student(String roll, String name) { }

    static class StudentImporter extends CsvImporter<Student> {
        final List<Student> saved = new ArrayList<>();

        protected String validate(String[] f) {
            if (f.length != 2) {
                return "expected roll,name";
            }
            return f[0].matches("\\d{2}[A-Z]{2}\\d{3}") ? null : "bad roll number";
        }

        protected Student convert(String[] f) {
            return new Student(f[0], f[1].trim());
        }

        protected void save(Student s) {
            saved.add(s);
        }
    }

    record FeePayment(String roll, long amount) { }

    static class FeePaymentImporter extends CsvImporter<FeePayment> {
        long totalCollected = 0;

        protected String validate(String[] f) {
            if (f.length != 2) {
                return "expected roll,amount";
            }
            try {
                return Long.parseLong(f[1].trim()) > 0 ? null : "amount must be positive";
            } catch (NumberFormatException e) {
                return "amount not a number";
            }
        }

        protected FeePayment convert(String[] f) {
            return new FeePayment(f[0], Long.parseLong(f[1].trim()));
        }

        protected void save(FeePayment p) {
            totalCollected += p.amount();
        }

        @Override
        protected void afterImport(Summary summary) {           // hook used only here
            System.out.println("  notify accounts: Rs " + totalCollected + " collected");
        }
    }

    public static void main(String[] args) {
        StudentImporter students = new StudentImporter();
        Summary s1 = students.importRows(List.of("22CS101,Aditi", "  ", "22CS1X2,Bharani", "22EC205,Charles"));
        System.out.println("students: " + s1);

        FeePaymentImporter fees = new FeePaymentImporter();
        Summary s2 = fees.importRows(List.of("22CS101,45000", "22EC205,abc", "22ME310,-5"));
        System.out.println("fees: " + s2);
    }
}
```

**Output:**

```text
students: Summary[imported=2, skipped=1, errors=[22CS1X2,Bharani -> bad roll number]]
  notify accounts: Rs 45000 collected
fees: Summary[imported=1, skipped=0, errors=[22EC205,abc -> amount not a number, 22ME310,-5 -> amount must be positive]]
```

The workflow (trimming, skipping blanks, error collection, summary) exists once; each importer supplies only what differs.

## Execution Flow

1. The client calls `importRows` on a concrete importer (typed as the base class).
2. The template method runs the fixed sequence.
3. At each step it calls an abstract method or hook — dynamically dispatched to the subclass.

## Real-World Examples

- `java.util.AbstractList`: implement `get(int)` and `size()`; inherited methods such as `indexOf`, `iterator`, `equals` are template methods built on them.
- `java.io.InputStream.read(byte[], int, int)` is implemented in terms of the abstract `read()`.
- Servlets: `HttpServlet.service()` dispatches to `doGet`/`doPost` that subclasses override.
- Test frameworks' lifecycle (set up → test → tear down); Spring's `JdbcTemplate`/`TransactionTemplate` apply the same "fixed skeleton, variable step" idea with callbacks instead of subclassing.

## When to Use

- Several classes share the same algorithm structure and differ in a few steps.
- The order of steps must be enforced (security checks, transactions, resource cleanup).
- You build a framework that calls user code at defined extension points.

## When Not to Use

- Steps vary independently and combine in many ways — subclass explosion; prefer Strategy (composition).
- The variants need to change at runtime — inheritance is fixed per class.
- The base class would need many abstract steps, forcing subclasses to implement things they do not care about.

## Advantages

- Removes duplicated workflow code (DRY); the skeleton is enforced.
- Clear extension points (abstract steps, hooks).
- Easy for subclasses: implement a few methods.

## Disadvantages

- Based on inheritance: subclasses are coupled to the base class (fragile base class risk).
- Only one dimension of variation per hierarchy; harder to change behaviour at runtime.
- Flow is spread between base class and subclass; can be harder to follow.
- LSP: overriding steps incorrectly can break the template's assumptions.

## Related Patterns

- **Strategy:** varies the algorithm by composition (inject an object); Template Method varies steps by inheritance. A template method can delegate a step to a strategy to combine both.
- **Factory Method** is often a step inside a template method.
- **Hooks** in frameworks are the template method's optional steps.

## SOLID Connection

- **OCP:** new variants by subclassing; the skeleton is not modified.
- **DRY / SRP:** the workflow is written once in the base class.
- **LSP:** subclasses must implement steps in ways the template expects.
- Uses inheritance deliberately — follow the advice of [Composition over Inheritance](../../relationships/composition-over-inheritance/content.md) when variation grows.

## Common Mistakes

- Not making the template method `final`, so a subclass overrides the whole algorithm.
- Making steps `public` (they should be `protected`; clients call only the template).
- Too many abstract steps; prefer hooks with defaults where possible.
- Calling overridable steps from the base-class constructor.

## Key Takeaways

- Template Method: a `final` method fixes the algorithm; subclasses implement abstract steps and optional hooks.
- Removes duplicated workflows and enforces step order.
- Inheritance-based: good for a fixed skeleton with a few variations; use Strategy when steps vary independently or at runtime.
- JDK examples: `AbstractList`, `InputStream`, `HttpServlet`.
