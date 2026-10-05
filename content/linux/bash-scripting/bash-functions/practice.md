# Functions — Practice

All items start in `~/linux-lab`.

### P1. Call with arguments

**Difficulty:** Easy · **Type:** Output · **Concepts:** function arguments

What does this print?

```bash
area() { echo "$1 x $2 = $(( $1 * $2 ))"; }
area 4 5
```

<details>
<summary>Answer</summary>

**Output:**

```text
4 x 5 = 20
```

</details>

### P2. Scope

**Difficulty:** Easy · **Type:** Output · **Concepts:** local vs global

What does this print?

```bash
x=1
y=1
modify() { x=2; local y=2; }
modify
echo "x=$x y=$y"
```

<details>
<summary>Answer</summary>

**Output:**

```text
x=2 y=1
```

</details>

### P3. Return a string?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** returning data

How do you get the text a function produces into a variable?

- A) `result=return func`
- B) `result=$(func)`
- C) `func; result=$?`
- D) `result=func`

<details>
<summary>Answer</summary>

**Answer:** B) `result=$(func)`

**Explanation:** Command substitution captures the function's output. `$?` holds only the 0–255 status.

</details>

### P4. Status codes

**Difficulty:** Medium · **Type:** Output · **Concepts:** return

What does this print?

```bash
validate() {
    [ -n "$1" ] || return 3
    [[ $1 =~ ^[0-9]+$ ]] || return 4
}
validate "";    echo "empty: $?"
validate "12a"; echo "12a: $?"
validate "42";  echo "42: $?"
```

<details>
<summary>Answer</summary>

**Output:**

```text
empty: 3
12a: 4
42: 0
```

With no explicit `return`, the status is that of the last command — the successful regex test.

</details>

### P5. Write a max function

**Difficulty:** Medium · **Type:** Script · **Concepts:** functions, output

Write `max` that prints the largest of any number of integer arguments. `max 3 9 4` should print `9`.

<details>
<summary>Answer</summary>

```bash
max() {
    local best=$1 n
    shift
    for n in "$@"; do
        (( n > best )) && best=$n
    done
    echo "$best"
}
max 3 9 4
```

**Output:**

```text
9
```

</details>

### P6. Captured noise

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** stdout vs stderr in functions

`count=$(count_errors app.log)` sets `count` to two lines: `checking app.log` and `3`. The function is:

```bash
count_errors() { echo "checking $1"; grep -c ERROR "$1"; }
```

Fix it so `count` is just `3`, while the message still appears on the terminal.

<details>
<summary>Answer</summary>

```bash
count_errors() { echo "checking $1" >&2; grep -c ERROR "$1"; }
count=$(count_errors app.log)
echo "count=$count"
```

**Output:**

```text
checking app.log
count=3
```

The message goes to stderr, which command substitution does not capture.

</details>

### P7. return or exit?

**Difficulty:** Medium · **Type:** Output · **Concepts:** return vs exit

What does this print?

```bash
bash -c '
step() { echo "step $1"; [ "$1" -lt 2 ] || return 1; }
step 1 && step 2 && step 3
echo "script continues"
fatal() { echo "fatal error"; exit 5; }
fatal
echo "never printed"
'
echo "status $?"
```

<details>
<summary>Answer</summary>

**Output:**

```text
step 1
step 2
script continues
fatal error
status 5
```

`step 2` returned 1, so `&&` skipped `step 3`, but the script continued. `exit 5` in `fatal` ended the whole script.

</details>

### P8. Wrapping overflow

**Difficulty:** Hard · **Type:** Output · **Concepts:** status range

What does this print?

```bash
code() { return "$1"; }
code 256; echo $?
code 257; echo $?
```

<details>
<summary>Answer</summary>

**Output:**

```text
0
1
```

Statuses are taken modulo 256, so 256 becomes 0 — a "failure" that looks like success. Keep return values between 0 and 125.

</details>
