// Shared, DOM-free logic for the DevOps & Deployment simulators and visualizers.
//
// Not an interaction itself (nothing registers "devops-common"). Keeping the rules
// here — container lifecycle, layer caching, connectivity, volume persistence and
// the configuration checker — lets the same code be checked with Node against the
// lessons, exactly as os-common.js does for the Operating Systems subject.
// Everything is a StudyHub simulation: no Docker command is ever run.

// ---- Container lifecycle -----------------------------------------------------------

export const LIFECYCLE_ACTIONS = {
  run: 'docker run -d --name api taskapi:1.0.0',
  create: 'docker create --name api taskapi:1.0.0',
  start: 'docker start api',
  write: 'docker exec api sh -c "echo hi > /tmp/note.txt"',
  stop: 'docker stop api',
  kill: 'docker kill api',
  crash: '(the application throws on start-up and exits)',
  restart: 'docker restart api',
  rm: 'docker rm api',
  rmf: 'docker rm -f api',
};

export const EMPTY_CONTAINER = { status: 'none', exitCode: null, files: [] };

/** Apply one action. Returns { state, ok, text }; an error leaves the state unchanged. */
export function lifecycleStep(state, action) {
  const s = state;
  const exists = s.status !== 'none';
  const err = (text) => ({ state: s, ok: false, text });
  const to = (patch, text) => ({ state: { ...s, ...patch }, ok: true, text });
  switch (action) {
    case 'run':
      if (exists) return err('Error: the container name "/api" is already in use. Remove the old container first (docker rm -f api).');
      return to({ status: 'running', exitCode: null, files: [] }, 'run = create + start: a new container with an empty writable layer is created from the image and its main process (java) starts.');
    case 'create':
      if (exists) return err('Error: the container name "/api" is already in use.');
      return to({ status: 'created', exitCode: null, files: [] }, 'The container exists (configuration and writable layer) but nothing runs yet. docker ps does not list it; docker ps -a does.');
    case 'start':
      if (!exists) return err('Error: No such container: api. Use docker run (or create) first.');
      if (s.status === 'running') return to({}, 'Already running — nothing changes.');
      return to({ status: 'running', exitCode: null }, 'The same container starts again with the same configuration — and the files in its writable layer are still there.');
    case 'write':
      if (s.status !== 'running') return err('Error: container api is not running. docker exec needs a running container.');
      if (s.files.includes('/tmp/note.txt')) return to({}, 'The file already exists in the writable layer.');
      return to({ files: [...s.files, '/tmp/note.txt'] }, 'The file is written to the container\'s writable layer — not to the image, and not to a volume.');
    case 'stop':
      if (s.status !== 'running') return to({}, exists ? 'The container is not running — nothing to stop.' : 'Error: No such container: api.');
      return to({ status: 'exited', exitCode: 143 }, 'SIGTERM: Spring Boot shuts down gracefully and the JVM exits with 143 (128 + 15). Docker would send SIGKILL only after 10 seconds.');
    case 'kill':
      if (s.status !== 'running') return err(exists ? 'Error: container api is not running.' : 'Error: No such container: api.');
      return to({ status: 'exited', exitCode: 137 }, 'SIGKILL: the process dies immediately, no graceful shutdown. Exit code 137 (128 + 9) — the same code an out-of-memory kill produces.');
    case 'crash':
      if (s.status !== 'running') return err('The application is not running, so it cannot crash.');
      return to({ status: 'exited', exitCode: 1 }, 'The main process exited with code 1, so the container stopped. docker logs api would show the exception. With restart: unless-stopped Docker would start it again — and again.');
    case 'restart':
      if (!exists) return err('Error: No such container: api.');
      return to({ status: 'running', exitCode: null }, 'restart = stop + start of the SAME container: same image, same environment, same writable layer. It never picks up a new image or new variables.');
    case 'rm':
      if (!exists) return err('Error: No such container: api.');
      if (s.status === 'running') return err('Error: cannot remove a running container. Stop it first or use docker rm -f.');
      return to({ status: 'none', exitCode: null, files: [] }, `Container removed${s.files.length ? ' — and its writable layer with /tmp/note.txt is gone for good' : ''}. The image is untouched; named volumes would survive.`);
    case 'rmf':
      if (!exists) return err('Error: No such container: api.');
      return to({ status: 'none', exitCode: null, files: [] }, `Force remove: killed (if running) and deleted${s.files.length ? ', including the writable layer with /tmp/note.txt' : ''}.`);
    default:
      return err(`Unknown action ${action}.`);
  }
}

