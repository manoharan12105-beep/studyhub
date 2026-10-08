// Configuration checker: paste (or pick) a compose.yaml, .env or application.yml
// fragment and step through what a reviewer would flag — hard-coded secrets,
// localhost in a container's JDBC URL, a published database port, missing
// profile, ddl-auto update, all Actuator endpoints, unpinned images.
//
//   text → checkConfig() (devops-common.js) → one frame per finding
//
// Runs entirely in the browser on the text in the box; nothing is sent anywhere.
// A teaching aid, not a complete linter: it knows the rules of these lessons.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select, statsView } from '../simulators/system-design-common.js';
import { checkConfig } from '../simulators/devops-common.js';

const PRESETS = {
  bad: {
    label: 'compose.yaml — first attempt',
    text: `version: "3"
services:
  db:
    image: postgres:latest
    environment:
      POSTGRES_PASSWORD: 123456
    ports:
      - "5432:5432"
  app:
    image: taskapi
    depends_on: [db]
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/taskdb
      SPRING_DATASOURCE_PASSWORD: \${DB_PASSWORD:-123456}
    ports:
      - "8080:8080"`,
  },
  good: {
    label: 'compose.yaml — reviewed',
    text: `services:
  db:
    image: postgres:18
    environment:
      POSTGRES_PASSWORD: \${DB_PASSWORD:?Set DB_PASSWORD in .env}
    volumes:
      - pgdata:/var/lib/postgresql
  app:
    image: \${APP_IMAGE:-taskapi:local}
    depends_on:
      db:
        condition: service_healthy
    environment:
      SPRING_PROFILES_ACTIVE: prod
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/taskdb
      SPRING_DATASOURCE_PASSWORD: \${DB_PASSWORD:?Set DB_PASSWORD in .env}
    ports:
      - "127.0.0.1:8080:8080"
volumes:
  pgdata:`,
  },
  props: {
    label: 'application-prod.yml — first attempt',
    text: `spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/taskdb
    password: admin123
  jpa:
    hibernate:
      ddl-auto: update
app:
  jwt:
    secret: mysecretkey
management:
  endpoints:
    web:
      exposure:
        include: "*"`,
  },
  env: {
    label: '.env on the server',
    text: `IMAGE_REPO=ghcr.io/your-user/taskapi
APP_IMAGE=ghcr.io/your-user/taskapi:4f2c1a9
DB_PASSWORD=Xq3v9LkP2mZt7Rw1Yb6Nc8Hd`,
  },
};

const SEVERITY = { error: 'Error', warning: 'Warning', info: 'Note' };

export function mount(root, { options }) {
  const preset = select(Object.fromEntries(Object.entries(PRESETS).map(([k, v]) => [k, v.label])), options.preset || 'bad');
  const helpId = `config-help-${Math.random().toString(36).slice(2, 8)}`;
  const area = el('textarea', { class: 'input config-input', rows: 14, spellcheck: 'false', 'aria-describedby': helpId });
  const run = el('button', { type: 'button', class: 'btn btn-primary' }, 'Check');
  root.append(el('div', { class: 'viz-form' }, field('Example', preset), run));
  root.append(field('Configuration (edit it — nothing leaves your browser)', area));
  root.append(el('p', { class: 'viz-note', id: helpId }, 'Checked in the browser against the rules of these lessons; it is not a complete linter.'));

  const list = el('ol', { class: 'check-findings', 'aria-label': 'Findings' });
  const stats = statsView('Findings');
  root.append(el('div', { class: 'viz-stage' }, list, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1800, nextLabel: 'Next finding' });

  let findings = [];
  function render(frame) {
    list.replaceChildren(...findings.slice(0, frame.shown).map((f) => el('li', { class: `check-finding is-${f.severity}` },
      el('strong', {}, `${SEVERITY[f.severity]}${f.line ? ` · line ${f.line}` : ' · whole file'}: `), f.message)));
    stats.render([
      ['Errors', findings.filter((f) => f.severity === 'error').length],
      ['Warnings', findings.filter((f) => f.severity === 'warning').length],
      ['Notes', findings.filter((f) => f.severity === 'info').length],
    ]);
  }

  function check() {
    findings = checkConfig(area.value);
    const first = { shown: 0, text: findings.length ? `${findings.length} finding(s). Press "Next finding" to review them one by one.` : 'No findings for the rules this checker knows. Review it yourself too!' };
    const frames = findings.map((f, i) => ({ shown: i + 1, text: `${SEVERITY[f.severity]}${f.line ? ` (line ${f.line})` : ''}: ${f.message}` }));
    stepper.load(first, frames);
  }

  function loadPreset() {
    area.value = PRESETS[preset.value].text;
    check();
  }

  preset.addEventListener('change', loadPreset);
  run.addEventListener('click', check);
  loadPreset();
  return stepper;
}
