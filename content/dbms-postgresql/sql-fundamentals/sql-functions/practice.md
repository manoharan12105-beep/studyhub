# SQL Functions — Practice

### P1. Predict the counts

**Difficulty:** Easy · **Type:** Output · **Concepts:** COUNT, NULL

```sql
SELECT count(*), count(city), count(DISTINCT city), count(email)
FROM customers;
```

<details>
<summary>Answer</summary>

**Output:**

```text
 count | count | count | count
-------+-------+-------+-------
     6 |     5 |     4 |     5
(1 row)
```

6 rows; 5 known cities (Eshan's is `NULL`); 4 distinct cities (Chennai twice); 5 emails (Deepa's is `NULL`).

</details>

### P2. Company salary summary

**Difficulty:** Easy · **Type:** Query · **Concepts:** aggregates, round

Show the number of employees, total, average (2 decimals), lowest and highest salary.

**Expected output:**

```text
 employees | total  | average  | lowest | highest
-----------+--------+----------+--------+---------
        12 | 924000 | 77000.00 |  45000 |  150000
(1 row)
```

<details>
<summary>Solution</summary>

```sql
SELECT count(*)              AS employees,
       sum(salary)           AS total,
       round(avg(salary), 2) AS average,
       min(salary)           AS lowest,
       max(salary)           AS highest
FROM employees;
```

</details>

### P3. Email domains and mailbox names

**Difficulty:** Medium · **Type:** Query · **Concepts:** string functions

For each customer with an email, return the name, the part before `@` in upper case, and the domain after `@`. Order by name.

**Expected output:**

```text
  name  | mailbox |  domain
--------+---------+----------
 Anil   | ANIL    | mail.com
 Bhavna | BHAVNA  | mail.com
 Chirag | CHIRAG  | mail.com
 Eshan  | ESHAN   | mail.com
 Fatima | FATIMA  | mail.com
(5 rows)
```

<details>
<summary>Hint</summary>

`position('@' IN email)` gives the index of `@`; `substring(email FROM n)` returns the rest from position `n`. PostgreSQL also has `split_part(email, '@', 2)`.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT name,
       upper(substring(email FROM 1 FOR position('@' IN email) - 1)) AS mailbox,
       substring(email FROM position('@' IN email) + 1)             AS domain
FROM customers
WHERE email IS NOT NULL
ORDER BY name;
```

**Alternative:** `upper(split_part(email, '@', 1))` and `split_part(email, '@', 2)` — shorter and PostgreSQL-specific.

</details>

### P4. Tenure in whole years

**Difficulty:** Medium · **Type:** Query · **Concepts:** age, extract

As of `2026-04-01`, list employees with at least 7 full years of service and their completed years, longest first.

**Expected output:**

```text
  name  | hire_date  | years
--------+------------+-------
 Asha   | 2015-01-10 |    11
 Divya  | 2016-11-05 |     9
 Ravi   | 2017-06-15 |     8
 Vikram | 2018-09-17 |     7
 Meena  | 2019-02-01 |     7
(5 rows)
```

<details>
<summary>Hint</summary>

`extract(year FROM age(DATE '2026-04-01', hire_date))` gives completed years.

</details>

<details>
<summary>Solution</summary>

```sql
SELECT name, hire_date,
       extract(year FROM age(DATE '2026-04-01', hire_date)) AS years
FROM employees
WHERE age(DATE '2026-04-01', hire_date) >= interval '7 years'
ORDER BY hire_date;
```

**Explanation:** `age` returns an interval in years/months/days, so it respects month lengths and leap years — better than dividing the day count by 365. Meena (hired 2019-02-01) has 7 years 2 months; Farhan (2019-07-22) has only 6 years, so he is excluded.

</details>

### P5. Delivery rate per customer

**Difficulty:** Medium · **Type:** Query · **Concepts:** integer division, FILTER, round

For each customer who has orders, show total orders and the percentage delivered (1 decimal). Order by customer id.

**Expected output:**

```text
 customer_id | orders | delivered_pct
-------------+--------+---------------
           1 |      3 |          66.7
           2 |      2 |          50.0
           3 |      1 |           0.0
           4 |      1 |         100.0
           5 |      1 |         100.0
(5 rows)
```

<details>
<summary>Solution</summary>

```sql
SELECT customer_id,
       count(*) AS orders,
       round(100.0 * count(*) FILTER (WHERE status = 'DELIVERED') / count(*), 1) AS delivered_pct
FROM orders
GROUP BY customer_id
ORDER BY customer_id;
```

**Explanation:** Starting with `100.0` makes the arithmetic numeric. With `100 * … / count(*)` customer 1 (2 of 3 delivered) would show 66 instead of 66.7.

</details>

### P6. Average with and without NULLs

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** AVG, COALESCE

A `ratings` column holds 5, 3, NULL, 4. What do `avg(ratings)` and `avg(COALESCE(ratings, 0))` return, and which is right for "average rating of products that have been rated"?

<details>
<summary>Answer</summary>

`avg(ratings)` = 12 / 3 = 4. `avg(COALESCE(ratings, 0))` = 12 / 4 = 3. Here `NULL` means "not rated yet", so ignoring it (4) is correct; treating it as 0 would wrongly penalise unrated products.

</details>