/** What docker ps / docker ps -a would show for the container. */
export function psView(state) {
  const status = {
    none: null,
    created: 'Created',
    running: 'Up 5 seconds',
    exited: `Exited (${state.exitCode})`,
  }[state.status];
  return { ps: state.status === 'running' ? status : null, psAll: status };
}

// ---- Dockerfile layer cache ---------------------------------------------------------

// Each layer lists the changes that invalidate it directly ("inputs").
export const DOCKERFILES = {
  naive: {
    title: 'COPY . . first (slow)',
    build: [
      ['FROM maven:3.9-eclipse-temurin-21 AS build', ['base']],
      ['WORKDIR /workspace', []],
      ['COPY . .', ['source', 'pom', 'readme']],
      ['RUN mvn -B package -DskipTests', []],
    ],
  },
  optimized: {
    title: 'pom.xml first (fast)',
    build: [
      ['FROM maven:3.9-eclipse-temurin-21 AS build', ['base']],
      ['WORKDIR /workspace', []],
      ['COPY pom.xml .', ['pom']],
      ['RUN mvn -B dependency:go-offline', []],
      ['COPY src ./src', ['source']],
      ['RUN mvn -B package -DskipTests', []],
    ],
  },
};

export const RUNTIME_STAGE = [
  ['FROM eclipse-temurin:21-jre', ['runtime-base']],
  ['RUN useradd --system --uid 10001 spring', []],
  ['WORKDIR /app', []],
  ['COPY --from=build /workspace/target/*.jar app.jar', ['jar']],
  ['USER spring', []],
  ['ENTRYPOINT ["java", "-jar", "app.jar"]', []],
];

export const CHANGES = {
  none: 'Nothing changed (build again)',
  source: 'Edited TaskController.java',
  pom: 'Added a dependency to pom.xml',
  readme: 'Edited README.md (no .dockerignore entry)',
  'runtime-base': 'A newer eclipse-temurin:21-jre was pulled',
};

/** Which layers are rebuilt. A rebuilt layer forces every later layer of its stage. */
export function layerPlan(dockerfileId, change) {
  const file = DOCKERFILES[dockerfileId] || DOCKERFILES.optimized;
  const out = [];
  let invalid = false;
  for (const [instruction, inputs] of file.build) {
    const direct = inputs.includes(change);
    const why = direct ? `its input changed (${CHANGES[change]})` : invalid ? 'an earlier layer in this stage was rebuilt' : 'instruction and inputs unchanged';
    invalid = invalid || direct;
    out.push({ stage: 'build', instruction, rebuilt: invalid, why });
  }
  const jarChanged = invalid; // any rebuilt build-stage layer re-runs the package step
  let runtimeInvalid = false;
  for (const [instruction, inputs] of RUNTIME_STAGE) {
    const direct = inputs.includes(change) || (inputs.includes('jar') && jarChanged);
    const why = direct
      ? (inputs.includes('jar') ? 'the JAR from the build stage changed' : `its input changed (${CHANGES[change]})`)
      : runtimeInvalid ? 'an earlier layer in this stage was rebuilt' : 'unchanged';
    runtimeInvalid = runtimeInvalid || direct;
    out.push({ stage: 'runtime', instruction, rebuilt: runtimeInvalid, why });
  }
  return out;
}

// ---- Connectivity (ports, localhost, Docker DNS) -------------------------------------

// The fixed setup the explorer reasons about.
export const SETUP = {
  appPublish: { bind: '0.0.0.0', host: 9000, container: 8080 },  // -p 9000:8080
  dbPublish: { bind: '127.0.0.1', host: 15432, container: 5432 }, // -p 127.0.0.1:15432:5432
};

export const CALLERS = {
  host: 'Your shell on the host (laptop or VPS)',
  app: 'Inside the taskapi container (network appnet)',
  other: 'Inside a container on the default bridge',
  internet: 'Another computer on the internet',
};

export const TARGETS = {
  'localhost:8080': 'localhost:8080',
  'localhost:9000': 'localhost:9000',
  'localhost:5432': 'localhost:5432',
  'localhost:15432': 'localhost:15432',
  'db:5432': 'db:5432',
  'db:15432': 'db:15432',
  'taskapi:8080': 'taskapi:8080',
  'PUBLIC_IP:9000': 'PUBLIC_IP:9000',
  'PUBLIC_IP:15432': 'PUBLIC_IP:15432',
};

