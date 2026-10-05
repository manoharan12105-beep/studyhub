# Entity–Relationship Modeling — Practice

### P1. Identify the cardinality

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** cardinality

"A patient can book many appointments; each appointment is with one doctor; a doctor has many appointments." What is the cardinality between PATIENT and DOCTOR?

- A) 1:1
- B) 1:N
- C) M:N, realised through APPOINTMENT
- D) There is no relationship

<details>
<summary>Answer</summary>

**Answer:** C)

**Explanation:** A patient can see many doctors and a doctor many patients; APPOINTMENT is the relationship (with attributes such as time), which becomes a table with foreign keys to both.

</details>

### P2. Classify the attributes

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** attribute types

For an EMPLOYEE entity, classify: `emp_id`, `full_name` (first + last), `date_of_birth`, `age`, `skills` (several per employee), `salary`.

<details>
<summary>Answer</summary>

- `emp_id` — key, simple, single-valued.
- `full_name` — composite (first, last).
- `date_of_birth` — simple, stored.
- `age` — derived (from `date_of_birth`); do not store it, it changes every year.
- `skills` — multi-valued → separate table `employee_skills (emp_id, skill)`.
- `salary` — simple, single-valued.

</details>

### P3. Weak or strong?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** weak entities

Which of these are naturally weak entities? Give the key of each weak one.

1. A seat in a cinema screen (screen 3, seat F12).
2. A customer of a bank.
3. A dependent of an employee recorded for insurance (identified by name within the employee).
4. A product in a catalogue with a SKU.

<details>
<summary>Answer</summary>

1. Weak — key (cinema_id, screen_no, seat_code); a seat code repeats in every screen.
2. Strong — a customer has their own identifier.
3. Weak — key (emp_id, dependent_name); the classic textbook example.
4. Strong — SKU identifies it.

</details>

### P4. ER for a food delivery app

**Difficulty:** Hard · **Type:** Design · **Concepts:** entities, relationships, cardinality, participation

Requirements: *"Customers place orders from one restaurant. An order has several menu items with quantities. Restaurants have menus of items. A delivery partner is assigned to an order after it is placed. Customers can save several addresses; each order is delivered to one of them."*

List entities, relationships (with cardinality and participation) and the resulting tables.

<details>
<summary>Hint</summary>

Underline the nouns (entities) and verbs (relationships). Ask for each relationship: can one X have many Y? Can Y exist without X — and is that true at every moment (is a partner assigned immediately)?

</details>

<details>
<summary>Answer</summary>

Entities: CUSTOMER, ADDRESS (weak or strong with its own id; owned by customer), RESTAURANT, MENU_ITEM (belongs to one restaurant), ORDER, DELIVERY_PARTNER.

Relationships:

- CUSTOMER *saves* ADDRESS — 1:N; ADDRESS total.
- CUSTOMER *places* ORDER — 1:N; ORDER total.
- ORDER *from* RESTAURANT — N:1; ORDER total.
- RESTAURANT *offers* MENU_ITEM — 1:N; MENU_ITEM total.
- ORDER *contains* MENU_ITEM — M:N with `quantity`, `price_at_order`.
- ORDER *delivered to* ADDRESS — N:1; ORDER total.
- DELIVERY_PARTNER *delivers* ORDER — 1:N; ORDER **partial** (unassigned right after placement).

Tables: `customers`, `addresses (address_id, customer_id NOT NULL FK, …)`, `restaurants`, `menu_items (item_id, restaurant_id NOT NULL FK, …)`, `orders (order_id, customer_id NOT NULL, restaurant_id NOT NULL, address_id NOT NULL, partner_id NULL, status, placed_at)`, `order_items (order_id, item_id, quantity, price_at_order, PK (order_id, item_id))`, `delivery_partners`.

Rules not captured by plain FKs: "all items of an order come from the order's restaurant" and "the address belongs to the ordering customer" need composite foreign keys (e.g. `order_items (order_id, restaurant_id, item_id)` referencing `menu_items (restaurant_id, item_id)`) or triggers.

</details>
