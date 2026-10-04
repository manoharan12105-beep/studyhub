# Builder — Practice

### P1. When is Builder justified?

**Difficulty:** Easy · **Type:** MCQ

- A) `Point(int x, int y)`
- B) `Money(long paise, String currency)`
- C) `Notification` with recipient (required) plus optional subject, CC list, attachments, priority, schedule time and template
- D) `Pair<A, B>`

<details>
<summary>Answer</summary>

**Answer:** C

**Explanation:** Many optional parameters and possible cross-field rules (a scheduled time must be in the future) — exactly the Builder's use case. The others are small value objects.

</details>

### P2. Write a builder

**Difficulty:** Medium · **Type:** Coding

Write an immutable `Pizza` (size required; cheese and toppings optional) with a builder that rejects more than five toppings.

<details>
<summary>Answer</summary>

```java
import java.util.ArrayList;
import java.util.List;

final class Pizza {
    private final String size;
    private final boolean extraCheese;
    private final List<String> toppings;

    private Pizza(Builder b) {
        this.size = b.size;
        this.extraCheese = b.extraCheese;
        this.toppings = List.copyOf(b.toppings);
    }

    static Builder ofSize(String size) {
        return new Builder(size);
    }

    static final class Builder {
        private final String size;
        private boolean extraCheese;
        private final List<String> toppings = new ArrayList<>();

        private Builder(String size) {
            this.size = size;
        }

        Builder extraCheese() {
            this.extraCheese = true;
            return this;
        }

        Builder topping(String topping) {
            toppings.add(topping);
            return this;
        }

        Pizza build() {
            if (toppings.size() > 5) {
                throw new IllegalStateException("at most 5 toppings");
            }
            return new Pizza(this);
        }
    }
}
```

**Explanation:** Required size in the entry method, fluent optional parts, validation and a defensive copy in `build()`.

</details>

### P3. Find the leak

**Difficulty:** Hard · **Type:** Code analysis

A builder's `build()` does `return new Report(this);` and `Report`'s constructor does `this.sections = builder.sections;` (an `ArrayList`). The same builder is reused to build two reports, adding a section between the calls. What happens?

<details>
<summary>Answer</summary>

**Answer:** Both reports share the builder's list. Adding a section for the second report also changes the first, so the "immutable" `Report` is not immutable.

**Fix:** copy in the product constructor — `this.sections = List.copyOf(builder.sections);`.

</details>
