# Loops — Practice

All items start in `~/linux-lab`.

### P1. Count down

**Difficulty:** Easy · **Type:** Output · **Concepts:** C-style for

What does this print?

```bash
for ((i = 3; i > 0; i--)); do printf '%s ' "$i"; done; echo "go"
```

<details>
<summary>Answer</summary>

**Output:**

```text
3 2 1 go
```

</details>

### P2. Skip and stop

**Difficulty:** Easy · **Type:** Output · **Concepts:** break, continue

What does this print?

```bash
for n in 10 20 30 40 50; do
    [ "$n" -eq 30 ] && continue
    [ "$n" -eq 50 ] && break
    echo "$n"
done
```

<details>
<summary>Answer</summary>

**Output:**

```text
10
20
40
```

</details>

### P3. Loop over files

**Difficulty:** Easy · **Type:** Command · **Concepts:** for with globs

Print the name and size in bytes of every `.txt` file in the lab, one per line.

<details>
<summary>Answer</summary>

```bash
for f in *.txt; do
    echo "$f $(wc -c < "$f")"
done
```

**Output:**

```text
fruits.txt 45
list1.txt 26
list2.txt 26
notes.txt 147
numbers.txt 17
v1.txt 74
v2.txt 96
```

</details>

### P4. Words or lines?

**Difficulty:** Medium · **Type:** Output · **Concepts:** for $(cat) vs while read

What do these print?

```bash
printf 'red apple\ngreen pear\n' > colours.txt
for x in $(cat colours.txt); do echo "[$x]"; done
while IFS= read -r x; do echo "[$x]"; done < colours.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
[red]
[apple]
[green]
[pear]
[red apple]
[green pear]
```

The `for` loop iterates over words; `while read` over lines.

</details>

### P5. Average salary

**Difficulty:** Medium · **Type:** Script · **Concepts:** while read with IFS

Using a `while read` loop over `employees.csv` (skipping the header), print the number of employees and the integer average salary.

<details>
<summary>Answer</summary>

```bash
count=0
sum=0
while IFS=, read -r id name dept salary city; do
    count=$((count + 1))
    sum=$((sum + salary))
done < <(tail -n +2 employees.csv)
echo "employees=$count average=$((sum / count))"
```

**Output:**

```text
employees=8 average=63875
```

</details>

### P6. Lost total

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** pipeline subshell

Why does this print `lines: 0`? Fix it.

```bash
lines=0
cat app.log | while read -r l; do lines=$((lines + 1)); done
echo "lines: $lines"
```

<details>
<summary>Answer</summary>

The `while` loop is a pipeline stage and runs in a subshell, so its `lines` is a separate copy. Redirect instead of piping:

```bash
lines=0
while read -r l; do lines=$((lines + 1)); done < app.log
echo "lines: $lines"
```

**Output:**

```text
lines: 12
```

</details>

### P7. Wait for a file

**Difficulty:** Medium · **Type:** Script · **Concepts:** until, retry limit

Write a loop that waits up to 3 seconds (checking once per second) for `ready.flag` to exist, then prints either `ready` or `timed out`. Test it without creating the file.

<details>
<summary>Answer</summary>

```bash
waited=0
until [ -e ready.flag ] || [ "$waited" -ge 3 ]; do
    sleep 1
    waited=$((waited + 1))
done
if [ -e ready.flag ]; then echo "ready"; else echo "timed out"; fi
```

**Output:**

```text
timed out
```

</details>

### P8. Multiplication row

**Difficulty:** Hard · **Type:** Output · **Concepts:** nested loops, break 2

What does this print?

```bash
for i in 1 2 3; do
    for j in 1 2 3; do
        [ $((i * j)) -gt 4 ] && break 2
        printf '%d ' $((i * j))
    done
done
echo
```

<details>
<summary>Answer</summary>

**Output:**

```text
1 2 3 2 4
```

When `i=2, j=3` the product 6 exceeds 4, and `break 2` leaves both loops.

</details>
