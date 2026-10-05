# Foreground, Background and Job Control — Practice

### P1. Background start

**Difficulty:** Easy · **Type:** Command · **Concepts:** &

Start `./export.sh` in the background with all its output written to `export.log`.

<details>
<summary>Answer</summary>

```bash
# Illustrative
./export.sh > export.log 2>&1 &
```

</details>

### P2. Suspend or stop?

**Difficulty:** Easy · **Type:** MCQ · **Concepts:** Ctrl+Z

You press `Ctrl+Z` while `top` is running. What is the state of `top` afterwards?

- A) Terminated
- B) Stopped, still in memory
- C) Running in the background
- D) A zombie

<details>
<summary>Answer</summary>

**Answer:** B) Stopped, still in memory

**Explanation:** `Ctrl+Z` sends `SIGTSTP`. The job appears in `jobs` as Stopped until you `fg`, `bg` or kill it.

</details>

### P3. Resume in the background

**Difficulty:** Easy · **Type:** Command · **Concepts:** bg

After pressing `Ctrl+Z` on a long `rsync`, continue it in the background.

<details>
<summary>Answer</summary>

```bash
# Illustrative
bg            # or: bg %1
```

</details>

### P4. Read the job table

**Difficulty:** Medium · **Type:** Conceptual · **Concepts:** jobs output

`jobs` prints:

```text
[1]-  Stopped                 vim notes.txt
[2]+  Running                 ./build.sh &
```

What does `fg` (with no argument) bring to the foreground? How do you bring back `vim`?

<details>
<summary>Answer</summary>

`fg` acts on the current job, marked `+`: `./build.sh`. Bring back `vim` with `fg %1` (or `fg %-`, or `fg %vim`).

</details>

### P5. Survive logout

**Difficulty:** Medium · **Type:** MCQ · **Concepts:** SIGHUP, nohup

Which command keeps running after you close the SSH session, with its output saved?

- A) `./backup.sh &`
- B) `nohup ./backup.sh > backup.log 2>&1 &`
- C) `./backup.sh` then `Ctrl+Z`
- D) `bg ./backup.sh`

<details>
<summary>Answer</summary>

**Answer:** B) `nohup ./backup.sh > backup.log 2>&1 &`

**Explanation:** A receives `SIGHUP` when the session closes. C only suspends it. D is not valid — `bg` takes a job, not a command.

</details>

### P6. Parallel work in a script

**Difficulty:** Medium · **Type:** Output · **Concepts:** &, wait

What does this print, and in what order?

```bash
(sleep 2; echo slow) &
(sleep 1; echo fast) &
wait
echo finished
```

<details>
<summary>Answer</summary>

**Output:**

```text
fast
slow
finished
```

Both run at the same time; the shorter sleep prints first, and `wait` holds `finished` until both have ended.

</details>

### P7. Port still in use

**Difficulty:** Medium · **Type:** Troubleshooting · **Concepts:** stopped jobs hold resources

You stopped a dev server with `Ctrl+Z` and now `npm start` fails with `EADDRINUSE: address already in use :::3000`. How do you fix it from the same terminal?

<details>
<summary>Answer</summary>

The suspended server still owns port 3000. Run `jobs` to find it, then either `fg` and stop it with `Ctrl+C`, or `kill %1` (if it does not end while stopped, `kill -CONT %1` after `kill`, or `kill -9 %1`).

</details>

### P8. Re-attach later

**Difficulty:** Hard · **Type:** Scenario · **Concepts:** tmux vs nohup

You must run an interactive database migration that takes an hour and may ask questions, over an unreliable VPN. Why is `nohup` a poor fit, and what do you use?

<details>
<summary>Answer</summary>

`nohup` gives no way to answer prompts (input is ignored) or to see the session again after a disconnect. Use `tmux` (or `screen`): `tmux new -s migrate`, run the migration, detach with `Ctrl+B d` if needed; after reconnecting, `tmux attach -t migrate` returns you to the same running session.

</details>
