# Inodes, Hard Links and Symbolic Links — Practice

All items start in `~/linux-lab`.

### P1. Count the names

**Difficulty:** Easy · **Type:** Output · **Concepts:** link count

What does this print?

```bash
mkdir -p linkdemo && cd linkdemo
echo data > a.txt
ln a.txt b.txt
ln a.txt c.txt
stat -c '%h' a.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
3
```

Three names point to the same inode.

</details>

### P2. Delete one name

**Difficulty:** Easy · **Type:** Output · **Concepts:** hard links survive deletion

Continuing, what does this print?

```bash
rm a.txt
cat c.txt
stat -c '%h' b.txt
```

<details>
<summary>Answer</summary>

**Output:**

```text
data
2
```

</details>

### P3. Which link?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** symlink vs hard link

You need a link to a directory on another disk. Which works?

- A) `ln /mnt/data/reports reports`
- B) `ln -s /mnt/data/reports reports`
- C) Either
- D) Neither

<details>
<summary>Answer</summary>

**Answer:** B) `ln -s /mnt/data/reports reports`

**Explanation:** Hard links cannot point to directories or cross filesystems; symlinks can do both.

</details>

### P4. Broken or not?

**Difficulty:** Medium · **Type:** Output · **Concepts:** dangling symlinks

Continuing in `linkdemo`, what does this print?

```bash
echo hello > target.txt
ln -s target.txt shortcut
mv target.txt renamed.txt
cat shortcut 2>&1
ln -sf renamed.txt shortcut
cat shortcut
```

<details>
<summary>Answer</summary>

**Output:**

```text
cat: shortcut: No such file or directory
hello
```

Renaming the target broke the symlink; `ln -sf` repointed it.

</details>

### P5. Same file?

**Difficulty:** Medium · **Type:** Command · **Concepts:** -ef test, inode

Write a test that prints `same inode` if `b.txt` and `c.txt` are hard links to the same file.

<details>
<summary>Answer</summary>

```bash
[ b.txt -ef c.txt ] && echo "same inode"
```

**Output:**

```text
same inode
```

`-ef` compares device and inode numbers. `ls -i b.txt c.txt` shows the numbers themselves.

</details>

### P6. Find broken links

**Difficulty:** Medium · **Type:** Command · **Concepts:** find -xtype l

Create a dangling link and then list every broken symlink under the current directory.

<details>
<summary>Answer</summary>

```bash
ln -s does-not-exist broken
find . -xtype l
```

**Output:**

```text
./broken
```

</details>

### P7. Space not freed

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** link count, open files

A 10 GB backup file has two hard links: `/backup/daily/db.dump` and `/backup/latest/db.dump`. An admin deletes `/backup/daily/db.dump` to free space. Does `df` change? Why?

<details>
<summary>Answer</summary>

No. Deleting one name reduces the link count from 2 to 1; the inode and its data blocks remain because `/backup/latest/db.dump` still refers to them. Space is freed only when the last link is removed and no process has the file open.

</details>

### P8. Relative target

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** relative symlinks

From `~/linux-lab`, someone runs `ln -s config/app.conf linkdemo/app.conf`. `cat linkdemo/app.conf` fails. Explain and give two correct commands.

<details>
<summary>Answer</summary>

The relative target `config/app.conf` is resolved from the link's directory, `linkdemo/`, i.e. `linkdemo/config/app.conf`, which does not exist. Correct options:

```bash
ln -s ../config/app.conf linkdemo/app.conf        # relative to the link's directory
ln -s ~/linux-lab/config/app.conf linkdemo/app.conf   # absolute path
```

(`ln -sr config/app.conf linkdemo/app.conf` lets GNU `ln` compute the relative path for you.)

</details>
