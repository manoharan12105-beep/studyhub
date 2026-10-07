// The Operating Systems algorithms, as plain functions with no DOM.
//
// Not an interaction itself (nothing registers "os-common"). The OS simulators
// and visualizers draw what these functions compute, and the same functions
// were used to check every worked number in the Operating Systems lessons:
//   schedule        — FCFS, SJF, SRTF, Round Robin, Priority (both kinds)
//   replacePages    — FIFO, LRU and Optimal page replacement
//   bankersSafety   — the Banker's safety algorithm, step by step
//   bankersRequest  — the resource-request check on top of it
//   translate       — logical address → page, offset, frame, physical address
//
// Tie-breaking rules are fixed so the results are reproducible; the lessons
// state the same rules.

export const ALGORITHMS = {
  fcfs: 'FCFS — first come, first served',
  sjf: 'SJF — shortest job first (non-preemptive)',
  srtf: 'SRTF — shortest remaining time first',
  rr: 'Round Robin',
  'priority-np': 'Priority (non-preemptive)',
  'priority-p': 'Priority (preemptive)',
};

/**
 * Discrete-time CPU scheduling.
 *   procs     [{ id, at, bt, pr }] — arrival time, burst time, priority (lower number = higher priority)
 *   algorithm a key of ALGORITHMS
 *   quantum   time slice for Round Robin
 * Ties: earlier arrival, then the order the processes were listed. A preemptive
 * algorithm switches only when the newcomer is strictly better. Round Robin
 * queues processes that arrive at the moment a quantum expires before the
 * preempted process.
 * Returns { slices, results, averages, events }.
 */
