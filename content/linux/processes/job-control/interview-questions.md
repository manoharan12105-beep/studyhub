# Foreground, Background and Job Control — Interview Questions

## Beginner

### Q1. What is the difference between a foreground and a background process?

<details>
<summary>Answer</summary>

A foreground process owns the terminal: it receives keyboard input and terminal signals (`Ctrl+C`, `Ctrl+Z`), and the shell waits for it. A background process (`command &`) runs while the shell returns the prompt; it does not receive keyboard input or those keys.

</details>

### Q2. How do you run a command in the background?

<details>
<summary>Answer</summary>

Append `&`: `./build.sh &`. The shell prints the job number and PID (`[1] 4321`). Redirect output if it is noisy: `./build.sh > build.log 2>&1 &`.

</details>

### Q3. What do `fg` and `bg` do?

<details>
<summary>Answer</summary>

`fg %n` brings job n to the foreground (continuing it if stopped). `bg %n` continues a stopped job in the background. Without an argument they act on the current job (`+` in `jobs`).

</details>

### Q4. What is the difference between `Ctrl+C` and `Ctrl+Z`?

<details>
<summary>Answer</summary>

`Ctrl+C` sends `SIGINT`, which normally terminates the foreground program. `Ctrl+Z` sends `SIGTSTP`, which suspends it; it can be resumed with `fg` or `bg`. A suspended program still holds its memory, files and ports.

</details>

## Intermediate

### Q5. What does `nohup` do?

<details>
<summary>Answer</summary>

It runs a command with `SIGHUP` ignored, so the command keeps running after the terminal or SSH session closes. If output is a terminal, it is redirected to `nohup.out`. It does not put the command in the background by itself — combine it with `&`.

</details>

### Q6. How do you keep a process running after you log out of SSH?

<details>
<summary>Answer</summary>

Options: `nohup cmd > log 2>&1 &`; start with `&` and then `disown`; run it inside `tmux` or `screen` (re-attachable later); or, for anything long-lived, run it as a systemd service (or a scheduled job), which also handles restarts and boot start.

</details>

### Q7. What is the difference between `nohup` and `disown`?

<details>
<summary>Answer</summary>

`nohup` is used at start time: the process itself ignores `SIGHUP` and its output is redirected. `disown` is a bash builtin used afterwards: it removes an already-running job from the shell's job table so the shell does not send it `SIGHUP` on exit — but its output still points at the (soon closed) terminal, so writes may fail.

</details>

### Q8. You started a long `scp` in the foreground and need your terminal back without restarting the transfer. What do you do?

<details>
<summary>Answer</summary>

Press `Ctrl+Z` to suspend it, then `bg` to continue it in the background. (`disown` it as well if you also want to close the terminal.) Note that programs reading from the terminal — such as one prompting for a password — stop again when backgrounded.

</details>

### Q9. Why do job numbers not work in a different terminal?

<details>
<summary>Answer</summary>

Jobs belong to the shell that started them; each shell keeps its own job table. From another terminal, use the PID (`kill 4321`, `ps -p 4321`) or find it with `pgrep`.

</details>

## Advanced

### Q10. What happens when a background job tries to read from the terminal?

<details>
<summary>Answer</summary>

The terminal driver sends it `SIGTTIN`, which stops it (`jobs` shows "Stopped (tty input)"). Bring it to the foreground with `fg` to give it input, or run it with input redirected (`< /dev/null` or from a file). Writing to the terminal is allowed by default, unless `stty tostop` is set (then `SIGTTOU`).

</details>

### Q11. Why is `nohup java -jar app.jar &` not a good way to run a production service?

<details>
<summary>Answer</summary>

Nothing restarts it if it crashes, it does not start at boot, logs grow without rotation, there is no resource limiting or dependency ordering, and stopping it relies on finding the PID. A systemd unit provides `Restart=on-failure`, start at boot (`enable`), journal logging, `User=`, resource limits and a clean `systemctl stop` that sends `SIGTERM` and waits.

</details>
