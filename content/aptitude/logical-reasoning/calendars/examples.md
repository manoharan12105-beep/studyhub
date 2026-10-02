# Calendars — Solved Examples

### E1. Days after a given day

**Difficulty:** Easy · **Pattern:** Days after a given day

**Problem:** Today is Monday. What day will it be after 61 days?

**Solution:**

1. 61 = 8 × 7 + 5 → 5 odd days.
2. Monday + 5 → Saturday.

**Answer:** **Saturday**

### E2. Leap years

**Difficulty:** Easy · **Pattern:** Leap years

**Problem:** Which of 1900 and 2000 is a leap year?

**Solution:**

1. Both are century years, so they must be divisible by 400.
2. 1900 ÷ 400 is not exact → not leap. 2000 ÷ 400 = 5 → leap.

**Answer:** **2000** only

### E3. Year to year

**Difficulty:** Medium · **Pattern:** Same date in another year

**Problem:** 1 January 2023 was a Sunday. What day was 1 January 2025?

**Solution:**

1. 2023 is a normal year → +1 → 1 January 2024 = Monday.
2. 2024 is a leap year → +2 → 1 January 2025 = Wednesday.

**Answer:** **Wednesday**

### E4. Historical date

**Difficulty:** Medium · **Pattern:** Day of a historical date

**Problem:** What day of the week was 15 August 1947?

**Solution:**

1. Up to 1600: 0 odd days. 1601–1900: 1 odd day.
2. 1901–1946: 46 years, 11 leap years → 35 × 1 + 11 × 2 = 57 → 57 mod 7 = 1.
3. 1947 up to 15 August: 3 + 0 + 3 + 2 + 3 + 2 + 3 + 15 = 31 → 31 mod 7 = 3.
4. Total = 0 + 1 + 1 + 3 = 5 → Friday.

**Answer:** **Friday**

### E5. Another historical date

**Difficulty:** Hard · **Pattern:** Day of a historical date

**Problem:** What day of the week was 26 January 1950?

**Solution:**

1. Up to 1900: 0 + 1 = 1.
2. 1901–1949: 49 years with 12 leap years → 37 + 24 = 61 → 5.
3. 26 January → 26 mod 7 = 5.
4. Total = 1 + 5 + 5 = 11 → 4 → Thursday.

**Answer:** **Thursday**

### E6. Repeating calendar

**Difficulty:** Hard · **Pattern:** Repeating calendar

**Problem:** In which year will the calendar of 2021 next be repeated?

**Solution:**

1. 2021 is a normal year, and 2021 mod 4 = 1 (the year after a leap year).
2. Such years repeat after 6 years → 2027.
3. Check: odd days from 2021 to 2026 = 1 + 1 + 1 + 2 (2024) + 1 + 1 = 7 → 0, and 2027 is also a normal year ✓.

**Answer:** **2027**