export function schedule(procs, algorithm, quantum = 2) {
  const n = procs.length;
  const rem = procs.map((p) => p.bt);
  const first = Array(n).fill(null);
  const ct = Array(n).fill(null);
  const admitted = Array(n).fill(false);
  const queue = [];          // ready processes (indexes), in the order they joined
  const slices = [];         // { id, start, end } — id null = CPU idle
  const events = [];         // { t, running, queue, notes[] } — one per moment something happened
  let t = 0;
  let done = 0;
  let cur = -1;
  let used = 0;              // time the current process has run in this quantum

  const key = {
    fcfs: (i) => [procs[i].at, i],
    sjf: (i) => [procs[i].bt, procs[i].at, i],
    srtf: (i) => [rem[i], procs[i].at, i],
    rr: () => [0],
    'priority-np': (i) => [procs[i].pr, procs[i].at, i],
    'priority-p': (i) => [procs[i].pr, procs[i].at, i],
  }[algorithm];
  const less = (a, b) => {
    const ka = key(a);
    const kb = key(b);
    for (let k = 0; k < ka.length; k += 1) if (ka[k] !== kb[k]) return ka[k] < kb[k];
    return false;
  };
  const preemptive = algorithm === 'srtf' || algorithm === 'priority-p';
  const name = (i) => procs[i].id;

  while (done < n) {
    const notes = [];
    // 1. Arrivals at time t join the ready queue (in listed order).
    procs.forEach((p, i) => {
      if (!admitted[i] && p.at <= t) {
        admitted[i] = true;
        queue.push(i);
        notes.push(`${p.id} arrives (burst ${p.bt}${algorithm.startsWith('priority') ? `, priority ${p.pr}` : ''}).`);
      }
    });

    // 2. Round Robin: an expired quantum sends the running process to the back.
    if (algorithm === 'rr' && cur !== -1 && used === quantum) {
      if (queue.length) {
        notes.push(`${name(cur)} used its quantum of ${quantum}; it goes to the back of the ready queue with ${rem[cur]} left.`);
        queue.push(cur);
        cur = -1;
      } else {
        notes.push(`${name(cur)} used its quantum, but no one else is ready, so it continues.`);
      }
      used = 0;
    }

    // 3. Preemptive algorithms compare the best waiting process with the running one.
    if (preemptive && cur !== -1 && queue.length) {
      const best = queue.reduce((b, i) => (less(i, b) ? i : b));
      const better = algorithm === 'srtf' ? rem[best] < rem[cur] : procs[best].pr < procs[cur].pr;
      if (better) {
        notes.push(algorithm === 'srtf'
          ? `${name(best)} needs ${rem[best]} < ${name(cur)}'s remaining ${rem[cur]}: ${name(cur)} is preempted.`
          : `${name(best)} has priority ${procs[best].pr}, higher than ${name(cur)}'s ${procs[cur].pr}: ${name(cur)} is preempted.`);
        queue.push(cur);
        cur = -1;
      } else if (notes.some((x) => x.includes('arrives'))) {
        notes.push(algorithm === 'srtf'
          ? `${name(cur)} keeps the CPU (remaining ${rem[cur]} ≤ ${rem[best]}).`
          : `${name(cur)} keeps the CPU (priority ${procs[cur].pr} is not beaten).`);
      }
    }

    // 4. Pick a process if the CPU is free.
    if (cur === -1 && queue.length) {
      const pick = algorithm === 'rr' || algorithm === 'fcfs' ? queue[0] : queue.reduce((b, i) => (less(i, b) ? i : b));
      queue.splice(queue.indexOf(pick), 1);
      cur = pick;
      used = 0;
      notes.push(`${name(pick)} is dispatched${reasonFor(algorithm, procs[pick], rem[pick])}.`);
    }

    // 5. Nothing ready: the CPU idles until the next arrival.
    if (cur === -1) {
      const next = Math.min(...procs.filter((_, i) => !admitted[i]).map((p) => p.at));
      notes.push(`No process is ready: the CPU is idle until ${next}.`);
      events.push({ t, running: null, queue: [], notes });
      slices.push({ id: null, start: t, end: next });
      t = next;
      continue;
    }

    if (notes.length) events.push({ t, running: name(cur), queue: queue.map(name), notes });

    // 6. Run one time unit.
    if (first[cur] === null) first[cur] = t;
    const last = slices[slices.length - 1];
    if (last && last.id === name(cur) && last.end === t) last.end = t + 1;
    else slices.push({ id: name(cur), start: t, end: t + 1 });
    rem[cur] -= 1;
    used += 1;
    t += 1;
    if (rem[cur] === 0) {
      ct[cur] = t;
      done += 1;
      events.push({ t, running: null, queue: queue.map(name), notes: [`${name(cur)} completes at ${t}.`], completed: name(cur) });
      cur = -1;
      used = 0;
    }
  }

  // Merge a completion event with the decisions taken at the same instant.
  const merged = [];
  for (const e of events) {
    const prev = merged[merged.length - 1];
    if (prev && prev.t === e.t && prev.completed && !e.completed) {
      merged[merged.length - 1] = { ...e, notes: [...prev.notes, ...e.notes], completed: prev.completed };
    } else merged.push(e);
  }

  const results = procs.map((p, i) => {
    const tat = ct[i] - p.at;
    return { id: p.id, at: p.at, bt: p.bt, pr: p.pr, ct: ct[i], tat, wt: tat - p.bt, rt: first[i] - p.at };
  });
  const avg = (f) => results.reduce((s, r) => s + r[f], 0) / n;
  const switches = slices.filter((s, k) => s.id && k > 0 && slices[k - 1].id && slices[k - 1].id !== s.id).length;
  return {
    slices,
    results,
    averages: { tat: avg('tat'), wt: avg('wt'), rt: avg('rt') },
    makespan: t,
    switches,
    events: merged,
  };
}

function reasonFor(algorithm, p, remaining) {
  switch (algorithm) {
    case 'fcfs': return ' (it is first in the ready queue)';
    case 'sjf': return ` (shortest burst among the ready processes: ${p.bt})`;
    case 'srtf': return ` (shortest remaining time: ${remaining})`;
    case 'rr': return ' (front of the ready queue)';
    default: return ` (highest priority among the ready processes: ${p.pr})`;
  }
}

/**
 * Page replacement with a fixed number of frames.
 * Frames are slots: a new page goes into the victim's slot (or the first empty one).
 * Optimal evicts the page used farthest in the future; among pages never used
 * again it evicts the one loaded earliest.
 * Returns one step per reference: { ref, frames, hit, victim, slot, faults, hits }.
 */
