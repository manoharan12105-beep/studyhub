# xargs and tee — Practice

All items start in `~/linux-lab`.

### P1. Arguments per run

**Difficulty:** Easy · **Type:** Output · **Concepts:** xargs -n

What does this print?

```bash
echo "1 2 3 4 5" | xargs -n 2 echo
```

<details>
<summary>Answer</summary>

**Output:**

```text
1 2
3 4
5
```

</details>

### P2. Why xargs?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** stdin vs arguments

Which command needs `xargs` to use a list of filenames coming from a pipe?

- A) `grep`
- B) `sort`
- C) `rm`
- D) `wc -l` (counting the names themselves)

<details>
<summary>Answer</summary>

**Answer:** C) `rm`

**Explanation:** `rm` acts only on its arguments. `grep`, `sort` and `wc` read stdin when given no file, so they work directly in a pipeline.

</details>

### P3. Save and count

**Difficulty:** Easy · **Type:** Command · **Concepts:** tee

Save all WARN lines of `app.log` into `warnings.txt` and, in the same pipeline, print how many there are.

<details>
<summary>Answer</summary>

```bash
grep WARN app.log | tee warnings.txt | wc -l
```

**Output:**

```text
2
```

</details>

### P4. Placeholder

**Difficulty:** Medium · **Type:** Output · **Concepts:** xargs -I

What does this print?

```bash
printf '%s\n' src test | xargs -I {} echo "project/{} exists"
```

<details>
<summary>Answer</summary>

**Output:**

```text
project/src exists
project/test exists
```

</details>

### P5. Lines in matching files

**Difficulty:** Medium · **Type:** Command · **Concepts:** grep -l with xargs

Print the line counts of all `.log` files in `logs` (not subdirectories) that contain the word `ok`.

<details>
<summary>Answer</summary>

```bash
grep -l ok logs/*.log | xargs wc -l
```

**Output:**

```text
  1 logs/app-2026-01-01.log
  2 logs/app-2026-01-08.log
  1 logs/app-2026-01-14.log
  4 total
```

</details>

### P6. Empty input

**Difficulty:** Medium · **Type:** Output · **Concepts:** xargs -r

What does this print?

```bash
grep -l NOTHING-MATCHES *.log | xargs -r wc -l
echo "end"
```

<details>
<summary>Answer</summary>

**Output:**

```text
end
```

`grep -l` printed no names, and `-r` stopped `xargs` from running `wc -l` with no arguments (which would have waited for keyboard input).

</details>

### P7. Spaces in names

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** -print0, -0

`find reports -name '*.pdf' | xargs rm` fails with "No such file or directory" for `Q1 report.pdf`. Explain and fix.

<details>
<summary>Answer</summary>

`xargs` split the name at the space and tried to remove `reports/Q1` and `report.pdf`. Use NUL separators:

```bash
# Illustrative
find reports -name '*.pdf' -print0 | xargs -0 rm
```

Or let `find` do it: `find reports -name '*.pdf' -delete`.

</details>

### P8. Root-owned file

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** sudo and redirection

You need to append `vm.swappiness=10` to `/etc/sysctl.conf` from a script that runs as a normal user with sudo rights. Which line works, and why does the obvious one fail?

- A) `sudo echo 'vm.swappiness=10' >> /etc/sysctl.conf`
- B) `echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf > /dev/null`

<details>
<summary>Answer</summary>

**Answer:** B) `echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf > /dev/null`

**Explanation:** In A, your own shell opens the file for `>>` before `sudo` runs, and it has no write permission. In B, `tee` itself runs as root and opens the file; `-a` appends and `> /dev/null` hides the echo of the line.

</details>
