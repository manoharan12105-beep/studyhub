# Creating, Copying, Moving and Deleting Files — Practice

All items start in `~/linux-lab`.

### P1. Nested directories

**Difficulty:** Easy · **Type:** Command · **Concepts:** mkdir -p

Create `practice/2026/jan/reports` in one command, even though none of these directories exist yet.

<details>
<summary>Answer</summary>

```bash
mkdir -p practice/2026/jan/reports
```

</details>

### P2. Copy a directory

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** cp -r

Which command copies the directory `config` to `config-backup`, including its files?

- A) `cp config config-backup`
- B) `cp -r config config-backup`
- C) `mv config config-backup`
- D) `cp config/* config-backup`

<details>
<summary>Answer</summary>

**Answer:** B) `cp -r config config-backup`

**Explanation:** A is refused ("-r not specified; omitting directory"). C moves instead of copying. D fails if `config-backup` does not exist and skips hidden files.

</details>

### P3. What is left?

**Difficulty:** Easy · **Type:** Output · **Concepts:** cp, mv

What does the final `ls` print?

```bash
mkdir -p practice/demo && cd practice/demo
touch one.txt
cp one.txt two.txt
mv one.txt three.txt
ls
```

<details>
<summary>Answer</summary>

**Output:**

```text
three.txt  two.txt
```

`cp` made `two.txt` and kept `one.txt`; `mv` renamed `one.txt` to `three.txt`.

</details>

### P4. Remove an empty folder safely

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** rmdir

You want to delete a directory only if it is empty, with no risk of deleting files. Which command?

- A) `rm -rf dir`
- B) `rm dir`
- C) `rmdir dir`
- D) `rm -r dir`

<details>
<summary>Answer</summary>

**Answer:** C) `rmdir dir`

**Explanation:** `rmdir` refuses non-empty directories. `rm dir` fails for any directory, and the `-r` forms delete contents.

</details>

### P5. Predict the error

**Difficulty:** Medium · **Type:** Output · **Concepts:** rm on directories

Continuing in `practice/demo`, what is printed?

```bash
mkdir sub
touch sub/file.txt
rm sub
rmdir sub
```

<details>
<summary>Answer</summary>

**Output:**

```text
rm: cannot remove 'sub': Is a directory
rmdir: failed to remove 'sub': Directory not empty
```

`rm` needs `-r` for directories; `rmdir` needs the directory to be empty.

</details>

### P6. Moving into a directory that does not exist

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** mv destination semantics

You run `mv report.txt archive` expecting the file to go into the `archive` folder, but `archive` does not exist. What happens, and how could you have made the mistake visible?

<details>
<summary>Answer</summary>

`report.txt` is renamed to a file called `archive`. Writing the destination with a trailing slash — `mv report.txt archive/` — makes `mv` fail with "Not a directory"/"No such file or directory" instead. (`mv -t archive report.txt` also requires a directory.)

</details>

### P7. Backup before an edit

**Difficulty:** Medium · **Type:** Command · **Concepts:** cp -a

Make a backup copy of `project` called `project-2026-01-15` that keeps permissions, timestamps and hidden files.

<details>
<summary>Answer</summary>

```bash
cp -a project project-2026-01-15
```

To date-stamp automatically: `cp -a project "project-$(date +%F)"`.

</details>

### P8. Guard the variable

**Difficulty:** Hard · **Type:** Script · **Concepts:** rm safety, parameter expansion

A cleanup script contains `rm -rf $CACHE_DIR/*`. Explain what happens if `CACHE_DIR` is empty, and rewrite the line safely.

<details>
<summary>Answer</summary>

With an empty variable the command becomes `rm -rf /*` — every top-level directory the user can delete is removed. Safe version:

```bash
# Illustrative
rm -rf -- "${CACHE_DIR:?CACHE_DIR is empty}"/*
```

`${VAR:?message}` aborts the script when the variable is unset or empty; quotes keep paths with spaces intact; `--` stops names beginning with `-` being read as options. Adding `set -u` at the top makes any unset variable an error.

</details>

### P9. Undelete?

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** rm is permanent

A teammate deleted `app.properties` with `rm` and asks you to restore it from "the trash". What do you tell them, and where could the file still exist?

<details>
<summary>Answer</summary>

`rm` does not use a trash folder; the directory entry is gone and the blocks may be reused. Look for copies: version control (`git checkout -- app.properties`), backups or snapshots, the deployed copy on another server, an editor's backup file, or — if a running process still has it open — `/proc/<pid>/fd/`.

</details>
