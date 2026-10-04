# Facade — Interview Questions

## Conceptual

### Q1. What is the Facade pattern?

<details>
<summary>Answer</summary>

A structural pattern that provides a simple, unified interface over a complex subsystem. The facade knows which subsystem classes to call and in what order; clients call one high-level method (`checkout.placeOrder(...)`) instead of coordinating inventory, payment, shipping and notification themselves. Subsystems remain usable directly when needed.

</details>

### Q2. What are the benefits of Facade?

<details>
<summary>Answer</summary>

Simpler clients, lower coupling between clients and subsystem internals, workflow rules (such as compensation when payment fails) implemented once, and freedom to refactor the subsystem behind a stable interface.

</details>

### Q3. Facade vs Adapter?

<details>
<summary>Answer</summary>

Adapter makes an existing interface match a different interface clients already expect — compatibility, usually for one class. Facade defines a new, simplified interface for a whole subsystem — convenience and decoupling. An adapter wraps one adaptee; a facade typically coordinates many classes.

</details>

### Q4. Facade vs Mediator?

<details>
<summary>Answer</summary>

Both centralise interactions. A facade is used by clients to access a subsystem, and the subsystem classes do not know the facade exists (one-directional). A mediator coordinates a group of peer objects that know the mediator and communicate through it (bidirectional), removing direct references between them.

</details>

### Q5. What is the risk of a facade?

<details>
<summary>Answer</summary>

It can become a god object if every operation and business rule is added to it. Keep facades focused on common use cases, keep business rules inside the subsystems or domain objects, and create several facades for different client needs if necessary.

</details>

## Applied

### Q6. Where do you see facades in Spring Boot applications?

<details>
<summary>Answer</summary>

Service-layer classes that implement a use case (`OrderService.placeOrder`) coordinating repositories, payment clients and notifiers act as facades for controllers. Framework helpers such as `JdbcTemplate` and `RestClient`/`RestTemplate` provide simple methods over connection management, resource cleanup and error translation.

</details>