export function replacePages(refs, frameCount, policy) {
  const slots = Array(frameCount).fill(null);   // { page, loaded, last }
  const steps = [];
  let faults = 0;
  let hits = 0;
  refs.forEach((ref, time) => {
    const at = slots.findIndex((s) => s && s.page === ref);
    let victim = null;
    let slot = at;
    let reason = '';
    if (at !== -1) {
      hits += 1;
      slots[at].last = time;
    } else {
      faults += 1;
      slot = slots.indexOf(null);
      if (slot === -1) {
        slot = pickVictim(slots, policy, refs, time);
        victim = slots[slot].page;
        reason = victimReason(slots[slot], policy, refs, time);
      }
      slots[slot] = { page: ref, loaded: time, last: time };
    }
    steps.push({ ref, frames: slots.map((s) => (s ? s.page : null)), hit: at !== -1, victim, slot, reason, faults, hits });
  });
  return steps;
}

function nextUse(page, refs, time) {
  const k = refs.indexOf(page, time + 1);
  return k === -1 ? Infinity : k;
}

function pickVictim(slots, policy, refs, time) {
  let best = 0;
  for (let i = 1; i < slots.length; i += 1) {
    const a = slots[i];
    const b = slots[best];
    if (policy === 'fifo' && a.loaded < b.loaded) best = i;
    else if (policy === 'lru' && a.last < b.last) best = i;
    else if (policy === 'optimal') {
      const na = nextUse(a.page, refs, time);
      const nb = nextUse(b.page, refs, time);
      if (na > nb || (na === nb && a.loaded < b.loaded)) best = i;
    }
  }
  return best;
}

function victimReason(slot, policy, refs, time) {
  if (policy === 'fifo') return `it was loaded first (at reference ${slot.loaded + 1})`;
  if (policy === 'lru') return `it was used longest ago (at reference ${slot.last + 1})`;
  const k = nextUse(slot.page, refs, time);
  return k === Infinity ? 'it is never used again' : `its next use (reference ${k + 1}) is farthest away`;
}

/** Need = Max − Allocation, row by row. */
export function needMatrix(allocation, max) {
  return max.map((row, i) => row.map((m, j) => m - allocation[i][j]));
}

const fits = (need, work) => need.every((x, j) => x <= work[j]);

/**
 * Banker's safety algorithm. Scans the processes in order, continuing from the
 * process after the last one that finished, until a full pass finds nobody.
 * Returns { safe, sequence, steps, need } where each step is
 * { process, need, work, ok, workAfter }.
 */
export function bankersSafety(allocation, max, available) {
  const n = allocation.length;
  const need = needMatrix(allocation, max);
  const finished = Array(n).fill(false);
  let work = available.slice();
  const sequence = [];
  const steps = [];
  let i = 0;
  let failedInRow = 0;
  while (sequence.length < n && failedInRow < n) {
    if (!finished[i]) {
      const ok = fits(need[i], work);
      const before = work.slice();
      if (ok) {
        work = work.map((w, j) => w + allocation[i][j]);
        finished[i] = true;
        sequence.push(i);
        failedInRow = 0;
      } else failedInRow += 1;
      steps.push({ process: i, need: need[i], work: before, ok, workAfter: work.slice() });
    } else failedInRow += 1;
    i = (i + 1) % n;
  }
  return { safe: sequence.length === n, sequence, steps, need, finalWork: work };
}

/**
 * Resource request by process p: request ≤ need, request ≤ available, then
 * pretend to grant it and run the safety algorithm on the new state.
 */
export function bankersRequest(allocation, max, available, p, request) {
  const need = needMatrix(allocation, max);
  if (!fits(request, need[p])) return { granted: false, reason: 'exceeds-need' };
  if (!fits(request, available)) return { granted: false, reason: 'must-wait' };
  const alloc2 = allocation.map((row, i) => (i === p ? row.map((a, j) => a + request[j]) : row.slice()));
  const avail2 = available.map((a, j) => a - request[j]);
  const safety = bankersSafety(alloc2, max, avail2);
  return { granted: safety.safe, reason: safety.safe ? 'safe' : 'unsafe', allocation: alloc2, available: avail2, safety };
}

/** Paging address translation. pageTable[page] = frame number, or null when the page is not in memory. */
export function translate(logical, pageSize, pageTable) {
  const page = Math.floor(logical / pageSize);
  const offset = logical % pageSize;
  if (page >= pageTable.length) return { page, offset, valid: false, fault: false };
  const frame = pageTable[page];
  if (frame === null || frame === undefined) return { page, offset, valid: true, fault: true };
  return { page, offset, valid: true, fault: false, frame, physical: frame * pageSize + offset };
}
