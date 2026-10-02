# Coding-Decoding — Solved Examples

### E1. Constant shift

**Difficulty:** Easy · **Pattern:** Constant shift

**Problem:** If CAT is coded as DBU, how is DOG coded?

**Solution:**

1. C → D, A → B, T → U: each letter +1.
2. DOG → D + 1 = E, O + 1 = P, G + 1 = H.

**Answer:** **EPH**

### E2. Shift by two

**Difficulty:** Easy · **Pattern:** Constant shift

**Problem:** If MANGO is coded as OCPIQ, how is APPLE coded?

**Solution:**

1. M → O, A → C, N → P, G → I, O → Q: each letter +2.
2. APPLE → C, R, R, N, G.

**Answer:** **CRRNG**

### E3. Number coding

**Difficulty:** Medium · **Pattern:** Number coding

**Problem:** If CAB = 6, what is BED?

**Solution:**

1. C + A + B = 3 + 1 + 2 = 6 → code = sum of positions.
2. BED = 2 + 5 + 4 = 11.

**Answer:** **11**

### E4. Opposite letters

**Difficulty:** Medium · **Pattern:** Opposite letters

**Problem:** If GOOD is coded as TLLW, how is BAD coded?

**Solution:**

1. G (7) → T (20): 7 + 20 = 27. O (15) → L (12): 27. D (4) → W (23): 27. Each letter is replaced by its opposite.
2. BAD → B ↔ Y, A ↔ Z, D ↔ W.

**Answer:** **YZW**

### E5. Reverse and shift

**Difficulty:** Hard · **Pattern:** Reverse and shift

**Problem:** If MONKEY is coded as XDJMNL, how is TIGER coded?

**Solution:**

1. Compare positions: M → X is not a small shift, so try reversing. MONKEY reversed = YEKNOM.
2. YEKNOM → XDJMNL: each letter −1.
3. TIGER reversed = REGIT → −1 → QDFHS.

**Answer:** **QDFHS**

### E6. Letter-to-digit substitution

**Difficulty:** Hard · **Pattern:** Substitution

**Problem:** If DELHI is coded as 73541 and CALCUTTA as 82589662, how is CALICUT coded?

**Solution:**

1. DELHI: D = 7, E = 3, L = 5, H = 4, I = 1.
2. CALCUTTA: C = 8, A = 2, L = 5, U = 9, T = 6 (L = 5 again — consistent).
3. CALICUT → C 8, A 2, L 5, I 1, C 8, U 9, T 6.

**Answer:** **8251896**

### E7. Sentence coding

**Difficulty:** Hard · **Pattern:** Sentence coding

**Problem:** In a code language, "sky is blue" is "ta na pa", "blue and green" is "na ka ra", and "green is good" is "ra ta la". What is the code for "good"?

**Solution:**

1. "blue" appears in sentences 1 and 2; the only common code is "na" → blue = na.
2. "green" appears in 2 and 3; common code "ra" → green = ra.
3. "is" appears in 1 and 3; common code "ta" → is = ta.
4. Sentence 3: green (ra), is (ta), good → the remaining code "la".

**Answer:** **la**
