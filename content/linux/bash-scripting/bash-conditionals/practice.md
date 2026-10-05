# Conditionals — Practice

All items start in `~/linux-lab`.

### P1. File or directory

**Difficulty:** Easy · **Type:** Output · **Concepts:** -f, -d

What does this print?

```bash
for p in notes.txt logs nothing; do
    if [ -f "$p" ]; then echo "$p: file"
    elif [ -d "$p" ]; then echo "$p: directory"
    else echo "$p: missing"; fi
done
```

<details>
<summary>Answer</summary>

**Output:**

```text
notes.txt: file
logs: directory
nothing: missing
```

</details>

### P2. Numeric operator

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** numeric tests

Which test is true when `$count` is greater than 10?

- A) `[ $count > 10 ]`
- B) `[ "$count" -gt 10 ]`
- C) `[ "$count" = 10 ]`
- D) `[ count -gt 10 ]`

<details>
<summary>Answer</summary>

**Answer:** B) `[ "$count" -gt 10 ]`

**Explanation:** A redirects output to a file named `10`. C tests string equality. D compares the literal word `count` and errors ("integer expression expected").

</details>

### P3. Empty or not

**Difficulty:** Easy · **Type:** Output · **Concepts:** -z, -n

What does this print?

```bash
a=""
b="x"
[ -z "$a" ] && echo "a is empty"
[ -n "$b" ] && echo "b is set"
```

<details>
<summary>Answer</summary>

**Output:**

```text
a is empty
b is set
```

</details>

### P4. case patterns

**Difficulty:** Medium · **Type:** Output · **Concepts:** case

What does this print?

```bash
for f in app.log photo.JPG notes.txt run.sh; do
    case "$f" in
        *.log|*.txt) echo "$f: text" ;;
        *.[jJ][pP][gG]) echo "$f: image" ;;
        *) echo "$f: other" ;;
    esac
done
```

<details>
<summary>Answer</summary>

**Output:**

```text
app.log: text
photo.JPG: image
notes.txt: text
run.sh: other
```

</details>

### P5. The empty-variable trap

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** quoting in [ ]

This prints `bash: [: =: unary operator expected` when `ENV` is not set. Rewrite the test two ways so it works.

```bash
if [ $ENV = prod ]; then echo "production"; fi
```

<details>
<summary>Answer</summary>

```bash
if [ "$ENV" = prod ]; then echo "production"; fi
if [[ $ENV == prod ]]; then echo "production"; fi
```

Both print nothing when `ENV` is unset, without an error.

</details>

### P6. Command as condition

**Difficulty:** Medium · **Type:** Output · **Concepts:** if with commands

What does this print?

```bash
if grep -q 'app.env=prod' config/app.conf; then
    echo "production config"
else
    echo "non-production config"
fi
```

<details>
<summary>Answer</summary>

**Output:**

```text
non-production config
```

`config/app.conf` has `app.env=dev`.

</details>

### P7. Validate input

**Difficulty:** Medium · **Type:** Script · **Concepts:** [[ =~ ]]

Write a check that prints `valid port` when `$port` is a number from 1 to 65535 and `invalid port` otherwise. Test it with `8080`, `abc` and `70000`.

<details>
<summary>Answer</summary>

```bash
for port in 8080 abc 70000; do
    if [[ $port =~ ^[0-9]+$ ]] && (( port >= 1 && port <= 65535 )); then
        echo "$port: valid port"
    else
        echo "$port: invalid port"
    fi
done
```

**Output:**

```text
8080: valid port
abc: invalid port
70000: invalid port
```

The regex check comes first so `(( ))` never sees non-numeric text.

</details>

### P8. Text comparison surprise

**Difficulty:** Hard · **Type:** Output · **Concepts:** string vs numeric comparison

What does this print?

```bash
[[ 100 < 20 ]] && echo "text: 100 < 20"
(( 100 < 20 )) || echo "number: 100 is not < 20"
```

<details>
<summary>Answer</summary>

**Output:**

```text
text: 100 < 20
number: 100 is not < 20
```

Inside `[[ ]]`, `<` compares strings, and "100" sorts before "20" because '1' < '2'. Arithmetic `(( ))` compares numbers.

</details>
