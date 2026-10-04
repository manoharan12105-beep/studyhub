# Designing Classes from Requirements — Practice

### P1. Nouns to classes

**Difficulty:** Easy · **Type:** Design

"A gym has members who book fitness classes. Each class has a trainer, a time slot and a maximum of 20 participants." Which nouns become classes, which become fields, and which become nothing?

<details>
<summary>Answer</summary>

**Answer:** Classes: `Member`, `FitnessClass` (session), `Trainer`, `Booking`. Fields: time slot (in `FitnessClass`, e.g. a `LocalDateTime` or a `TimeSlot` value object), maximum participants (`capacity`). `Gym` becomes a class only if the system manages several gyms.

**Explanation:** Keep nouns that have their own identity or rules; attributes become fields.

</details>

### P2. Assign the responsibility

**Difficulty:** Medium · **Type:** Scenario

In the gym system, where should "can this member book this class?" live, given the rules: the class is not full, the member's membership is active, and the member has no other booking at the same time?

<details>
<summary>Answer</summary>

**Answer:** Each class checks what it owns: `FitnessClass.hasSpace()`, `Member.isActiveOn(date)`, and a member's bookings check `hasBookingAt(slot)`. A `BookingService.book(member, fitnessClass)` combines them and creates the `Booking`.

**Explanation:** Information Expert for each rule, with the cross-object use case in a thin coordinator. Putting all three checks in the service by reading getters would scatter the rules.

</details>

### P3. Find the extension point

**Difficulty:** Medium · **Type:** Design

The gym charges per class: members pay nothing, walk-ins pay ₹300, and corporate partners pay ₹150. Next year, festival discounts are planned. How would you design pricing?

<details>
<summary>Answer</summary>

**Answer:** A `PricingPolicy` interface (`long pricePaise(Customer c, FitnessClass fc)`) with implementations per customer type, selected by a map or factory; festival discounts as a decorator wrapping any policy (`FestivalDiscount(PricingPolicy inner, int percent)`).

**Explanation:** Pricing varies along two axes (customer type and temporary promotions). Strategy covers the first, Decorator the second, without editing existing policies (OCP).

</details>

### P4. Full mini-design

**Difficulty:** Hard · **Type:** Design

Design classes for "Hospital outpatient tokens": patients get a token for a department; each doctor calls the next token in their department; emergency patients jump the queue; the display board shows the current token for each doctor. List classes, responsibilities, relationships, one interface, and one pattern you might use.

<details>
<summary>Answer</summary>

**Answer:**

- `Patient` (id, name), `Department`, `Doctor` (belongs to a department).
- `Token` (number, patient, department, priority, issued time) — value object.
- `DepartmentQueue` owns a priority queue ordered by (priority, issue time); responsibilities: `issue(patient, priority)`, `next()`.
- `TokenService` coordinates: issue tokens, `callNext(doctor)` takes from the doctor's department queue and records the doctor's current token.
- `DisplayBoard` shows the current token per doctor.
- Interface: `TokenListener` (or `DisplayUpdate`) notified when a doctor calls a token — the display board and an SMS notifier implement it (**Observer**).
- Relationships: `Department` 1 — * `Doctor`; `Department` 1 — 1 `DepartmentQueue` (composition); `DepartmentQueue` — * `Token`.

**Explanation:** Queue rules live in the queue; the display depends on events, not on the service's internals; emergency priority is a field in the comparator, not a subclass of token.

</details>
