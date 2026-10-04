# Adapter — Practice

### P1. Recognise it

**Difficulty:** Easy · **Type:** MCQ

Your code expects `TemperatureSensor.celsius()`, but a new device library offers `ThermoChip.readFahrenheitTimes10()`. Which pattern fits?

- A) Decorator
- B) Adapter
- C) Observer
- D) Builder

<details>
<summary>Answer</summary>

**Answer:** B) Adapter

**Explanation:** An existing incompatible interface must be made to match the one your code uses.

</details>

### P2. Write the adapter

**Difficulty:** Medium · **Type:** Coding

Write `ThermoChipAdapter implements TemperatureSensor` for P1, where `celsius()` returns a `double`.

<details>
<summary>Answer</summary>

```java
interface TemperatureSensor {
    double celsius();
}

class ThermoChip {                                   // third-party, cannot change
    int readFahrenheitTimes10() {
        return 986;                                  // 98.6 °F
    }
}

class ThermoChipAdapter implements TemperatureSensor {
    private final ThermoChip chip;

    ThermoChipAdapter(ThermoChip chip) {
        this.chip = chip;
    }

    @Override
    public double celsius() {
        double fahrenheit = chip.readFahrenheitTimes10() / 10.0;
        return (fahrenheit - 32) * 5 / 9;
    }
}
```

**Explanation:** The adapter performs unit and scale conversion and exposes exactly the target interface.

</details>

### P3. Choose: Adapter or Facade?

**Difficulty:** Medium · **Type:** Scenario

(a) A legacy billing system needs 7 calls in a specific order to raise an invoice; you want one `raiseInvoice(order)` method. (b) A new PDF library has `renderDoc(Doc d)` but your code expects `DocumentRenderer.render(Report r)`. Which pattern for each?

<details>
<summary>Answer</summary>

**Answer:** (a) Facade — a simpler interface over a multi-step subsystem. (b) Adapter — make one existing API conform to your expected interface (converting `Report` to `Doc`).

</details>
