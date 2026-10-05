# The Sample Database

**Module:** SQL Fundamentals · **Interview priority:** Awareness

## What Is It?

A small PostgreSQL database — a company (departments, employees) plus a shop (customers, products, orders, order items) and bank accounts — used by **every** example, practice problem and expected output in the DBMS + PostgreSQL category. Run the script below once and every query in this category can be executed and checked.

## Why It Matters

- Learning SQL by running queries is far faster than reading them. With one shared dataset you stop re-learning tables and focus on the query.
- Every `**Output:**` block in this category was produced by running the query against exactly this data on PostgreSQL 18. Behaviour is the same on PostgreSQL 17 except where a lesson points out a difference.
- The data is deliberately small but contains the awkward cases interviews love: ties in salary, a department with no employees, an employee with no department, a customer who never ordered, `NULL` versus `0` in a column, and a self-referencing manager hierarchy.

## Core Concept

### How to use it

1. Install PostgreSQL 17 or later and open `psql` (or pgAdmin's Query Tool).
2. Create a practice database and connect to it:

```sql
-- Illustrative: run in psql
CREATE DATABASE studyhub;
\c studyhub
```

3. Paste and run the whole script in [Setup Script](#setup-script).
4. To reset after experimenting, drop and recreate the database, then run the script again.

### How outputs are shown

Outputs are printed exactly as `psql` prints them, with one setting: `NULL` is displayed as `NULL` (run `\pset null NULL` in psql to match). Without that setting psql shows `NULL` as an empty cell, which looks identical to an empty string `''` — a real source of confusion when learning.

```sql
-- Illustrative: psql meta-command to make NULL visible
\pset null NULL
```

> [!NOTE]
> Blocks that begin with `-- Illustrative` are not meant to run as-is (they are templates, psql meta-commands, or need a second session). Every other SQL block in this category runs against the sample database.

### Entity overview

```text
departments 1 ──< employees >── 1 employees (manager_id → emp_id, self-reference)

customers 1 ──< orders 1 ──< order_items >── 1 products

accounts (stand-alone, used for transaction examples)
```

`1 ──<` reads "one … to many".

## Setup Script

```sql
-- Sample database for the StudyHub DBMS + PostgreSQL category (PostgreSQL 17+)
CREATE TABLE departments (
    dept_id   integer PRIMARY KEY,
    dept_name text    NOT NULL UNIQUE,
    location  text
);

CREATE TABLE employees (
    emp_id     integer PRIMARY KEY,
    name       text    NOT NULL,
    email      text    UNIQUE,
    dept_id    integer REFERENCES departments (dept_id),
    manager_id integer REFERENCES employees (emp_id),
    salary     integer NOT NULL CHECK (salary > 0),
    commission integer,
    hire_date  date    NOT NULL
);

CREATE TABLE customers (
    customer_id integer PRIMARY KEY,
    name        text NOT NULL,
    city        text,
    email       text UNIQUE
);

CREATE TABLE products (
    product_id integer PRIMARY KEY,
    name       text          NOT NULL,
    category   text          NOT NULL,
    price      numeric(10,2) NOT NULL CHECK (price >= 0)
);

CREATE TABLE orders (
    order_id    integer PRIMARY KEY,
    customer_id integer NOT NULL REFERENCES customers (customer_id),
    order_date  date    NOT NULL,
    status      text    NOT NULL
        CHECK (status IN ('PLACED', 'SHIPPED', 'DELIVERED', 'CANCELLED'))
);

CREATE TABLE order_items (
    order_id   integer REFERENCES orders (order_id) ON DELETE CASCADE,
    product_id integer REFERENCES products (product_id),
    quantity   integer       NOT NULL CHECK (quantity > 0),
    unit_price numeric(10,2) NOT NULL,
    PRIMARY KEY (order_id, product_id)
);

CREATE TABLE accounts (
    account_id integer PRIMARY KEY,
    holder     text          NOT NULL,
    balance    numeric(12,2) NOT NULL CHECK (balance >= 0)
);

INSERT INTO departments VALUES
    (10, 'Engineering', 'Chennai'),
    (20, 'Sales',       'Mumbai'),
    (30, 'HR',          'Chennai'),
    (40, 'Finance',     'Bengaluru'),
    (50, 'Research',    NULL);

INSERT INTO employees VALUES
    (1,  'Asha',   'asha@corp.com',   10, NULL, 150000, NULL, '2015-01-10'),
    (2,  'Ravi',   'ravi@corp.com',   10, 1,     95000, NULL, '2017-06-15'),
    (3,  'Meena',  'meena@corp.com',  10, 2,     95000, NULL, '2019-02-01'),
    (4,  'Karan',  NULL,              10, 2,     72000, NULL, '2021-08-20'),
    (5,  'Divya',  'divya@corp.com',  20, 1,     88000, 5000, '2016-11-05'),
    (6,  'Arjun',  'arjun@corp.com',  20, 5,     60000, 3000, '2020-04-12'),
    (7,  'Sneha',  'sneha@corp.com',  20, 5,     60000, NULL, '2022-01-03'),
    (8,  'Vikram', 'vikram@corp.com', 30, 1,     70000, NULL, '2018-09-17'),
    (9,  'Pooja',  'pooja@corp.com',  30, 8,     52000, NULL, '2023-03-01'),
    (10, 'Farhan', 'farhan@corp.com', 40, 1,     82000, NULL, '2019-07-22'),
    (11, 'Nisha',  'nisha@corp.com',  NULL, 1,   45000, NULL, '2024-02-15'),
    (12, 'Rahul',  'rahul@corp.com',  20, 5,     55000, 0,    '2024-06-01');

INSERT INTO customers VALUES
    (1, 'Anil',   'Chennai', 'anil@mail.com'),
    (2, 'Bhavna', 'Mumbai',  'bhavna@mail.com'),
    (3, 'Chirag', 'Delhi',   'chirag@mail.com'),
    (4, 'Deepa',  'Chennai', NULL),
    (5, 'Eshan',  NULL,      'eshan@mail.com'),
    (6, 'Fatima', 'Pune',    'fatima@mail.com');

INSERT INTO products VALUES
    (1, 'Laptop',   'Electronics', 55000.00),
    (2, 'Mouse',    'Electronics',   500.00),
    (3, 'Keyboard', 'Electronics',  1500.00),
    (4, 'Desk',     'Furniture',    8000.00),
    (5, 'Chair',    'Furniture',    4500.00),
    (6, 'Notebook', 'Stationery',     50.00);

INSERT INTO orders VALUES
    (101, 1, '2026-01-05', 'DELIVERED'),
    (102, 2, '2026-01-12', 'DELIVERED'),
    (103, 1, '2026-02-03', 'SHIPPED'),
    (104, 3, '2026-02-14', 'CANCELLED'),
    (105, 4, '2026-02-20', 'DELIVERED'),
    (106, 2, '2026-03-01', 'PLACED'),
    (107, 1, '2026-03-15', 'DELIVERED'),
    (108, 5, '2026-03-28', 'DELIVERED');

INSERT INTO order_items VALUES
    (101, 1, 1, 55000.00),
    (101, 2, 2,   500.00),
    (102, 4, 1,  8000.00),
    (102, 5, 2,  4500.00),
    (103, 3, 1,  1500.00),
    (104, 1, 1, 55000.00),
    (105, 5, 1,  4500.00),
    (105, 2, 1,   500.00),
    (106, 3, 1,  1500.00),
    (106, 2, 1,   450.00),
    (107, 4, 1,  8000.00),
    (107, 5, 1,  4500.00),
    (108, 2, 3,   500.00);

INSERT INTO accounts VALUES
    (1, 'Asha',  10000.00),
    (2, 'Ravi',   5000.00),
    (3, 'Meena',     0.00);
```

## The Data

### departments

```sql
SELECT * FROM departments ORDER BY dept_id;
```

**Output:**

```text
 dept_id |  dept_name  | location
---------+-------------+-----------
      10 | Engineering | Chennai
      20 | Sales       | Mumbai
      30 | HR          | Chennai
      40 | Finance     | Bengaluru
      50 | Research    | NULL
(5 rows)
```

Research (50) has **no employees** and a `NULL` location.

### employees

```sql
SELECT emp_id, name, email, dept_id, manager_id, salary, commission, hire_date
FROM employees
ORDER BY emp_id;
```

**Output:**

```text
 emp_id |  name  |      email      | dept_id | manager_id | salary | commission | hire_date
--------+--------+-----------------+---------+------------+--------+------------+------------
      1 | Asha   | asha@corp.com   |      10 |       NULL | 150000 |       NULL | 2015-01-10
      2 | Ravi   | ravi@corp.com   |      10 |          1 |  95000 |       NULL | 2017-06-15
      3 | Meena  | meena@corp.com  |      10 |          2 |  95000 |       NULL | 2019-02-01
      4 | Karan  | NULL            |      10 |          2 |  72000 |       NULL | 2021-08-20
      5 | Divya  | divya@corp.com  |      20 |          1 |  88000 |       5000 | 2016-11-05
      6 | Arjun  | arjun@corp.com  |      20 |          5 |  60000 |       3000 | 2020-04-12
      7 | Sneha  | sneha@corp.com  |      20 |          5 |  60000 |       NULL | 2022-01-03
      8 | Vikram | vikram@corp.com |      30 |          1 |  70000 |       NULL | 2018-09-17
      9 | Pooja  | pooja@corp.com  |      30 |          8 |  52000 |       NULL | 2023-03-01
     10 | Farhan | farhan@corp.com |      40 |          1 |  82000 |       NULL | 2019-07-22
     11 | Nisha  | nisha@corp.com  |    NULL |          1 |  45000 |       NULL | 2024-02-15
     12 | Rahul  | rahul@corp.com  |      20 |          5 |  55000 |          0 | 2024-06-01
(12 rows)
```

Things to notice:

- Asha (1) has no manager — she is the root of the hierarchy.
- Nisha (11) has no department (`dept_id` is `NULL`).
- Karan (4) has no email.
- Ravi and Meena both earn 95000; Arjun and Sneha both earn 60000 — ties for ranking questions.
- `commission` is `NULL` for most employees, `0` for Rahul and positive for Divya and Arjun. `NULL` (unknown / not applicable) and `0` (known to be zero) are different.

### customers, products, orders, order_items, accounts

```sql
SELECT * FROM customers ORDER BY customer_id;
```

**Output:**

```text
 customer_id |  name  |  city   |      email
-------------+--------+---------+-----------------
           1 | Anil   | Chennai | anil@mail.com
           2 | Bhavna | Mumbai  | bhavna@mail.com
           3 | Chirag | Delhi   | chirag@mail.com
           4 | Deepa  | Chennai | NULL
           5 | Eshan  | NULL    | eshan@mail.com
           6 | Fatima | Pune    | fatima@mail.com
(6 rows)
```

```sql
SELECT * FROM products ORDER BY product_id;
```

**Output:**

```text
 product_id |   name   |  category   |  price
------------+----------+-------------+----------
          1 | Laptop   | Electronics | 55000.00
          2 | Mouse    | Electronics |   500.00
          3 | Keyboard | Electronics |  1500.00
          4 | Desk     | Furniture   |  8000.00
          5 | Chair    | Furniture   |  4500.00
          6 | Notebook | Stationery  |    50.00
(6 rows)
```

```sql
SELECT o.order_id, o.customer_id, o.order_date, o.status,
       sum(oi.quantity * oi.unit_price) AS order_total
FROM orders o
JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY o.order_id
ORDER BY o.order_id;
```

**Output:**

```text
 order_id | customer_id | order_date |  status   | order_total
----------+-------------+------------+-----------+-------------
      101 |           1 | 2026-01-05 | DELIVERED |    56000.00
      102 |           2 | 2026-01-12 | DELIVERED |    17000.00
      103 |           1 | 2026-02-03 | SHIPPED   |     1500.00
      104 |           3 | 2026-02-14 | CANCELLED |    55000.00
      105 |           4 | 2026-02-20 | DELIVERED |     5000.00
      106 |           2 | 2026-03-01 | PLACED    |     1950.00
      107 |           1 | 2026-03-15 | DELIVERED |    12500.00
      108 |           5 | 2026-03-28 | DELIVERED |     1500.00
(8 rows)
```

- Fatima (6) has **never ordered**; the Notebook (6) has **never been sold**.
- Order 106 sold a Mouse at 450.00 (a discount), so `order_items.unit_price` can differ from `products.price` — the price at the time of sale is stored on the item.

```sql
SELECT * FROM accounts ORDER BY account_id;
```

**Output:**

```text
 account_id | holder | balance
------------+--------+----------
          1 | Asha   | 10000.00
          2 | Ravi   |  5000.00
          3 | Meena  |     0.00
(3 rows)
```

### The manager hierarchy

```text
Asha (1)
├── Ravi (2)
│   ├── Meena (3)
│   └── Karan (4)
├── Divya (5)
│   ├── Arjun (6)
│   ├── Sneha (7)
│   └── Rahul (12)
├── Vikram (8)
│   └── Pooja (9)
├── Farhan (10)
└── Nisha (11)
```

## Common Mistakes

- Running queries in the wrong database (`\c studyhub` first) — "relation does not exist" usually means this.
- Comparing your output with a lesson's output without `\pset null NULL` and mistaking an empty cell for an empty string.
- Experimenting with `UPDATE`/`DELETE` and then wondering why later outputs differ — reset the database.

## Revision

- One shared PostgreSQL dataset: `departments`, `employees`, `customers`, `products`, `orders`, `order_items`, `accounts`.
- Deliberate edge cases: ties (95000, 60000), empty department (Research), employee without department (Nisha), customer without orders (Fatima), unsold product (Notebook), `NULL` vs `0` commission.
- Outputs are psql output with `\pset null NULL`.

## Quick Revision

Run the setup script once; every example in this category uses it. Watch the edge cases: ties, empty groups, `NULL`s.
