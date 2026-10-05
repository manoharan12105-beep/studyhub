# sort, uniq and wc — Practice

All items start in `~/linux-lab`.

### P1. Numeric order

**Difficulty:** Easy · **Type:** Output · **Concepts:** sort -n

What does this print?

```bash
sort -n numbers.txt | tail -n 2
```

<details>
<summary>Answer</summary>

**Output:**

```text
33
100
```

</details>

### P2. Text order

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** default sort

`numbers.txt` contains 10, 2, 33, 4, 100, 25. What is the **first** line of `sort numbers.txt`?

- A) 2
- B) 10
- C) 100
- D) 4

<details>
<summary>Answer</summary>

**Answer:** B) 10

**Explanation:** Text sort compares character by character. `10` and `100` both start with `1`, the smallest first character; `10` is a prefix of `100`, so it comes first.

</details>

### P3. Unique without sorting

**Difficulty:** Easy · **Type:** Output · **Concepts:** uniq adjacency

What does this print?

```bash
printf '%s\n' a a b a | uniq
```

<details>
<summary>Answer</summary>

**Output:**

```text
a
b
a
```

Only the two adjacent `a` lines collapse.

</details>

### P4. Count lines

**Difficulty:** Easy · **Type:** Command · **Concepts:** wc -l

Print only the number of lines in `access.log` (no filename).

<details>
<summary>Answer</summary>

```bash
wc -l < access.log
```

**Output:**

```text
10
```

</details>

### P5. Lowest paid

**Difficulty:** Medium · **Type:** Command · **Concepts:** sort -t -k

Print the name and salary of the lowest-paid employee from `employees.csv`.

<details>
<summary>Answer</summary>

```bash
tail -n +2 employees.csv | sort -t, -k4,4n | head -n 1 | cut -d, -f2,4
```

**Output:**

```text
karan,45000
```

</details>

### P6. Repeated fruits

**Difficulty:** Medium · **Type:** Output · **Concepts:** uniq -d, -c

What does this print?

```bash
sort fruits.txt | uniq -cd
```

<details>
<summary>Answer</summary>

**Output:**

```text
      3 apple
      2 banana
```

`-d` keeps only repeated lines and `-c` counts them.

</details>

### P7. Status code frequency

**Difficulty:** Medium · **Type:** Command · **Concepts:** frequency pipeline

Using `access.log`, print each HTTP status code with the number of requests that returned it, most frequent first. The status is the 9th space-separated field.

<details>
<summary>Answer</summary>

```bash
cut -d' ' -f9 access.log | sort | uniq -c | sort -rn
```

**Output:**

```text
      6 200
      2 404
      1 500
      1 302
```

</details>

### P8. Cities, unique and counted

**Difficulty:** Medium · **Type:** Output · **Concepts:** sort -u, wc

How many distinct cities appear in `employees.csv`?

```bash
tail -n +2 employees.csv | cut -d, -f5 | sort -u | wc -l
```

<details>
<summary>Answer</summary>

**Output:**

```text
4
```

chennai, mumbai, bengaluru and delhi.

</details>

### P9. Sizes in order

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** sort -h

Which command sorts the output of `du -sh *` from smallest to largest correctly?

- A) `du -sh * | sort`
- B) `du -sh * | sort -n`
- C) `du -sh * | sort -h`
- D) `du -sh * | sort -r`

<details>
<summary>Answer</summary>

**Answer:** C) `du -sh * | sort -h`

**Explanation:** `-n` reads `900K` as 900 and `2G` as 2, putting them in the wrong order. `-h` understands unit suffixes.

</details>

### P10. Department and salary order

**Difficulty:** Hard · **Type:** Output · **Concepts:** multiple sort keys

What are the first two lines?

```bash
tail -n +2 employees.csv | sort -t, -k3,3r -k4,4n | head -n 2
```

<details>
<summary>Answer</summary>

**Output:**

```text
108,karan,sales,45000,chennai
102,ravi,sales,52000,mumbai
```

Departments in reverse text order (sales first), then salary ascending inside each department.

</details>
