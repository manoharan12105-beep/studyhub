# Getting Help and Finding Commands — Practice

### P1. Builtin help

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** help vs man

Which command shows documentation for the bash builtin `export`?

- A) `which export`
- B) `help export`
- C) `whereis export`
- D) `export --version`

<details>
<summary>Answer</summary>

**Answer:** B) `help export`

**Explanation:** Builtins are documented by bash's `help`. `which` and `whereis` look for files on disk, and builtins have none.

</details>

### P2. Predict type

**Difficulty:** Easy · **Type:** Output · **Concepts:** type

What does this print?

```bash
type cd ls if
```

<details>
<summary>Answer</summary>

**Output:**

```text
cd is a shell builtin
ls is /usr/bin/ls
if is a shell keyword
```

</details>

### P3. Config file format

**Difficulty:** Easy · **Type:** Command · **Concepts:** man sections

Open the manual page that explains the format of a user's crontab file (the five time fields), not the `crontab` command.

<details>
<summary>Answer</summary>

```bash
# Illustrative: interactive
man 5 crontab
```

Section 5 holds file formats; plain `man crontab` opens section 1, the command.

</details>

### P4. which and builtins

**Difficulty:** Medium · **Type:** Output · **Concepts:** which, exit status

What does this print, and why?

```bash
which cd
echo "status=$?"
```

<details>
<summary>Answer</summary>

**Output:**

```text
status=1
```

`cd` is a builtin with no executable in `$PATH`, so `which` finds nothing, prints nothing and exits with status 1.

</details>

### P5. Is it installed?

**Difficulty:** Medium · **Type:** Script · **Concepts:** command -v

Write an `if` statement that prints `git is missing` to standard error and exits with status 1 when `git` is not installed.

<details>
<summary>Answer</summary>

```bash
# Illustrative: part of a script
if ! command -v git >/dev/null 2>&1; then
    echo "git is missing" >&2
    exit 1
fi
```

</details>

### P6. Shadowed command

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** alias, type -a

`rm file.txt` on a colleague's machine always asks "remove file.txt?", but on yours it does not. `which rm` shows `/usr/bin/rm` on both. What explains the difference, and which command reveals it?

<details>
<summary>Answer</summary>

Their shell has an alias (commonly `alias rm='rm -i'` in `.bashrc`). `which` only searches `$PATH` and cannot see aliases. `type rm` (or `type -a rm`) shows "rm is aliased to `rm -i'". Run the real command with `\rm` or `command rm`.

</details>

### P7. The wrong version

**Difficulty:** Hard · **Type:** Troubleshooting · **Concepts:** PATH order, hash

You installed Maven 3.9 to `/opt/maven/bin` and added it to `PATH`, but `mvn -v` still reports 3.6. List the checks you would do, in order.

<details>
<summary>Answer</summary>

1. `type -a mvn` — every `mvn` on `PATH`, in resolution order (also reveals aliases/functions).
2. `echo $PATH` — if `/opt/maven/bin` was appended, `/usr/bin/mvn` (3.6) wins; prepend it instead: `export PATH=/opt/maven/bin:$PATH`.
3. `hash -r` — clear bash's cached location of `mvn`.
4. Make the change permanent in `~/.bashrc` or `~/.profile`, and open a new shell to confirm.

</details>

### P8. Secret in history

**Difficulty:** Medium · **Type:** Scenario · **Concepts:** history security

A developer ran `curl -u admin:S3cret https://api.internal/deploy`. What two places expose the password, and what should they do now?

<details>
<summary>Answer</summary>

The command line is saved in `~/.bash_history`, and while it ran it was visible to other users in `ps`/`/proc/<pid>/cmdline`. Rotate the password (it must be treated as leaked), remove the entry from history (`history -d <n>` then `history -w`), and in future let `curl` prompt (`-u admin`) or read credentials from a protected file (`--netrc-file` with mode 600).

</details>
