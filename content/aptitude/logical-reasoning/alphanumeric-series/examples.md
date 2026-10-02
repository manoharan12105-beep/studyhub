# Alphanumeric Series — Solved Examples

### E1. Letter–number pairs

**Difficulty:** Easy · **Pattern:** Letter–number pairs

**Problem:** A1, C3, E5, G7, ?

**Solution:**

1. Letters: A, C, E, G → +2 → I.
2. Numbers: 1, 3, 5, 7 → +2 → 9.

**Answer:** **I9**

### E2. Number–letter pairs

**Difficulty:** Easy · **Pattern:** Letter–number pairs

**Problem:** 2B, 4D, 6F, 8H, ?

**Solution:**

1. Numbers: 2, 4, 6, 8 → 10.
2. Letters: B, D, F, H → J. (Each letter's position equals its number: B = 2, D = 4 …)

**Answer:** **10J**

### E3. Different rules for each part

**Difficulty:** Medium · **Pattern:** Different rules

**Problem:** Z1, X3, V6, T10, ?

**Solution:**

1. Letters: Z, X, V, T (26, 24, 22, 20) → −2 → R.
2. Numbers: 1, 3, 6, 10 → +2, +3, +4 → +5 → 15.

**Answer:** **R15**

**Use this arrangement for E4–E7:**

```text
Position: 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22
Element:  R 4 # M 7 E 2 @ K 9  P  $  3  A  5  &  U  8  T  *  6  D
```

### E4. Position from the left

**Difficulty:** Medium · **Pattern:** Position from both ends

**Problem:** Which element is 7th to the right of the 5th element from the left?

**Solution:**

1. 5th from the left = position 5 (7).
2. 7th to its right = position 5 + 7 = 12 → $.

**Answer:** **$**

### E5. Position from the right

**Difficulty:** Medium · **Pattern:** Position from both ends

**Problem:** Which element is 4th to the left of the 10th element from the right?

**Solution:**

1. 10th from the right = 22 − 10 + 1 = 13th from the left (3).
2. 4th to its left = position 13 − 4 = 9 → K.

**Answer:** **K**

### E6. Neighbour condition

**Difficulty:** Hard · **Pattern:** Neighbour conditions

**Problem:** How many numbers are immediately preceded by a letter?

**Solution:**

1. Check each number's left neighbour:
   4 (R ✓), 7 (M ✓), 2 (E ✓), 9 (K ✓), 3 ($ ✗), 5 (A ✓), 8 (U ✓), 6 (* ✗).
2. Count = 6.

**Answer:** **6**

### E7. Two conditions and a removal

**Difficulty:** Hard · **Pattern:** Neighbour conditions; Removing a category

**Problem:** (a) How many letters are immediately preceded by a number and immediately followed by a symbol? (b) If all symbols are removed, which element is 6th from the right?

**Solution:**

1. (a) Check each letter: R (no left neighbour) ✗; M (# before) ✗; E (7 before, 2 after) ✗; K (@ before) ✗; P (9 before, $ after) ✓; A ($ before) ✗; U (& before) ✗; T (8 before, * after) ✓; D (6 before, nothing after) ✗ → 2.
2. (b) Without symbols: R 4 M 7 E 2 K 9 P 3 A 5 U 8 T 6 D (17 elements). From the right: D, 6, T, 8, U, 5 → 6th is 5.

**Answer:** (a) **2** (P and T) (b) **5**
