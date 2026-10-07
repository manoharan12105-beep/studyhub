# Functional and Non-Functional Requirements — Practice

### P1. Classify

**Difficulty:** Easy · **Type:** Comparison · **Concepts:** functional vs non-functional

Label each F (functional) or NF (non-functional): (a) users can reset their password, (b) the API answers 95 % of requests within 100 ms, (c) admins can ban a user, (d) the service survives the loss of one data centre, (e) data is encrypted at rest.

<details>
<summary>Answer</summary>

(a) F, (b) NF, (c) F, (d) NF, (e) NF.

</details>

### P2. Which requirement justifies a cache?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** requirements drive design

Which requirement is the best reason to add a cache in front of the product catalogue?

- A) Users can search products
- B) Product pages load in under 100 ms while reads outnumber writes 1000 to 1
- C) Admins can edit product prices
- D) Products have names and descriptions

<details>
<summary>Answer</summary>

**Answer:** B) Product pages load in under 100 ms while reads outnumber writes 1000 to 1

A cache exists to meet a latency target on read-heavy data; features alone never justify it.

</details>

### P3. Make it measurable

**Difficulty:** Medium · **Type:** Design · **Concepts:** stating NFRs

Rewrite as measurable requirements: "The chat app should be fast, reliable and handle lots of users."

<details>
<summary>Answer</summary>

One good version: "Deliver a message to an online recipient within 500 ms at P99; never lose a message once the sender sees it as sent; support 10 million concurrent connections and 100k messages/s at peak; 99.95 % monthly availability." Each phrase now has a number that can be tested.

</details>

### P4. Resolve the conflict

**Difficulty:** Hard · **Type:** Trade-off · **Concepts:** conflicting NFRs

An e-commerce site wants (1) product pages served from caches worldwide in under 100 ms and (2) "never sell an item that is out of stock". How do you satisfy both?

<details>
<summary>Answer</summary>

Treat the two paths differently. Product pages (description, images, approximate stock "in stock / few left") can be cached and slightly stale. The **purchase** itself checks and decrements stock with a strongly consistent operation on the primary database (a transaction or conditional update such as `UPDATE ... SET stock = stock - 1 WHERE stock > 0`). Staleness on the page is acceptable because correctness is enforced at the moment that matters.

</details>
