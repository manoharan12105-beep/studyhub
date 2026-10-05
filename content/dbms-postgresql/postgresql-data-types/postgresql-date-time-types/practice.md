# Date and Time Types — Practice

### P1. Choose the type

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** timestamp vs timestamptz

Which type should `orders.created_at` use in an application with users in several countries?

- A) `timestamp`
- B) `timestamptz`
- C) `date`
- D) `text`

<details>
<summary>Answer</summary>

**Answer:** B)

**Explanation:** An order is created at an absolute moment. `timestamptz` stores the instant and lets each session display it in its own zone. `timestamp` loses the information about which zone the wall-clock time belonged to.

</details>

### P2. Employees hired in a given year

**Difficulty:** Easy · **Type:** Query · **Concepts:** half-open date range

List employees hired in 2019 using a range condition that could use an index on `hire_date`. Order by hire date.

**Expected output:**

```text
  name  | hire_date
--------+------------
 Meena  | 2019-02-01
 Farhan | 2019-07-22
(2 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, hire_date
FROM employees
WHERE hire_date >= DATE '2019-01-01' AND hire_date < DATE '2020-01-01'
ORDER BY hire_date;
```

**Explanation:** `extract(year FROM hire_date) = 2019` gives the same rows but applies a function to the column, so a plain B-tree index on `hire_date` cannot be used.

</details>

### P3. Tenure in years and days

**Difficulty:** Medium · **Type:** Query · **Concepts:** age, date subtraction

As of `2026-04-01`, show each Engineering employee's tenure as an `age` interval and as whole days. Order by hire date.

**Expected output:**

```text
 name  | hire_date  |         tenure          | days
-------+------------+-------------------------+------
 Asha  | 2015-01-10 | 11 years 2 mons 22 days | 4099
 Ravi  | 2017-06-15 | 8 years 9 mons 16 days  | 3212
 Meena | 2019-02-01 | 7 years 2 mons          | 2616
 Karan | 2021-08-20 | 4 years 7 mons 12 days  | 1685
(4 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT name, hire_date,
       age(DATE '2026-04-01', hire_date) AS tenure,
       DATE '2026-04-01' - hire_date     AS days
FROM employees
WHERE dept_id = 10
ORDER BY hire_date;
```

</details>

### P4. Orders per local day

**Difficulty:** Medium · **Type:** Query · **Concepts:** AT TIME ZONE, grouping by day

Payments are stored as `timestamptz`. Count payments per **Indian** calendar day.

**Schema and data:**

```sql
CREATE TABLE payments (payment_id int, paid_at timestamptz);
INSERT INTO payments VALUES
    (1, '2026-03-09 17:00+00'),
    (2, '2026-03-09 19:15+00'),
    (3, '2026-03-10 02:00+00'),
    (4, '2026-03-10 20:00+00');
```

**Expected output:**

```text
  ist_day   | payments
------------+----------
 2026-03-09 |        1
 2026-03-10 |        2
 2026-03-11 |        1
(3 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT (paid_at AT TIME ZONE 'Asia/Kolkata')::date AS ist_day, count(*) AS payments
FROM payments
GROUP BY ist_day
ORDER BY ist_day;
```

**Explanation:** 19:15 UTC on 9 March is 00:45 on 10 March in India, and 20:00 UTC on 10 March is 01:30 on 11 March. Grouping by UTC days would give 2 and 2.

</details>

### P5. Find the missing logins

**Difficulty:** Hard · **Type:** Debugging · **Concepts:** BETWEEN on timestamps, half-open ranges

A report of "logins on 31 March 2026 (UTC)" returns too few rows.

**Schema and data:**

```sql
CREATE TABLE logins (user_name text, login_at timestamptz);
INSERT INTO logins VALUES
    ('anil',   '2026-03-31 00:00+00'),
    ('bhavna', '2026-03-31 09:30+00'),
    ('chirag', '2026-03-31 23:59:59.5+00'),
    ('deepa',  '2026-04-01 00:00+00');
```

```sql
SET TIME ZONE 'UTC';
SELECT user_name FROM logins
WHERE login_at BETWEEN '2026-03-31' AND '2026-03-31 23:59:59'
ORDER BY login_at;
```

**Output:**

```text
 user_name
-----------
 anil
 bhavna
(2 rows)
```

<details>
<summary>Answer</summary>

The upper bound `23:59:59` excludes Chirag's login at `23:59:59.5` — timestamps have microsecond precision, so any "last second of the day" bound leaves a gap. Use a half-open range:

```sql
SELECT user_name FROM logins
WHERE login_at >= '2026-03-31' AND login_at < '2026-04-01'
ORDER BY login_at;
```

**Output:**

```text
 user_name
-----------
 anil
 bhavna
 chirag
(3 rows)
```

</details>
