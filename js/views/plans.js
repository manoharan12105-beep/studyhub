// Study plans: the plans dashboard, built-in plan previews and one plan's page.
//
//   #/plans                               dashboard: active, saved, completed, built-in
//   #/plans/builtin/<plan-id>/<variant>   a built-in plan at one difficulty
//   #/plans/p/<record-id>                 one of the learner's plans (today, milestones, days)
//   #/plans/new  ·  #/plans/p/<id>/edit   builder (plan-builder.js)

import { el, icon, formatMinutes, announce } from '../util.js';
import { href, navigate } from '../router.js';
import * as plans from '../plans.js';
import { MODE_LABELS } from '../plan-schedule.js';
import { pageHeader, errorState, notice, progressBar, loading, subjectIcon, DIFFICULTY_LABELS, difficultyBadge, statusBadge } from './common.js';

export const PRIVACY = 'Study plans are stored in this browser. Nothing is uploaded.';
const CATEGORY_TITLES = { placement: 'Placement preparation', interview: 'Interview preparation', role: 'Role-based', subject: 'Subject plans' };
const LEVEL_NAMES = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const crumbsTo = (...rest) => [{ label: 'Dashboard', href: '#/' }, { label: 'Study plans', href: '#/plans' }, ...rest];

/** "about 42 hours" — whole hours from 10 h, half hours below, minutes under an hour. */
export function approxHours(minutes) {
  if (minutes < 60) return `${minutes} minutes`;
  const h = minutes / 60;
  const n = h >= 10 ? Math.round(h) : Math.round(h * 2) / 2;
  return `${n} hour${n === 1 ? '' : 's'}`;
}

export function dailyText(minutes) {
  return `${formatMinutes(minutes)} a day`;
}

export function privacyNote() {
  return el('p', { class: 'plan-privacy small muted' }, icon('info', 16), el('span', {}, PRIVACY));
}

function eyebrowFor(record) {
  return record.kind === 'builtin' ? `Built-in plan · ${DIFFICULTY_LABELS[record.variant] || ''}` : 'Custom plan';
}

/** "Day 5 of 30", or where the learner stands when the schedule has not started or has ended. */
function dayLine(summary) {
  if (summary.finished) return 'Plan complete';
  if (summary.notStarted) return `Starts in ${summary.startsIn} day${summary.startsIn === 1 ? '' : 's'}`;
  if (summary.ended) return `Schedule ended · ${summary.total - summary.done} activities left`;
  return `Day ${summary.dayNumber} of ${summary.dayCount}`;
}

function continueButton(next, size = '') {
  if (!next) return null;
  return el('a', { class: `btn btn-primary ${size}`, href: next.href, 'data-interactive': next.mode === 'interactive' ? next.topic?.id : null },
    'Continue', el('span', { class: 'sr-only' }, `: ${MODE_LABELS[next.mode]}, ${next.label}`), icon('arrowRight', 16));
}

// ---- Dashboard -----------------------------------------------------------------------

export async function renderPlans(main, { isCurrent }) {
  main.replaceChildren(el('div', { class: 'page plans-page' }, loading('Loading study plans…')));
  let defs = null;
  let defsError = null;
  try {
    defs = await plans.loadDefinitions();
  } catch (error) {
    defsError = error.message;
  }
  if (!isCurrent()) return null;

  const groups = plans.grouped();
  const canAdd = plans.canAddPlan();
  main.replaceChildren(el('div', { class: 'page plans-page' },
    pageHeader({
      crumbs: [{ label: 'Dashboard', href: '#/' }, { label: 'Study plans' }],
      title: 'Study plans',
      lead: 'Follow a ready-made plan or build your own from any subjects, modules and topics. Plans link to the real lessons and question sessions and use the progress you already have.',
      actions: canAdd ? el('a', { class: 'btn btn-primary', href: '#/plans/new' }, icon('spark', 16), 'Create custom plan') : null,
    }),
    privacyNote(),
    canAdd ? null : notice(`You have ${plans.MAX_PLANS} plans, the most this browser keeps. Delete one to create another.`, 'info'),
    groups.active ? activeSection(groups.active) : null,
    yourPlansSection(groups),
    defs ? builtinSection(defs) : notice(`Built-in plans could not be loaded. ${defsError || ''}`, 'warning')));
  wireInteractiveLinks(main);
  return { title: 'Study plans' };
}

