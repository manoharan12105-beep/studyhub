# sed — Interview Questions

## Beginner

### Q1. How do you replace all occurrences of a word in a file using sed?

<details>
<summary>Answer</summary>

`sed 's/old/new/g' file` prints the result; `sed -i 's/old/new/g' file` changes the file in place (`-i.bak` keeps a backup). Without `g`, only the first occurrence on each line is replaced.

</details>

### Q2. How do you delete lines containing a pattern?

<details>
<summary>Answer</summary>

`sed '/pattern/d' file`. For example `sed '/^#/d' app.conf` removes comment lines; `sed '/^$/d'` removes blank lines.

</details>

### Q3. How do you print only lines 10 to 20 of a file?

<details>
<summary>Answer</summary>

`sed -n '10,20p' file`. `-n` disables automatic printing and `p` prints the addressed lines. (`awk 'NR>=10 && NR<=20'` or `head -20 | tail -11` also work.)

</details>

### Q4. What does the `-i` option do?

<details>
<summary>Answer</summary>

Edits the file in place: sed writes the result to a temporary file and replaces the original. `-i.bak` saves the original with a `.bak` suffix. Test the command without `-i` first.

</details>

## Intermediate

### Q5. What is the difference between `sed 's/a/b/'` and `sed 's/a/b/g'`?

<details>
<summary>Answer</summary>

Without `g`, only the first match on each line is replaced; with `g`, every match on each line. A number flag (`s/a/b/2`) replaces only the Nth match.

</details>

### Q6. How do you replace a path such as `/usr/local/bin` without escaping every slash?

<details>
<summary>Answer</summary>

Use another delimiter: `sed 's|/usr/local/bin|/opt/bin|g' file`. Any character that does not appear in the pattern can be the delimiter.

</details>

### Q7. What do `&` and `\1` mean in a replacement?

<details>
<summary>Answer</summary>

`&` is the entire matched text (`sed 's/[0-9]\+/(&)/'` wraps numbers in parentheses). `\1`…`\9` refer to groups captured with `\( \)` (or `( )` with `-E`), allowing reordering: `sed -E 's/(.*),(.*)/\2,\1/'` swaps two comma-separated fields.

</details>

### Q8. How do you set a configuration value to `9090` regardless of its current value?

<details>
<summary>Answer</summary>

Anchor the key and replace the whole line value: `sed -i 's/^server\.port=.*/server.port=9090/' app.properties`. `^` anchors to the line start, `\.` escapes the dot, `.*` matches any old value. Add the key if missing with `grep -q '^server\.port=' f || echo 'server.port=9090' >> f`.

</details>

### Q9. Why does `sed '/ERROR/p' app.log` print error lines twice?

<details>
<summary>Answer</summary>

sed prints every line automatically, and `p` prints matching lines again. Add `-n` to suppress the automatic printing: `sed -n '/ERROR/p'`.

</details>

## Advanced

### Q10. How do you print the lines between two markers, e.g. a stack trace?

<details>
<summary>Answer</summary>

Use a range address: `sed -n '/Exception/,/^[0-9]\{4\}-/p' app.log` prints from the line containing "Exception" through the next line starting with a date (the next log entry). Ranges match from each start pattern to the next end pattern, repeatedly.

</details>

### Q11. A script with `sed -i 's/a/b/' file` works on Linux but fails on a Mac. Why?

<details>
<summary>Answer</summary>

BSD sed (macOS) requires a suffix argument after `-i`: `sed -i '' 's/a/b/' file`. GNU sed treats the suffix as optional and attached (`-i.bak`). A portable form is `sed -i.bak 's/a/b/' file && rm file.bak`, or use `perl -pi -e`.

</details>

### Q12. How would you remove Windows line endings and trailing whitespace from every `.sh` file in a project?

<details>
<summary>Answer</summary>

```bash
# Illustrative
find . -name '*.sh' -exec sed -i 's/\r$//; s/[[:space:]]*$//' {} +
```

`\r$` removes a carriage return at the end of each line; `[[:space:]]*$` removes trailing spaces and tabs. Commit beforehand so the change can be reviewed with `git diff`.

</details>
