# Alphabet Series — Solved Examples

### E1. Constant skip

**Difficulty:** Easy · **Pattern:** Constant skip

**Problem:** A, C, E, G, ?

**Solution:**

1. Positions 1, 3, 5, 7 → +2.
2. Next = 9 → I.

**Answer:** **I**

### E2. Backwards skip

**Difficulty:** Easy · **Pattern:** Constant skip

**Problem:** Z, X, V, T, ?

**Solution:**

1. Positions 26, 24, 22, 20 → −2.
2. Next = 18 → R.

**Answer:** **R**

### E3. Growing gaps

**Difficulty:** Medium · **Pattern:** Growing gaps

**Problem:** B, E, I, N, ?

**Solution:**

1. Positions 2, 5, 9, 14 → gaps +3, +4, +5.
2. Next gap +6 → 20 → T.

**Answer:** **T**

### E4. Opposite pairs

**Difficulty:** Medium · **Pattern:** Letter pairs

**Problem:** AZ, BY, CX, ?

**Solution:**

1. First letters: A, B, C → D.
2. Second letters: Z, Y, X → W.

**Answer:** **DW**

### E5. Letter groups

**Difficulty:** Medium · **Pattern:** Letter groups

**Problem:** ABD, DEG, GHJ, ?

**Solution:**

1. First letters: A, D, G (1, 4, 7) → +3 → J (10).
2. Inside each group: x, x + 1, x + 3 (A B D; D E G; G H J).
3. With x = J: J, K, M.

**Answer:** **JKM**

### E6. Alternating series

**Difficulty:** Hard · **Pattern:** Alternating letters

**Problem:** A, Z, C, X, E, V, ?

**Solution:**

1. Odd positions: A, C, E (1, 3, 5) → next 7 → G.
2. Even positions: Z, X, V (26, 24, 22).
3. The 7th term belongs to the odd series.

**Answer:** **G**

### E7. Wrap-around

**Difficulty:** Hard · **Pattern:** Letter groups

**Problem:** KPU, MRW, OTY, ?

**Solution:**

1. First letters K, M, O (11, 13, 15) → Q (17).
2. Second letters P, R, T (16, 18, 20) → V (22).
3. Third letters U, W, Y (21, 23, 25) → 27 → wrap: 27 − 26 = 1 → A.

**Answer:** **QVA**
