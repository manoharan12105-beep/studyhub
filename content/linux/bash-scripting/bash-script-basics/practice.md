# Bash Script Basics — Practice

All items start in `~/linux-lab`.

### P1. Make it runnable

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** execute permission

`./deploy.sh` prints "Permission denied". What is the usual fix?

- A) `sudo ./deploy.sh`
- B) `chmod +x deploy.sh`
- C) Rename it to `deploy`
- D) Add `#!/bin/bash` to the end of the file

<details>
<summary>Answer</summary>

**Answer:** B) `chmod +x deploy.sh`

**Explanation:** The execute bit is missing. `sudo` does not help (and is unsafe as a habit). The shebang belongs on the first line.

</details>

### P2. Argument parameters

**Difficulty:** Easy · **Type:** Output · **Concepts:** $#, $1, $2

What does this print?

```bash
mkdir -p scripts
cat > scripts/show.sh <<'EOF'
#!/bin/bash
echo "$# args, first=$1, second=$2"
EOF
bash scripts/show.sh red "light blue"
```

<details>
<summary>Answer</summary>

**Output:**

```text
2 args, first=red, second=light blue
```

</details>

### P3. Exit codes

**Difficulty:** Easy · **Type:** Output · **Concepts:** exit, $?

What does this print?

```bash
bash -c 'echo working; exit 4'
echo "status=$?"
```

<details>
<summary>Answer</summary>

**Output:**

```text
working
status=4
```

</details>

### P4. Quoting the arguments

**Difficulty:** Medium · **Type:** Output · **Concepts:** "$@" vs $*

What does this print?

```bash
cat > scripts/count.sh <<'EOF'
#!/bin/bash
quoted() { echo "$#"; }
quoted "$@"
quoted $*
EOF
bash scripts/count.sh "new york" paris
```

<details>
<summary>Answer</summary>

**Output:**

```text
2
3
```

`"$@"` passes two arguments; unquoted `$*` splits `new york` into two words, giving three.

</details>

### P5. Read from a pipe

**Difficulty:** Medium · **Type:** Output · **Concepts:** read

What does this print?

```bash
printf 'Ravi 42\n' | bash -c 'read -r name age; echo "$name is $age"'
```

<details>
<summary>Answer</summary>

**Output:**

```text
Ravi is 42
```

`read` splits the line on whitespace into the listed variables; the last variable receives the rest of the line.

</details>

### P6. Usage check

**Difficulty:** Medium · **Type:** Script · **Concepts:** $#, exit, stderr

Write `scripts/need2.sh` that requires exactly two arguments. Otherwise it prints `usage: need2.sh SRC DEST` to stderr and exits with status 2; with two arguments it prints `copying SRC to DEST`.

<details>
<summary>Answer</summary>

```bash
cat > scripts/need2.sh <<'EOF'
#!/bin/bash
if [ $# -ne 2 ]; then
    echo "usage: $(basename "$0") SRC DEST" >&2
    exit 2
fi
echo "copying $1 to $2"
EOF
bash scripts/need2.sh only-one
echo "status=$?"
bash scripts/need2.sh a.txt b.txt
```

**Output:**

```text
usage: need2.sh SRC DEST
status=2
copying a.txt to b.txt
```

</details>

### P7. Strict mode

**Difficulty:** Medium · **Type:** Output · **Concepts:** set -u

What does this print?

```bash
bash -c 'set -u; name=lab; echo "start"; echo "$nmae"; echo "end"' || echo "script failed"
```

<details>
<summary>Answer</summary>

**Output:**

```text
start
bash: line 1: nmae: unbound variable
script failed
```

The typo `$nmae` is caught by `set -u` instead of silently expanding to an empty string.

</details>

### P8. Bad interpreter

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** CRLF, shebang

A script edited on Windows fails with `bash: ./run.sh: /bin/bash^M: bad interpreter: No such file or directory`, but `bash run.sh` gives errors like `$'\r': command not found`. Explain both messages and fix the file.

<details>
<summary>Answer</summary>

The file uses CRLF line endings. With `./run.sh` the kernel reads the shebang as `/bin/bash\r` (shown as `^M`), which does not exist. With `bash run.sh`, bash reads each line with a trailing `\r`, so blank lines become a command named `$'\r'`. Fix:

```bash
# Illustrative
sed -i 's/\r$//' run.sh      # or: dos2unix run.sh
```

</details>

### P9. Trace it

**Difficulty:** Medium · **Type:** Command · **Concepts:** bash -x

`scripts/show.sh` prints unexpected values. Run it with tracing so each command is printed after expansion, with the arguments `a b`.

<details>
<summary>Answer</summary>

```bash
bash -x scripts/show.sh a b
```

**Output:**

```text
+ echo '2 args, first=a, second=b'
2 args, first=a, second=b
```

</details>
