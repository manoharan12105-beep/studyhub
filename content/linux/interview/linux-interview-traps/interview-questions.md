# Linux Interview Traps — Interview Questions

## Beginner

### Q1. Trap: "`sort file.txt > file.txt` sorts the file in place."

<details>
<summary>Answer</summary>

It empties the file. The shell processes `> file.txt` — truncating it — **before** `sort` starts, so `sort` reads an empty file.

```bash
cd ~/linux-lab
cp fruits.txt f.txt
sort f.txt > f.txt
wc -l f.txt
```

**Output:**

```text
0 f.txt
```

Use `sort -o f.txt f.txt` (sort reads everything before writing), or write to a temporary file and `mv` it. The same applies to `grep`, `sed`, `cut`, … — `sed -i` exists for in-place editing.

</details>

### Q2. Trap: "`uniq` removes duplicate lines."

<details>
<summary>Answer</summary>

It removes only **adjacent** duplicates. `fruits.txt` has duplicates, but none next to each other:

```bash
cd ~/linux-lab
uniq fruits.txt | wc -l
sort fruits.txt | uniq | wc -l
```

**Output:**

```text
7
4
```

Sort first (`sort | uniq`, or `sort -u`).

</details>

### Q3. Trap: "To delete a file, you need write permission on the file."

<details>
<summary>Answer</summary>

Deleting changes the **directory** (it removes an entry), so you need write and execute permission on the directory. You can delete a read-only file in your own directory (`rm` asks for confirmation), and you cannot delete your own file inside a directory you cannot write to. The sticky bit (`/tmp`) adds a restriction: only the file's owner, the directory's owner or root may delete.

</details>

### Q4. Trap: "`kill <pid>` kills the process."

<details>
<summary>Answer</summary>

`kill` sends a signal — by default SIGTERM (15), a polite request. The process can catch it to clean up, or ignore it. Only SIGKILL (`kill -9`) and SIGSTOP cannot be caught or ignored, and even SIGKILL waits for a process in uninterruptible sleep (`D` state). Zombies cannot be killed at all — they are already dead.

</details>

### Q5. Trap: "`grep -c apple` counts how many times apple appears."

<details>
<summary>Answer</summary>

It counts **matching lines**, not occurrences.

```bash
cd ~/linux-lab
echo "apple apple" > aa.txt
grep -c apple aa.txt
grep -o apple aa.txt | wc -l
```

**Output:**

```text
1
2
```

`grep -o` prints each match on its own line, so `grep -o … | wc -l` counts occurrences.

</details>

### Q6. Trap: "`wc -l` counts the lines of a file."

<details>
<summary>Answer</summary>

It counts **newline characters**. A last line without a trailing newline is not counted:

```bash
cd ~/linux-lab
printf 'a\nb' > nonl.txt
wc -l nonl.txt
```

**Output:**

```text
1 nonl.txt
```

The file has two lines of text, but only one newline.

</details>

### Q7. Trap: "`sudo echo 'text' > /etc/app.conf` writes the file as root."

<details>
<summary>Answer</summary>

The redirection is done by **your** shell before `sudo` runs, so it fails with `Permission denied`; only `echo` runs as root. Use `echo 'text' | sudo tee /etc/app.conf` (or `sudo tee -a` to append), or `sudo sh -c 'echo text > /etc/app.conf'`.

</details>

### Q8. Trap: "`df` and `du` should report the same usage."

<details>
<summary>Answer</summary>

`df` asks the filesystem how many blocks are used; `du` adds up the files it can see. They differ because of deleted files still held open by processes (counted by `df`, invisible to `du`), files hidden under a mount point, directories `du` cannot read, reserved blocks and filesystem metadata. A large gap usually means deleted-but-open files (`lsof +L1`).

</details>

## Intermediate

### Q9. Trap: "`cmd 2>&1 > file` sends both output and errors to the file."

<details>
<summary>Answer</summary>

Redirections are processed left to right. `2>&1` first makes stderr point where stdout points **now** (the terminal); then `> file` moves only stdout. Errors still appear on the screen:

```bash
cd ~/linux-lab
ls nosuchfile 2>&1 > out2.txt
wc -c out2.txt
```

**Output:**

```text
ls: cannot access 'nosuchfile': No such file or directory
0 out2.txt
```

