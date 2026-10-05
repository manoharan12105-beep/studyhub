# cut, tr and paste — Interview Questions

## Beginner

### Q1. How do you print the second column of a comma-separated file?

<details>
<summary>Answer</summary>

`cut -d, -f2 file.csv`. With `awk`: `awk -F, '{print $2}' file.csv`. (Neither handles quoted fields containing commas; use a CSV-aware tool for those.)

</details>

### Q2. How do you convert text to uppercase on the command line?

<details>
<summary>Answer</summary>

`tr '[:lower:]' '[:upper:]' < file` (or `tr a-z A-Z`). Bash can also do it for a variable: `${var^^}`.

</details>

### Q3. How do you remove all digits from a string?

<details>
<summary>Answer</summary>

`echo "$s" | tr -d '0-9'` (or `tr -d '[:digit:]'`). To keep only digits: `tr -cd '0-9'`.

</details>

### Q4. What does `paste` do?

<details>
<summary>Answer</summary>

It joins corresponding lines of several files side by side, separated by tabs (or `-d` delimiter). With `-s` it joins all lines of a file into one line: `paste -sd, ids.txt` → `1,2,3`.

</details>

## Intermediate

### Q5. Why does `cut -d' ' -f2` give unexpected results on `ps` output?

<details>
<summary>Answer</summary>

`ps` aligns columns with a variable number of spaces. `cut` treats each single space as a separator, so empty fields appear between consecutive spaces and the "second field" shifts from line to line. Use `awk '{print $2}'`, which splits on runs of whitespace, or squeeze first with `tr -s ' '`.

</details>

### Q6. How do you convert a file with Windows line endings to Unix line endings?

<details>
<summary>Answer</summary>

Remove the carriage returns: `tr -d '\r' < in.txt > out.txt`, `sed -i 's/\r$//' file`, or `dos2unix file`. Symptoms of CRLF files: `bash: $'\r': command not found` in scripts, and `^M` shown by `cat -A`.

</details>

### Q7. What is the difference between `tr` and `sed` for replacing text?

<details>
<summary>Answer</summary>

`tr` works on individual characters (mapping, deleting, squeezing) and reads only stdin. `sed` works on strings and regular expressions, line by line, on files or stdin. `tr 'abc' 'xyz'` maps a→x, b→y, c→z; replacing the word "abc" with "xyz" needs `sed 's/abc/xyz/g'`.

</details>

### Q8. Can `cut` reorder columns?

<details>
<summary>Answer</summary>

No. `cut -f3,1` prints fields 1 and 3 in their original order. Use `awk -F, '{print $3 "," $1}'` to reorder.

</details>

## Advanced

### Q9. Turn a column of IDs into a SQL `IN (...)` list.

<details>
<summary>Answer</summary>

```bash
# Illustrative
echo "SELECT * FROM orders WHERE id IN ($(paste -sd, ids.txt));"
```

`paste -sd,` joins all lines with commas. For string IDs add quotes first: `sed "s/.*/'&'/" ids.txt | paste -sd,`.

</details>

### Q10. Split the `PATH` variable into one directory per line.

<details>
<summary>Answer</summary>

`echo "$PATH" | tr ':' '\n'`. This is a quick way to check the order in which directories are searched for commands.

</details>

### Q11. A CSV field contains a comma inside quotes, e.g. `"Mumbai, MH"`. What happens with `cut -d,`, and what would you use instead?

<details>
<summary>Answer</summary>

`cut` does not understand quoting; it splits at every comma, so the quoted field breaks into two and all later fields shift. Use a CSV-aware tool (`csvcut` from csvkit, `mlr` (Miller), Python's `csv` module, or GNU awk with `FPAT`). For data you control, a separator that never appears in values (tab) avoids the problem.

</details>
