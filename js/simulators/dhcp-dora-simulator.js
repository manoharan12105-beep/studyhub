// DHCP: how a device gets its IP configuration.
//
//   scenario → Discover / Offer / Request / Ack (or renewal, or failure),
//   with the addresses and ports of every message and the client's
//   configuration filling in as the exchange completes.

import { el } from '../util.js';
import { createStepper, field } from '../engagement/stepper.js';
import { select, sequenceView, tableView } from './network-common.js';

const SCENARIOS = {
  dora: 'New laptop joins the network (DORA)',
  two: 'Two DHCP servers answer',
  renew: 'Lease renewal at T1 (50 %)',
  fail: 'No DHCP server answers',
};

const OFFER = { ip: '192.168.1.23', mask: '255.255.255.0', gw: '192.168.1.1', dns: '192.168.1.1, 1.1.1.1', lease: '86400 s (24 h)' };

export function mount(root, { options }) {
  const scenario = select(SCENARIOS, options.scenario || 'dora');
  root.append(el('div', { class: 'viz-form' }, field('Scenario', scenario)));
  const seq = sequenceView([
    { id: 'c', label: 'Laptop (MAC aa:aa:aa:00:00:23)' },
    { id: 's', label: 'DHCP server 192.168.1.1' },
    { id: 's2', label: 'Second DHCP server 192.168.1.2' },
  ]);
  const packet = tableView('Current message on the wire', ['Field', 'Value']);
  const config = tableView('Laptop\'s IP configuration (ipconfig /all)', ['Setting', 'Value']);
  root.append(el('div', { class: 'viz-stage net-two-col' }, seq.node, el('div', {}, packet.node, config.node)));
  const stepper = createStepper(root, { render, playDelay: 2000, nextLabel: 'Next message' });

  function render(frame) {
    seq.render(frame);
    packet.render(frame.packet || [], { empty: '—' });
    config.render(frame.config, { highlight: frame.configNew || [] });
  }
  function start() {
    const frames = build(scenario.value);
    stepper.load(frames[0], frames.slice(1));
  }
  scenario.addEventListener('change', start);
  start();
  return stepper;
}

const pkt = (type, srcIp, dstIp, srcPort, dstPort, dstMac, extra = []) => [
  ['Message', type], ['Source IP : port', `${srcIp} : ${srcPort}`], ['Destination IP : port', `${dstIp} : ${dstPort}`],
  ['Destination MAC', dstMac], ...extra,
];

function emptyConfig() {
  return [['IPv4 address', '—'], ['Subnet mask', '—'], ['Default gateway', '—'], ['DNS servers', '—'], ['Lease', '—']];
}
function fullConfig(obtained = 'Mon 09:00') {
  return [['IPv4 address', OFFER.ip], ['Subnet mask', OFFER.mask], ['Default gateway', OFFER.gw], ['DNS servers', OFFER.dns], ['Lease', `${OFFER.lease}, obtained ${obtained}`]];
}

