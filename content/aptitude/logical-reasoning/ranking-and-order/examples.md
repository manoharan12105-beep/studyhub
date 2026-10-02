# Ranking and Order — Solved Examples

### E1. Total from two positions

**Difficulty:** Easy · **Pattern:** Total from two positions

**Problem:** Ravi is 12th from the left and 9th from the right in a row. How many people are in the row?

**Solution:**

1. Ravi is counted in both positions.
2. Total = 12 + 9 − 1 = 20.

**Answer:** **20**

### E2. Rank from the other end

**Difficulty:** Easy · **Pattern:** Position from the other end

**Problem:** In a class of 40, Asha ranks 15th from the top. What is her rank from the bottom?

**Solution:**

1. Rank from bottom = 40 − 15 + 1 = 26.

**Answer:** **26th**

### E3. People between two persons

**Difficulty:** Medium · **Pattern:** Number between

**Problem:** In a row of 30 students, A is 10th from the left and B is 15th from the right. How many students are between A and B?

**Solution:**

1. B from the left = 30 − 15 + 1 = 16.
2. Between = 16 − 10 − 1 = 5.

**Answer:** **5**

### E4. Comparison chain

**Difficulty:** Medium · **Pattern:** Comparison chains

**Problem:** P is taller than Q but shorter than R. S is shorter than Q. T is taller than R. Who is the tallest, and who is second from the bottom?

**Solution:**

1. R > P > Q (P taller than Q, shorter than R).
2. Q > S; T > R.
3. Chain: T > R > P > Q > S.

**Answer:** Tallest **T**; second shortest **Q**.

### E5. Overlapping positions

**Difficulty:** Medium · **Pattern:** Overlapping positions

**Problem:** In a row of 14 children, A is 7th from the left and B is 10th from the right. How many children are between A and B?

**Solution:**

1. B from the left = 14 − 10 + 1 = 5 → B is to the left of A.
2. Between = 7 − 5 − 1 = 1.

**Answer:** **1**

### E6. Interchanging positions

**Difficulty:** Hard · **Pattern:** Interchanging positions

**Problem:** In a row, A is 8th from the left and B is 12th from the right. When they interchange positions, A becomes 15th from the left. How many people are in the row?

**Solution:**

1. A's new position is B's old position → B was 15th from the left.
2. B was also 12th from the right.
3. Total = 15 + 12 − 1 = 26.

**Answer:** **26**

### E7. Minimum number in a queue

**Difficulty:** Hard · **Pattern:** Minimum number

**Problem:** In a queue, A is 10th from the front and B is 12th from the back. There are 4 people between them. What is the minimum number of people in the queue?

**Solution:**

1. Case 1 — B behind A: B is 10 + 4 + 1 = 15th from the front → total = 15 + 12 − 1 = 26.
2. Case 2 — B ahead of A: B is 10 − 4 − 1 = 5th from the front → total = 5 + 12 − 1 = 16.
3. Check case 2: positions 6–9 lie between B (5) and A (10) — 4 people ✓. A is 16 − 10 + 1 = 7th from the back, consistent.
4. Minimum = 16.

**Answer:** **16**
