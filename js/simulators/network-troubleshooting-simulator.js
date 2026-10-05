// Guided network troubleshooting: choose the next command.
//
//   scenario → stage → you choose a command →
//     right choice: its output + what it proves → next stage
//     wrong choice: why it does not help → same stage
//   "Show next command" plays the expert's choice, so Next/Play walk the ideal path.
//
// Reuses the state machine of the Linux troubleshooting simulator (advance);
// only the scenarios differ. The machines and addresses are invented; output
// formats follow what Windows and Linux tools print.

import { el, escapeHtml } from '../util.js';
import { highlight } from '../highlight.js';
import { createStepper } from '../engagement/stepper.js';
import { advance } from './linux-troubleshooting-simulator.js';

const SCENARIOS = {
  'no-internet': {
    title: 'Laptop: "the internet is not working"',
    intro: 'A user\'s Windows laptop on the office Wi-Fi cannot open any website. Colleagues on the same Wi-Fi are fine. What do you check first?',
    stages: [
      [
        { cmd: 'ipconfig /all', ok: true, out: `Wireless LAN adapter Wi-Fi:
   Connection-specific DNS Suffix  . :
   IPv4 Address. . . . . . . . . . . : 192.168.10.57(Preferred)
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.10.254
   DHCP Enabled. . . . . . . . . . . : No
   DNS Servers . . . . . . . . . . . : 192.168.10.1`, why: 'Start with the configuration. The address is valid (not 169.254.x.x) — but DHCP is disabled (static settings) and the gateway is .254, while colleagues use DHCP. Suspicious; test it.' },
        { cmd: 'restart the laptop', why: 'A restart may hide the symptom but teaches nothing, and static settings would survive it anyway. Look first.' },
        { cmd: 'nslookup google.com', why: 'DNS is a later layer. First confirm the device has a sane IP configuration and can reach its gateway.' },
      ],
      [
        { cmd: 'ping 192.168.10.254', ok: true, out: `Pinging 192.168.10.254 with 32 bytes of data:
Reply from 192.168.10.57: Destination host unreachable.
Reply from 192.168.10.57: Destination host unreachable.

Ping statistics for 192.168.10.254:
    Packets: Sent = 2, Received = 2, Lost = 0 (0% loss),`, why: 'The configured gateway does not answer. Note the reply comes from the laptop ITSELF: its ARP request for .254 got no answer, so nothing on the LAN has that address. (Windows counts these as "received" — read the text, not the loss line.)' },
        { cmd: 'tracert 8.8.8.8', why: 'Traceroute needs the first hop (the gateway) to work. Test the gateway directly first.' },
        { cmd: 'ping 192.168.10.20  (a colleague\'s PC)', info: true, out: `Reply from 192.168.10.20: bytes=32 time=3ms TTL=128
Reply from 192.168.10.20: bytes=32 time=4ms TTL=128`, why: 'Useful: local traffic works, so Wi-Fi, the IP and the mask are fine. Local delivery never uses the gateway — the remaining suspect is exactly the gateway.' },
      ],
      [
        { cmd: 'arp -a', ok: true, out: `Interface: 192.168.10.57 --- 0x12
  Internet Address      Physical Address      Type
  192.168.10.1          a4-91-b1-00-00-01     dynamic
  192.168.10.20         3c-22-fb-9a-10-4e     dynamic
  192.168.10.255        ff-ff-ff-ff-ff-ff     static`, why: 'There is no entry for .254 — nothing answered ARP for it. But .1 is a router (it is also the DNS server). Colleagues\' configuration confirms: the real gateway is 192.168.10.1.' },
        { cmd: 'ipconfig /flushdns', why: 'DNS is not the problem yet — even IP traffic to the Internet cannot leave the subnet.' },
      ],
      [
        { cmd: 'switch the adapter back to DHCP, then: ipconfig /renew', ok: true, out: `   IPv4 Address. . . . . . . . . . . : 192.168.10.112
   Default Gateway . . . . . . . . . : 192.168.10.1
   DHCP Enabled. . . . . . . . . . . : Yes`, why: 'Root cause: an old static configuration with a wrong default gateway. Using DHCP gives the correct gateway (and keeps working if the network changes).' },
        { cmd: 'set the gateway to 192.168.10.1 manually', info: true, why: 'This would work, but leaves a fragile static configuration. Prefer DHCP (or a DHCP reservation if a fixed IP is needed).' },
      ],
      [
        { cmd: 'ping 1.1.1.1  then  nslookup example.com', ok: true, out: `Reply from 1.1.1.1: bytes=32 time=18ms TTL=56

Name:    example.com
Addresses:  172.66.147.243
          104.20.23.154`, why: 'Verify from the user\'s point of view: Internet by IP works, DNS works.', done: 'Fixed. Prevent: avoid static settings on clients, document network changes, and teach the symptom — "local works, remote does not" points at the gateway.' },
      ],
    ],
  },
  'dns-failure': {
    title: 'Laptop: websites fail, but ping 8.8.8.8 works',
    intro: 'A Linux laptop shows "Could not resolve host" for every site. The user says "but ping 8.8.8.8 works". What do you run first?',
    stages: [
      [
        { cmd: 'getent hosts example.com', ok: true, out: '(no output, exit status 2)', why: 'Resolve the way applications do (hosts file + DNS): it fails. Since ping by IP works, layers 1–3 are fine — this is name resolution.' },
        { cmd: 'ping -c 3 8.8.8.8', why: 'Already known to work. Repeating it adds nothing; test DNS.' },
        { cmd: 'sudo systemctl restart networking', why: 'Restarting blindly may drop the user\'s connection and hides the cause. Diagnose DNS first.' },
      ],
      [
        { cmd: 'cat /etc/resolv.conf', ok: true, out: `nameserver 10.99.0.53
search corp.example.com`, why: 'The configured resolver is 10.99.0.53 — a company DNS server reachable only through the VPN. Is it reachable now?' },
        { cmd: 'curl -v https://example.com', why: 'curl will only repeat "Could not resolve host". Look at which resolver is configured.' },
      ],
      [
        { cmd: 'nslookup example.com 1.1.1.1', ok: true, out: `Server:         1.1.1.1
Address:        1.1.1.1#53

Non-authoritative answer:
Name:   example.com
Address: 172.66.147.243`, why: 'A public resolver answers immediately. So the network and DNS in general work; only the configured resolver is failing.' },
        { cmd: 'nslookup example.com', info: true, out: `;; communications error to 10.99.0.53#53: timed out
;; no servers could be reached`, why: 'Confirms it: the configured resolver times out.' },
      ],
      [
        { cmd: 'reconnect the VPN (or restore the DHCP-provided DNS)', ok: true, out: `$ resolvectl status | grep 'DNS Servers'
       DNS Servers: 192.168.1.1
$ getent hosts example.com
172.66.147.243  example.com`, why: 'Root cause: the VPN client left its DNS server configured after disconnecting. Restoring the network\'s own resolver fixes resolution.', done: 'Fixed. Prevent: VPN clients that restore DNS on disconnect, two resolvers configured, and remember the rule: ping IP works + names fail = DNS.' },
        { cmd: 'add example.com to /etc/hosts', why: 'That patches one name and creates a stale entry for later. Fix the resolver.' },
      ],
    ],
  },
  'api-timeout': {
    title: 'App server cannot reach the database',
    intro: 'After moving a Spring Boot service to a new subnet (10.0.3.0/24), it logs "Connect timed out" for PostgreSQL at db.internal:5432. Where do you start?',
    stages: [
      [
        { cmd: 'getent hosts db.internal', ok: true, out: '10.0.2.20       db.internal', why: 'DNS works: the name resolves to 10.0.2.20. Next, test the TCP port itself.' },
        { cmd: 'sudo systemctl restart my-service', why: 'The application is just reporting what the network does. Restarting changes nothing.' },
        { cmd: 'ping db.internal', why: 'ICMP is often blocked between subnets and says nothing about port 5432. Test the actual port.' },
      ],
      [
        { cmd: 'nc -zv -w 5 10.0.2.20 5432', ok: true, out: 'nc: connect to 10.0.2.20 port 5432 (tcp) timed out: Operation now in progress', why: 'A TIMEOUT, not "refused": the SYN gets no answer at all. That points to a firewall/security group or routing — not to PostgreSQL being down (that would be refused).' },
        { cmd: 'psql -h 10.0.2.20 -U app', why: 'It would hang the same way; nc tests the TCP layer more directly and quickly.' },
      ],
      [
        { cmd: 'nc -zv -w 5 10.0.2.20 5432   (from an old server in 10.0.1.0/24)', ok: true, out: 'Connection to 10.0.2.20 5432 port [tcp/postgresql] succeeded!', why: 'From the old subnet it works. The database is fine; something allows 10.0.1.0/24 but not the new 10.0.3.0/24.' },
        { cmd: 'ss -ltn on the database host', info: true, out: `State  Recv-Q Send-Q Local Address:Port Peer Address:Port
LISTEN 0      200          0.0.0.0:5432      0.0.0.0:*`, why: 'Good check: PostgreSQL listens on all interfaces. The problem is in between.' },
      ],
      [
        { cmd: 'inspect the database security group inbound rules', ok: true, out: `Inbound rules (sg-database):
  TCP 5432   source 10.0.1.0/24   (app subnet)`, why: 'Root cause: the rule still allows only the OLD app subnet. Packets from 10.0.3.0/24 are silently dropped → timeout.' },
        { cmd: 'allow 0.0.0.0/0 on port 5432', why: 'That would expose the database to everything. Allow exactly the app\'s subnet — or better, the app\'s security group.' },
      ],
      [
        { cmd: 'allow TCP 5432 from the app\'s security group, then nc -zv again', ok: true, out: 'Connection to 10.0.2.20 5432 port [tcp/postgresql] succeeded!', why: 'Fixed with least privilege: the rule follows the application wherever it runs.', done: 'Prevent: reference security groups instead of IP ranges, keep rules in infrastructure as code, and add a connectivity check to the deployment. Remember: timeout = dropped; refused = nothing listening.' },
      ],
    ],
  },
};

export function mount(root, { options }) {
  const scenario = SCENARIOS[options.scenario] || SCENARIOS['no-internet'];
  const term = el('pre', { class: 'mini-code term-out trouble-term', tabindex: 0, 'aria-label': 'Simulated terminal' });
  const prompt = el('p', { class: 'trouble-prompt' });
  const choices = el('div', { class: 'trouble-choices', role: 'group', 'aria-label': 'Choose the next command' });
  const progress = el('p', { class: 'viz-note' });
  root.append(el('div', { class: 'viz-stage' },
    el('p', { class: 'tree-side-title' }, `${scenario.title} — simulated`), term, prompt, choices, progress));
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
    prompt.textContent = done ? 'Problem solved.' : frame.kind === 'intro' ? 'Choose a command:' : 'What next? Choose a command:';
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
