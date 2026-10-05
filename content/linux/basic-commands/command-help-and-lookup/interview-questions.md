# Getting Help and Finding Commands — Interview Questions

## Beginner

### Q1. How do you find out what an option of a command does?

<details>
<summary>Answer</summary>

`man command` for the full manual (search inside with `/option`), or `command --help` for a quick summary. For bash builtins use `help command`.

</details>

### Q2. What is a shell builtin? Give examples.

<details>
<summary>Answer</summary>

A command implemented inside the shell itself rather than as a separate program, so no new process is created. Some must be builtins because they change the shell's own state: `cd`, `export`, `source`, `exit`, `alias`, `read`. Others are builtins for speed: `echo`, `printf`, `test`/`[`, `pwd`.

</details>

### Q3. What does `which` do?

<details>
<summary>Answer</summary>

It searches the directories in `$PATH`, in order, and prints the path of the first executable with that name — the one that would run if no alias, function or builtin got in the way.

</details>

### Q4. What are man page sections? Why does `man 5 passwd` differ from `man passwd`?

<details>
<summary>Answer</summary>

Manuals are split into sections: 1 user commands, 2 system calls, 3 library functions, 5 file formats, 7 overviews, 8 admin commands. `man passwd` shows section 1, the `passwd` command; `man 5 passwd` shows the format of the `/etc/passwd` file.

</details>

### Q5. How do you repeat the previous command with sudo?

<details>
<summary>Answer</summary>

`sudo !!` — `!!` is history expansion for the last command line.

</details>

## Intermediate

### Q6. What is the difference between `type` and `which`?

<details>
<summary>Answer</summary>

`type` is a bash builtin that reports what the shell will actually run — alias, keyword, function, builtin or file — following the shell's real resolution order. `which` is an external program that only searches `$PATH`, so it misses aliases, functions and builtins (`which cd` prints nothing). Use `type -a name` to see all matches.

</details>

### Q7. In what order does bash look up a command name?

<details>
<summary>Answer</summary>

Alias → shell keyword → function → builtin → executable found in `$PATH` (searched left to right; the first match wins; bash caches the result in a hash table, cleared with `hash -r`). If nothing matches, "command not found".

</details>

### Q8. You do not remember the name of the command that shows disk usage of directories. How do you find it on the system?

<details>
<summary>Answer</summary>

Search the manual descriptions: `man -k disk` or `apropos 'disk usage'`, which lists `du (1) - estimate file space usage` among others. `whatis du` then confirms a single page.

</details>

### Q9. How do you check in a script whether a command is installed?

<details>
<summary>Answer</summary>

```bash
# Illustrative
if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required" >&2
    exit 1
fi
```

`command -v` is POSIX, works for builtins and functions too, and returns non-zero when the name is not found.

</details>

## Advanced

### Q10. After installing a new version of a tool in `/usr/local/bin`, the shell keeps running the old one from `/usr/bin`. Why, and how do you fix it?

<details>
<summary>Answer</summary>

Either `/usr/local/bin` comes after `/usr/bin` in `$PATH` (check `echo $PATH`), or bash cached the old location in its command hash table. Run `hash -r` (or `hash -d tool`) to clear the cache, fix the `PATH` order if needed, and confirm with `type -a tool`.

</details>

### Q11. Why is typing a password as a command-line argument a security problem?

<details>
<summary>Answer</summary>

The full command line is stored in `~/.bash_history`, and while the command runs any user can see it with `ps` or `/proc/<pid>/cmdline`. It may also end up in audit logs or terminal scrollback. Use prompts, environment variables with care, credential files with `600` permissions, or secret managers. (A leading space with `HISTCONTROL=ignorespace` keeps a command out of history, but not out of `ps`.)

</details>
