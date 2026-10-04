# Single Responsibility Principle — Practice

### P1. How many responsibilities?

**Difficulty:** Easy · **Type:** Code analysis

```java
class Employee {
    double calculateSalary() { return 0; }
    String generatePayslipHtml() { return ""; }
    void saveToDatabase() { }
    boolean isEligibleForPromotion() { return false; }
}
```

How many reasons to change does `Employee` have? Name them.

<details>
<summary>Answer</summary>

**Answer:** Four, roughly: salary rules (payroll), payslip presentation (HR/design), persistence (database/operations), and promotion policy (HR management).

**Explanation:** Salary calculation and promotion eligibility might arguably both be "employee rules", but they are owned by different stakeholders and change independently.

</details>

### P2. Which split is right?

**Difficulty:** Medium · **Type:** MCQ

A `Cart` class has `addItem`, `removeItem`, `subtotal`, `applyCoupon`, `renderHtml` and `saveToSession`. Which refactoring best follows SRP without overdoing it?

- A) One class per method
- B) Keep `addItem`, `removeItem`, `subtotal`, `applyCoupon` in `Cart`; move `renderHtml` to a view/formatter and `saveToSession` to a repository
- C) Move all methods into a `CartService`, leaving `Cart` with only fields
- D) Leave it as is; SRP applies only to services

<details>
<summary>Answer</summary>

**Answer:** B

**Explanation:** Cart contents and pricing are one responsibility; presentation and storage change for other reasons. A over-splits; C creates an anaemic model; D ignores real mixing.

</details>

### P3. Refactor

**Difficulty:** Medium · **Type:** Design

```java
class AttendanceTracker {
    void markPresent(String studentId) { /* updates a map */ }
    double attendancePercent(String studentId) { return 0; }
    void exportCsv(String path) { /* writes a file */ }
    void smsParentsIfBelow75() { /* calls an SMS gateway */ }
}
```

Propose classes following SRP and say how they collaborate.

<details>
<summary>Answer</summary>

**Answer:**

- `AttendanceRegister` — `markPresent`, `attendancePercent` (the core rules and data).
- `AttendanceCsvExporter` — reads from the register and writes CSV.
- `LowAttendanceNotifier` — asks the register for students below 75% and sends messages through an injected `SmsGateway` interface.

**Explanation:** Export format and messaging channel change independently of attendance rules; the notifier and exporter depend on the register, not the other way round.

</details>

### P4. Over-split or not?

**Difficulty:** Hard · **Type:** Scenario

A teammate split `PasswordPolicy` into `PasswordLengthChecker`, `PasswordDigitChecker`, `PasswordSymbolChecker` and `PasswordPolicyCoordinator`. All four always change together when security asks for a new policy. Is this good SRP?

<details>
<summary>Answer</summary>

**Answer:** Probably not. All rules change together for one reason (the security team's policy), so they form one responsibility. Four classes add indirection without isolating change.

**Better:** one `PasswordPolicy` class with small private methods per rule — or, if rules must be configurable per tenant, a list of `PasswordRule` strategy objects, which is justified by a real variation, not by SRP alone.

</details>
