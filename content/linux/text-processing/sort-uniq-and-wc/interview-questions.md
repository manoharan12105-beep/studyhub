# sort, uniq and wc — Interview Questions

## Beginner

### Q1. How do you sort a file numerically?

<details>
<summary>Answer</summary>

`sort -n file` (add `-r` for descending). Without `-n`, `sort` compares text, so `100` comes before `2`.

</details>

### Q2. How do you count the lines in a file?

<details>
<summary>Answer</summary>

`wc -l file` (prints the count and the name) or `wc -l < file` (only the number — convenient in scripts).

</details>

### Q3. How do you remove duplicate lines from a file?

<details>
<summary>Answer</summary>

`sort -u file`, or `sort file | uniq`. Plain `uniq file` removes only consecutive duplicates. To remove duplicates while keeping the original order: `awk '!seen[$0]++' file`.

</details>

### Q4. What does `uniq -c` do?

<details>
<summary>Answer</summary>

It prefixes each group of adjacent identical lines with the number of lines in the group. After `sort`, that is a frequency count of each distinct line.

</details>

## Intermediate

### Q5. Why must the input to `uniq` usually be sorted?

<details>
<summary>Answer</summary>

`uniq` compares each line only with the line directly before it, so it can stream through huge inputs using almost no memory. Duplicates that are not adjacent are not detected; sorting brings equal lines together.

</details>

### Q6. How do you sort a CSV file by its third column, numerically, in descending order?

<details>
<summary>Answer</summary>

`sort -t, -k3,3nr file.csv`. `-t,` sets the separator, `-k3,3` limits the key to field 3, `n` makes it numeric and `r` reverses. Skip a header with `tail -n +2 file.csv | sort …` or `(head -n 1 file.csv; tail -n +2 file.csv | sort -t, -k3,3nr)`.

</details>

### Q7. Find the 10 most frequent words in a text file.

<details>
<summary>Answer</summary>

```bash
# Illustrative
tr -cs '[:alpha:]' '\n' < file | tr '[:upper:]' '[:lower:]' | sort | uniq -c | sort -rn | head -n 10
```

The first `tr` turns every run of non-letters into a newline (one word per line), the second lowercases, then the frequency-count pipeline.

</details>

### Q8. What is the difference between `wc -c` and `wc -m`?

<details>
<summary>Answer</summary>

`-c` counts bytes, `-m` counts characters according to the locale. They differ for multi-byte UTF-8 text: `héllo` is 6 bytes but 5 characters.

</details>

### Q9. How do you sort output like `du -sh *` by size?

<details>
<summary>Answer</summary>

`du -sh * | sort -h`. `-h` understands the K/M/G suffixes; `-n` would put `900K` after `2G`. Add `-r` for largest first.

</details>

## Advanced

### Q10. Why can `sort` give different orders on two machines for the same file?

<details>
<summary>Answer</summary>

Locale. In `C`/`POSIX` locales `sort` compares bytes (uppercase before lowercase, punctuation significant). In locales such as `en_US.UTF-8` it uses language collation rules (case and some punctuation mostly ignored at first comparison). Scripts that depend on order — including `comm` and `join`, which need identically sorted input — should set `LC_ALL=C`.

</details>

### Q11. How does `sort` handle files larger than memory?

<details>
<summary>Answer</summary>

GNU `sort` performs an external merge sort: it sorts chunks that fit in a memory buffer, writes them to temporary files (in `$TMPDIR` or `-T dir`), then merges them. Options: `-S` buffer size, `--parallel=N` threads, `-T` temp directory (make sure it has enough free space).

</details>

### Q12. What does `sort -k2` do differently from `sort -k2,2`?

<details>
<summary>Answer</summary>

`-k2` makes the key run from field 2 to the end of the line; `-k2,2` uses only field 2. With `-k2`, lines equal in field 2 are further ordered by fields 3, 4, … as part of the same key, and a second `-k` option may never be consulted. Specify both start and end for predictable multi-key sorts.

</details>
