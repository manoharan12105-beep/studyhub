# Pipes and Command Chaining — Practice

All items start in `~/linux-lab`.

### P1. Which runs?

**Difficulty:** Easy · **Type:** Output · **Concepts:** &&, ||

What does this print?

```bash
ls app.log > /dev/null && echo A
ls none.log 2> /dev/null && echo B
ls none.log 2> /dev/null || echo C
```

<details>
<summary>Answer</summary>

**Output:**

```text
A
C
```

`ls app.log` succeeds, so `A` prints. `ls none.log` fails: `&&` skips `B`, `||` runs `C`.

</details>

### P2. Count the Java files

**Difficulty:** Easy · **Type:** Command · **Concepts:** pipe, wc

Count the `.java` files in `project/src` with a pipeline of `ls`, `grep` and `wc`.

<details>
<summary>Answer</summary>

```bash
ls project/src | grep '\.java$' | wc -l
```

**Output:**

```text
4
```

`\.` matches a literal dot and `$` anchors the end of the line.

</details>

### P3. Pipe operator meaning

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** pipes

In `grep WARN app.log | wc -l`, what does `wc` receive on its standard input?

- A) The filename `app.log`
- B) The lines of `app.log` that contain WARN
- C) The number of WARN lines
- D) grep's error messages

<details>
<summary>Answer</summary>

**Answer:** B) The lines of `app.log` that contain WARN

**Explanation:** The pipe carries `grep`'s stdout — the matching lines. `wc -l` counts them. Errors (stderr) are not piped.

</details>

### P4. Stage by stage

**Difficulty:** Medium · **Type:** Output · **Concepts:** pipeline stages

What does this print?

```bash
sort fruits.txt | uniq -c | sort -rn | head -n 1
```

<details>
<summary>Answer</summary>

**Output:**

```text
      3 apple
```

`apple` appears three times in `fruits.txt`, more than any other fruit.

</details>

### P5. The misleading status

**Difficulty:** Medium · **Type:** Output · **Concepts:** pipeline exit status, pipefail

What does this print?

```bash
grep nothing-here app.log | wc -l
echo "default: $?"
set -o pipefail
grep nothing-here app.log | wc -l
echo "pipefail: $?"
set +o pipefail
```

<details>
<summary>Answer</summary>

**Output:**

```text
0
default: 0
0
pipefail: 1
```

`grep` returns 1 when nothing matches. Without `pipefail` the status is `wc`'s 0.

</details>

### P6. Safe directory change

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** ; vs &&

A deploy script contains `cd /srv/app/releases/old; rm -r *`. One day the `old` directory does not exist. What happens, and how do you fix the script?

<details>
<summary>Answer</summary>

`cd` fails, but `;` runs `rm -r *` anyway — in the script's current directory, deleting whatever is there. Fix: `cd /srv/app/releases/old && rm -r ./*`, or better avoid `cd`: `rm -r /srv/app/releases/old/*`, and start the script with `set -e` so any failing command stops it.

</details>

### P7. Subshell or not?

**Difficulty:** Medium · **Type:** Output · **Concepts:** ( ) vs { }

What does this print?

```bash
( cd config ); pwd
{ cd config; }; pwd
cd ~/linux-lab
```

<details>
<summary>Answer</summary>

**Output:**

```text
/home/student/linux-lab
/home/student/linux-lab/config
```

The `cd` inside `( )` happens in a child process and is lost; inside `{ }` it changes the current shell.

</details>

### P8. Header plus data

**Difficulty:** Medium · **Type:** Command · **Concepts:** grouping and redirection

Create `sales.csv` containing the header line of `employees.csv` followed by only the `sales` rows, using one grouped command.

<details>
<summary>Answer</summary>

```bash
{ head -n 1 employees.csv; grep ',sales,' employees.csv; } > sales.csv
cat sales.csv
```

**Output:**

```text
id,name,dept,salary,city
102,ravi,sales,52000,mumbai
105,fatima,sales,61000,delhi
108,karan,sales,45000,chennai
```

</details>

### P9. Not if/else

**Difficulty:** Hard · **Type:** Output · **Concepts:** && || pitfall

What does this print?

```bash
ls app.log > /dev/null && grep -q CRITICAL app.log && echo found || echo "not found or ls failed"
```

<details>
<summary>Answer</summary>

**Output:**

```text
not found or ls failed
```

`ls` succeeded, but `grep -q CRITICAL` failed (no such lines), so the `||` branch ran. The message cannot tell which step failed — use `if` when you need to know.

</details>

### P10. The lost counter

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** pipelines run in subshells

This prints `errors: 0` although `app.log` has three ERROR lines. Explain and fix.

```bash
count=0
grep ERROR app.log | while read -r line; do count=$((count + 1)); done
echo "errors: $count"
```

<details>
<summary>Answer</summary>

The `while` loop runs in a subshell because it is a pipeline stage; it increments its own copy of `count`. Feed the loop with a redirection so it runs in the current shell:

```bash
count=0
while read -r line; do count=$((count + 1)); done < <(grep ERROR app.log)
echo "errors: $count"
```

**Output:**

```text
errors: 3
```

(For simple counting, `grep -c ERROR app.log` is the right tool.)

</details>
