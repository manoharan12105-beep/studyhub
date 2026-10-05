# Comparing Files: diff and comm — Interview Questions

## Beginner

### Q1. How do you compare two files in Linux?

<details>
<summary>Answer</summary>

`diff file1 file2` shows the lines that differ and how to turn one file into the other. `diff -u` gives the unified format used by Git, `diff -y` a side-by-side view, `diff -q` just whether they differ. For binary files use `cmp` or compare checksums.

</details>

### Q2. In `diff` output, what do `<` and `>` mean?

<details>
<summary>Answer</summary>

`<` marks lines from the first file, `>` lines from the second. Headers such as `3c3`, `4a5` and `7d6` mean change, add and delete, with line numbers in the first and second file.

</details>

### Q3. What does `comm` do?

<details>
<summary>Answer</summary>

It compares two sorted files and prints three columns: lines only in the first, lines only in the second, and lines in both. `-1`, `-2` and `-3` suppress columns, so `comm -12 a b` prints only common lines.

</details>

## Intermediate

### Q4. How do you find lines that are in file A but not in file B?

<details>
<summary>Answer</summary>

`comm -23 <(sort A) <(sort B)`. Alternatives: `grep -Fxv -f B A` (whole-line, literal, inverted match against B's lines; no sorting needed) or `awk 'NR==FNR{b[$0]; next} !($0 in b)' B A`.

</details>

### Q5. What is the unified diff format?

<details>
<summary>Answer</summary>

A header with `---` (old file) and `+++` (new file), then hunks starting with `@@ -start,count +start,count @@`. Inside a hunk, lines prefixed with `-` are removed, `+` added, and a space unchanged context (3 lines by default). It is compact, readable, used by Git and code review tools, and can be applied with `patch`.

</details>

### Q6. How do you compare two directories?

<details>
<summary>Answer</summary>

`diff -r dir1 dir2` reports differing files and their line changes, plus `Only in …` for files present on one side. `diff -rq` lists only which files differ. `rsync -n -av --delete dir1/ dir2/` (dry run) is another way to see what would change.

</details>

### Q7. What is the difference between `diff` and `cmp`?

<details>
<summary>Answer</summary>

`diff` compares text line by line and explains the changes. `cmp` compares bytes and reports only the first difference (or nothing with `-s`). `cmp` works on binary files; `diff` on binary files just says they differ.

</details>

## Advanced

### Q8. Why does `comm` give wrong results on unsorted input?

<details>
<summary>Answer</summary>

`comm` reads both files once, in parallel, like the merge step of merge sort: it compares the current lines and advances the file with the smaller one. That only finds every match when both files are sorted in the same collation order. Unsorted input makes it skip matches (GNU `comm` warns "not in sorted order"). Sort both with the same locale (`LC_ALL=C sort`).

</details>

### Q9. How would you check that a configuration file on 20 servers is identical?

<details>
<summary>Answer</summary>

Compare checksums rather than full files: run `sha256sum /etc/app/app.conf` on every server (via SSH loop or a configuration management tool) and look for hashes that differ from the reference; then `diff` only the outliers against the reference copy, e.g. `diff <(ssh host cat /etc/app/app.conf) reference.conf`. Configuration management (Ansible, Puppet) prevents the drift in the first place.

</details>

### Q10. What does `diff` exit with, and why does that matter in scripts?

<details>
<summary>Answer</summary>

0 when the files are identical, 1 when they differ, 2 on errors. A script can use `if diff -q expected.txt actual.txt >/dev/null; then echo PASS; fi` for tests. Under `set -e`, a `diff` that finds differences (status 1) would stop the script unless it is part of a condition.

</details>
