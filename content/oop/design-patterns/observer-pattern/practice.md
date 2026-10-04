# Observer — Practice

### P1. Recognise it

**Difficulty:** Easy · **Type:** MCQ

Which is an example of the Observer pattern?

- A) `button.addActionListener(e -> save())`
- B) `new BufferedReader(reader)`
- C) `List.of(1, 2, 3)`
- D) `Collections.sort(list, comparator)`

<details>
<summary>Answer</summary>

**Answer:** A

**Explanation:** The button (subject) notifies registered listeners (observers) when clicked. B is a decorator, C a static factory, D a strategy.

</details>

### P2. Output with unsubscription

**Difficulty:** Medium · **Type:** Output-based

```java
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

public class PriceAlerts {

    static class Stock {
        private final List<Consumer<Integer>> watchers = new ArrayList<>();

        void watch(Consumer<Integer> watcher) {
            watchers.add(watcher);
        }

        void unwatch(Consumer<Integer> watcher) {
            watchers.remove(watcher);
        }

        void setPrice(int price) {
            for (Consumer<Integer> watcher : List.copyOf(watchers)) {
                watcher.accept(price);
            }
        }
    }

    public static void main(String[] args) {
        Stock stock = new Stock();
        Consumer<Integer> logger = p -> System.out.println("log " + p);
        Consumer<Integer> alert = p -> {
            if (p > 100) {
                System.out.println("ALERT " + p);
            }
        };
        stock.watch(logger);
        stock.watch(alert);
        stock.setPrice(90);
        stock.setPrice(120);
        stock.unwatch(logger);
        stock.setPrice(130);
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
log 90
log 120
ALERT 120
ALERT 130
```

**Explanation:** Both observers receive the first two prices (the alert stays silent at 90). After `unwatch(logger)`, only the alert observer runs. Iterating over a copy lets observers unsubscribe during notification safely.

</details>

### P3. Design

**Difficulty:** Hard · **Type:** Design

A library system must, when a reserved book is returned: notify the next member in the reservation queue, update the "available books" display and record an audit entry. A teammate proposes calling all three from `Library.returnBook()`. Propose an Observer-based design and one risk to handle.

<details>
<summary>Answer</summary>

**Design:** `Library.returnBook()` updates the loan and publishes `BookReturned(copyId, isbn, returnedAt)` to a `BookEventPublisher`. Observers: `ReservationNotifier`, `AvailabilityDisplay`, `AuditLogger`, each implementing `BookEventListener`. `Library` depends only on the publisher interface.

**Risk to handle:** observer failures and ordering — for example, if `ReservationNotifier` throws, the display and audit must still run (isolate failures per listener), and the audit entry should not depend on notification order. For durability (audit must never be lost), write the audit in the same transaction or use a reliable outbox/broker.

</details>
