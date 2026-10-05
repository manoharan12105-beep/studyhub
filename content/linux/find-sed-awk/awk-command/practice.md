# awk — Practice

All items start in `~/linux-lab`.

### P1. One column

**Difficulty:** Easy · **Type:** Output · **Concepts:** fields

What does this print?

```bash
awk '{print $7}' access.log | head -n 3
```

<details>
<summary>Answer</summary>

**Output:**

```text
/index.html
/login
/login
```

Field 7 is the request path in the access log.

</details>

### P2. CSV column

**Difficulty:** Easy · **Type:** Command · **Concepts:** -F, NR

Print the city of every employee (no header) using awk.

<details>
<summary>Answer</summary>

```bash
awk -F, 'NR > 1 {print $5}' employees.csv
```

**Output:**

```text
chennai
mumbai
bengaluru
chennai
delhi
mumbai
bengaluru
chennai
```

</details>

### P3. Last field

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** NF

Which prints the last word of each line, however many words a line has?

- A) `awk '{print $LAST}'`
- B) `awk '{print $NF}'`
- C) `awk '{print NF}'`
- D) `awk '{print $-1}'`

<details>
<summary>Answer</summary>

**Answer:** B) `awk '{print $NF}'`

**Explanation:** `NF` is the number of fields, so `$NF` is the last field. `NF` alone prints the count.

</details>

### P4. Filter by number

**Difficulty:** Medium · **Type:** Output · **Concepts:** numeric patterns

What does this print?

```bash
awk '$10 > 2000 {print $7, $10}' access.log
```

<details>
<summary>Answer</summary>

**Output:**

```text
/api/orders 2310
/dashboard 3150
/api/orders 2290
```

</details>

### P5. Total for one department

**Difficulty:** Medium · **Type:** Command · **Concepts:** conditions, END

Print the total salary of the `engineering` department.

<details>
<summary>Answer</summary>

```bash
awk -F, '$3 == "engineering" {sum += $4} END {print sum}' employees.csv
```

**Output:**

```text
255000
```

</details>

### P6. Requests per IP

**Difficulty:** Medium · **Type:** Output · **Concepts:** associative arrays

What does this print?

```bash
awk '{hits[$1]++} END {for (ip in hits) print hits[ip], ip}' access.log | sort -rn
```

<details>
<summary>Answer</summary>

**Output:**

```text
4 192.168.1.10
3 10.0.0.5
2 192.168.1.11
1 192.168.1.12
```

</details>

### P7. Header leak

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** string vs numeric comparison

`awk -F, '$4 >= 50000 {print $2}' employees.csv` prints `name` as its first line. Why, and how do you fix it?

<details>
<summary>Answer</summary>

On the header line, field 4 is the text `salary`; comparing text with a number makes awk compare strings, and `"salary" >= "50000"` is true. Skip the header:

```bash
awk -F, 'NR > 1 && $4 >= 50000 {print $2}' employees.csv
```

**Output:**

```text
asha
ravi
meena
fatima
arjun
divya
```

</details>

### P8. Formatted report

**Difficulty:** Medium · **Type:** Output · **Concepts:** printf, BEGIN

What does this print?

```bash
awk -F, 'BEGIN {printf "%-8s %6s\n", "NAME", "SALARY"} NR > 1 && NR <= 3 {printf "%-8s %6d\n", $2, $4}' employees.csv
```

<details>
<summary>Answer</summary>

**Output:**

```text
NAME     SALARY
asha      85000
ravi      52000
```

`%-8s` left-aligns in 8 characters; `%6d` right-aligns a number in 6.

</details>

### P9. Average per city

**Difficulty:** Hard · **Type:** Command · **Concepts:** two arrays, floating point

Print each city with the average salary of employees there, one decimal place, sorted by city name.

<details>
<summary>Answer</summary>

```bash
awk -F, 'NR > 1 {s[$5] += $4; n[$5]++} END {for (c in s) printf "%s %.1f\n", c, s[c] / n[c]}' employees.csv | sort
```

**Output:**

```text
bengaluru 71000.0
chennai 59333.3
delhi 61000.0
mumbai 65000.0
```

</details>

### P10. Keep first occurrence

**Difficulty:** Hard · **Type:** Output · **Concepts:** !seen[$0]++

What does this print?

```bash
printf '%s\n' b a b c a | awk '!seen[$0]++'
```

<details>
<summary>Answer</summary>

**Output:**

```text
b
a
c
```

Each line is printed only the first time it appears, in the original order.

</details>