The correct order is `cmd > file 2>&1` (or bash's `cmd &> file`).

</details>

### Q10. Trap: "A variable set inside `cat file | while read …` is available after the loop."

<details>
<summary>Answer</summary>

In bash each part of a pipeline runs in a subshell, so changes made in the loop are lost:

```bash
cd ~/linux-lab
count=0
cat fruits.txt | while read -r f; do count=$((count + 1)); done
echo "count=$count"
```

**Output:**

```text
count=0
```

Redirect the file into the loop instead, so it runs in the current shell:

```bash
count=0
while read -r f; do count=$((count + 1)); done < fruits.txt
echo "count=$count"
```

**Output:**

```text
count=7
```

</details>

### Q11. Trap: "`[ $name = admin ]` is a fine way to compare strings."

<details>
<summary>Answer</summary>

Unquoted, an empty variable disappears and the test becomes `[ = admin ]`:

```bash
name=""
[ $name = "admin" ] && echo yes
```

**Output:**

```text
bash: [: =: unary operator expected
```

A value with spaces breaks it too. Quote variables (`[ "$name" = "admin" ]`) or use bash's `[[ $name == admin ]]`, which does not word-split.

</details>

### Q12. Trap: "`for f in $(ls *.txt)` loops over the files."

<details>
<summary>Answer</summary>

The output of `ls` is split on whitespace, so names with spaces break apart:

```bash
cd ~/linux-lab
touch "my file.txt"
for f in $(ls *.txt | grep my); do echo "[$f]"; done
```

**Output:**

```text
[my]
[file.txt]
```

Loop over the glob directly — each match stays one word:

```bash
for f in *.txt; do [[ $f == my* ]] && echo "[$f]"; done
```

**Output:**

```text
[my file.txt]
```

For recursive searches use `find … -print0 | xargs -0` or `find -exec`.

</details>

### Q13. Trap: "A script that runs `cd /tmp` changes my current directory."

<details>
<summary>Answer</summary>

A script runs in a child process; its `cd` changes only the child's directory, which disappears when the script ends.

```bash
cd ~/linux-lab
bash -c 'cd /tmp'
pwd
```

**Output:**

```text
/home/student/linux-lab
```

To affect the current shell, `source` the script (`. script.sh`) or use a function or alias.

</details>

### Q14. Trap: "Any variable I set is visible to programs I start."

<details>
<summary>Answer</summary>

Only **exported** (environment) variables are copied to child processes:

```bash
x=5
bash -c 'echo "x=[$x]"'
export y=7
bash -c 'echo "y=[$y]"'
```

**Output:**

```text
x=[]
y=[7]
```

</details>

### Q15. Trap: "`$?` holds the status of the command I care about."

<details>
<summary>Answer</summary>

It holds the status of the **most recent** command — including an `echo` used to print it:

```bash
false; echo "first: $?"; echo "second: $?"
```

**Output:**

```text
first: 1
second: 0
```

Save it immediately (`cmd; rc=$?`) or test the command directly (`if cmd; then …`). In a pipeline, `$?` is the status of the last command unless `set -o pipefail` is used.

</details>

### Q16. Trap: "`cp -r src/ dest` and `cp -r src dest` do the same thing."

<details>
<summary>Answer</summary>

When `dest` already exists, `cp -r src dest` copies the directory **into** it (`dest/src`). When it does not exist, `dest` becomes the copy:

```bash
cd ~/linux-lab
mkdir -p d1 && echo hi > d1/a.txt && mkdir -p dst
cp -r d1 dst
cp -r d1/ dst2
ls dst dst2
```

**Output:**

```text
dst:
d1

dst2:
a.txt
```

The trailing slash on the source does not matter for `cp` (it does for `rsync`); whether the destination exists does.

</details>

## Advanced

### Q17. Trap: "`chmod 777` fixes permission problems."

<details>
<summary>Answer</summary>

It lets every user modify (and for scripts, replace with malicious code) the file or directory — a security hole — and often does not fix the real cause (wrong owner, missing `x` on a parent directory, SELinux, a `noexec` mount). Some programs even refuse files that are too open (SSH keys, sudoers). Fix ownership and grant the minimum: `chown app:app`, `chmod 640`, `chmod u+x`.

</details>

### Q18. Trap: "`rm -rf $DIR/` is a safe way to empty a directory."

<details>
<summary>Answer</summary>

If `DIR` is unset or empty, the command becomes `rm -rf /` — attempting to delete the whole filesystem (GNU `rm` refuses `/` itself by default, but `rm -rf $DIR/*` expands to every top-level directory and has no such protection). Defensive versions: `rm -rf -- "${DIR:?DIR is not set}"/*`, `set -u` in scripts, checking the path before deleting, and preferring `find "$DIR" -mindepth 1 -delete` after a dry run with `-print`.

</details>

### Q19. Trap: "A hard link is just a shortcut, like a symbolic link."

<details>
<summary>Answer</summary>

A hard link is another directory entry for the **same inode** — both names are equal; the data exists until the last link is removed; it cannot cross filesystems or (normally) point to directories. A symbolic link is a separate small file containing a path; it breaks if the target is moved or deleted and can point anywhere, including directories and other filesystems.

</details>

### Q20. Trap: "`su` and `sudo` are the same thing."

<details>
<summary>Answer</summary>

`su` switches to another user (root by default) and asks for **that user's** password; you get a whole shell as them. `sudo` runs one command as another user after asking for **your own** password, only if `/etc/sudoers` allows it, and logs each command. `sudo` gives fine-grained, auditable privilege without sharing the root password; `sudo -i` or `su -` give a full login shell.

</details>

### Q21. Trap: "`echo $(( 7 / 2 ))` prints 3.5."

<details>
<summary>Answer</summary>

Bash arithmetic is integer-only and truncates:

```bash
echo $(( 7 / 2 ))
```

**Output:**

```text
3
```

Use `awk 'BEGIN { print 7 / 2 }'` or `bc -l` for decimals.

</details>

### Q22. Trap: "`find . -name *.log` finds all log files."

<details>
<summary>Answer</summary>

Unquoted, the shell expands `*.log` **before** `find` runs. With one `.log` file in the current directory, `find` searches only for that exact name; with several, `find` fails with `paths must precede expression`. Quote the pattern: `find . -name '*.log'`.

</details>