function activeSection({ record, summary }) {
  return el('section', { class: 'section plan-active', 'aria-labelledby': 'plan-active-title' },
    el('div', { class: 'section-head' }, el('h2', { id: 'plan-active-title' }, 'Active plan')),
    planCard(record, summary, { featured: true }));
}

/** The compact plan card used on the dashboard and on the plans page. */
export function planCard(record, summary, { featured = false } = {}) {
  const todayLeft = summary.today.filter((i) => !i.done).length;
  return el('article', { class: `plan-card ${featured ? 'is-featured' : ''}` },
    el('div', { class: 'plan-card-text' },
      el('p', { class: 'eyebrow' }, eyebrowFor(record)),
      el('h3', { class: 'plan-card-title' }, el('a', { href: href(['plans', 'p', record.id]) }, record.title)),
      el('p', { class: 'plan-card-day' }, summary.finished ? icon('check', 16) : icon('clock', 16), dayLine(summary)),
      el('div', { class: 'plan-card-progress' },
        progressBar(summary.percent, `${record.title}: ${summary.percent}% of activities done`),
        el('span', { class: 'small muted' }, `${summary.done} of ${summary.total} done`,
          summary.finished ? '' : ` · ~${approxHours(summary.minutesLeft)} left`)),
      featured && !summary.finished && !summary.notStarted
        ? el('p', { class: 'small muted' }, todayLeft ? `${todayLeft} ${todayLeft === 1 ? 'activity' : 'activities'} left today` : 'Today’s activities are done',
          summary.overdue.length ? ` · ${summary.overdue.length} to catch up` : '')
        : null),
    el('div', { class: 'plan-card-actions' },
      summary.finished ? null : continueButton(summary.next),
      el('a', { class: 'btn btn-secondary', href: href(['plans', 'p', record.id]) }, 'Open plan')));
}

function yourPlansSection({ saved, completed }) {
  if (!saved.length && !completed.length) return null;
  const row = ({ record, summary }) => el('li', { class: 'plan-row' },
    el('div', { class: 'plan-row-main' },
      el('a', { class: 'plan-row-title', href: href(['plans', 'p', record.id]) }, record.title),
      el('span', { class: 'small muted' }, `${eyebrowFor(record)} · ${dayLine(summary)} · ${summary.done} of ${summary.total} done`)),
    el('div', { class: 'plan-row-progress' }, progressBar(summary.percent, `${record.title}: ${summary.percent}% done`)),
    summary.finished ? el('span', { class: 'status status-completed' }, el('span', { class: 'status-dot', 'aria-hidden': 'true' }), 'Completed')
      : el('button', { class: 'btn btn-secondary btn-sm', type: 'button', 'data-activate': record.id }, 'Make active',
        el('span', { class: 'sr-only' }, `: ${record.title}`)));
  const section = el('section', { class: 'section', 'aria-labelledby': 'plan-yours-title' },
    el('div', { class: 'section-head' }, el('h2', { id: 'plan-yours-title' }, 'Your other plans')),
    saved.length ? el('ul', { class: 'plan-rows', role: 'list' }, saved.map(row)) : null,
    completed.length ? el('h3', { class: 'plan-subhead' }, 'Completed') : null,
    completed.length ? el('ul', { class: 'plan-rows', role: 'list' }, completed.map(row)) : null);
  section.addEventListener('click', (event) => {
    const button = event.target.closest('[data-activate]');
    if (!button) return;
    plans.setActive(button.dataset.activate);
    announce('Active plan changed');
    navigate('#/plans', { replace: true });
  });
  return section;
}

