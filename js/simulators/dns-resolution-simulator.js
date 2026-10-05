// DNS resolution, query by query.
//
//   name + cache state → stub → recursive resolver → root → TLD → authoritative,
//   each referral and answer explained, the resolver's cache filling with TTLs.
//
// Zone data is invented for the example (documentation addresses); the query
// flow, referrals, CNAME chasing, caching and NXDOMAIN follow real DNS.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select, sequenceView, tableView } from './network-common.js';

const NAMES = {
  'www.example.com': 'www.example.com (CNAME to a CDN, then A)',
  'api.example.com': 'api.example.com (A record)',
  'shopp.example.com': 'shopp.example.com (typo — does not exist)',
};
const CACHES = {
  cold: 'Cold: every cache empty',
  tld: 'Resolver already knows the .com servers',
  answer: 'Resolver already has the answer',
  browser: 'Browser cache already has the answer',
};

export function mount(root, { options }) {
  const name = select(NAMES, options.name || 'api.example.com');
  const cache = select(CACHES, options.cache || 'cold');
  root.append(el('div', { class: 'viz-form' }, field('Name typed', name), field('Cache state', cache)));

  const seq = sequenceView([
    { id: 'stub', label: 'Browser + OS (stub)' },
    { id: 'res', label: 'Recursive resolver' },
    { id: 'root', label: 'Root server' },
    { id: 'tld', label: '.com TLD server' },
    { id: 'auth', label: 'example.com authoritative' },
  ]);
  const cacheTable = tableView('Resolver cache', ['Name', 'Type', 'Value', 'TTL']);
  root.append(el('div', { class: 'viz-stage net-two-col' }, seq.node, cacheTable.node));
  const stepper = createStepper(root, { render, playDelay: 2000, nextLabel: 'Next query' });

  function render(frame) {
    seq.render(frame);
    cacheTable.render(frame.cache, { highlight: frame.cacheNew || [], empty: '(empty)' });
  }

  function start() {
    const frames = build(name.value, cache.value);
    stepper.load(frames[0], frames.slice(1));
  }

  name.addEventListener('change', start);
  cache.addEventListener('change', start);
  start();
  return stepper;
}

