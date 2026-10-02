# Permutation and Combination — Solved Examples

### E1. Counting principle

**Difficulty:** Easy · **Pattern:** Counting principle

**Problem:** A person has 3 shirts and 4 pairs of trousers. How many different outfits (one shirt and one pair of trousers) are possible?

**Solution:**

1. Choose a shirt (3 ways) AND a pair of trousers (4 ways).
2. AND → multiply: 3 × 4 = 12.

**Answer:** **12**

### E2. Letters with a repeat

**Difficulty:** Easy · **Pattern:** Arranging letters

**Problem:** In how many ways can the letters of the word LEADER be arranged?

**Solution:**

1. 6 letters: L, E, A, D, E, R — E appears twice.
2. Arrangements = 6!/2! = 720/2 = 360.

**Answer:** **360**

### E3. Committee with an exact count

**Difficulty:** Medium · **Pattern:** Committees

**Problem:** A committee of 5 is to be formed from 6 men and 4 women. In how many ways can it be formed if it must contain exactly 3 men?

**Solution:**

1. Choose 3 of 6 men: ⁶C₃ = 20.
2. The other 2 members are women: ⁴C₂ = 6.
3. Total = 20 × 6 = 120.

**Answer:** **120**

### E4. Vowels together

**Difficulty:** Medium · **Pattern:** Arranging letters

**Problem:** In how many ways can the letters of ORANGE be arranged so that the vowels are always together?

**Solution:**

1. Vowels: O, A, E. Glue them into one block.
2. Units to arrange: [OAE], R, N, G → 4! = 24.
3. Arrangements inside the block: 3! = 6.
4. Total = 24 × 6 = 144.

**Answer:** **144**

### E5. Forming numbers

**Difficulty:** Medium · **Pattern:** Forming numbers

**Problem:** Using the digits 1 to 6 without repetition, how many 3-digit numbers can be formed? How many of them are even?

**Solution:**

1. All: 6 × 5 × 4 = 120.
2. Even: units digit must be 2, 4 or 6 → 3 choices.
3. Hundreds: 5 remaining choices; tens: 4.
4. Even numbers = 3 × 5 × 4 = 60.

**Answer:** **120** numbers, **60** even.

### E6. Diagonals and handshakes

**Difficulty:** Medium · **Pattern:** Geometry counts

**Problem:** (a) How many diagonals does a decagon have? (b) If 12 people shake hands with each other exactly once, how many handshakes occur?

**Solution:**

1. (a) Lines joining any 2 of 10 vertices: ¹⁰C₂ = 45. Subtract the 10 sides → 35.
2. (b) Each handshake is a pair: ¹²C₂ = 66.

**Answer:** (a) **35** (b) **66**

### E7. At least one woman

**Difficulty:** Hard · **Pattern:** Committees

**Problem:** A team of 4 is to be selected from 5 men and 3 women. In how many ways can this be done if the team must include at least one woman?

**Solution:**

1. Total teams: ⁸C₄ = 70.
2. Teams with no women (all men): ⁵C₄ = 5.
3. At least one woman = 70 − 5 = 65.
4. Check by cases: 1W: 3 × 10 = 30; 2W: 3 × 10 = 30; 3W: 1 × 5 = 5 → 65 ✓.

**Answer:** **65**

### E8. Round table with a restriction

**Difficulty:** Hard · **Pattern:** Circular seating

**Problem:** In how many ways can 6 people sit around a round table if two particular people must not sit next to each other?

**Solution:**

1. Total circular arrangements: (6 − 1)! = 120.
2. The two together: glue them → 5 units around the table → 4! = 24, × 2 for their internal order → 48.
3. Not together = 120 − 48 = 72.

**Answer:** **72**

### E9. No two girls together

**Difficulty:** Hard · **Pattern:** Gap method

**Problem:** In how many ways can 5 boys and 3 girls stand in a row so that no two girls are next to each other?

**Solution:**

1. Arrange the 5 boys: 5! = 120.
2. This creates 6 gaps: _ B _ B _ B _ B _ B _.
3. Place the 3 girls in 3 different gaps, in order: ⁶P₃ = 6 × 5 × 4 = 120.
4. Total = 120 × 120 = 14,400.

**Answer:** **14,400**

### E10. Grid paths

**Difficulty:** Hard · **Pattern:** Grid paths

**Problem:** On a grid, how many shortest paths go from (0, 0) to (4, 3) if each step moves one unit right or one unit up?

**Solution:**

1. Every shortest path uses exactly 4 R moves and 3 U moves — 7 moves in total.
2. A path is fixed by choosing which 3 of the 7 moves are U: ⁷C₃ = 35.

**Answer:** **35**
