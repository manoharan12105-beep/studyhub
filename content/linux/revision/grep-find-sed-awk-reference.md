# grep, find, sed and awk Quick Reference

The four power tools side by side — patterns you can copy, using the practice-lab files.

## Which Tool?

| Task | Tool |
|------|------|
| Find **lines** that match a pattern | `grep` |
| Find **files** by name, size, age, owner, permissions | `find` |
| **Edit** text: substitute, delete, print ranges | `sed` |
| Work with **columns**: filter, compute, report | `awk` |

## grep

| Pattern | Does |
|---------|------|
| `grep ERROR app.log` | Lines containing ERROR |
| `grep -i error app.log` | Ignore case |
| `grep -v INFO app.log` | Lines **not** containing INFO |
| `grep -c ERROR app.log` | Count matching **lines** |
| `grep -n ERROR app.log` | With line numbers |
| `grep -w apple fruits.txt` | Whole words only |
| `grep -E 'ERROR\|WARN' app.log` | Either (extended regex) |
| `grep -o '[0-9]\{3\}' access.log` | Print only the matched text |
| `grep -A 2 -B 1 ERROR app.log` | Context after / before |
| `grep -rn 'TODO' project/` | Recursive, with file and line |
| `grep -rl 'class' project/src` | Only file names |
| `grep -q ERROR app.log && echo found` | Exit status only |
| `grep -F '[db]' app.log` | Fixed string (no regex) |

Regex: `^` start, `$` end, `.` any char, `*` 0+, `+` 1+ (`-E`), `?` 0/1 (`-E`), `[abc]`, `[^abc]`, `\b` word boundary, `( | )` groups (`-E`).

## find

| Pattern | Does |
|---------|------|
| `find . -name '*.log'` | By name (quote the pattern) |
| `find . -iname 'readme*'` | Case-insensitive name |
| `find . -type f` / `-type d` / `-type l` | Files / directories / symlinks |
| `find . -size +1M` / `-size -10k` | Larger than 1 MiB / smaller than 10 KiB |
| `find . -mtime -7` / `-mtime +30` | Modified in the last 7 days / more than 30 days ago |
| `find . -mmin -60` | Modified in the last hour |
| `find . -empty` | Empty files and directories |
| `find . -user alice` / `-perm -u+x` / `-perm 644` | Owner / has bits / exact mode |
| `find . -maxdepth 1 -type f` | Do not descend |
| `find . -name '*.java' -not -path '*/test/*'` | Exclude a path |
| `find . -name '*.tmp' -exec rm -- {} +` | Run a command on all matches |
| `find . -name '*.log' -print0 \| xargs -0 gzip` | Safe pipeline for any file name |
| `find / -xdev -type f -size +500M 2>/dev/null` | Big files on one filesystem |
| `find . -name '*.tmp' -delete` | Delete matches (run with `-print` first) |

Tests combine with AND by default; `-o` = OR with `\( … \)`; `!`/`-not` = NOT.

## sed

| Pattern | Does |
|---------|------|
| `sed 's/ERROR/FAIL/' app.log` | Replace first match per line |
| `sed 's/ERROR/FAIL/g' app.log` | Replace all matches |
| `sed 's/error/FAIL/gI' app.log` | Ignore case (GNU) |
| `sed -n '3,5p' app.log` | Print lines 3–5 only |
| `sed -n '/ERROR/p' app.log` | Print matching lines (like grep) |
| `sed '1d' employees.csv` | Delete the header |
| `sed '/^#/d; /^$/d' config/app.conf` | Delete comments and blank lines |
| `sed 's#/var/log#/data/log#g' f` | Another delimiter for paths |
| `sed -E 's/([0-9]+)ms/\1 ms/' f` | Groups and back-references |
| `sed -i.bak 's/8080/9090/' app.conf` | Edit in place, keep a backup |
| `sed '2i\new line' f` / `sed '2a\new line' f` | Insert before / append after line 2 |

`-n` suppresses automatic printing; `p` prints; `d` deletes; `-i` modifies the file — test without `-i` first.

## awk

| Pattern | Does |
|---------|------|
| `awk '{print $1}' access.log` | First field (whitespace-separated) |
| `awk -F, '{print $2, $4}' employees.csv` | CSV columns |
| `awk -F, 'NR > 1' employees.csv` | Skip the header |
| `awk -F, '$4 > 60000 {print $2}' employees.csv` | Filter by a column |
| `awk '/ERROR/ {n++} END {print n}' app.log` | Count matches |
| `awk -F, 'NR > 1 {s += $4} END {print s}' employees.csv` | Sum a column |
| `awk -F, 'NR > 1 {t[$3] += $4} END {for (d in t) print d, t[d]}' employees.csv` | Group and sum |
| `awk '{print NF}' f` / `awk '{print $NF}' f` | Field count / last field |
| `awk 'length($0) > 80' f` | Long lines |
| `awk -F, -v OFS='\t' '{$1 = $1; print}' f` | Change the output separator |
| `awk '{c[$1]++} END {for (ip in c) print c[ip], ip}' access.log \| sort -rn` | Requests per IP |

Built-ins: `$0` line, `$1…` fields, `NF` fields, `NR` line number, `FS`/`OFS` separators, `BEGIN {}` / `END {}`.

## Classic Pipelines

```bash
# Illustrative
grep ERROR app.log | awk '{print $4}' | sort | uniq -c | sort -rn     # errors per component
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head -3     # top IPs
awk '{print $9}' access.log | sort | uniq -c                          # status codes
find . -name '*.java' | xargs grep -l 'Order'                         # files mentioning Order
du -ah . | sort -h | tail -5                                          # largest items
```