function builtinSection(defs) {
  const byCategory = new Map();
  for (const plan of defs.plans) {
    if (!byCategory.has(plan.category)) byCategory.set(plan.category, []);
    byCategory.get(plan.category).push(plan);
  }
  return el('section', { class: 'section', 'aria-labelledby': 'plan-builtin-title' },
    el('div', { class: 'section-head' },
      el('h2', { id: 'plan-builtin-title' }, 'Built-in plans'),
      el('p', { class: 'muted small' }, 'Each difficulty changes the topics, question levels, study modes and daily workload.')),
    Object.keys(CATEGORY_TITLES).filter((c) => byCategory.has(c)).map((c) => el('div', { class: 'plan-group' },
      el('h3', { class: 'plan-subhead' }, CATEGORY_TITLES[c]),
      el('ul', { class: 'card-grid plan-grid', role: 'list' }, byCategory.get(c).map(builtinCard)))));
}

function builtinCard(plan) {
  return el('li', { class: 'card plan-builtin-card' },
    el('h4', { class: 'card-title' }, plan.title),
    el('p', { class: 'card-desc' }, plan.description),
    el('ul', { class: 'plan-variant-links', role: 'list', 'aria-label': `${plan.title} difficulties` }, plan.variants.map((v) => el('li', {},
      el('a', { class: 'plan-variant-link', href: href(['plans', 'builtin', plan.id, v.difficulty]) },
        el('span', { class: 'plan-variant-name' }, DIFFICULTY_LABELS[v.difficulty]),
        el('span', { class: 'plan-variant-meta' }, `${v.durationDays} days · ${dailyText(v.dailyMinutes)}`))))));
}

// ---- Built-in plan preview -------------------------------------------------------------------

