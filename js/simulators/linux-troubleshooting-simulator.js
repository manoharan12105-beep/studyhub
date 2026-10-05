// Guided incident investigation on a simulated server: pick the next command.
//
//   scenario → stage → you choose a command →
//     right choice: its output + why → next stage
//     wrong choice: why it does not help (or is dangerous) → same stage
//   "Show next command" plays the expert's choice, so Next/Play walk the ideal path.
//
// One module serves several scenarios (options.scenario). The server, its PIDs,
// sizes and timestamps are invented; the commands, output formats and error
// messages are what the real tools print.

import { el, escapeHtml } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper, field } from '../engagement/stepper.js';

const SCENARIOS = {
  'disk-full': {
    title: 'Disk full on web01',
    intro: 'Alert: the inventory API on web01 returns errors, and its log says "No space left on device". What is your first command?',
    stages: [
      [
        { cmd: 'df -h', ok: true, out: `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        40G   40G     0 100% /
tmpfs           1.9G     0  1.9G   0% /dev/shm
/dev/sdb1       200G   61G  140G  31% /data`, why: 'df shows usage per filesystem: the root filesystem / is at 100 %, /data is fine. Now find what fills /.' },
        { cmd: 'sudo rm -rf /tmp/*', why: 'Deleting before you know what is full is guessing — /tmp may not even be the problem, and running programs may need those files. Measure first.' },
        { cmd: 'free -h', why: 'free reports memory (RAM), not disk space.' },
      ],
      [
        { cmd: 'sudo du -xh --max-depth=1 / 2>/dev/null | sort -h | tail -4', ok: true, out: `1.9G    /home
3.4G    /opt
32G     /var
39G     /`, why: 'du adds up the space under each top-level directory; -x stays on this filesystem (so /data is not counted), sort -h orders human-readable sizes. /var holds 32G of it.' },
        { cmd: 'df -i /', info: true, out: `Filesystem      Inodes  IUsed   IFree IUse% Mounted on
/dev/sda1      2621440 311204 2310236   12% /`, why: 'A good check — inodes are only 12 % used, so this is a space problem, not an inode problem. Next: find where the space is.' },
        { cmd: 'ls -lh /', why: 'ls shows each directory entry\'s own size (4.0K), not the size of what is inside. Use du.' },
      ],
      [
        { cmd: 'sudo du -xh /var 2>/dev/null | sort -h | tail -3', ok: true, out: `27G     /var/log/inventory
30G     /var/log
32G     /var`, why: 'One directory dominates: /var/log/inventory with 27G — the application\'s own logs.' },
        { cmd: "sudo find / -name '*.log' -delete", why: 'Dangerous: this deletes every .log file on the system, including logs you may need to investigate — and files still open by programs would not even free space. Never delete blindly.' },
        { cmd: 'sudo du -sh /data', why: '/data is a separate filesystem at 31 %. It is not the one that is full.' },
      ],
      [
        { cmd: 'ls -lhS /var/log/inventory | head -3', ok: true, out: `total 27G
-rw-r--r-- 1 inventory inventory  27G Jan 15 09:31 debug.log
-rw-r--r-- 1 inventory inventory  12M Jan 15 09:31 app.log`, why: 'debug.log is 27G and was modified a minute ago: the running service is still writing to it.' },
        { cmd: 'sudo systemctl restart inventory', why: 'A restart does not free a single byte here, and the service would immediately fail again or keep filling the disk. Identify the file first.' },
        { cmd: 'cat /var/log/inventory/debug.log', why: 'cat would try to print 27G to your terminal. Use ls -lh to see sizes, or tail/head to sample a big file.' },
      ],
      [
        { cmd: 'sudo truncate -s 0 /var/log/inventory/debug.log && df -h /', ok: true, out: `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        40G   13G   27G  33% /`, why: 'Truncating empties the file in place. The service keeps its file open and continues writing at the start of an empty file, and the 27G are free immediately.' },
        { cmd: 'sudo rm /var/log/inventory/debug.log && df -h /', why: 'This is the classic trap: rm removes the name, but the service still holds the file open, so df would still show 100 % — sudo lsof +L1 would list it as "(deleted)". You would have to restart the service to get the space back. (Simulation rewound.)' },
        { cmd: 'sudo gzip /var/log/inventory/debug.log', why: 'gzip writes a compressed copy BEFORE removing the original — on a full disk it fails with "No space left on device". And the service would keep writing to the removed original.' },
      ],
      [
        { cmd: 'sudo tail -n 2 /var/log/inventory/debug.log', ok: true, out: `2026-01-15 09:32:10 DEBUG [cache] cache refresh tick
2026-01-15 09:32:10 DEBUG [cache] cache refresh tick`, why: 'The root cause: DEBUG logging was left on in production, writing the same line many times a second.', done: 'Fixed for now. Prevent a repeat: set the log level to INFO and restart the service, add a logrotate rule (daily, maxsize, compress, copytruncate) and alert on disk usage at 80 %.' },
        { cmd: 'sudo reboot', why: 'A reboot removes nothing and the service would fill the disk again. Find out WHY the log grows.' },
      ],
    ],
  },
  'port-in-use': {
    title: 'Service will not start on web01',
    intro: 'After a deployment, sudo systemctl start inventory returns an error. What do you run first?',
    stages: [
      [
        { cmd: 'systemctl status inventory --no-pager', ok: true, out: `× inventory.service - Inventory API
     Loaded: loaded (/etc/systemd/system/inventory.service; enabled; preset: enabled)
     Active: failed (Result: exit-code) since Thu 2026-01-15 09:30:12 UTC; 5s ago
    Process: 2210 ExecStart=/usr/bin/java -jar /opt/inventory/app.jar (code=exited, status=1/FAILURE)
   Main PID: 2210 (code=exited, status=1/FAILURE)

Jan 15 09:30:12 web01 java[2210]: Web server failed to start. Port 8080 was already in use.
Jan 15 09:30:12 web01 systemd[1]: inventory.service: Failed with result 'exit-code'.`, why: 'The status shows the failure and the last log lines: port 8080 is already taken by something else.' },
        { cmd: 'sudo systemctl restart inventory', why: 'Trying again without reading the error gives the same failure. Read the status and logs first.' },
        { cmd: 'sudo reboot', why: 'A reboot might hide the problem for a while, but you would learn nothing — and whatever holds the port may start again at boot.' },
      ],
      [
        { cmd: "sudo ss -ltnp 'sport = :8080'", ok: true, out: `State  Recv-Q Send-Q Local Address:Port Peer Address:Port Process
LISTEN 0      100                *:8080            *:*     users:(("java",pid=1875,fd=19))`, why: 'ss lists listening TCP sockets (-l -t) with numeric ports (-n) and the owning process (-p, needs sudo for other users\' processes): a java process with PID 1875 holds port 8080.' },
        { cmd: 'ps aux | grep 8080', why: 'ps knows nothing about ports; this only finds processes that happen to have "8080" in their command line. Ask the socket table: ss -ltnp or lsof -i :8080.' },
        { cmd: 'ping localhost:8080', why: 'ping uses ICMP and has no concept of ports. Use ss on the server, or nc -zv host port from a client.' },
      ],
      [
        { cmd: 'ps -o pid,user,etime,cmd -p 1875', ok: true, out: `    PID USER         ELAPSED CMD
   1875 deploy      02:14:09 java -jar /home/deploy/inventory-old.jar`, why: 'It is an old copy of the application, started by hand by the deploy user over two hours ago — not the systemd service. A duplicate instance.' },
        { cmd: 'sudo kill -9 1875', why: 'Never kill before you know what a process is — it could be a different, important application. And SIGKILL skips its clean shutdown. Identify it first.' },
      ],
      [
        { cmd: "sudo kill 1875 && sleep 5 && sudo ss -ltn 'sport = :8080'", ok: true, out: 'State  Recv-Q Send-Q Local Address:Port Peer Address:Port', why: 'SIGTERM lets the old Java application shut down cleanly. After a few seconds the port is free: ss prints only its header.' },
        { cmd: 'sudo kill -9 1875', info: true, why: 'This would work, but SIGKILL gives the application no chance to finish requests or release resources. Send SIGTERM first; use -9 only if it does not exit.' },
        { cmd: 'Change the service to port 8081', why: 'Then two copies of the application would run, one of them unmanaged and outdated. Remove the duplicate instead.' },
      ],
      [
        { cmd: 'sudo systemctl start inventory && systemctl is-active inventory', ok: true, out: 'active', why: 'The service starts and stays active.', done: 'Fixed. Prevent a repeat: run the application only through systemd (no manual nohup java -jar), make the deployment script stop old instances, and monitor the service with systemctl is-active or a health check.' },
        { cmd: 'nohup java -jar /opt/inventory/app.jar &', why: 'That recreates the original problem: an unmanaged copy that systemd does not supervise, restart or log. Start the service.' },
      ],
    ],
  },
};

