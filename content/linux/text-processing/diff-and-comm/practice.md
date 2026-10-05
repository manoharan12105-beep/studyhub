# Comparing Files: diff and comm — Practice

All items start in `~/linux-lab`.

### P1. Read a diff header

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** diff normal format

In `diff old.txt new.txt`, what does `5d4` mean?

- A) Line 5 of the second file was deleted
- B) Delete line 5 of the first file; the files then match up after line 4 of the second
- C) Lines 4 and 5 differ
- D) Line 5 is duplicated

<details>
<summary>Answer</summary>

**Answer:** B) Delete line 5 of the first file; the files then match up after line 4 of the second

**Explanation:** The letter is the action needed on the first file: `a` add, `c` change, `d` delete.

</details>

### P2. Common lines

**Difficulty:** Easy · **Type:** Output · **Concepts:** comm -12

What does this print?

```bash
comm -12 list1.txt list2.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
banana
mango
```

</details>

### P3. Only in the second list

**Difficulty:** Easy · **Type:** Command · **Concepts:** comm -13

Print the lines that are in `list2.txt` but not in `list1.txt`.

<details>
<summary>Answer</summary>

```bash
comm -13 list1.txt list2.txt
```

**Output:**

```text
grape
orange
```

</details>

### P4. Quick yes/no

**Difficulty:** Easy · **Type:** Output · **Concepts:** diff -q, exit status

What does this print?

```bash
diff -q v1.txt v2.txt > /dev/null
echo $?
```

<details>
<summary>Answer</summary>

**Output:**

```text
1
```

1 means the files differ (0 identical, 2 error).

</details>

### P5. Predict the diff

**Difficulty:** Medium · **Type:** Output · **Concepts:** diff normal format

What does this print?

```bash
printf '%s\n' a b c > x.txt
printf '%s\n' a c d > y.txt
diff x.txt y.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
2d1
< b
3a3
> d
```

Delete `b` (line 2 of x), then after line 3 of x add `d` (line 3 of y).

</details>

### P6. Unsorted input

**Difficulty:** Medium · **Type:** Command · **Concepts:** comm with sort, process substitution

Print the fruits that appear in both `fruits.txt` (unsorted, with duplicates) and `list1.txt`, without creating temporary files.

<details>
<summary>Answer</summary>

```bash
comm -12 <(sort -u fruits.txt) list1.txt
```

**Output:**

```text
apple
banana
cherry
mango
```

</details>

### P7. Directory drift

**Difficulty:** Medium · **Type:** Output · **Concepts:** diff -r

What does this print?

```bash
mkdir -p a1 a2
echo same > a1/one.txt
echo same > a2/one.txt
echo extra > a2/two.txt
diff -r a1 a2
```

<details>
<summary>Answer</summary>

**Output:**

```text
Only in a2: two.txt
```

`one.txt` is identical in both, so only the extra file is reported.

</details>

### P8. Whitespace-only change

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** diff -w

A teammate reformatted a config file, replacing tabs with spaces, and also changed one value. `diff` shows every line as changed. How do you see only the real change?

<details>
<summary>Answer</summary>

`diff -w old.conf new.conf` ignores all whitespace differences (`-b` ignores changes in the amount of whitespace, `-B` blank lines). Only the line whose value changed remains.

</details>

### P9. Apply a patch

**Difficulty:** Hard · **Type:** Command · **Concepts:** diff -u, patch

Create a unified patch that turns `v1.txt` into `v2.txt`, apply it to a copy of `v1.txt` called `staging.txt`, and verify the result is identical to `v2.txt`.

<details>
<summary>Answer</summary>

```bash
diff -u v1.txt v2.txt > upgrade.patch
cp v1.txt staging.txt
patch staging.txt < upgrade.patch
diff staging.txt v2.txt && echo "patched correctly"
```

**Output:**

```text
patching file staging.txt
patched correctly
```

</details>