export async function renderBuiltin(main, { planId, difficulty, isCurrent }) {
  main.replaceChildren(el('div', { class: 'page plans-page' }, loading('Loading plan…')));
  let defs;
  try {
    defs = await plans.loadDefinitions();
  } catch (error) {
    if (!isCurrent()) return null;
    main.replaceChildren(errorState({ title: 'Plan could not be loaded', message: error.message, actions: [{ label: 'Study plans', href: '#/plans', primary: true }] }));
    return { title: 'Plan could not be loaded' };
  }
  const plan = defs.plans.find((p) => p.id === planId);
  const found = plan && plans.findVariant(defs, planId, difficulty || plan.variants[0].difficulty);
  if (!isCurrent()) return null;
  if (!found) {
    main.replaceChildren(errorState({ title: 'Plan not found', message: 'This built-in plan or difficulty does not exist.', actions: [{ label: 'Study plans', href: '#/plans', primary: true }] }));
    return { title: 'Plan not found' };
  }
  const { variant } = found;
  const draft = plans.builtinDraft(defs, plan, variant);
  const weak = plans.weakTopicIds();
  const weakInScope = draft.topics.filter((id) => weak.has(id)).length;
  const lessonDone = plans.doneChecker({});
  const completedInScope = draft.topics.filter((id) => lessonDone(`learn:${id}`)).length;

  const skip = el('input', { type: 'checkbox', id: 'bp-skip', disabled: completedInScope ? null : true });
  const weakBox = el('input', { type: 'checkbox', id: 'bp-weak', disabled: weakInScope ? null : true });
  const facts = el('dl', { class: 'fact-row plan-facts' });
  const stagesHost = el('div', {});
  const existing = plans.list().find((r) => r.kind === 'builtin' && r.plan === plan.id && r.variant === variant.difficulty);
  const start = el('button', { class: 'btn btn-primary btn-lg', type: 'button', disabled: plans.canAddPlan() ? null : true },
    existing ? 'Start again' : 'Start this plan', icon('arrowRight', 18));

  async function refresh() {
    const settings = { ...draft.settings, skipCompleted: skip.checked, prioritizeWeak: weakBox.checked };
    const result = await plans.generate(draft.topics, settings, defs.defaults.modeMinutes);
    if (!isCurrent()) return null;
    const topicCount = new Set(result.items.filter((i) => i.topicId).map((i) => i.topicId)).size;
    const daysUsed = result.days.reduce((last, day, i) => (day.length ? i + 1 : last), 0);
    facts.replaceChildren(
      fact('Topics', String(topicCount)),
      fact('Study time', `~${approxHours(result.capacity.required)}`),
      fact('Schedule', `${variant.durationDays} days · ${dailyText(variant.dailyMinutes)}`),
      fact('Activities', String(result.items.length)));
    stagesHost.replaceChildren(stageList(draft, result, daysUsed));
    return result;
  }

  skip.addEventListener('change', refresh);
  weakBox.addEventListener('change', refresh);
  start.addEventListener('click', async () => {
    start.disabled = true;
    const settings = { ...draft.settings, skipCompleted: skip.checked, prioritizeWeak: weakBox.checked };
    const result = await plans.generate(draft.topics, settings, defs.defaults.modeMinutes);
    const record = plans.put({
      ...draft, id: plans.newId(), settings, created: new Date().toISOString(), start: plans.todayString(),
      minutes: { ...defs.defaults.modeMinutes }, days: result.days, done: {},
    });
    announce(`${record.title} started`);
    navigate(href(['plans', 'p', record.id]));
  });

  main.replaceChildren(el('div', { class: 'page plans-page' },
    pageHeader({
      crumbs: crumbsTo({ label: plan.title }),
      eyebrow: 'Built-in plan',
      title: plan.title,
      lead: plan.description,
    }),
    el('nav', { class: 'mode-tabs plan-variant-tabs', 'aria-label': 'Difficulty' }, el('ul', {}, plan.variants.map((v) => el('li', {},
      el('a', { class: `mode-tab ${v === variant ? 'is-active' : ''}`, href: href(['plans', 'builtin', plan.id, v.difficulty]), 'aria-current': v === variant ? 'page' : null },
        DIFFICULTY_LABELS[v.difficulty]))))),
    el('section', { class: 'panel plan-preview', 'aria-labelledby': 'bp-variant-title' },
      el('h2', { id: 'bp-variant-title', class: 'plan-panel-title' }, `${DIFFICULTY_LABELS[variant.difficulty]} plan`),
      el('p', {}, variant.summary),
      facts,
      el('dl', { class: 'plan-details' },
        detail('For', plan.targetAudience),
        plan.prerequisites.length ? detail('Before you start', plan.prerequisites.join('; ')) : null,
        detail('Study modes', variant.modes.map((m) => (m === 'revision' ? `Revision (${variant.revision === 'quick' ? 'quick' : 'full'} sheets)` : MODE_LABELS[m])).join(', ')),
        detail('Lesson levels', variant.topicLevels.map((l) => DIFFICULTY_LABELS[l]).join(', ')),
        detail('Question difficulty', variant.questionLevels.map((l) => LEVEL_NAMES[l]).join(', '))),
      el('fieldset', { class: 'plan-options' },
        el('legend', {}, 'Personalise'),
        checkRow(skip, `Skip topics I have already completed (${completedInScope})`),
        checkRow(weakBox, weakInScope ? `Put my weak areas first (${weakInScope} topic${weakInScope === 1 ? '' : 's'} with mostly wrong answers)` : 'Put my weak areas first (not enough recorded answers yet: nothing is guessed)')),
      el('div', { class: 'plan-start' }, start,
        existing ? el('a', { class: 'btn btn-secondary btn-lg', href: href(['plans', 'p', existing.id]) }, 'Open your plan') : null,
        el('a', { class: 'btn btn-ghost', href: href(['plans', 'new'], { from: `${plan.id}/${variant.difficulty}` }) }, 'Customise before starting')),
      plans.canAddPlan() ? null : notice(`You have ${plans.MAX_PLANS} plans. Delete one to start another.`, 'info'),
      privacyNote()),
    el('section', { class: 'section', 'aria-labelledby': 'bp-stages-title' },
      el('div', { class: 'section-head' }, el('h2', { id: 'bp-stages-title' }, 'Milestones')),
      stagesHost)));
  await refresh();
  return { title: plan.title };
}

