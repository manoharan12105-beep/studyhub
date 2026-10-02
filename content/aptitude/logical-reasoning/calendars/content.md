# Calendars

## Concept

Calendar questions ask for the day of the week on a date, or relate days across months and years. Days repeat every 7, so only the **remainder after dividing by 7** matters. These remainders are called **odd days**.

```text
Odd days = number of days mod 7
```

If today is Monday, 61 days later is 61 mod 7 = 5 days after Monday → Saturday. Every calendar method is a way of counting odd days without counting every day.

## Rules

### Leap years

- A year divisible by 4 is a leap year (366 days) — **except** century years.
- A century year is a leap year only if divisible by **400**.
- 2000 and 2400 are leap years; 1800, 1900 and 2100 are not.

### Odd days in years and centuries

| Period | Days | Odd days |
|--------|------|----------|
| Normal year | 365 = 52 weeks + 1 | 1 |
| Leap year | 366 = 52 weeks + 2 | 2 |
| 100 years (76 normal + 24 leap) | — | 76 + 48 = 124 → **5** |
| 200 years | — | 10 → **3** |
| 300 years | — | 15 → **1** |
| 400 years (includes the extra leap year at 400) | — | **0** |

### Odd days in months

| Month length | Odd days |
|--------------|----------|
| 31 days | 3 |
| 30 days | 2 |
| 28 days (February, normal year) | 0 |
| 29 days (February, leap year) | 1 |

Months with 31 days: January, March, May, July, August, October, December.

### Odd days to day of the week

| Odd days | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|----------|---|---|---|---|---|---|---|
| Day | Sunday | Monday | Tuesday | Wednesday | Thursday | Friday | Saturday |

This table applies when counting odd days **from the beginning of the calendar** (year 1) up to the date.

## Formulas

### Day of the week for a date

```text
Total odd days = odd days in completed centuries
               + odd days in remaining completed years
               + odd days in completed months of the given year
               + the date
Day = table value of (total mod 7)
```

- **Example:** 15 August 1947.
  - 1600 years → 0; 1601–1900 (300 years) → 1.
  - 1901–1946: 46 years with 11 leap years → 35 + 22 = 57 → 1.
  - 1947: Jan 3 + Feb 0 + Mar 3 + Apr 2 + May 3 + Jun 2 + Jul 3 + 15 days of August (1) = 17 → 3.
  - Total = 0 + 1 + 1 + 3 = 5 → **Friday**.
- **Common mistake:** counting the leap day for a February that has not yet ended, or treating 1900 as a leap year.

### Moving from a known date

```text
Day after k days = known day + (k mod 7)
Same date next year: +1 day (normal year in between), +2 days (if 29 February falls in between)
```

- **Example:** 1 January 2023 was a Sunday. 2023 is a normal year → 1 January 2024 was a Monday. 2024 is a leap year → 1 January 2025 was a Wednesday.

### Repeating calendars

A year's calendar repeats in a later year that starts on the same day and has the same leap status:

| Year type | Calendar repeats after |
|-----------|------------------------|
| Leap year | 28 years |
| Year after a leap year (Y mod 4 = 1) | 6 years |
| Other non-leap years (Y mod 4 = 2 or 3) | 11 years |

These rules hold when no non-leap century year (like 2100) falls in between.

- **Example:** 2021 → 2027; 2022 → 2033; 2023 → 2034; 2024 → 2052.

## Solving Approach

1. If a reference day is given, count the days between and use mod 7.
2. Otherwise, count odd days from year 1: centuries, years, months, date.
3. Map the total to a day with the table.
4. For repeating calendars, check both the starting day and leap status.

## Problem Patterns

### Pattern 1: Days after a given day

**Example:** Wednesday + 100 days → 100 mod 7 = 2 → Friday.

### Pattern 2: Day of a historical date

**Example:** 26 January 1950 → 0 + 1 + (49 years: 12 leap → 37 + 24 = 61 → 5) + 26 (→ 5) = 11 → 4 → **Thursday**.

### Pattern 3: Same date in another year

**Example:** 5 March 2024 was a Tuesday. From 5 March 2024 to 5 March 2025 there is no 29 February → 365 days → +1 → Wednesday.

### Pattern 4: Repeating calendar

**Example:** the calendar of 2023 will be repeated in 2034.

## Common Mistakes

- Treating every century year as a leap year.
- Adding a leap day for a February that is not inside the period.
- Using the odd-day table (0 = Sunday) when counting from a reference date instead of from year 1.
- Assuming a calendar repeats after 7 years.

## Placement Tips

- Memorise the century odd days (5, 3, 1, 0) and month odd days (3, 0/1, 3, 2, 3, 2, 3, 3, 2, 3, 2, 3).
- When a reference date is given, never count from year 1 — just add the difference.
- Check whether 29 February lies inside the interval before adding days across years.

## Key Takeaways

- Only odd days (days mod 7) matter.
- Leap year: divisible by 4; centuries only if divisible by 400.
- Odd days: normal year 1, leap year 2; 100 years 5, 200 → 3, 300 → 1, 400 → 0.
- Calendars repeat after 28 years (leap), 6 years (year after a leap year) or 11 years (other non-leap years).
