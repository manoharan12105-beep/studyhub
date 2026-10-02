# Number System — Practice

### P1. Which of the following is a prime number?

**Difficulty:** Easy · **Pattern:** Types of Numbers

- A) 91
- B) 87
- C) 97
- D) 51

<details>
<summary>Hint</summary>

Test each option for divisibility by 3 and 7.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) 97

**Explanation:** 91 = 7 × 13, 87 = 3 × 29, 51 = 3 × 17. For 97, √97 < 10, and 97 is not divisible by 2, 3, 5 or 7, so it is prime.

</details>

### P2. If the 4-digit number 7x52 is divisible by 9, what is x?

**Difficulty:** Easy · **Pattern:** Divisibility Rules

- A) 2
- B) 4
- C) 6
- D) 8

<details>
<summary>Answer</summary>

**Answer:** B) 4

**Explanation:** Digit sum = 7 + x + 5 + 2 = 14 + x. The only multiple of 9 reachable with a single digit x is 18, so x = 4. Check: 7452 ÷ 9 = 828.

</details>

### P3. What is the unit digit of 3⁶⁵?

**Difficulty:** Easy · **Pattern:** Unit Digit

- A) 1
- B) 3
- C) 7
- D) 9

<details>
<summary>Answer</summary>

**Answer:** B) 3

**Explanation:** Cycle of 3 is (3, 9, 7, 1). 65 mod 4 = 1 → first term → 3.

</details>

### P4. The HCF of two numbers is 8 and their LCM is 48. If one number is 16, find the other.

**Difficulty:** Easy · **Pattern:** HCF and LCM

- A) 12
- B) 24
- C) 32
- D) 48

<details>
<summary>Answer</summary>

**Answer:** B) 24

**Explanation:** HCF × LCM = product of the two numbers → 8 × 48 = 16 × other → other = 384 / 16 = 24. Check: HCF(16, 24) = 8 and LCM(16, 24) = 48 ✓.

</details>

### P5. How many factors does 720 have?

**Difficulty:** Medium · **Pattern:** Factors and Multiples

- A) 24
- B) 28
- C) 30
- D) 36

<details>
<summary>Hint</summary>

Write 720 as a product of prime powers first.

</details>

<details>
<summary>Answer</summary>

**Answer:** C) 30

**Explanation:** 720 = 2⁴ × 3² × 5. Number of factors = (4 + 1)(2 + 1)(1 + 1) = 5 × 3 × 2 = 30.

</details>

### P6. What digit must replace x so that 31x45 is divisible by 11?

**Difficulty:** Medium · **Pattern:** Divisibility Rules

- A) 2
- B) 5
- C) 7
- D) 8

<details>
<summary>Answer</summary>

**Answer:** D) 8

**Explanation:** From the right, odd places hold 5, x, 3 and even places hold 4, 1.
(5 + x + 3) − (4 + 1) = x + 3. This must be 0 or a multiple of 11; with x a single digit, x + 3 = 11 → x = 8. Check: 31845 = 11 × 2895 ✓.

</details>

### P7. A number divided by 342 leaves remainder 47. What is the remainder when the same number is divided by 18?

**Difficulty:** Medium · **Pattern:** Remainders

- A) 5
- B) 11
- C) 13
- D) Cannot be determined

<details>
<summary>Hint</summary>

Check whether 18 divides 342.

</details>

<details>
<summary>Answer</summary>

**Answer:** B) 11

**Explanation:** N = 342k + 47. Since 342 = 18 × 19, the part 342k is divisible by 18. So the remainder is 47 ÷ 18 → 47 = 18 × 2 + 11 → 11.

</details>

### P8. Find the greatest number that divides 1305, 4665 and 6905 leaving the same remainder in each case.

**Difficulty:** Medium · **Pattern:** HCF with remainders

- A) 1120
- B) 1210
- C) 560
- D) 280

<details>
<summary>Answer</summary>

**Answer:** A) 1120

**Explanation:** The required number divides every difference:
4665 − 1305 = 3360, 6905 − 4665 = 2240, 6905 − 1305 = 5600.
HCF(3360, 2240) = 1120 and 5600 = 1120 × 5, so the HCF of all differences is 1120. (The common remainder is 1305 − 1120 = 185.)

</details>

### P9. Find the least number which, when divided by 6, 9 and 15, leaves remainder 4 in each case.

**Difficulty:** Medium · **Pattern:** LCM with remainders

- A) 49
- B) 64
- C) 94
- D) 184

<details>
<summary>Answer</summary>

**Answer:** C) 94

**Explanation:** LCM(6, 9, 15) = 90. The least number leaving remainder 4 for each divisor is 90 + 4 = 94. (184 = 180 + 4 also works but is not the least.)

</details>

### P10. What is the remainder when 2²⁵⁶ is divided by 17?

**Difficulty:** Hard · **Pattern:** Remainders of powers

- A) 1
- B) 2
- C) 15
- D) 16

<details>
<summary>Hint</summary>

2⁴ = 16 is one less than 17.

</details>

<details>
<summary>Answer</summary>

**Answer:** A) 1

**Explanation:** 2⁴ = 16 leaves remainder −1 with 17, so 2⁸ = (2⁴)² leaves (−1)² = 1. 2²⁵⁶ = (2⁸)³² leaves 1³² = 1.

</details>

### P11. How many trailing zeros does 250! have?

**Difficulty:** Hard · **Pattern:** Factors and Multiples

- A) 50
- B) 60
- C) 62
- D) 64

<details>
<summary>Answer</summary>

**Answer:** C) 62

**Explanation:** ⌊250/5⌋ + ⌊250/25⌋ + ⌊250/125⌋ = 50 + 10 + 2 = 62. (⌊250/625⌋ = 0.)

</details>

### P12. Find the least number which leaves remainder 4 when divided by 6, 9 or 15, and is exactly divisible by 7.

**Difficulty:** Hard · **Pattern:** LCM with remainders

- A) 94
- B) 184
- C) 274
- D) 364

<details>
<summary>Hint</summary>

The number has the form 90k + 4. Test k = 1, 2, 3, … for divisibility by 7.

</details>

<details>
<summary>Answer</summary>

**Answer:** D) 364

**Explanation:** LCM(6, 9, 15) = 90, so the number is 90k + 4.
k = 1 → 94 (94 ÷ 7 leaves 3), k = 2 → 184 (leaves 2), k = 3 → 274 (leaves 1), k = 4 → 364 = 7 × 52 ✓.

</details>

### P13. What is the unit digit of 2⁴³ × 3⁶⁷ × 7³³?

**Difficulty:** Hard · **Pattern:** Unit Digit

- A) 2
- B) 4
- C) 6
- D) 8

<details>
<summary>Answer</summary>

**Answer:** A) 2

**Explanation:**
2⁴³: 43 mod 4 = 3 → third term of (2, 4, 8, 6) → 8.
3⁶⁷: 67 mod 4 = 3 → third term of (3, 9, 7, 1) → 7.
7³³: 33 mod 4 = 1 → first term of (7, 9, 3, 1) → 7.
8 × 7 = 56 → 6; 6 × 7 = 42 → **2**.

</details>