function fact(label, value) {
  return el('div', { class: 'fact' }, el('dt', {}, label), el('dd', {}, value));
}

function detail(label, value) {
  return el('div', {}, el('dt', {}, label), el('dd', {}, value));
}

export function checkRow(input, label, hint) {
  return el('div', { class: 'check-row' }, input, el('label', { for: input.id }, label, hint ? el('span', { class: 'field-hint' }, hint) : null));
}

/** Stages of a built-in plan with the topics the schedule really contains (lazy topic lists). */
function stageList(draft, result, daysUsed) {
  const inPlan = new Map();
  result.items.forEach((item) => {
    if (!item.topicId) return;
    inPlan.set(item.topicId, (inPlan.get(item.topicId) || 0) + item.minutes);
  });
  const rows = draft.milestones.map((m, i) => {
    const ids = m.topics.filter((id) => inPlan.has(id));
    if (!ids.length) return null;
    const minutes = ids.reduce((sum, id) => sum + inPlan.get(id), 0);
    const list = el('ul', { class: 'mini-list plan-stage-topics', role: 'list' });
    const box = el('details', { class: 'plan-stage' },
      el('summary', {},
        el('span', { class: 'plan-stage-num', 'aria-hidden': 'true' }, String(i + 1)),
        el('span', { class: 'plan-stage-title' }, m.title),
        el('span', { class: 'plan-stage-meta small muted' }, `${ids.length} topic${ids.length === 1 ? '' : 's'} · ~${approxHours(minutes)}`)),
      list);
    box.addEventListener('toggle', () => {
      if (!box.open || list.childElementCount) return;
      list.append(...ids.map((id) => {
        const topic = plans.lookup.topic(id);
        return el('li', {}, el('a', { class: 'mini-item', href: href(['t', id]) },
          el('span', { class: 'mini-title' }, topic.title),
          el('span', { class: 'mini-meta' }, statusBadge(id), difficultyBadge(topic.difficulty))));
      }));
    });
    return el('li', {}, box);
  }).filter(Boolean);
  return el('div', {},
    el('p', { class: 'small muted' }, daysUsed ? `The schedule uses ${daysUsed} of ${result.days.length} days.` : 'Nothing to schedule with these options.'),
    el('ol', { class: 'plan-stages', role: 'list' }, rows));
}

// ---- One plan -------------------------------------------------------------------------

