// CI/CD pipeline: follow one change from git push to production, stage by stage,
// in a scenario of your choice — a clean release, a failing test, a pull request,
// a registry permission error, a release that never becomes healthy (automatic
// rollback) or a broken public endpoint.
//
//   scenario → list of stages [node, outcome, explanation] → frames
//
// The stages and the failure messages follow the Task API pipeline of the CI/CD
// lessons (.github/workflows/pipeline.yml and deploy.sh). A StudyHub simulation:
// no workflow runs.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select, statsView } from './system-design-common.js';

const NODES = [
  ['push', 'git push'],
  ['test', 'test job'],
  ['publish', 'publish image'],
  ['deploy', 'SSH deploy'],
  ['up', 'pull + up -d'],
  ['health', 'readiness'],
  ['public', 'public HTTPS'],
  ['live', 'Live'],
];

const SCENARIOS = {
  success: 'Merge to main — clean release',
  'test-fails': 'A test fails',
  pr: 'Pull request (not main)',
  'registry-denied': 'Push to GHCR denied',
  unhealthy: 'New version never becomes ready',
  'public-fails': 'Server healthy, public HTTPS broken',
};

function stages(scenario) {
  const list = [['push', 'ok', scenario === 'pr'
    ? 'A pull request is opened: the workflow runs for the pull_request event.'
    : 'Commit 4f2c1a9 is merged into main: the push event starts the CI/CD workflow.']];
  if (scenario === 'test-fails') {
    list.push(['test', 'fail', 'test: checkout → JDK 21 → ./mvnw -B verify against the PostgreSQL service container. A test fails, so the step exits non-zero; the failure() step uploads the Surefire reports. publish and deploy depend on test and are skipped — nothing reaches the server.']);
    return list;
  }
  list.push(['test', 'ok', 'test: ./mvnw -B verify passes (Tests run: 3, Failures: 0) and docker build proves the Dockerfile still builds.']);
  if (scenario === 'pr') {
    list.push(['publish', 'skip', 'publish has if: github.event_name == \'push\' && github.ref == \'refs/heads/main\' — skipped for pull requests. The PR gets a green check; merging it will release.']);
    return list;
  }
  if (scenario === 'registry-denied') {
    list.push(['publish', 'fail', 'publish: the push to ghcr.io is denied — the job lacks permissions: packages: write. deploy needs publish, so it is skipped; production keeps the previous version.']);
    return list;
  }
  list.push(['publish', 'ok', 'publish: logs in with GITHUB_TOKEN and pushes ghcr.io/you/taskapi:4f2c1a9 and :latest.']);
  list.push(['deploy', 'ok', 'deploy (environment production): writes the deploy key and verified known_hosts, then ssh deploy@VPS "/opt/taskapi/deploy.sh 4f2c1a9".']);
  list.push(['up', 'ok', 'deploy.sh remembers the previous APP_IMAGE, sets the new one in .env, runs docker compose pull app and docker compose up -d app.']);
  if (scenario === 'unhealthy') {
    list.push(['health', 'fail', 'Readiness never returns UP within 24 checks × 5 s (for example a migration error). deploy.sh restores the previous APP_IMAGE, runs up -d app again and exits 1 — the job is red, users keep the previous version.']);
    return list;
  }
  list.push(['health', 'ok', 'curl -fsS http://127.0.0.1:8080/actuator/health/readiness answers UP: "Healthy after 9 check(s)".']);
  if (scenario === 'public-fails') {
    list.push(['public', 'fail', 'The public check (curl https://api.example.com/actuator/health) fails although the server-side check passed: look between the internet and the app — Nginx, certificate, DNS, firewall.']);
    return list;
  }
  list.push(['public', 'ok', 'curl -fsS https://api.example.com/actuator/health succeeds through DNS, Nginx and TLS.']);
  list.push(['live', 'ok', 'Live: /api/info now reports ghcr.io/you/taskapi:4f2c1a9. Total time is a few minutes, without a single manual step.']);
  return list;
}

export function mount(root, { options }) {
  const scenario = select(SCENARIOS, options.scenario || 'success');
  root.append(el('div', { class: 'viz-form' }, field('Scenario', scenario)));
  root.append(el('p', { class: 'viz-note' }, 'StudyHub simulation of the pipeline in the CI/CD lessons — no workflow runs.'));
  const lane = el('ol', { class: 'flow-lane' }, NODES.map(([id, label]) => el('li', { class: 'flow-node', 'data-node': id }, el('span', {}, label))));
  const status = el('p', { class: 'flow-status' });
  const stats = statsView('Pipeline');
  root.append(el('div', { class: 'viz-stage' }, lane, status, stats.node));
  const stepper = createStepper(root, { render, playDelay: 1800, nextLabel: 'Next stage' });

  function render(frame) {
    for (const li of lane.children) {
      const id = li.dataset.node;
      const outcome = frame.outcomes[id];
      li.className = ['flow-node', outcome ? 'is-visited' : '', id === frame.node ? 'is-current' : '', outcome === 'fail' ? 'is-error' : ''].join(' ');
      li.toggleAttribute('aria-current', id === frame.node);
      li.title = outcome ? { ok: 'passed', fail: 'failed', skip: 'skipped' }[outcome] : 'not reached';
    }
    status.textContent = frame.final ? frame.finalText : frame.node ? `Stage: ${NODES.find(([id]) => id === frame.node)[1]} — ${{ ok: 'passed', fail: 'FAILED', skip: 'skipped' }[frame.outcomes[frame.node]]}` : 'Waiting for a change…';
    status.className = `flow-status ${frame.final ? (frame.success ? 'is-ok' : 'is-error') : ''}`;
    const values = Object.values(frame.outcomes);
    stats.render([['Passed', values.filter((v) => v === 'ok').length], ['Failed', values.filter((v) => v === 'fail').length], ['Skipped', values.filter((v) => v === 'skip').length]]);
  }

  function start() {
    const list = stages(scenario.value);
    const first = { node: null, outcomes: {}, final: false, text: `${SCENARIOS[scenario.value]}. Press "Next stage".` };
    let outcomes = {};
    const frames = list.map(([node, outcome, text], i) => {
      outcomes = { ...outcomes, [node]: outcome };
      const last = i === list.length - 1;
      const success = outcomes.live === 'ok';
      const finalText = success ? 'Released to production.' : outcome === 'skip' ? 'Checked, not released (as designed).' : 'Stopped before or rolled back from production.';
      return { node, outcomes, final: last, success, finalText, text };
    });
    stepper.load(first, frames);
  }

  scenario.addEventListener('change', start);
  start();
  return stepper;
}
