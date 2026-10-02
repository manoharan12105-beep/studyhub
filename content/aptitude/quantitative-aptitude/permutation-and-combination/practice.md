# Permutation and Combination — Practice

### P1. Find the value of ⁵P₂.

**Difficulty:** Easy · **Pattern:** Permutations

- A) 10
- B) 20
- C) 25
- D) 60

<details>
<summary>Answer</summary>

**Answer:** B) 20

**Explanation:** 5 × 4 = 20. Option A is ⁵C₂.

</details>

### P2. In how many ways can 3 books be chosen from 8 different books?

**Difficulty:** Easy · **Pattern:** Combinations

- A) 24
- B) 56
- C) 168
- D) 336

<details>
<summary>Answer</summary>

**Answer:** B) 56

**Explanation:** Order does not matter: ⁸C₃ = 336/6 = 56. Option D is ⁸P₃.

</details>

### P3. In how many ways can the letters of the word BOOK be arranged?

**Difficulty:** Easy · **Pattern:** Arranging letters

- A) 6
- B) 12
- C) 16
- D) 24

<details>
<summary>Answer</summary>

**Answer:** B) 12

**Explanation:** 4!/2! = 12 (O is repeated). Option D ignores the repeat.

</details>

### P4. How many 3-digit numbers with all digits different can be formed from the digits 0 to 9?

**Difficulty:** Medium · **Pattern:** Forming numbers

- A) 504
- B) 648
- C) 720
- D) 900

<details>
<summary>Answer</summary>

**Answer:** B) 648

**Explanation:** Hundreds digit: 9 choices (not 0). Tens: 9 (any remaining digit, including 0). Units: 8. 9 × 9 × 8 = 648. Option C (10 × 9 × 8) allows a leading 0.

</details>

### P5. How many triangles can be formed from 10 points in a plane, no three of which are collinear?

**Difficulty:** Medium · **Pattern:** Geometry counts

- A) 45
- B) 90
- C) 120
- D) 720

<details>
<summary>Answer</summary>

**Answer:** C) 120

**Explanation:** Any 3 points form a triangle: ¹⁰C₃ = 720/6 = 120. Option A counts lines (¹⁰C₂).

</details>

### P6. In how many ways can the letters of MOTHER be arranged so that the vowels are always together?

**Difficulty:** Medium · **Pattern:** Arranging letters

- A) 120
- B) 240
- C) 480
- D) 720

<details>
<summary>Answer</summary>

**Answer:** B) 240

**Explanation:** Vowels O, E glued → [OE], M, T, H, R = 5 units → 5! = 120, × 2! inside the block = 240. Option A forgets the internal order.

</details>

### P7. A team of 5 is to be chosen from 7 boys and 5 girls. In how many ways can it be done if the team has exactly 2 girls?

**Difficulty:** Medium · **Pattern:** Committees

- A) 210
- B) 350
- C) 420
- D) 792

<details>
<summary>Answer</summary>

**Answer:** B) 350

**Explanation:** ⁵C₂ × ⁷C₃ = 10 × 35 = 350. Option D is all teams of 5 (¹²C₅).

</details>

### P8. In how many ways can 7 people sit around a circular table?

**Difficulty:** Medium · **Pattern:** Circular arrangements

- A) 360
- B) 720
- C) 2,520
- D) 5,040

<details>
<summary>Answer</summary>

**Answer:** B) 720

**Explanation:** (7 − 1)! = 6! = 720. Option D treats it as a row; option A divides by 2, which applies only to necklaces.

</details>

### P9. In how many ways can the letters of BANANA be arranged?

**Difficulty:** Hard · **Pattern:** Arranging letters

- A) 60
- B) 120
- C) 360
- D) 720

<details>
<summary>Answer</summary>

**Answer:** A) 60

**Explanation:** 6 letters with A × 3 and N × 2 → 6!/(3! × 2!) = 720/12 = 60.

</details>

### P10. A committee of 5 is to be formed from 6 men and 4 women. In how many ways can it be formed if it must include at least 2 women?

**Difficulty:** Hard · **Pattern:** Committees

- A) 120
- B) 180
- C) 186
- D) 246

<details>
<summary>Hint</summary>

Total minus the cases with 0 women and with exactly 1 woman.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) 186

**Explanation:** Total ¹⁰C₅ = 252. No women: ⁶C₅ = 6. One woman: ⁴C₁ × ⁶C₄ = 4 × 15 = 60. 252 − 66 = 186. By cases: 2W 120 + 3W 60 + 4W 6 = 186 ✓.

</details>

### P11. In how many ways can 5 boys and 3 girls stand in a row so that no two girls stand together?

**Difficulty:** Hard · **Pattern:** Gap method

- A) 2,400
- B) 7,200
- C) 14,400
- D) 40,320

<details>
<summary>Answer</summary>

**Answer:** C) 14,400

**Explanation:** Boys: 5! = 120. Six gaps; girls in 3 distinct gaps in order: ⁶P₃ = 120. 120 × 120 = 14,400. Option D is 8! (no restriction).

</details>

### P12. In how many ways can a person choose one or more fruits from 5 different fruits?

**Difficulty:** Hard · **Pattern:** Selecting any number

- A) 5
- B) 25
- C) 31
- D) 32

<details>
<summary>Answer</summary>

**Answer:** C) 31

**Explanation:** Each fruit is taken or not: 2⁵ = 32 subsets; remove the empty selection → 31.

</details>

### P13. How many 4-digit even numbers with all digits different can be formed from the digits 0 to 9?

**Difficulty:** Hard · **Pattern:** Forming numbers

- A) 1,792
- B) 2,016
- C) 2,296
- D) 2,520

<details>
<summary>Hint</summary>

Split into two cases: units digit 0, and units digit 2, 4, 6 or 8.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) 2,296

**Explanation:** Units = 0: thousands 9, hundreds 8, tens 7 → 504. Units ∈ {2, 4, 6, 8}: 4 choices; thousands 8 (not 0, not the units digit), hundreds 8, tens 7 → 4 × 8 × 8 × 7 = 1,792. Total 504 + 1,792 = 2,296. Option A misses the units-0 case.

</details>
