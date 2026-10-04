# Observer — Interview Questions

## Conceptual

### Q1. What is the Observer pattern?

<details>
<summary>Answer</summary>

A behavioral pattern defining a one-to-many dependency: a subject maintains a list of observers implementing a common interface and notifies all of them when its state changes. The subject does not know the observers' concrete types or what they do, so reactions can be added or removed without changing the subject. Example: an order publishes "shipped" and SMS, analytics and loyalty observers react.

</details>

### Q2. What is the difference between the push and pull models?

<details>
<summary>Answer</summary>

In the push model the subject sends the relevant data with the notification (an event object); observers do not need to call back. In the pull model the subject sends only a notification (often itself), and observers query the data they need. Push decouples observers from the subject's API but may send unneeded data; pull gives observers flexibility but couples them to the subject.

</details>

### Q3. What problems can Observer cause?

<details>
<summary>Answer</summary>

Memory leaks when observers are never unsubscribed (the subject keeps them alive); hard-to-follow control flow; unspecified notification order; one failing observer breaking notification of others; slow observers delaying the subject in synchronous designs; and cascades of events triggering further events.

</details>

### Q4. Why is `java.util.Observable` deprecated?

<details>
<summary>Answer</summary>

They were deprecated in Java 9. The JDK documentation explains that the event model they support is quite limited, the order of notifications is unspecified, and state changes are not in one-to-one correspondence with notifications; it points to `java.beans` (property change events), `java.util.concurrent` structures and the `Flow` API instead. Design drawbacks commonly mentioned as well: `Observable` is a class you must extend (using up single inheritance) and notifications carry an untyped `Object` argument. Typed listener interfaces of your own are usually the simplest replacement.

</details>

### Q5. Observer vs publish–subscribe with a message broker?

<details>
<summary>Answer</summary>

The GoF Observer is in-process and the subject holds direct references to its observers. Broker-based pub-sub (Kafka, RabbitMQ) puts a broker between publishers and subscribers: they do not know each other, communication is asynchronous and can cross services and machines, with durability and retries — at the cost of operational complexity and eventual consistency.

</details>

### Q6. Observer vs Mediator?

<details>
<summary>Answer</summary>

Observer broadcasts state changes to any interested subscribers; the subject contains no knowledge of how they react. A mediator knows all its colleagues and contains the coordination logic for how they affect each other. Observer distributes; Mediator orchestrates.

</details>

## Applied

### Q7. How would you implement "notify interested modules when a student's attendance drops below 75%" in a Spring Boot application?

<details>
<summary>Answer</summary>

When attendance is recorded, the attendance service checks the threshold and publishes a domain event, e.g. `LowAttendanceEvent(studentId, percent)`, through `ApplicationEventPublisher`. Separate components with `@EventListener` methods react: one emails parents, one creates a counselling task, one updates a dashboard. The attendance service depends on neither, and new reactions are new listeners. For reliability across failures or services, publish to a message broker instead.

</details>
