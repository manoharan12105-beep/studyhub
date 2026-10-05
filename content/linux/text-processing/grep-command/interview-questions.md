# grep: Searching Text — Interview Questions

## Beginner

### Q1. How do you search for a word in a file, ignoring case?

<details>
<summary>Answer</summary>

`grep -i word file`. Add `-w` to match it only as a whole word, and `-n` to see line numbers.

</details>

### Q2. How do you show lines that do **not** contain a pattern?

<details>
<summary>Answer</summary>

`grep -v pattern file`. Example: `grep -v '^#' app.conf` removes comment lines.

</details>

### Q3. How do you search recursively through a directory?

<details>
<summary>Answer</summary>

`grep -r pattern dir/` (add `-n` for line numbers, `-l` for just filenames, `--include='*.java'` to limit file types, `--exclude-dir=.git` to skip directories). `-R` also follows symbolic links.

</details>

### Q4. How do you count matching lines?

<details>
<summary>Answer</summary>

`grep -c pattern file`. It counts lines, not occurrences; `grep -o pattern file | wc -l` counts occurrences.

</details>

### Q5. How do you print the lines around a match?

<details>
<summary>Answer</summary>

`-A n` (after), `-B n` (before), `-C n` (both). For example `grep -B 5 -A 20 'NullPointerException' app.log` shows what led to an exception and its stack trace.

</details>

## Intermediate

### Q6. What is the difference between `grep`, `grep -E` and `grep -F`?

<details>
<summary>Answer</summary>

`grep` uses basic regular expressions, where `+ ? | ( ) { }` need backslashes. `grep -E` (formerly `egrep`) uses extended regular expressions, where they work directly: `grep -E 'ERROR|WARN'`. `grep -F` (formerly `fgrep`) treats the pattern as a literal string — no metacharacters — which is safest for text such as `[db]` or `1.5` and fast for many patterns (`-f patterns.txt`).

</details>

### Q7. Why does `grep 1.5 file` match the line `version 105`?

<details>
<summary>Answer</summary>

In a regular expression `.` matches any character, so `1.5` matches "105". Use `grep -F '1.5'` or escape the dot: `grep '1\.5'`.

</details>

### Q8. What exit codes does grep return, and how are they used in scripts?

<details>
<summary>Answer</summary>

0 if a line matched, 1 if none matched, 2 on error. Scripts use them with `if grep -q pattern file; then …` — `-q` suppresses output and stops at the first match. Note that under `set -e`, a `grep` that finds nothing (status 1) stops the script unless handled (`grep … || true`).

</details>

### Q9. How do you find all files under `src` that contain "TODO" but list only file names?

<details>
<summary>Answer</summary>

`grep -rl TODO src/`. `-L` lists files that do **not** contain it.

</details>

### Q10. Why does `ps aux | grep nginx` often show a `grep nginx` line, and how do you avoid it?

<details>
<summary>Answer</summary>

`grep`'s own command line contains "nginx", and it is running when `ps` takes its snapshot. Avoid it with `pgrep -a nginx`, or the trick `grep '[n]ginx'` — the regex matches "nginx" but grep's command line contains "[n]ginx", which it does not match.

</details>

## Advanced

### Q11. Extract all unique email addresses from a file.

<details>
<summary>Answer</summary>

```bash
# Illustrative
grep -oE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' file | sort -u
```

`-o` prints each match on its own line, `-E` enables `+` and `{2,}`, and `sort -u` removes duplicates. Mention that a regex like this is practical, not a full RFC 5322 validator.

</details>

### Q12. How would you find which requests returned HTTP 5xx in an access log and count them per endpoint?

<details>
<summary>Answer</summary>

```bash
# Illustrative
grep -E '" 5[0-9]{2} ' access.log | awk '{print $7}' | sort | uniq -c | sort -rn
```

The pattern anchors on the closing quote of the request and the space-separated status code so that a `500` inside a path or byte count does not match. `awk '{print $7}'` extracts the path in the common log format.

</details>

### Q13. A `grep -r` across a large repository is slow and noisy. How do you improve it?

<details>
<summary>Answer</summary>

Narrow the search: `--include='*.java'`, `--exclude-dir={.git,node_modules,target,build}`, `-I` to skip binary files, `-F` when the pattern is literal, `-l` if only filenames are needed, and start in the narrowest directory. Tools such as `ripgrep` (`rg`) or `git grep` respect `.gitignore` and are faster, but `grep` is available everywhere.

</details>