/**
 * Follow one connection attempt. Returns { steps: string[], result: 'ok'|'refused'|'dns'|'blocked',
 * reaches: 'Spring Boot'|'PostgreSQL'|null, summary }.
 */
export function connect(caller, target) {
  const [name, portText] = target.split(':');
  const port = Number(portText);
  const steps = [];
  const done = (result, reaches, summary) => ({ steps, result, reaches, summary });

  // 1. Where does the name point?
  let namespace;
  if (name === 'localhost') {
    namespace = caller === 'internet' ? 'remote' : caller;
    steps.push(caller === 'host'
      ? 'localhost means the host itself.'
      : caller === 'app' ? 'localhost inside a container means THAT container — here, the taskapi container itself.'
        : caller === 'other' ? 'localhost means this other container itself.'
          : 'localhost on a remote computer is that computer — not your server.');
    if (caller === 'internet') return done('refused', null, 'Your server is never "localhost" for anyone else.');
  } else if (name === 'PUBLIC_IP') {
    namespace = 'host';
    steps.push(caller === 'internet' ? 'The packet travels over the internet to the server\'s public address.' : 'The public address leads to the host\'s network interface.');
  } else {
    // A container name: resolvable only through Docker DNS on a shared user-defined network.
    if (caller === 'app') {
      steps.push(`Docker's DNS (127.0.0.11) resolves "${name}" — both containers are on appnet.`);
      namespace = name === 'db' ? 'db' : 'app';
    } else if (caller === 'other') {
      steps.push(`"${name}" cannot be resolved: the default bridge network has no name resolution and this container is not on appnet.`);
      return done('dns', null, `Name resolution fails — the application would log UnknownHostException: ${name}.`);
    } else {
      steps.push(`"${name}" is a container name. Container names resolve only inside Docker networks, not on ${caller === 'host' ? 'the host' : 'the internet'}.`);
      return done('dns', null, 'Name resolution fails.');
    }
  }

  // 2. Who listens on that port in that network namespace?
  if (namespace === 'app') {
    if (port === 8080) { steps.push('Spring Boot listens on 8080 inside the taskapi container.'); return done('ok', 'Spring Boot', 'Reaches Spring Boot (the app talking to itself).'); }
    steps.push(`Nothing listens on port ${port} inside the taskapi container${port === 5432 ? ' — PostgreSQL runs in a DIFFERENT container' : ''}.`);
    return done('refused', null, port === 5432 ? 'Connection refused — the classic "localhost:5432 refused" start-up error. Use db:5432.' : 'Connection refused.');
  }
  if (namespace === 'db') {
    if (port === 5432) { steps.push('PostgreSQL listens on 5432 inside the db container; traffic on the shared network goes straight to the container port.'); return done('ok', 'PostgreSQL', 'Reaches PostgreSQL.'); }
    steps.push(`Port ${port} is a PUBLISHED host port; it exists on the host, not inside the db container.`);
    return done('refused', null, 'Connection refused — between containers, use the container port (5432).');
  }
  if (namespace === 'other') {
    steps.push(`Nothing listens on port ${port} in this container.`);
    return done('refused', null, 'Connection refused.');
  }
  // Host namespace: only published ports forward into containers.
  const { appPublish: a, dbPublish: d } = SETUP;
  if (port === a.host) {
    steps.push(`Docker publishes ${a.bind}:${a.host} → taskapi:${a.container}.`);
    if (caller === 'internet') steps.push('0.0.0.0 means every interface — reachable from outside. Docker\'s iptables rules apply even if ufw does not allow this port.');
    return done('ok', 'Spring Boot', caller === 'internet' ? 'Reaches Spring Boot from the internet — fine for a test, risky in production (put Nginx in front and bind to 127.0.0.1).' : 'Reaches Spring Boot through the published port.');
  }
  if (port === d.host) {
    steps.push(`Docker publishes ${d.bind}:${d.host} → db:${d.container}.`);
    if (caller === 'internet') { steps.push('Bound to 127.0.0.1: only the server itself can use it.'); return done('blocked', null, 'Not reachable from outside — exactly what you want for a database.'); }
    return done('ok', 'PostgreSQL', 'Reaches PostgreSQL through the loopback-only published port (local tools such as psql or DBeaver).');
  }
  steps.push(`Nothing is published on host port ${port}${port === 8080 ? ' (the container listens on 8080, but it was published as 9000)' : ''}${port === 5432 ? ' (the database was published on 15432)' : ''}.`);
  return done(caller === 'internet' ? 'blocked' : 'refused', null, caller === 'internet' ? 'No response from outside.' : 'Connection refused on the host.');
}

