# OOP with Collections — Interview Questions

## Conceptual

### Q1. What is the difference between `Comparable` and `Comparator`?

<details>
<summary>Answer</summary>

`Comparable<T>` is implemented by the class itself (`compareTo(T other)`) and defines its single natural order, used by `Collections.sort(list)` and `TreeSet`/`TreeMap` without arguments. `Comparator<T>` is a separate object (`compare(T a, T b)`), often a lambda, defining any number of external orders without changing the class — passed to `list.sort`, `new TreeSet<>(cmp)`, `PriorityQueue`. Use `Comparable` for the obvious order of your own value types and `Comparator` for situational or multiple orders.

</details>

### Q2. Why might a `TreeSet` contain fewer elements than you added, even though all are unequal by `equals`?

<details>
<summary>Answer</summary>

`TreeSet` uses `compareTo`/`compare`, not `equals`, to detect duplicates. If the comparator returns 0 for two different objects (for example comparing only by marks), the second one is treated as a duplicate and not added. Fix the comparator with tie-breakers so it returns 0 only for the same logical element, ideally consistent with `equals`.

</details>

### Q3. What does "compareTo is consistent with equals" mean, and why does it matter?

<details>
<summary>Answer</summary>

It means `a.compareTo(b) == 0` exactly when `a.equals(b)`. If they disagree, hash-based and sorted collections behave differently for the same objects: `new BigDecimal("2.0")` and `new BigDecimal("2.00")` are two elements in a `HashSet` (not equal) but one in a `TreeSet` (compare as 0). It is strongly recommended but not strictly required.

</details>

### Q4. Why should you not use subtraction in a comparator?

<details>
<summary>Answer</summary>

`a - b` can overflow when values are large or have opposite signs, producing a result with the wrong sign and an inconsistent ordering (sorting may even throw "Comparison method violates its general contract"). Use `Integer.compare(a, b)` or `Comparator.comparingInt(...)`.

</details>

### Q5. What happens if you modify an object that is already in a `HashSet` or `TreeSet`?

<details>
<summary>Answer</summary>

If the modified fields are used by `hashCode`/`equals` (hash collections) or by the comparator (sorted collections), the collection is not updated: the element sits where its old state placed it. Lookups and removals compute the new position and miss, and the element may appear duplicated or lost. Remove the element before changing it and re-add it afterwards, or design keys to be immutable.

</details>

## Applied

### Q6. What does this print?

```java
import java.util.ArrayList;
import java.util.List;

public class ContainsQuestion {

    static class Product {
        final String sku;

        Product(String sku) {
            this.sku = sku;
        }

        public boolean equals(Product other) {
            return other != null && sku.equals(other.sku);
        }
    }

    public static void main(String[] args) {
        List<Product> cart = new ArrayList<>();
        cart.add(new Product("P-1"));
        Product same = new Product("P-1");
        System.out.println(cart.contains(same) + " " + cart.get(0).equals(same));
    }
}
```

<details>
<summary>Answer</summary>

**Output:**

```text
false true
```

`equals(Product)` is an overload, not an override of `equals(Object)`. `ArrayList.contains` calls `equals(Object)`, which is still identity-based, so it returns `false`. The direct call `cart.get(0).equals(same)` has a `Product` argument, so the compiler selects the overload and it returns `true`. Fix: `@Override public boolean equals(Object o)` plus `hashCode`.

</details>

### Q7. Sort employees by department ascending, then by salary descending, then by name. Write the comparator.

<details>
<summary>Answer</summary>

```java
Comparator<Employee> order = Comparator
        .comparing(Employee::department)
        .thenComparing(Employee::salary, Comparator.reverseOrder())
        .thenComparing(Employee::name);
employees.sort(order);
```

`thenComparing` adds tie-breakers; passing `Comparator.reverseOrder()` reverses only the salary key. (Calling `.reversed()` at the end would reverse the entire chain.)

</details>
