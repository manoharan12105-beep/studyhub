// Longest prefix match, route by route.
//
//   destination IP + routing table → each route tested (first n bits equal?) →
//   the longest matching prefix wins → the forwarding decision (next hop, TTL).
//
// Two tables: a branch-office router and a laptop with a full-tunnel VPN
// (two /1 routes that beat the default route without replacing it).

import { el } from '../util.js';
import { createStepper, field, errorLine } from '../engagement/stepper.js';
import { select } from '../simulators/network-common.js';

const TABLES = {
  branch: {
    label: 'Branch-office router',
    routes: [
      ['0.0.0.0/0', '203.0.113.1', 'wan0', 'static (default)'],
      ['10.0.0.0/8', '10.255.0.1', 'vpn0', 'static'],
      ['10.20.0.0/16', '10.255.0.2', 'vpn0', 'OSPF'],
      ['10.20.5.0/24', 'directly connected', 'eth1', 'connected'],
      ['10.20.5.128/25', '10.20.5.254', 'eth1', 'static'],
      ['192.168.1.0/24', 'directly connected', 'eth0', 'connected'],
    ],
  },
  vpn: {
    label: 'Laptop with a full-tunnel VPN',
    routes: [
      ['0.0.0.0/0', '192.168.1.1', 'wlan0', 'home router (default)'],
      ['0.0.0.0/1', '10.8.0.1', 'tun0', 'VPN'],
      ['128.0.0.0/1', '10.8.0.1', 'tun0', 'VPN'],
      ['198.51.100.50/32', '192.168.1.1', 'wlan0', 'VPN server itself'],
      ['192.168.1.0/24', 'directly connected', 'wlan0', 'connected'],
    ],
  },
};

export function mount(root, { options }) {
  const table = select(Object.fromEntries(Object.entries(TABLES).map(([k, v]) => [k, v.label])), options.table || 'branch');
  const dest = el('input', { class: 'input', value: options.destination || '10.20.5.200', inputmode: 'decimal', spellcheck: 'false', autocomplete: 'off' });
  const go = el('button', { type: 'button', class: 'btn btn-secondary' }, 'Look up');
  const error = errorLine();
  root.append(el('div', { class: 'viz-form' }, field('Routing table', table), field('Destination IP', dest, 'Try 10.20.5.200, 10.20.9.9, 10.99.1.1, 8.8.8.8'), go), error.node);

  const view = el('table', { class: 'viz-table' });
  const decision = el('p', { class: 'flow-status' });
  root.append(el('div', { class: 'viz-stage' },
    el('div', { class: 'table-wrap', tabindex: 0, role: 'region', 'aria-label': 'Routing table' }, view), decision));
  const stepper = createStepper(root, { render, playDelay: 1500, nextLabel: 'Next route' });

  function start() {
    const parts = dest.value.trim().split('.');
    if (parts.length !== 4 || parts.some((p) => !/^\d{1,3}$/.test(p) || Number(p) > 255)) {
      error.show('Enter an IPv4 address like 10.20.5.200.');
      return;
    }
    error.clear();
    const routes = TABLES[table.value].routes;
    const frames = build(routes, parts.map(Number));
    stepper.load(frames[0], frames.slice(1));
  }

  function render(frame) {
    const routes = TABLES[table.value].routes;
    view.replaceChildren(
      el('thead', {}, el('tr', {}, ['Prefix', 'Next hop', 'Interface', 'Source', 'Match?'].map((h) => el('th', { scope: 'col' }, h)))),
      el('tbody', {}, routes.map((r, i) => {
        const state = frame.results[i];
        const cls = i === frame.best && frame.done ? 'is-matched is-current'
          : i === frame.checking ? 'is-current'
            : state === true ? 'is-matched' : state === false ? 'is-unmatched' : '';
        return el('tr', { class: cls }, r.map((c) => el('td', {}, c)),
          el('td', {}, state === undefined ? '…' : state ? `yes (/${r[0].split('/')[1]})` : 'no'));
      })));
    decision.textContent = frame.decision;
    decision.className = `flow-status ${frame.done ? 'is-ok' : ''}`;
  }

  go.addEventListener('click', start);
  dest.addEventListener('keydown', (e) => { if (e.key === 'Enter') start(); });
  table.addEventListener('change', start);
  start();
  return stepper;
}

const num = (o) => ((o[0] * 256 + o[1]) * 256 + o[2]) * 256 + o[3];

function matches(prefix, destNum) {
  const [ip, len] = prefix.split('/');
  const n = Number(len);
  if (n === 0) return true;
  const size = 2 ** (32 - n);
  return Math.floor(num(ip.split('.').map(Number)) / size) === Math.floor(destNum / size);
}

function build(routes, dest) {
  const d = num(dest);
  const ip = dest.join('.');
  const frames = [{ results: {}, checking: null, best: null, done: false, decision: `Packet for ${ip} arrives. Which route?`,
    text: `A packet for ${ip} arrives. The router compares the destination with EVERY route: a route P/n matches when the first n bits are equal. Then the longest matching prefix wins.` }];
  const results = {};
  let best = null;
  routes.forEach((r, i) => {
    const ok = matches(r[0], d);
    results[i] = ok;
    const len = Number(r[0].split('/')[1]);
    if (ok && (best === null || len > Number(routes[best][0].split('/')[1]))) best = i;
    frames.push({
      results: { ...results }, checking: i, best, done: false,
      decision: best === null ? 'No match yet.' : `Best so far: ${routes[best][0]}`,
      text: len === 0
        ? `${r[0]} has length 0: it matches EVERY destination — which is why it is the default route, used only when nothing longer matches.`
        : ok
          ? `${r[0]}: the first ${len} bits of ${ip} equal this prefix — match (length ${len}).${best === i ? ' It is the longest match so far.' : ` But ${routes[best][0]} is longer.`}`
          : `${r[0]}: the first ${len} bits differ — no match.`,
    });
  });
  const winner = routes[best];
  frames.push({
    results, checking: null, best, done: true,
    decision: `Forward via ${winner[1]} on ${winner[2]} (route ${winner[0]})`,
    text: `Longest prefix wins: ${winner[0]}. ${winner[1] === 'directly connected' ? `The destination is on a directly connected network, so the router ARPs for ${ip} itself on ${winner[2]}.` : `The router decrements TTL, ARPs for the next hop ${winner[1]} (if needed) and sends a new frame out of ${winner[2]}.`} Metrics and administrative distance never overrule a longer prefix — they only break ties for the same prefix.`,
  });
  return frames;
}