function build(name, cacheState) {
  const exists = name !== 'shopp.example.com';
  const cname = name === 'www.example.com';
  const answer = name === 'api.example.com' ? '203.0.113.10' : '198.51.100.80';
  const frames = [];
  let log = [];
  let cache = [];
  if (cacheState === 'tld' || cacheState === 'answer') cache = [['com.', 'NS', 'a.gtld-servers.net. …', '172800']];
  if (cacheState === 'answer' && exists) {
    cache = [...cache, ...(cname ? [[name, 'CNAME', 'example.cdn-net.net.', '3600']] : []), [cname ? 'example.cdn-net.net.' : name, 'A', answer, '217 (counting down)']];
  }
  let queries = 0;
  const states = (o = {}) => ({ stub: '', res: '', root: '', tld: '', auth: '', ...o });
  const push = (text, o = {}) => frames.push({ log, cache, states: states(o.states), text, active: o.active, cacheNew: o.cacheNew });

  push(`The user types ${name}. Before any network traffic, the browser checks its own DNS cache, then the OS cache and the hosts file.`, { active: ['stub'] });

  if (cacheState === 'browser' && exists) {
    push(`Browser cache hit: ${name} → ${answer} (cached earlier, TTL not yet expired). Zero DNS packets — the browser goes straight to TCP. This is why the second visit to a site starts faster.`,
      { states: { stub: `${answer} (cached)` }, active: ['stub'] });
    return frames;
  }

  log = [...log, { from: 'stub', to: 'res', label: `A? ${name}  (recursive: "give me the final answer")`, note: 'UDP to port 53 of the resolver from DHCP' }];
  push('Cache miss on the device. The stub resolver sends ONE recursive query to its configured resolver (often the home router, the ISP or 1.1.1.1). From now on the resolver does all the work.',
    { states: { stub: 'waiting', res: 'working' }, active: ['stub', 'res'] });

  if (cacheState === 'answer' && exists) {
    log = [...log, { from: 'res', to: 'stub', label: `${cname ? 'CNAME + ' : ''}A ${answer}  TTL 217`, note: 'non-authoritative (from cache)' }];
    push(`Resolver cache hit — another user asked recently. It answers immediately with the REMAINING TTL (217 s left of the original). nslookup would print "Non-authoritative answer". No root, TLD or authoritative server is contacted.`,
      { states: { stub: answer, res: 'answered from cache' }, active: ['stub', 'res'], cacheNew: [cache.length - 1] });
    return frames;
  }

  const hasTld = cacheState === 'tld' || cacheState === 'answer';
  if (!hasTld) {
    queries += 1;
    log = [...log, { from: 'res', to: 'root', label: `A? ${name}` }];
    push('The resolver knows nothing about .com yet, so it starts at the top: it asks a root server (it has the root server addresses built in — the "root hints").',
      { states: { stub: 'waiting', res: `query ${queries}`, root: 'asked' }, active: ['res', 'root'] });
    log = [...log, { from: 'root', to: 'res', label: 'Referral: com. NS a.gtld-servers.net … (+ glue A records)', note: 'iterative: "ask them"' }];
    cache = [...cache, ['com.', 'NS', 'a.gtld-servers.net. …', '172800']];
    push('The root server does not know the answer. It replies with a REFERRAL to the .com TLD servers (an iterative answer). The resolver caches this for 2 days — so later lookups of any .com name skip the root.',
      { states: { stub: 'waiting', res: 'got referral', root: 'referred to .com' }, active: ['res', 'root'], cacheNew: [cache.length - 1] });
  } else {
    push('The resolver already has the .com NS records cached (from an earlier lookup), so it skips the root servers entirely.',
      { states: { stub: 'waiting', res: 'uses cached .com NS' }, active: ['res'], cacheNew: [0] });
  }

  queries += 1;
  log = [...log, { from: 'res', to: 'tld', label: `A? ${name}` }];
  push('The resolver asks a .com TLD server the same question.', { states: { stub: 'waiting', res: `query ${queries}`, tld: 'asked' }, active: ['res', 'tld'] });
  log = [...log, { from: 'tld', to: 'res', label: 'Referral: example.com NS ns1.dnsprovider.net, ns2…', note: 'the delegation registered for the domain' }];
  cache = [...cache, ['example.com.', 'NS', 'ns1.dnsprovider.net. …', '172800']];
  push('The TLD server does not hold example.com\'s records either; it refers the resolver to example.com\'s AUTHORITATIVE name servers (the NS records the domain owner registered).',
    { states: { stub: 'waiting', res: 'got referral', tld: 'referred to example.com' }, active: ['res', 'tld'], cacheNew: [cache.length - 1] });

  queries += 1;
  log = [...log, { from: 'res', to: 'auth', label: `A? ${name}` }];
  push('The resolver asks one of example.com\'s authoritative servers.', { states: { stub: 'waiting', res: `query ${queries}`, auth: 'asked' }, active: ['res', 'auth'] });

  if (!exists) {
    log = [...log, { from: 'auth', to: 'res', label: `NXDOMAIN — ${name} does not exist`, note: 'with the zone SOA (negative-cache TTL)' }];
    cache = [...cache, [name, '—', 'NXDOMAIN (negative cache)', '300']];
    push('The authoritative server answers definitively: NXDOMAIN, the name does not exist. Even this negative answer is cached (for the SOA\'s negative TTL) — creating the name now would not be visible to this resolver for a few minutes.',
      { states: { stub: 'waiting', res: 'got NXDOMAIN', auth: 'NXDOMAIN' }, active: ['res', 'auth'], cacheNew: [cache.length - 1] });
    log = [...log, { from: 'res', to: 'stub', label: 'NXDOMAIN' }];
    push('The resolver passes NXDOMAIN to the client. The browser shows "server IP address could not be found"; nslookup says "Non-existent domain". Check the spelling — this is a name problem, not a network problem.',
      { states: { stub: 'NXDOMAIN', res: 'done' }, active: ['stub', 'res'] });
    return frames;
  }

  if (cname) {
    log = [...log, { from: 'auth', to: 'res', label: `${name} CNAME example.cdn-net.net.  TTL 3600`, note: 'an alias, not an address' }];
    cache = [...cache, [name, 'CNAME', 'example.cdn-net.net.', '3600']];
    push('The authoritative server answers with a CNAME: www.example.com is an alias for a CDN host name. The resolver must now resolve THAT name — CNAME chains cost extra lookups.',
      { states: { stub: 'waiting', res: 'follows CNAME', auth: 'CNAME' }, active: ['res', 'auth'], cacheNew: [cache.length - 1] });
    queries += 1;
    log = [...log, { from: 'res', to: 'auth', label: 'A? example.cdn-net.net', note: '(the CDN\'s own authoritative servers, after their own referral chain)' }];
    push('The resolver resolves the CDN name the same way (for brevity, its own root/TLD referrals are folded into this step). The CDN\'s DNS picks an edge server near the resolver.',
      { states: { stub: 'waiting', res: `query ${queries}` }, active: ['res'] });
    log = [...log, { from: 'auth', to: 'res', label: `example.cdn-net.net A ${answer}  TTL 60`, note: 'short TTL: the CDN can steer traffic quickly' }];
    cache = [...cache, ['example.cdn-net.net.', 'A', answer, '60']];
    push(`The final A record arrives with a short TTL (60 s), so the CDN can move users between edges quickly.`,
      { states: { stub: 'waiting', res: 'has the answer' }, active: ['res'], cacheNew: [cache.length - 1] });
  } else {
    log = [...log, { from: 'auth', to: 'res', label: `${name} A ${answer}  TTL 300`, note: 'authoritative answer (aa flag)' }];
    cache = [...cache, [name, 'A', answer, '300']];
    push(`The authoritative server returns the answer: A ${answer} with TTL 300 s. The resolver caches it — the next client asking within 5 minutes gets it instantly.`,
      { states: { stub: 'waiting', res: 'has the answer', auth: 'answered' }, active: ['res', 'auth'], cacheNew: [cache.length - 1] });
  }

  log = [...log, { from: 'res', to: 'stub', label: `${cname ? 'CNAME + ' : ''}A ${answer}` }];
  push(`The resolver returns the final answer to the client (${queries} iterative queries on its side, 1 recursive query from the client). The OS and browser cache it too. Next: the browser opens a TCP connection to ${answer}:443.`,
    { states: { stub: answer, res: 'done' }, active: ['stub', 'res'] });
  return frames;
}