export function mount(root, { options }) {
  const scenario = SCENARIOS[options.scenario] || SCENARIOS['disk-full'];
  const term = el('pre', { class: 'mini-code term-out trouble-term', tabindex: 0, 'aria-label': 'Simulated terminal on web01' });
  const prompt = el('p', { class: 'trouble-prompt' });
  const choices = el('div', { class: 'trouble-choices', role: 'group', 'aria-label': 'Choose the next command' });
  const progress = el('p', { class: 'viz-note' });
  root.append(el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, `${scenario.title} — simulated server`), term, prompt, choices, progress));
  const stepper = createStepper(root, { render, playDelay: 2200, nextLabel: 'Show next command' });

  let current = null;
  function start(picks = []) {
    const first = { stage: 0, picks: [], cmd: null, out: null, kind: 'intro', text: scenario.intro };
    stepper.load(first, (frame, index) => advance(scenario, frame, picks[index]));
    for (let i = 0; i < picks.length; i += 1) stepper.next();
  }

  function render(frame) {
    current = frame;
    term.innerHTML = frame.cmd
      ? `${highlight(`$ ${frame.cmd}`, 'bash')}${frame.out ? `\n${escapeHtml(frame.out)}` : ''}`
      : '$ ';
    term.classList.toggle('is-wrong', frame.kind === 'wrong');
    const done = frame.stage >= scenario.stages.length;
    prompt.textContent = done ? 'Incident resolved.' : frame.kind === 'intro' ? 'Choose a command:' : 'What next? Choose a command:';
    choices.replaceChildren(...(done ? [] : scenario.stages[frame.stage].map((c, i) => el('button', {
      type: 'button', class: 'btn btn-secondary btn-sm trouble-choice', 'data-choice': i,
    }, el('code', {}, c.cmd)))));
    progress.textContent = `Stage ${Math.min(frame.stage + 1, scenario.stages.length)} of ${scenario.stages.length}${frame.kind === 'wrong' ? ' · that choice did not move the investigation forward' : ''}`;
  }

  choices.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-choice]');
    if (!button || !current) return;
    // Replay the path up to the current frame, then add this choice.
    start([...current.picks, Number(button.dataset.choice)]);
  });

  start();
  return stepper;
}

/** Next frame: the given pick at the current stage, or the expert's choice when none is given. */
export function advance(scenario, frame, pick) {
  if (frame.stage >= scenario.stages.length) return null;
  const stage = scenario.stages[frame.stage];
  const index = pick ?? stage.findIndex((c) => c.ok);
  const choice = stage[index];
  const picks = [...frame.picks, index];
  if (choice.ok) {
    const last = frame.stage === scenario.stages.length - 1;
    return { stage: frame.stage + 1, picks, cmd: choice.cmd, out: choice.out, kind: 'ok', text: `✓ ${choice.why}${last && choice.done ? ` ${choice.done}` : ''}` };
  }
  return {
    stage: frame.stage, picks, cmd: choice.cmd,
    out: choice.info ? choice.out || null : '# not run in the simulation — see why below',
    kind: choice.info ? 'info' : 'wrong', text: `${choice.info ? 'ℹ' : '✗'} ${choice.why}`,
  };
}