export async function renderPlan(main, { id }) {
  const initial = plans.get(id);
  if (!initial) {
    main.replaceChildren(errorState({ title: 'Plan not found', message: 'This plan is not in this browser. Plans are stored per browser; restore a progress backup to bring them over.', actions: [{ label: 'Study plans', href: '#/plans', primary: true }] }));
    return { title: 'Plan not found' };
  }
  const openDays = new Set();
  let firstDraw = true;
  let confirmDelete = false;
  const page = el('div', { class: 'page plans-page plan-page' });
  main.replaceChildren(page);

  function draw(focusSelector) {
    const record = plans.get(id);
    if (!record) {
      navigate('#/plans', { replace: true });
      return;
    }
    const summary = plans.summarize(record);
    if (firstDraw) openDays.add(summary.dayNumber - 1);
    firstDraw = false;
    const isActive = plans.activeId() === record.id;
    const subjects = new Set(record.topics.map((t) => plans.lookup.topic(t)?.category).filter(Boolean));

    page.replaceChildren(
      pageHeader({
        crumbs: crumbsTo({ label: record.title }),
        eyebrow: eyebrowFor(record),
        title: record.title,
        lead: `${summary.total} activities across ${subjects.size} subject${subjects.size === 1 ? '' : 's'} · ${record.settings.durationDays} days · ${dailyText(record.settings.dailyMinutes)}`,
        actions: [
          isActive ? el('span', { class: 'badge badge-interactive plan-active-badge' }, icon('check', 12), 'Active plan')
            : el('button', { class: 'btn btn-secondary', type: 'button', 'data-action': 'activate' }, 'Make active'),
          el('a', { class: 'btn btn-secondary', href: href(['plans', 'p', record.id, 'edit']) }, 'Edit plan'),
        ],
      }),
      overview(record, summary),
      todaySection(record, summary),
      summary.milestones.length ? milestoneSection(summary) : null,
      scheduleSection(record, summary, openDays),
      el('section', { class: 'section plan-manage', 'aria-labelledby': 'plan-manage-title' },
        el('h2', { id: 'plan-manage-title', class: 'plan-subhead' }, 'Manage'),
        el('div', { class: 'plan-manage-row' },
          el('button', { class: 'btn btn-secondary', type: 'button', 'data-action': 'restart' }, 'Restart schedule from today'),
          confirmDelete
            ? el('span', { class: 'plan-confirm', role: 'group', 'aria-label': 'Confirm delete' },
              el('span', {}, 'Delete this plan? Lesson progress is kept.'),
              el('button', { class: 'btn btn-danger btn-sm', type: 'button', 'data-action': 'delete-yes' }, 'Delete plan'),
              el('button', { class: 'btn btn-secondary btn-sm', type: 'button', 'data-action': 'delete-no' }, 'Cancel'))
            : el('button', { class: 'btn btn-ghost btn-danger-text', type: 'button', 'data-action': 'delete' }, 'Delete plan')),
        privacyNote()));
    wireInteractiveLinks(page);
    if (focusSelector) page.querySelector(focusSelector)?.focus();
  }

  // One set of listeners for the whole page (event delegation; the content is redrawn).
  page.addEventListener('change', (event) => {
    const box = event.target.closest('input[data-key]');
    if (box) {
      const record = plans.get(id);
      plans.setDone(record, box.dataset.key, box.checked);
      announce(box.checked ? 'Marked done' : 'Marked not done');
      draw(`input[data-key="${CSS.escape(box.dataset.key)}"][data-where="${box.dataset.where}"]`);
      return;
    }
    const move = event.target.closest('select[data-move]');
    if (move) {
      const day = Number(move.value);
      plans.moveItem(plans.get(id), move.dataset.move, day);
      openDays.add(day);
      announce(`Moved to day ${day + 1}`);
      draw(`select[data-move="${CSS.escape(move.dataset.move)}"]`);
    }
  });
  page.addEventListener('toggle', (event) => {
    const day = event.target.closest?.('details[data-day]');
    if (!day) return;
    const i = Number(day.dataset.day);
    if (day.open) {
      openDays.add(i);
      fillDay(day, plans.get(id));
    } else openDays.delete(i);
  }, true);
  page.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-action]');
    if (!button) return;
    const action = button.dataset.action;
    const record = plans.get(id);
    if (action === 'activate') {
      plans.setActive(id);
      announce('This is now your active plan');
      draw('.plan-active-badge');
    } else if (action === 'restart') {
      plans.put({ ...record, start: plans.todayString() });
      openDays.clear();
      firstDraw = true;
      announce('Schedule restarted from today');
      draw('[data-action="restart"]');
    } else if (action === 'delete') {
      confirmDelete = true;
      draw('[data-action="delete-no"]');
    } else if (action === 'delete-no') {
      confirmDelete = false;
      draw('[data-action="delete"]');
    } else if (action === 'delete-yes') {
      plans.remove(id);
      announce('Plan deleted');
      navigate('#/plans');
    }
  });

  draw();
  return { title: initial.title };
}