function build(name) {
  const frames = [];
  let log = [];
  const push = (text, o = {}) => frames.push({ log, text, states: o.states || {}, active: o.active, packet: o.packet, config: o.config || emptyConfig(), configNew: o.configNew });
  const BCAST = 'ff:ff:ff:ff:ff:ff';

  if (name === 'renew') {
    push('The laptop has held 192.168.1.23 since 09:00 with a 24-hour lease. At T1 = 50 % of the lease (21:00) it starts renewing — users notice nothing.',
      { states: { c: 'BOUND', s: 'lease active' }, config: fullConfig() });
    log = [...log, { from: 'c', to: 's', label: 'DHCPREQUEST (renew 192.168.1.23)', note: 'UNICAST — the client has an IP and knows the server' }];
    push('At T1 the client sends a REQUEST directly (unicast) to the server that gave the lease, asking to keep its address. No Discover, no broadcast.',
      { states: { c: 'RENEWING', s: 'lease active' }, active: ['c', 's'], config: fullConfig(),
        packet: pkt('DHCPREQUEST', OFFER.ip, '192.168.1.1', 68, 67, 'a4:91:b1:00:00:01 (the server)') });
    log = [...log, { from: 's', to: 'c', label: 'DHCPACK (lease extended 24 h)' }];
    push('The server ACKs and the lease restarts from now (21:00). If the server had not answered, the client would try again, and at T2 = 87.5 % (Tue 06:00) broadcast a REQUEST to ANY server (rebinding). Only at expiry must it give up the address.',
      { states: { c: 'BOUND', s: 'lease renewed' }, active: ['c', 's'], config: fullConfig('Mon 21:00'), configNew: [4],
        packet: pkt('DHCPACK', '192.168.1.1', OFFER.ip, 67, 68, 'aa:aa:aa:00:00:23') });
    return frames;
  }

  push('The laptop has joined the Wi-Fi network (the link works) but has no IP address, no gateway and no DNS servers. It does not even know where the DHCP server is.',
    { states: { c: 'INIT — no IP', s: 'listening on UDP 67', s2: name === 'two' ? 'listening on UDP 67' : 'not present' } });

  log = [...log, { from: 'c', to: 's', label: 'DHCPDISCOVER', note: 'broadcast — reaches every device on the LAN' }];
  push('D — DISCOVER: the client broadcasts from 0.0.0.0 (it has no address) to 255.255.255.255, UDP 68 → 67. Broadcast is the only option: it knows nobody\'s address. Routers do not forward it (that is what DHCP relays are for).',
    { states: { c: 'SELECTING', s: 'received', s2: name === 'two' ? 'received' : 'not present' }, active: ['c', 's', ...(name === 'two' ? ['s2'] : [])],
      packet: pkt('DHCPDISCOVER', '0.0.0.0', '255.255.255.255', 68, 67, BCAST, [['Client hardware address', 'aa:aa:aa:00:00:23'], ['Transaction ID', '0x3903f326']]) });

  if (name === 'fail') {
    log = [...log, { from: 'c', to: 's', label: 'DHCPDISCOVER (retry)', lost: true, note: 'no server on this network/VLAN' }];
    push('No server answers (it is down, the pool is full, or the laptop is in a VLAN without a DHCP relay). The client retries with back-off…',
      { states: { c: 'SELECTING (retrying)', s: 'unreachable' }, active: ['c'] });
    push('…and finally gives up and assigns itself a link-local APIPA address from 169.254.0.0/16 — with NO default gateway. It can talk only to other link-local hosts. Seeing 169.254.x.x in ipconfig means "DHCP failed", not "cable unplugged".',
      { states: { c: 'APIPA 169.254.77.12', s: 'unreachable' }, active: ['c'],
        config: [['IPv4 address', '169.254.77.12 (autoconfigured)'], ['Subnet mask', '255.255.0.0'], ['Default gateway', '(none)'], ['DNS servers', '(none)'], ['Lease', '—']], configNew: [0, 2] });
    return frames;
  }

  log = [...log, { from: 's', to: 'c', label: `DHCPOFFER ${OFFER.ip}`, note: 'mask, gateway, DNS, lease' }];
  push(`O — OFFER: the server picks a free address from its pool (${OFFER.ip}) and offers it with the options: subnet mask, router (gateway), DNS servers, lease time. The address is reserved briefly but not yet committed.`,
    { states: { c: 'SELECTING', s: 'offered .23', s2: name === 'two' ? 'preparing offer' : 'not present' }, active: ['s', 'c'],
      packet: pkt('DHCPOFFER', '192.168.1.1', '255.255.255.255 (or the offered IP)', 67, 68, `${BCAST} or the client MAC`,
        [['Your IP (yiaddr)', OFFER.ip], ['Option 1 mask', OFFER.mask], ['Option 3 router', OFFER.gw], ['Option 6 DNS', OFFER.dns], ['Option 51 lease', OFFER.lease]]) });

  if (name === 'two') {
    log = [...log, { from: 's2', to: 'c', label: 'DHCPOFFER 192.168.1.140' }];
    push('A second server also offers an address (192.168.1.140). The client usually takes the FIRST offer it receives.',
      { states: { c: 'SELECTING (2 offers)', s: 'offered .23', s2: 'offered .140' }, active: ['s2', 'c'],
        packet: pkt('DHCPOFFER', '192.168.1.2', '255.255.255.255', 67, 68, BCAST, [['Your IP (yiaddr)', '192.168.1.140']]) });
  }

  log = [...log, { from: 'c', to: 's', label: `DHCPREQUEST ${OFFER.ip} from server 192.168.1.1`, note: 'still a BROADCAST' }];
  push(`R — REQUEST: the client accepts one offer — but broadcasts the request, naming the chosen server (option 54). ${name === 'two' ? 'Server 192.168.1.2 sees it was not chosen and returns .140 to its pool.' : 'Any other server that made an offer would see it was not chosen.'} The client still has no IP, so the source is still 0.0.0.0.`,
    { states: { c: 'REQUESTING', s: 'chosen', s2: name === 'two' ? 'not chosen — offer withdrawn' : 'not present' }, active: ['c', 's', ...(name === 'two' ? ['s2'] : [])],
      packet: pkt('DHCPREQUEST', '0.0.0.0', '255.255.255.255', 68, 67, BCAST, [['Requested IP (option 50)', OFFER.ip], ['Server identifier (option 54)', '192.168.1.1']]) });

  log = [...log, { from: 's', to: 'c', label: `DHCPACK ${OFFER.ip}, lease 24 h` }];
  push('A — ACK: the server commits the lease (MAC aa:aa:aa:00:00:23 ↔ 192.168.1.23 until tomorrow 09:00). The client configures its interface — often first ARP-probing the address to make sure nobody else uses it.',
    { states: { c: 'BOUND', s: 'lease recorded', s2: name === 'two' ? 'idle' : 'not present' }, active: ['s', 'c'], config: fullConfig(), configNew: [0, 1, 2, 3, 4],
      packet: pkt('DHCPACK', '192.168.1.1', OFFER.ip, 67, 68, 'aa:aa:aa:00:00:23') });
  push('Done. The laptop now has everything for the next steps of any connection: its IP and mask (to tell local from remote), the default gateway (next hop for everything remote — ARP will find its MAC) and DNS servers (to resolve names).',
    { states: { c: 'BOUND', s: 'lease recorded' }, config: fullConfig() });
  return frames;
}
