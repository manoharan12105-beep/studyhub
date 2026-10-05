# find — Interview Questions

## Beginner

### Q1. How do you find all `.log` files under `/var/log`?

<details>
<summary>Answer</summary>

`find /var/log -type f -name '*.log'`. Quote the pattern so the shell does not expand it; use `-iname` for case-insensitive matching.

</details>

### Q2. How do you find files larger than 100 MB?

<details>
<summary>Answer</summary>

`find / -xdev -type f -size +100M 2>/dev/null`. `+` means larger than, `M` is mebibytes; `-xdev` stays on one filesystem and `2>/dev/null` hides permission errors. Add `-exec ls -lh {} +` to see sizes.

</details>

### Q3. How do you find files modified in the last 24 hours?

<details>
<summary>Answer</summary>

`find /path -type f -mtime -1` (age less than one whole day) or, more precisely, `find /path -type f -mmin -1440`.

</details>

### Q4. How do you find and delete empty files?

<details>
<summary>Answer</summary>

`find /path -type f -empty -print` to check, then `find /path -type f -empty -delete`.

</details>

## Intermediate

### Q5. What is the difference between `-exec cmd {} \;` and `-exec cmd {} +`?

<details>
<summary>Answer</summary>

`\;` runs the command once for every file found — thousands of process launches for thousands of files. `+` appends as many paths as fit to a single command line and runs it a few times, like `xargs`. `+` is much faster; `{}` must be the last argument. Use `\;` when the command can only take one file or `{}` must appear in the middle.

</details>

### Q6. What exactly does `-mtime +7` match?

<details>
<summary>Answer</summary>

Files whose age, measured in whole days and rounded down, is greater than 7 — i.e. last modified at least 8 full days ago. `-mtime -7` means less than 7 days; `-mtime 7` means between 7 and 8 days. For exact boundaries use `-mmin` or `-newer`/`-newermt '2026-01-01'`.

</details>

### Q7. How do you find files with permission 777 or world-writable files?

<details>
<summary>Answer</summary>

Exactly 777: `find /srv -perm 777`. World-writable (other-write bit set, whatever else): `find / -xdev -type f -perm /o=w 2>/dev/null` (`/` = any of these bits; `-` = all of these bits).

</details>

### Q8. What is the difference between `find` and `locate`?

<details>
<summary>Answer</summary>

`find` searches the live filesystem and can filter by many attributes, but walks directories (slower). `locate` queries a database of filenames built periodically by `updatedb` — instant, but only by name and possibly out of date (new files missing, deleted ones still listed).

</details>

### Q9. How do you find files containing a word, not just files with a name?

<details>
<summary>Answer</summary>

Combine `find` with `grep`: `find . -type f -name '*.java' -exec grep -l 'TODO' {} +`, or use `grep -rl --include='*.java' TODO .`. `find` selects files by attributes; `grep` searches their contents.

</details>

## Advanced

### Q10. Why is `find . -delete -name '*.tmp'` dangerous?

<details>
<summary>Answer</summary>

The expression is evaluated left to right for each file: `-delete` runs first — on every file — before `-name` is checked. It deletes the whole tree. Actions must come after the tests; always dry-run with `-print`.

</details>

### Q11. Why does `find . -size -1M` return only empty files?

<details>
<summary>Answer</summary>

`-size` rounds file sizes up to whole units of the given suffix. In MiB, any file from 1 byte to 1 MiB counts as 1, so "less than 1" is only true for 0-byte files. Use smaller units: `-size -1024k` or `-size -1048576c`.

</details>

### Q12. How do you exclude a directory such as `.git` from a search efficiently?

<details>
<summary>Answer</summary>

Use `-prune` so `find` does not descend into it: `find . -name .git -prune -o -type f -name '*.sh' -print`. `-not -path './.git/*'` also filters the output but still walks every file inside `.git`, which is slower.

</details>
