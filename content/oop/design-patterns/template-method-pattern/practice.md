# Template Method — Practice

### P1. Identify the template method

**Difficulty:** Easy · **Type:** MCQ

```java
abstract class Examination {
    final void conduct() {
        distributePapers();
        writeExam();
        collectPapers();
        if (needsViva()) {
            conductViva();
        }
    }

    void distributePapers() { }
    abstract void writeExam();
    void collectPapers() { }
    boolean needsViva() { return false; }
    void conductViva() { }
}
```

Which method is the template method and which is a hook that changes the flow?

- A) `writeExam` is the template; `collectPapers` is a hook
- B) `conduct` is the template; `needsViva` is a hook
- C) `conductViva` is the template; `distributePapers` is a hook
- D) There is no template method

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** `conduct` fixes the sequence; `needsViva` has a default (`false`) that a `LabExamination` subclass may override to add the viva step. `writeExam` is the abstract step every subclass must implement.

</details>

### P2. Output

**Difficulty:** Medium · **Type:** Output-based

```java
public class ReportTemplate {

    abstract static class Report {
        final String render() {
            return header() + "|" + body() + "|" + footer();
        }

        String header() {
            return "HEAD";
        }

        abstract String body();

        String footer() {
            return "END";
        }
    }

    static class SalesReport extends Report {
        String body() {
            return "sales";
        }

        @Override
        String footer() {
            return "page 1";
        }
    }

    public static void main(String[] args) {
        Report r = new SalesReport();
        System.out.println(r.render());
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
HEAD|sales|page 1
```

**Explanation:** `render` is fixed; it calls the inherited `header`, the implemented `body` and the overridden `footer` through dynamic dispatch.

</details>

### P3. Choose the pattern

**Difficulty:** Hard · **Type:** Scenario

Payment processing always does: validate → reserve funds → charge → record → notify. Charging differs per provider (UPI, card, wallet), and notification differs per customer preference (SMS, email, push), in any combination. Template Method, Strategy, or both?

<details>
<summary>Answer</summary>

**Answer:** Both, used for different things. Keep the fixed sequence in one place (a template method, or a service method that enforces the order), but inject **strategies** for charging (`PaymentProvider`) and notification (`Notifier`).

**Why:** subclassing for every provider × channel combination (Template Method alone) would explode into 3 × 3 subclasses. Composition handles the two independent dimensions; the template guarantees the order.

</details>
