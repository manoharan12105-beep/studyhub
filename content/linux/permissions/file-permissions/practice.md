# File Permissions and chmod — Practice

All items start in `~/linux-lab`.

### P1. Symbolic to numeric

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** octal notation

What is `rwxr-xr--` in numeric form?

- A) 755
- B) 754
- C) 744
- D) 654

<details>
<summary>Answer</summary>

**Answer:** B) 754

**Explanation:** rwx = 4+2+1 = 7, r-x = 4+0+1 = 5, r-- = 4.

</details>

### P2. Numeric to symbolic

**Difficulty:** Easy · **Type:** Conceptual · **Concepts:** octal notation

Write the symbolic form of 640, 700 and 711.

<details>
<summary>Answer</summary>

- 640 → `rw-r-----`
- 700 → `rwx------`
- 711 → `rwx--x--x`

</details>

### P3. Make it runnable

**Difficulty:** Easy · **Type:** Command · **Concepts:** chmod u+x

`project/build.sh` fails with "Permission denied". Give the owner execute permission and run it.

<details>
<summary>Answer</summary>

```bash
chmod u+x project/build.sh
./project/build.sh
```

**Output:**

```text
Building inventory...
Build finished
```

</details>

### P4. Predict the mode

**Difficulty:** Easy · **Type:** Output · **Concepts:** symbolic chmod

What does the last command print?

```bash
touch report.txt
chmod 600 report.txt
chmod g+r,o+r report.txt
stat -c '%a %A' report.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
644 -rw-r--r--
```

</details>

### P5. Exact assignment

**Difficulty:** Medium · **Type:** Output · **Concepts:** = operator

What does this print?

```bash
chmod 777 report.txt
chmod go=r report.txt
stat -c '%A' report.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
-rwxr--r--
```

`go=r` sets group and others to exactly `r`, removing their `w` and `x`; the owner's bits are untouched.

</details>

### P6. The owner is locked out

**Difficulty:** Medium · **Type:** Output · **Concepts:** one class checked

What does this print?

```bash
echo secret > locked.txt
chmod 044 locked.txt
cat locked.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
cat: locked.txt: Permission denied
```

The owner class has no bits, and the kernel never falls back to the group or others bits for the owner.

</details>

### P7. Directory execute

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** directory permissions

A directory `shared` has mode `drw-r--r--` and you are its owner. Which operation succeeds?

- A) `cd shared`
- B) `cat shared/file.txt`
- C) `ls shared` (names only)
- D) `touch shared/new.txt`

<details>
<summary>Answer</summary>

**Answer:** C) `ls shared` (names only)

**Explanation:** `r` allows reading the names. Without `x` you cannot enter the directory or access anything inside it, so A, B and D fail (D would also need `x` together with `w`).

</details>

### P8. Private SSH key

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** 600, 700

SSH refuses your key with "UNPROTECTED PRIVATE KEY FILE! Permissions 0644 for 'id_ed25519' are too open." Which commands fix the key and its directory?

<details>
<summary>Answer</summary>

```bash
# Illustrative
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
```

The private key must not be readable by anyone else; the `.ssh` directory should be accessible only by you. The public key can stay 644.

</details>

### P9. Safe recursive fix

**Difficulty:** Hard · **Type:** Command · **Concepts:** chmod -R with X

Someone ran `chmod -R 777 project`. Restore it so directories are `rwxr-xr-x` and regular files `rw-r--r--`, using one `chmod` command, then show `build.sh` and `src`.

<details>
<summary>Answer</summary>

```bash
chmod -R 777 project
chmod -R u=rw,go=r,a+X project
stat -c '%A %n' project/build.sh project/src
```

**Output:**

```text
-rw-r--r-- project/build.sh
drwxr-xr-x project/src
```

The comma-separated clauses are applied **in order** to each file. `u=rw` and `go=r` first remove every execute bit, so when `a+X` is evaluated a regular file is no longer executable by anyone and gets no `x`, while directories always get it. Writing `u=rwX,go=rX` instead would have kept `x` on the files, because `X` would have seen the old `777` mode. The explicit alternative is `find project -type f -exec chmod 644 {} +` plus `find project -type d -exec chmod 755 {} +`.

</details>

### P10. Delete without write

**Difficulty:** Hard · **Type:** Conceptual · **Concepts:** deletion and directory permissions

`report.txt` has mode `444` and lives in a directory with mode `755` that you own. Can you delete it? Can a different, non-root user delete it? Explain both.

<details>
<summary>Answer</summary>

You can: deletion needs write and execute on the directory, which you (the owner of a 755 directory) have; `rm` only asks for confirmation because the file is write-protected. Another user cannot: for them the directory's "others" bits are `r-x`, without `w`, so they cannot remove entries — regardless of the file's own mode.

</details>