function overview(record, summary) {
  return el('section', { class: 'plan-overview', 'aria-label': 'Plan progress' },
    el('div', { class: 'plan-overview-text' },
      el('p', { class: 'plan-day-line' }, dayLine(summary)),
      progressBar(summary.percent, `${summary.percent}% of activities done`),
      el('p', { class: 'small muted' }, `${summary.done} of ${summary.total} activities done (${summary.percent}%)`,
        summary.finished ? '' : ` · ~${approxHours(summary.minutesLeft)} of study left`,
        summary.lastDay < summary.dayCount && !summary.finished ? ` · the schedule fills ${summary.lastDay} of ${summary.dayCount} days` : '')),
    summary.finished
      ? el('p', { class: 'plan-finished' }, icon('check', 18), 'Every activity in this plan is done.')
      : !summary.next
        ? el('p', { class: 'muted' }, 'This plan has no activities left in the content. Edit the plan to choose topics.')
      : el('div', { class: 'plan-overview-next' },
        el('p', { class: 'small muted' }, 'Next: ', el('strong', {}, `${MODE_LABELS[summary.next.mode]} · ${summary.next.label}`), ` (day ${summary.next.day + 1})`),
        continueButton(summary.next, 'btn-lg')));
}

function todaySection(record, summary) {
  const title = summary.notStarted ? 'First day' : summary.ended ? 'Last day' : `Today · Day ${summary.dayNumber}`;
  const items = summary.today;
  return el('section', { class: 'section', 'aria-labelledby': 'plan-today-title' },
    el('div', { class: 'section-head' },
      el('h2', { id: 'plan-today-title' }, title),
      el('p', { class: 'muted small' }, items.length ? `${items.filter((i) => i.done).length} of ${items.length} done · ~${formatMinutes(items.reduce((s, i) => s + i.minutes, 0))}` : '')),
    items.length
      ? el('ul', { class: 'plan-items', role: 'list' }, items.map((info) => itemRow(record, info, info.done, 'today')))
      : el('p', { class: 'muted' }, 'Nothing is scheduled for this day. Use the time to catch up or revise.'),
    summary.overdue.length ? el('details', { class: 'plan-catchup' },
      el('summary', {}, `Catch up: ${summary.overdue.length} ${summary.overdue.length === 1 ? 'activity' : 'activities'} from earlier days`),
      el('ul', { class: 'plan-items', role: 'list' }, summary.overdue.slice(0, 50).map((info) => itemRow(record, info, false, 'catchup', `Day ${info.day + 1}`))),
      summary.overdue.length > 50 ? el('p', { class: 'small muted' }, `and ${summary.overdue.length - 50} more in the schedule below.`) : null) : null);
}

function milestoneSection(summary) {
  return el('section', { class: 'section', 'aria-labelledby': 'plan-ms-title' },
    el('div', { class: 'section-head' }, el('h2', { id: 'plan-ms-title' }, 'Milestones')),
    el('ol', { class: 'plan-milestones', role: 'list' }, summary.milestones.map((m) => el('li', { class: `plan-milestone ${m.reached ? 'is-reached' : ''}` },
      el('span', { class: 'plan-milestone-mark', 'aria-hidden': 'true' }, m.reached ? icon('check', 14) : null),
      el('span', { class: 'plan-milestone-title' }, m.title),
      el('span', { class: 'small muted' }, m.reached ? 'Reached' : `${m.complete} of ${m.total} topics · planned by day ${m.day}`)))));
}

