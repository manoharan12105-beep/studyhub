# Paths and Navigation — Practice

### P1. Absolute or relative?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** absolute vs relative paths

Which path is absolute?

- A) `linux-lab/app.log`
- B) `./app.log`
- C) `/home/student/linux-lab/app.log`
- D) `../app.log`

<details>
<summary>Answer</summary>

**Answer:** C) `/home/student/linux-lab/app.log`

**Explanation:** Only paths that start with `/` are absolute. `./` and `../` are relative to the current directory.

</details>

### P2. Where do I end up?

**Difficulty:** Easy · **Type:** Output · **Concepts:** cd, ..

Starting in `~/linux-lab`, what does this print?

```bash
cd project/src
cd ../../config
pwd
```

<details>
<summary>Answer</summary>

**Output:**

```text
/home/student/linux-lab/config
```

`../..` from `project/src` is `~/linux-lab`, then into `config`.

</details>

### P3. Toggle

**Difficulty:** Easy · **Type:** Output · **Concepts:** cd -

Starting in `~/linux-lab/config`, what do these print?

```bash
cd /tmp
cd -
pwd
```

<details>
<summary>Answer</summary>

**Output:**

```text
/home/student/linux-lab/config
/home/student/linux-lab/config
```

`cd -` returns to the previous directory **and prints it**; then `pwd` prints it again.

</details>

### P4. Newest log

**Difficulty:** Easy · **Type:** Command · **Concepts:** ls -t

Write a command that lists `~/linux-lab/logs` with the oldest file first.

<details>
<summary>Answer</summary>

```bash
ls -ltr ~/linux-lab/logs
```

`-t` sorts newest first; `-r` reverses it. This is the habit for log directories: the most recent file ends up at the bottom, next to your prompt.

</details>

### P5. The directory itself

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** ls -d

You want to see the permissions of the directory `config`, not of the files inside it. Which command?

- A) `ls -l config`
- B) `ls -ld config`
- C) `ls -a config`
- D) `ls -R config`

<details>
<summary>Answer</summary>

**Answer:** B) `ls -ld config`

**Explanation:** `-d` treats the directory as an entry to list instead of opening it.

</details>

### P6. Count the links

**Difficulty:** Medium · **Type:** Output · **Concepts:** link count of directories

`project` contains the subdirectories `docs`, `src` and `test`. What link count does `ls -ld project` show, and why?

<details>
<summary>Answer</summary>

**5.** A directory's link count is 2 (its entry in the parent, and its own `.`) plus one for each subdirectory (each child's `..` points back to it): 2 + 3 = 5.

</details>

### P7. Quoting a tilde

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** tilde expansion

Why does `cd "~/linux-lab"` fail with "No such file or directory" while `cd ~/linux-lab` works? Give a quoted form that works.

<details>
<summary>Answer</summary>

Tilde expansion happens only when `~` is unquoted at the start of a word. Inside quotes the shell passes a literal `~` character, so `cd` looks for a directory named `~` in the current directory. Use `cd "$HOME/linux-lab"` (variables expand inside double quotes) or `cd ~/"linux-lab"`.

</details>

### P8. Script that works only from one place

**Difficulty:** Hard · **Type:** Script · **Concepts:** working directory vs script location

`~/linux-lab/project/run.sh` contains `cat readme.md`. It works when run as `./run.sh` from `project`, but from `~` (`linux-lab/project/run.sh`) it fails. Fix the script so it works from anywhere.

<details>
<summary>Answer</summary>

The relative path is resolved from the caller's working directory, not the script's location. Resolve the script's own directory first:

```bash
#!/bin/bash
script_dir=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
cat "$script_dir/readme.md"
```

</details>