// ---- Volume persistence --------------------------------------------------------------

export const STORAGE_MODES = {
  named: 'Named volume (-v pgdata:/var/lib/postgresql)',
  bind: 'Bind mount (-v /srv/pgdata:/var/lib/postgresql)',
  none: 'No volume declared',
};

export const VOLUME_ACTIONS = {
  insert: 'INSERT a task',
  recreate: 'docker rm -f db, then docker run … again',
  down: 'docker compose down, then up -d',
  downv: 'docker compose down -v, then up -d',
  volrm: 'docker compose down, delete the storage, up -d',
};

export function initialVolumeState() {
  return { stored: 0, generation: 1, orphaned: 0 };
}

/**
 * stored: rows in the storage the running container uses. Returns { state, text, lost }.
 * In "none" mode the postgres image still writes to an anonymous volume that a NEW
 * container does not reuse, so recreation shows an empty database.
 */
export function volumeStep(mode, state, action) {
  const s = { ...state };
  if (action === 'insert') {
    s.stored += 1;
    return { state: s, lost: false, text: `INSERT succeeded — the database now holds ${s.stored} row(s).` };
  }
  const recreate = (why) => {
    if (mode === 'none') {
      s.orphaned += s.stored;
      s.stored = 0;
      s.generation += 1;
      return { state: s, lost: true, text: `${why} The new container started with an EMPTY data directory: without a declared volume, the old data stayed in an anonymous volume nobody reuses. The app now sees 0 rows.` };
    }
    s.generation += 1;
    return { state: s, lost: false, text: `${why} The new container mounted the same ${mode === 'named' ? 'named volume' : 'host folder'}: all ${s.stored} row(s) are still there.` };
  };
  if (action === 'recreate') return recreate('The container was deleted and a new one created.');
  if (action === 'down') return recreate('down removed the containers and the network; named volumes are kept.');
  if (action === 'downv') {
    if (mode === 'named') {
      s.stored = 0; s.generation += 1;
      return { state: s, lost: true, text: 'down -v removed the named volume declared in compose.yaml — the data is DELETED. PostgreSQL initialised an empty database.' };
    }
    if (mode === 'bind') return recreate('down -v removes named and anonymous volumes, but a bind mount is a host folder — it is not removed.');
    s.orphaned = 0;
    return recreate('down -v also removed the anonymous volume.');
  }
  if (action === 'volrm') {
    s.stored = 0; s.orphaned = 0; s.generation += 1;
    return { state: s, lost: true, text: mode === 'bind' ? 'The host folder was deleted: the data is gone.' : 'The volume was deleted (docker volume rm): the data is gone. Only a backup could bring it back.' };
  }
  return { state: s, lost: false, text: 'Unknown action.' };
}

// ---- Configuration checker -------------------------------------------------------------

const SECRET_KEY = /(password|passwd|secret|api[_-]?key|token|private[_-]?key)/i;

/**
 * Lint a compose.yaml / .env / application.yml snippet line by line.
 * Returns [{ line, severity: 'error'|'warning'|'info', message }].
 */
