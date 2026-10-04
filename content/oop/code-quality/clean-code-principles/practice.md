# Clean Code Principles for OOP — Practice

### P1. Name it

**Difficulty:** Easy · **Type:** Conceptual

Rename: `int d; // days until expiry`, `List<User> l2; // users waiting for approval`, `void doIt(); // sends overdue reminders`, `boolean check; // whether the card is blocked`.

<details>
<summary>Answer</summary>

**Answer:** `int daysUntilExpiry;`, `List<User> usersAwaitingApproval;`, `void sendOverdueReminders();`, `boolean isCardBlocked;`

**Explanation:** Once the name says it, the comment is unnecessary.

</details>

### P2. Which principle?

**Difficulty:** Easy · **Type:** MCQ

`invoice.getCustomer().getAddress().getState().getGstCode()` violates which principle most directly?

- A) DRY
- B) Law of Demeter
- C) YAGNI
- D) KISS

<details>
<summary>Answer</summary>

**Answer:** B) Law of Demeter

**Explanation:** The caller navigates through three objects' internal structure. Ask the invoice for what it needs (`invoice.placeOfSupplyGstCode()`).

</details>

### P3. Tell, don't ask

**Difficulty:** Medium · **Type:** Coding

```java
if (cart.getItems().size() < 10 && product.getStock() > 0) {
    cart.getItems().add(product);
    product.setStock(product.getStock() - 1);
}
```

Rewrite this so the objects enforce their own rules.

<details>
<summary>Answer</summary>

```java
product.reserveOne();      // throws IllegalStateException if out of stock; decrements internally
cart.add(product);         // throws if the cart already has 10 items; the item list stays private
```

**Explanation:** Each rule now lives in the object that owns the data; no caller can bypass the stock or cart-size limits by manipulating getters. (In a real system the two steps would also need to be atomic, or the reservation released if `add` fails.)

</details>

### P4. DRY or not?

**Difficulty:** Hard · **Type:** Scenario

Two methods compute "price minus 10%": one for student discounts, one for a monthly loyalty reward. A teammate extracts `applyTenPercent()` and makes both call it. Six months later, loyalty changes to 12%. What went wrong?

<details>
<summary>Answer</summary>

**Answer:** The two rules only looked the same; they were different pieces of knowledge that change for different reasons. Merging them coupled unrelated business rules, so the change now needs a new method anyway (or accidentally changes student pricing).

**Lesson:** DRY targets duplicated *knowledge*. Here, a small shared helper such as `applyPercentDiscount(price, percent)` with **separate** constants (`STUDENT_DISCOUNT_PERCENT`, `LOYALTY_DISCOUNT_PERCENT`) is the right level of sharing.

</details>
