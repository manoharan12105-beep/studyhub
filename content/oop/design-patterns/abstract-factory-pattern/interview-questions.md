# Abstract Factory — Interview Questions

## Conceptual

### Q1. What is the Abstract Factory pattern?

<details>
<summary>Answer</summary>

A creational pattern that provides an interface for creating families of related objects without naming their concrete classes. Each concrete factory produces one consistent family (for example India's GST calculator and GST invoice formatter); the client receives a factory and works only with abstract product interfaces, so it can never mix products from different families.

</details>

### Q2. Factory Method vs Abstract Factory?

<details>
<summary>Answer</summary>

Factory Method is a single overridable method that lets a subclass decide which one product to create (inheritance). Abstract Factory is an object with several creation methods for a family of related products, passed to the client (composition). Abstract factories are often implemented using factory methods. Use Factory Method to vary one product within a workflow; use Abstract Factory when several products must vary together consistently.

</details>

### Q3. What is the main drawback of Abstract Factory?

<details>
<summary>Answer</summary>

Adding a new kind of product (say, a `ReceiptPrinter` to every compliance kit) requires changing the abstract factory interface and every concrete factory. It is easy to add families, hard to add product types. It also introduces many classes, which is not justified for a single family.

</details>

### Q4. How do you choose which concrete factory to use?

<details>
<summary>Answer</summary>

Once, at the edge of the system — from configuration, environment or the deployment's region — usually in the composition root or through a DI container, and then inject the chosen factory. That single selection replaces the scattered `if/else` checks.

</details>

## Applied

### Q5. A banking app must support two card networks; each needs its own `CardValidator`, `FeeCalculator` and `SettlementFileWriter`, which must not be mixed. Which pattern and why?

<details>
<summary>Answer</summary>

Abstract Factory: define `CardNetworkKit` with `validator()`, `feeCalculator()` and `settlementWriter()`, and one kit per network. The payment service receives the kit for the transaction's network and uses only the abstract products. Consistency is guaranteed, and adding a third network is a new kit with no change to the payment service.

</details>

### Q6. When would you NOT use Abstract Factory even though there are related objects?

<details>
<summary>Answer</summary>

When there is only one family and no realistic second; when the products vary independently (any validator could be combined with any fee calculator), in which case separate injection is simpler; or when new product kinds are added frequently, which would force repeated changes to all factories.

</details>