export function checkConfig(text) {
  const lines = String(text).split(/\r?\n/);
  const findings = [];
  const add = (line, severity, message) => findings.push({ line, severity, message });
  const all = lines.join('\n');
  lines.forEach((raw, i) => {
    const n = i + 1;
    const line = raw.replace(/\s+#.*$/, '');
    if (/^\s*#/.test(raw) || !line.trim()) return;
    if (/jdbc:postgresql:\/\/(localhost|127\.0\.0\.1)[:/]/i.test(line)) {
      add(n, 'warning', 'JDBC URL points to localhost. Inside a container that is the container itself — use the database service name (db:5432) when PostgreSQL runs in another container.');
    }
    const kv = /^(\s*-?\s*)["']?([A-Za-z0-9_.-]+)["']?\s*([:=])\s*(.*)$/.exec(line);
    if (kv) {
      const [, prefix, key, separator, rawValue] = kv;
      const value = rawValue.trim().replace(/^["']|["']$/g, '');
      // KEY=value at the start of a line is a .env file: the one place a secret value belongs.
      const envFile = separator === '=' && prefix === '';
      if (SECRET_KEY.test(key) && value) {
        if (/\$\{[^}]*:-[^}]+\}|\$\{[A-Za-z0-9_.]+:[^?}-][^}]*\}/.test(value)) {
          add(n, 'error', `${key} has a default value inside \${…}: the default is committed with the file. Remove the default so a missing variable fails fast.`);
        } else if (envFile) {
          add(n, 'info', `${key} holds a secret value: correct only in a git-ignored .env file with chmod 600 — never in a committed file.`);
        } else if (!/^\$\{.+\}$/.test(value) && !/^change-?me$/i.test(value)) {
          add(n, 'error', `${key} is a hard-coded secret. Read it from the environment (\${…}) and keep the value in a git-ignored .env or GitHub Secrets.`);
        }
      }
      if (/^ddl-auto$/.test(key) && /^(update|create|create-drop)$/.test(value)) {
        add(n, 'warning', `ddl-auto: ${value} lets Hibernate change production tables. Use Flyway migrations with ddl-auto: validate.`);
      }
      if (key === 'include' && /^\*$/.test(value)) add(n, 'error', 'All Actuator endpoints exposed (env, heapdump, …). Expose only health,info.');
      if (key === 'image' && (/:latest$/.test(value) || (!/[:@]/.test(value.split('/').pop()) && !/\$\{/.test(value)))) {
        add(n, 'warning', `Image "${value}" has no fixed tag (or uses latest). Pin a version or a commit SHA for reproducible deployments.`);
      }
      if (key === 'version' && /^["']?\d/.test(rawValue.trim()) && /^version/.test(raw)) {
        add(n, 'info', 'The top-level version key is obsolete; modern Compose ignores it.');
      }
    }
    const port = /^\s*-\s*["']?(?:(\d+\.\d+\.\d+\.\d+):)?(\d+):(\d+)["']?\s*$/.exec(line);
    if (port) {
      const [, bind, , containerPort] = port;
      if (containerPort === '5432' && bind !== '127.0.0.1') add(n, 'error', 'The database port is published on every interface. The app reaches PostgreSQL over the Docker network; remove this mapping (or bind it to 127.0.0.1 for local tools).');
      else if (!bind && containerPort !== '5432') add(n, 'warning', `Port ${containerPort} is published on all interfaces — on a server it bypasses ufw. Bind it to 127.0.0.1 and put Nginx in front.`);
    }
    if (/^\s*depends_on:\s*\[/.test(line)) add(n, 'info', 'Short-form depends_on only orders start-up. Use condition: service_healthy with a database health check.');
  });
  if (/SPRING_DATASOURCE_URL/.test(all) && !/SPRING_PROFILES_ACTIVE/.test(all)) {
    add(0, 'warning', 'The datasource is configured but SPRING_PROFILES_ACTIVE is not set — production may run with development settings.');
  }
  if (/image:\s*postgres/.test(all) && !/\/var\/lib\/postgresql/.test(all)) {
    add(0, 'error', 'PostgreSQL has no volume for its data directory: removing the container loses the data.');
  }
  return findings.sort((a, b) => a.line - b.line);
}

// ---- Deployment checklist ------------------------------------------------------------

export const CHECKLIST_GROUPS = [
  ['Code and configuration', [
    ['git-ready', 'Git repository ready'], ['tests-passing', 'Tests passing'], ['prod-profile', 'Production profile configured'],
    ['secrets-removed', 'Secrets removed from source']]],
  ['Containers', [
    ['dockerfile', 'Dockerfile created'], ['image-builds', 'Image builds'], ['container-runs', 'Container runs'],
    ['postgres-container', 'PostgreSQL container works'], ['volume', 'Volume configured'], ['network', 'Docker network works'],
    ['compose', 'Compose works']]],
  ['Server', [
    ['vps', 'VPS created'], ['ssh', 'SSH configured'], ['firewall', 'Firewall configured'], ['docker-installed', 'Docker installed'],
    ['app-deployed', 'Application deployed'], ['postgres-persistent', 'PostgreSQL persistent']]],
  ['Edge', [['nginx', 'Nginx configured'], ['domain', 'Domain configured'], ['https', 'HTTPS enabled']]],
  ['Automation', [['github-actions', 'GitHub Actions configured'], ['registry', 'Container registry configured'], ['cd', 'CD deployment works']]],
  ['Operations', [['health', 'Health check works'], ['logs', 'Logs verified'], ['backups', 'Backup strategy confirmed']]],
];
