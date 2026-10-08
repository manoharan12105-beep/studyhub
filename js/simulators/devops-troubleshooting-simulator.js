// Guided production troubleshooting for the Docker + Nginx deployment: choose the
// next command.
//
//   scenario → stage → you choose a command →
//     right choice: its output + what it proves → next stage
//     wrong choice: why it does not help (or is dangerous) → same stage
//   "Show next command" plays the expert's choice, so Next/Play walk the ideal path.
//
// Reuses the state machine of the Linux troubleshooting simulator (advance); only
// the scenarios differ. The server, IDs, sizes and times are invented; the
// application error lines are the Task API's real messages, and the tool output
// is abridged to the columns that matter.

import { el, escapeHtml } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper } from '../engagement/stepper.js';
import { advance } from './linux-troubleshooting-simulator.js';

const SCENARIOS = {
  'restart-loop': {
    title: 'Task API restarting after a configuration change',
    intro: 'After editing compose.yaml and running docker compose up -d, the API returns errors. What do you run first?',
    stages: [
      [
        { cmd: 'docker compose ps', ok: true, out: `NAME            SERVICE   STATUS                          PORTS
taskapi-app-1   app       Restarting (1) 4 seconds ago
taskapi-db-1    db        Up 2 hours (healthy)`, why: 'The database is healthy; the app keeps exiting with code 1 and the restart policy keeps starting it again. Read why it exits.' },
        { cmd: 'docker compose down -v && docker compose up -d', why: 'down -v deletes the database volume — every task would be lost — and the same configuration error would come back.' },
        { cmd: 'sudo reboot', why: 'A reboot changes nothing in compose.yaml; the container would restart in the same loop.' },
      ],
      [
        { cmd: 'docker compose logs --tail 30 app', ok: true, out: `app-1  | Caused by: org.postgresql.util.PSQLException: Connection to localhost:5432 refused. Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.`, why: 'The application tries localhost:5432 — inside the app container that is the app container itself, not PostgreSQL.' },
        { cmd: 'docker compose restart db', why: 'The database is healthy; restarting it only interrupts it. The logs of the failing service tell you more.' },
        { cmd: 'docker stats --no-stream', info: true, out: `NAME            CPU %     MEM USAGE / LIMIT
taskapi-db-1    0.02%     41MiB / 1.9GiB`, why: 'Resources look fine (and the app is not even running long enough to show up). The cause is in the app logs.' },
      ],
      [
        { cmd: 'docker compose config | grep SPRING_DATASOURCE_URL', ok: true, out: '      SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/taskdb', why: 'The edited file says localhost. It must be the service name: jdbc:postgresql://db:5432/taskdb.' },
        { cmd: 'docker exec -it taskapi-app-1 sh', why: 'The container restarts every few seconds — and fixing things inside a container is lost anyway. Fix compose.yaml.' },
      ],
      [
        { cmd: "sed -i 's|//localhost:5432|//db:5432|' compose.yaml && docker compose up -d", ok: true, out: ` ✔ Container taskapi-db-1   Running
 ✔ Container taskapi-app-1  Started`, why: 'Compose recreates only the app with the corrected URL; db keeps running.' },
        { cmd: 'docker compose restart app', why: 'restart keeps the old configuration — the container was created with the localhost URL. up -d recreates it.' },
      ],
      [
        { cmd: 'curl -s localhost:8080/actuator/health/readiness', ok: true, out: '{"status":"UP"}', why: 'Ready again.', done: 'Prevention: run docker compose config before deploying, keep the deployment health-checked with automatic rollback, and remember: containers reach each other by service name, never localhost.' },
        { cmd: 'docker compose ps', info: true, out: `NAME            SERVICE   STATUS
taskapi-app-1   app       Up 40 seconds (healthy)
taskapi-db-1    db        Up 2 hours (healthy)`, why: 'Good sign, but confirm the endpoint itself answers.' },
      ],
    ],
  },
  'nginx-502': {
    title: 'Users see 502 Bad Gateway',
    intro: 'Monitoring alerts: https://api.example.com returns 502. You are on the server. First command?',
    stages: [
      [
        { cmd: 'sudo tail -n 3 /var/log/nginx/error.log', ok: true, out: `[error] 811#811: *4127 connect() failed (111: Connection refused) while connecting to upstream, client: 198.51.100.24, server: api.example.com, request: "GET /api/tasks HTTP/1.1", upstream: "http://127.0.0.1:8080/api/tasks"`, why: 'Nginx works; nothing accepts connections on 127.0.0.1:8080. The problem is the app, not Nginx.' },
        { cmd: 'sudo systemctl restart nginx', why: 'Nginx is not the problem — it reported correctly that the upstream refused. Restarting it changes nothing.' },
        { cmd: 'sudo certbot renew --force-renewal', why: 'A certificate problem would fail before any request reaches Nginx\'s proxy — a 502 is an upstream problem.' },
      ],
      [
        { cmd: 'docker compose ps -a', ok: true, out: `NAME            SERVICE   STATUS
taskapi-app-1   app       Exited (137) 3 minutes ago
taskapi-db-1    db        Up 9 days (healthy)`, why: 'The app exited with 137 — SIGKILL. Nobody ran docker kill; suspect the out-of-memory killer.' },
        { cmd: "ps aux | grep java", why: 'The process runs inside a container; ask Docker about the container\'s state first.' },
      ],
      [
        { cmd: "docker inspect -f '{{.State.OOMKilled}}' taskapi-app-1", ok: true, out: 'true', why: 'Confirmed: killed for exceeding its memory limit.' },
        { cmd: 'journalctl -k | tail -n 2', info: true, out: 'Memory cgroup out of memory: Killed process 23041 (java)', why: 'Same conclusion from the kernel log. docker inspect is the direct answer for one container.' },
        { cmd: 'docker compose down -v', why: 'Never: -v deletes the database volume. The database is healthy.' },
      ],
      [
        { cmd: 'docker compose up -d app && sleep 60 && curl -s localhost:8080/actuator/health/readiness', ok: true, out: '{"status":"UP"}', why: 'Service restored. It had stayed down because this app service had no restart policy — add restart: unless-stopped.', done: 'Now fix the cause: compare the memory limit with -XX:MaxRAMPercentage, check docker stats under load, and look for a leak. Add alerting on container restarts and 5xx rates.' },
        { cmd: "Raise Nginx's proxy_read_timeout", why: 'Timeouts produce 504, not 502. The upstream was simply not running.' },
      ],
    ],
  },
  'disk-full-docker': {
    title: 'Disk full on the Docker host',
    intro: 'PostgreSQL logs "No space left on device" and the API fails to save tasks. First command?',
    stages: [
      [
        { cmd: 'df -h /', ok: true, out: `Filesystem      Size  Used Avail Use% Mounted on
/dev/vda1        25G   25G     0 100% /`, why: 'The root filesystem is full.' },
        { cmd: 'docker volume prune -a -f', why: 'Dangerous: deletes every named volume no container uses — the database\'s volume too, if its container happens to be removed or being recreated. Measure first.' },
      ],
      [
        { cmd: 'docker system df', ok: true, out: `TYPE            TOTAL     ACTIVE    SIZE      RECLAIMABLE
Images          14        2         6.1GB     5.2GB (85%)
Containers      2         2         9.8GB     0B (0%)
Local Volumes   1         1         1.1GB     0B (0%)
Build Cache     38        0         2.4GB     2.4GB`, why: 'Containers use 9.8 GB although the app writes almost nothing to disk — that is their log files. Old images and build cache are reclaimable too.' },
        { cmd: 'sudo du -sh /var/lib/postgresql', why: 'PostgreSQL runs in a container; its data is in a Docker volume (1.1 GB here). Look at what Docker uses.' },
      ],
      [
        { cmd: "sudo sh -c 'du -h /var/lib/docker/containers/*/*-json.log' | sort -h | tail -n 1", ok: true, out: '9.7G    /var/lib/docker/containers/5c1e…/5c1e…-json.log', why: 'One container\'s JSON log is 9.7 GB: no log rotation, and DEBUG logging left on.' },
        { cmd: 'docker system prune -a --volumes -f', why: 'Removes every unused image (your rollback target), and anonymous volumes. Clean deliberately instead.' },
      ],
      [
        { cmd: 'docker image prune -f && docker builder prune -f', ok: true, out: 'Total reclaimed space: 7.4GB', why: 'Safe: dangling images and build cache. The database can write again; now fix the log growth.' },
        { cmd: 'sudo rm /var/lib/docker/containers/5c1e…/5c1e…-json.log', why: 'Docker still holds the file open, so the space is not freed, and Docker\'s log state breaks. Rotate instead.' },
      ],
      [
        { cmd: 'Add logging: max-size "10m", max-file "3" to the service and run docker compose up -d app', ok: true, out: ' ✔ Container taskapi-app-1  Recreated', why: 'The recreated container starts a new, size-limited log; the 9.7 GB file is removed with the old container.', done: 'Prevention: log rotation for every service (or daemon.json), INFO level in production, periodic image pruning, and a disk alert at 80 %.' },
        { cmd: 'sudo reboot', why: 'A reboot frees nothing and the log would keep growing.' },
      ],
    ],
  },
};

export function mount(root, { options }) {
  const scenario = SCENARIOS[options.scenario] || SCENARIOS['restart-loop'];
  const term = el('pre', { class: 'mini-code term-out trouble-term', tabindex: 0, 'aria-label': 'Simulated terminal' });
  const prompt = el('p', { class: 'trouble-prompt' });
  const choices = el('div', { class: 'trouble-choices', role: 'group', 'aria-label': 'Choose the next command' });
  const progress = el('p', { class: 'viz-note' });
  root.append(el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, `${scenario.title} — StudyHub simulation`), term, prompt, choices, progress));
  const stepper = createStepper(root, { render, playDelay: 2400, nextLabel: 'Show next command' });

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
    start([...current.picks, Number(button.dataset.choice)]);
  });

  start();
  return stepper;
}