function scheduleSection(record, summary, openDays) {
  const start = parseYmd(record.start);
  const isItemDone = plans.doneChecker(record);
  const days = record.days.map((keys, i) => {
    const infos = keys.map((key) => plans.describe(record, key)).filter((x) => x.available);
    const doneCount = keys.filter((k) => isItemDone(k)).length;
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    const label = date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
    const box = el('details', { class: `plan-day ${i === summary.dayNumber - 1 ? 'is-today' : ''} ${infos.length && doneCount >= infos.length ? 'is-done' : ''}`, 'data-day': i, open: openDays.has(i) ? true : null },
      el('summary', {},
        el('span', { class: 'plan-day-name' }, `Day ${i + 1}`),
        el('span', { class: 'plan-day-date small muted' }, label),
        el('span', { class: 'plan-day-meta small muted' }, infos.length
          ? `${doneCount} of ${infos.length} done · ~${formatMinutes(infos.reduce((s, x) => s + x.minutes, 0))}`
          : 'Free day')),
      el('ul', { class: 'plan-items', role: 'list' }));
    if (box.open) fillDay(box, record);
    return box;
  });
  return el('section', { class: 'section', 'aria-labelledby': 'plan-schedule-title' },
    el('div', { class: 'section-head' },
      el('h2', { id: 'plan-schedule-title' }, 'Schedule'),
      el('p', { class: 'muted small' }, 'Open a day to see its activities. Move an activity to another day with its “Day” menu.')),
    el('div', { class: 'plan-days' }, days));
}

/** Day contents are built when the day is opened (plans can have hundreds of items). */
function fillDay(box, record) {
  const list = box.querySelector('.plan-items');
  if (list.childElementCount) return;
  const isItemDone = plans.doneChecker(record);
  const day = Number(box.dataset.day);
  const rows = record.days[day].map((key) => plans.describe(record, key)).filter((x) => x.available)
    .map((info) => itemRow(record, info, isItemDone(info.key), `day-${day}`, null, day));
  list.replaceChildren(...(rows.length ? rows : [el('li', { class: 'muted small plan-empty' }, 'No activities on this day.')]));
  wireInteractiveLinks(list);
}

function parseYmd(text) {
  const [y, m, d] = text.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * One activity: a done checkbox, the link, its mode, subject and time, and (in the
 * schedule) a menu to move it to another day. Learn items show the shared lesson status.
 */
function itemRow(record, info, done, where, note = null, day = null) {
  const id = `pi-${where}-${info.key.replace(/[^a-z0-9]/g, '-')}`;
  const modeLabel = MODE_LABELS[info.mode];
  const box = el('input', { type: 'checkbox', id, 'data-key': info.key, 'data-where': where, checked: done ? true : null });
  const move = day === null ? null : el('select', { class: 'select plan-move', 'data-move': info.key, 'aria-label': `Move ${modeLabel}: ${info.label} to another day` },
    record.days.map((_, i) => el('option', { value: i, selected: i === day ? true : null }, `Day ${i + 1}`)));
  return el('li', { class: `plan-item ${done ? 'is-done' : ''}` },
    box,
    el('div', { class: 'plan-item-main' },
      el('label', { class: 'sr-only', for: id }, `Done: ${modeLabel}, ${info.label}`),
      el('a', { class: 'plan-item-link', href: info.href, 'data-interactive': info.mode === 'interactive' ? info.topic.id : null }, info.label),
      el('span', { class: 'plan-item-meta' },
        el('span', { class: `plan-mode plan-mode-${info.mode}` }, modeLabel),
        info.category ? el('span', { class: 'plan-item-subject' }, subjectIcon(info.category, 'sm'), info.category.title) : null,
        el('span', {}, formatMinutes(info.minutes)),
        note ? el('span', {}, note) : null,
        info.mode === 'learn' && done ? el('span', { class: 'status status-completed' }, icon('check', 12), 'Completed') : null)),
    move);
}

/** Point "Interactive" links at the lesson's first exercise once the registry is loaded. */
export function wireInteractiveLinks(root) {
  for (const link of root.querySelectorAll('a[data-interactive]')) {
    const topic = plans.lookup.topic(link.dataset.interactive);
    if (!topic) continue;
    plans.interactiveHref(topic).then((target) => { link.href = target; });
  }
}
