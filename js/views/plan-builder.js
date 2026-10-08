// Custom study plan builder, also used to edit any existing plan.
//
//   #/plans/new                     empty builder
//   #/plans/new?from=<plan>/<level> start from a built-in plan's scope and settings
//   #/plans/p/<record-id>/edit      change topics, difficulty, schedule or modes, then rebuild
//
// The content picker reads only metadata (the topic index and the small
// interaction registries); no lesson Markdown is loaded. Module and topic rows
// are created the first time their parent is expanded.

import { el, icon, formatMinutes, announce } from '../util.js';
import { href, navigate } from '../router.js';
import { categoriesInDisplayOrder, isAvailable, ungroupedTopics } from '../content-loader.js';
import * as plans from '../plans.js';
import * as P from '../plan-schedule.js';
import { pageHeader, errorState, loading, notice, DIFFICULTY_LABELS, difficultyBadge } from './common.js';
import { approxHours, dailyText, privacyNote, checkRow } from './plans.js';

const DURATIONS = [7, 14, 30, 60];
const DAILY = [15, 30, 45, 60, 120];
const LEVEL_NAMES = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const MODE_HINTS = {
  learn: 'Read the lesson and mark it complete',
  interactive: 'The visualizers and simulations inside a lesson',
  practice: 'Practice questions, one at a time',
  interview: 'Interview questions, answered out loud',
  flashcards: 'Quick recall from the interview questions',
  revision: 'A subject revision sheet after its last topic',
};
const DEFAULT_SETTINGS = {
  durationDays: 30, dailyMinutes: 60, topicLevels: [...P.TOPIC_LEVELS], questionLevels: [...P.QUESTION_LEVELS],
  modes: ['learn', 'practice', 'revision'], revision: 'full', skipCompleted: false, prioritizeWeak: false, overload: false,
};
const MAX_NAME = 80;

export async function renderBuilder(main, { recordId = null, from = null, isCurrent }) {
  main.replaceChildren(el('div', { class: 'page plans-page' }, loading('Loading the plan builder…')));
  let defs;
  try {
    defs = await plans.loadDefinitions();
  } catch (error) {
    if (!isCurrent()) return null;
    main.replaceChildren(errorState({ title: 'The plan builder could not start', message: error.message, actions: [{ label: 'Study plans', href: '#/plans', primary: true }] }));
    return { title: 'Plan builder' };
  }
  const subjects = categoriesInDisplayOrder().filter(isAvailable);
  const interactive = await plans.interactiveIds(subjects.map((c) => c.id));
  if (!isCurrent()) return null;

  // ---- Starting point --------------------------------------------------------------------
  const existing = recordId ? plans.get(recordId) : null;
  if (recordId && !existing) {
    main.replaceChildren(errorState({ title: 'Plan not found', message: 'This plan is not in this browser.', actions: [{ label: 'Study plans', href: '#/plans', primary: true }] }));
    return { title: 'Plan not found' };
  }
  if (!existing && !plans.canAddPlan()) {
    main.replaceChildren(errorState({ title: 'Plan limit reached', message: `This browser keeps up to ${plans.MAX_PLANS} plans. Delete one before creating another.`, actions: [{ label: 'Study plans', href: '#/plans', primary: true }] }));
    return { title: 'Plan builder' };
  }
  let base = existing;
  if (!base && from) {
    const [planId, level] = from.split('/');
    const found = plans.findVariant(defs, planId, level);
    if (found) {
      const { plan: _plan, variant: _variant, ...draft } = plans.builtinDraft(defs, found.plan, found.variant);
      base = { ...draft, kind: 'custom', basedOn: from, title: `${found.plan.title} (custom)` };
    }
  }
  const settings = { ...DEFAULT_SETTINGS, ...(base?.settings || {}) };
  settings.topicLevels = [...settings.topicLevels];
  settings.questionLevels = [...settings.questionLevels];
  settings.modes = [...settings.modes];
  let order = (base?.topics || []).filter((id) => plans.lookup.topic(id)); // selected ids, plan order
  let selected = new Set(order);
  const weak = plans.weakTopicIds();
  const lessonDone = plans.doneChecker({});
  const isComplete = (id) => lessonDone(`learn:${id}`);
  const learningIndex = new Map();
  subjects.forEach((c) => c.topics.forEach((t) => learningIndex.set(t.id, learningIndex.size)));

  // ---- Selection helpers ----------------------------------------------------------------
  /** Keep subjects together: a new topic joins its subject's block, in learning order. */
  function addTopics(ids) {
    for (const id of ids) {
      if (selected.has(id)) continue;
      const topic = plans.lookup.topic(id);
      const gi = learningIndex.get(id);
      const sameSubject = order.map((x, i) => [x, i]).filter(([x]) => plans.lookup.topic(x)?.category === topic.category);
      const before = sameSubject.find(([x]) => learningIndex.get(x) > gi);
      const at = before ? before[1] : sameSubject.length ? sameSubject[sameSubject.length - 1][1] + 1 : order.length;
      order.splice(at, 0, id);
      selected.add(id);
    }
  }
  function removeTopics(ids) {
    const drop = new Set(ids);
    order = order.filter((id) => !drop.has(id));
    for (const id of drop) selected.delete(id);
  }

  // ---- Form controls ----------------------------------------------------------------------
  const nameInput = el('input', { class: 'input', id: 'pb-name', type: 'text', maxlength: MAX_NAME, required: true, value: base?.title || 'My study plan', autocomplete: 'off' });
  const startInput = el('input', { class: 'input', id: 'pb-start', type: 'date', value: base?.start || plans.todayString(), required: true });
  const duration = choiceControl('pb-duration', 'Duration', DURATIONS, settings.durationDays, (n) => `${n} days`, { min: 1, max: 365, unit: 'days' });
  const daily = choiceControl('pb-daily', 'Daily study time', DAILY, settings.dailyMinutes, (n) => formatMinutes(n), { min: 10, max: 600, unit: 'minutes' });

  const topicLevelBoxes = P.TOPIC_LEVELS.map((level) => el('input', { type: 'checkbox', id: `pb-tl-${level}`, value: level, checked: settings.topicLevels.includes(level) ? true : null }));
  const questionLevelBoxes = P.QUESTION_LEVELS.map((level) => el('input', { type: 'checkbox', id: `pb-ql-${level}`, value: level, checked: settings.questionLevels.includes(level) ? true : null }));
  const modeBoxes = P.MODES.map((mode) => el('input', { type: 'checkbox', id: `pb-mode-${mode}`, value: mode, checked: settings.modes.includes(mode) ? true : null }));
  const revisionSelect = el('select', { class: 'select', id: 'pb-revision' },
    el('option', { value: 'full' }, 'Full revision sheets'), el('option', { value: 'quick' }, 'Quick revision sheets'));
  revisionSelect.value = settings.revision;
  const skipBox = el('input', { type: 'checkbox', id: 'pb-skip', checked: settings.skipCompleted ? true : null });
  const weakBox = el('input', { type: 'checkbox', id: 'pb-weak', checked: settings.prioritizeWeak ? true : null });

  const levelCounts = el('p', { class: 'field-hint', id: 'pb-tl-hint' });
  const modeCounts = new Map(P.MODES.map((m) => [m, el('span', { class: 'field-hint' })]));
  const skipLabel = el('span', {});
  const weakLabel = el('span', {});
  const selectionLine = el('p', { class: 'small muted', role: 'status' });
  const summaryBox = el('div', { class: 'plan-summary', role: 'status', 'aria-live': 'polite' });
  const capacityBox = el('div', { class: 'plan-capacity' });
  const formError = el('p', { class: 'form-error', role: 'alert', id: 'pb-error' });
  const orderList = el('ol', { class: 'plan-order', role: 'list' });
  const orderBox = el('details', { class: 'plan-order-box' }, el('summary', {}, 'Order and remove selected topics'), orderList);
  const tree = el('ul', { class: 'plan-tree', role: 'list', id: 'pb-tree' });
  let overload = settings.overload;

  function currentSettings() {
    return {
      durationDays: duration.value(), dailyMinutes: daily.value(),
      topicLevels: topicLevelBoxes.filter((b) => b.checked).map((b) => b.value),
      questionLevels: questionLevelBoxes.filter((b) => b.checked).map((b) => b.value),
      modes: modeBoxes.filter((b) => b.checked && !b.disabled).map((b) => b.value),
      revision: revisionSelect.value, skipCompleted: skipBox.checked, prioritizeWeak: weakBox.checked, overload,
    };
  }

  function preview() {
    const s = currentSettings();
    const topics = P.planTopics(order, s, plans.lookup, { isComplete, weak });
    const items = P.buildItems(topics, s, plans.lookup, { interactive, minutes: defs.defaults.modeMinutes });
    return { s, topics, items, capacity: P.capacity(items, s.durationDays || 1, s.dailyMinutes || 1) };
  }

  // ---- Tree ---------------------------------------------------------------------------------
  const rows = []; // { kind, box, topics: [ids], meta, update }

  function groupState(ids) {
    const n = ids.filter((id) => selected.has(id)).length;
    return { n, all: n === ids.length && n > 0, some: n > 0 && n < ids.length };
  }

  function groupRow(kind, key, title, ids, makeChildren, iconNode = null) {
    const boxId = `pb-${kind}-${key}`;
    const listId = `${boxId}-list`;
    const box = el('input', { type: 'checkbox', id: boxId, 'data-ids': kind });
    const meta = el('span', { class: 'plan-tree-meta small muted' });
    const toggle = el('button', { class: 'plan-tree-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': listId },
      icon('chevronRight', 16), el('span', { class: 'sr-only' }, `Show ${kind === 'subject' ? 'modules' : 'topics'} of ${title}`));
    const children = el('ul', { class: 'plan-tree-children', role: 'list', id: listId, hidden: true });
    const row = { kind, box, topics: ids, update() {
      const st = groupState(ids);
      box.checked = st.all;
      box.indeterminate = st.some;
      const minutes = ids.reduce((sum, id) => sum + (plans.lookup.topic(id).estimatedMinutes || 0), 0);
      meta.textContent = `${st.n ? `${st.n} of ` : ''}${ids.length} topic${ids.length === 1 ? '' : 's'} · ${formatMinutes(minutes)} of lessons`;
    } };
    rows.push(row);
    box.addEventListener('change', () => {
      if (box.checked) addTopics(ids);
      else removeTopics(ids);
      changed();
    });
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      if (open && !children.childElementCount) children.append(...makeChildren());
      toggle.setAttribute('aria-expanded', String(open));
      children.hidden = !open;
      syncTree();
    });
    row.update();
    return el('li', { class: `plan-tree-item plan-tree-${kind}` },
      el('div', { class: 'plan-tree-row' }, toggle, box,
        el('label', { for: boxId, class: 'plan-tree-label' }, iconNode, el('span', {}, title)), meta),
      children);
  }

  function topicRow(topic) {
    const boxId = `pb-t-${topic.id}`;
    const box = el('input', { type: 'checkbox', id: boxId });
    const row = { kind: 'topic', box, topics: [topic.id], update() { box.checked = selected.has(topic.id); } };
    rows.push(row);
    box.addEventListener('change', () => {
      if (box.checked) addTopics([topic.id]);
      else removeTopics([topic.id]);
      changed();
    });
    row.update();
    return el('li', { class: 'plan-tree-item plan-tree-topic' },
      el('div', { class: 'plan-tree-row' }, box,
        el('label', { for: boxId, class: 'plan-tree-label' }, el('span', {}, topic.title)),
        el('span', { class: 'plan-tree-meta small muted' },
          difficultyBadge(topic.difficulty),
          topic.estimatedMinutes ? ` ${formatMinutes(topic.estimatedMinutes)}` : '',
          isComplete(topic.id) ? el('span', { class: 'status status-completed' }, icon('check', 12), 'Completed') : null)));
  }

  function subjectChildren(category) {
    const modules = category.subcategories.filter((s) => s.topics.length).map((sub) => groupRow('module', `${category.id}--${sub.id}`, sub.title,
      sub.topics.map((t) => t.id), () => sub.topics.map(topicRow)));
    const loose = ungroupedTopics(category);
    if (loose.length) modules.push(groupRow('module', `${category.id}--other`, 'Other topics', loose.map((t) => t.id), () => loose.map(topicRow)));
    return modules;
  }

  tree.append(...subjects.map((category) => groupRow('subject', category.id, category.title,
    category.topics.map((t) => t.id), () => subjectChildren(category), null)));

  function syncTree() {
    for (const row of rows) row.update();
  }

  // ---- Order list ---------------------------------------------------------------------------
  function drawOrder() {
    if (!orderBox.open) return;
    const s = currentSettings();
    const kept = new Set(P.planTopics(order, s, plans.lookup, { isComplete, weak }).map((t) => t.id));
    orderList.replaceChildren(...(order.length ? order.map((id, i) => {
      const topic = plans.lookup.topic(id);
      const why = kept.has(id) ? null : !s.topicLevels.includes(topic.difficulty) ? 'left out by the lesson level filter' : 'left out: already completed';
      return el('li', { class: `plan-order-item ${why ? 'is-excluded' : ''}` },
        el('span', { class: 'plan-order-title' }, topic.title,
          el('span', { class: 'small muted' }, ` · ${plans.lookup.category(topic.category)?.title || ''}`),
          why ? el('span', { class: 'small muted' }, ` (${why})`) : null),
        el('span', { class: 'plan-order-actions' },
          orderButton('up', id, i === 0, `Move ${topic.title} up`, icon('chevronLeft', 14)),
          orderButton('down', id, i === order.length - 1, `Move ${topic.title} down`, icon('chevronRight', 14)),
          orderButton('remove', id, false, `Remove ${topic.title}`, icon('close', 14))));
    }) : [el('li', { class: 'muted small' }, 'No topics selected yet.')]));
  }

  function orderButton(action, id, disabled, label, iconNode) {
    return el('button', { class: 'btn btn-secondary btn-sm plan-order-btn', type: 'button', 'data-order': action, 'data-id': id, disabled: disabled ? true : null, 'aria-label': label }, iconNode);
  }

  orderBox.addEventListener('toggle', drawOrder);
  orderList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-order]');
    if (!button) return;
    const { order: action, id } = button.dataset;
    const i = order.indexOf(id);
    if (action === 'remove') {
      removeTopics([id]);
      announce('Topic removed');
    } else {
      const j = action === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= order.length) return;
      [order[i], order[j]] = [order[j], order[i]];
      announce(`Moved to position ${j + 1}`);
    }
    changed();
    // Keep focus on the same control for the moved topic (or the list after a removal).
    orderList.querySelector(`button[data-order="${action}"][data-id="${CSS.escape(id)}"]:not([disabled])`)?.focus()
      || orderList.querySelector('button:not([disabled])')?.focus();
  });
  const sortButton = el('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, 'Sort in learning order');
  sortButton.addEventListener('click', () => {
    order.sort((a, b) => learningIndex.get(a) - learningIndex.get(b));
    announce('Topics sorted in learning order');
    changed();
  });

  // ---- Live summary ---------------------------------------------------------------------------
  function changed() {
    syncTree();
    drawOrder();
    const { s, topics, items, capacity } = preview();
    const subjectCount = new Set(order.map((id) => plans.lookup.topic(id).category)).size;
    selectionLine.textContent = order.length
      ? `${order.length} topic${order.length === 1 ? '' : 's'} selected from ${subjectCount} subject${subjectCount === 1 ? '' : 's'}.`
      : 'No topics selected yet.';

    // Level counts and mode availability are about the selection, not the filters.
    const chosen = order.map((id) => plans.lookup.topic(id));
    const byLevel = Object.fromEntries(P.TOPIC_LEVELS.map((l) => [l, chosen.filter((t) => t.difficulty === l).length]));
    levelCounts.textContent = `In your selection: ${P.TOPIC_LEVELS.map((l) => `${byLevel[l]} ${DIFFICULTY_LABELS[l].toLowerCase()}`).join(', ')}.`;
    const filtered = P.planTopics(order, { ...s, modes: P.MODES }, plans.lookup, { isComplete, weak });
    const available = {
      learn: filtered.length,
      interactive: filtered.filter((t) => interactive.has(t.id)).length,
      practice: filtered.filter((t) => t.files.includes('practice.md')).length,
      interview: filtered.filter((t) => t.files.includes('interview-questions.md')).length,
      flashcards: filtered.filter((t) => t.files.includes('interview-questions.md')).length,
      revision: new Set(filtered.filter((t) => plans.lookup.category(t.category)?.studyModes.length).map((t) => t.category)).size,
    };
    modeBoxes.forEach((box) => {
      const n = available[box.value];
      box.disabled = n === 0;
      modeCounts.get(box.value).textContent = n === 0
        ? (order.length ? 'Not available for the selected topics' : 'Select topics first')
        : box.value === 'revision' ? `${n} subject${n === 1 ? '' : 's'} with revision sheets` : `${n} topic${n === 1 ? '' : 's'}`;
    });
    revisionSelect.disabled = !modeBoxes.find((b) => b.value === 'revision').checked || available.revision === 0;
    const completed = order.filter(isComplete).length;
    skipLabel.textContent = `Skip topics I have already completed (${completed} in the selection)`;
    skipBox.disabled = completed === 0 && !skipBox.checked;
    const weakSelected = order.filter((id) => weak.has(id)).length;
    weakLabel.textContent = weak.size
      ? `Put my weak areas first (${weakSelected} selected topic${weakSelected === 1 ? '' : 's'} with mostly wrong answers)`
      : 'Put my weak areas first (not enough recorded answers yet: nothing is guessed)';
    weakBox.disabled = weakSelected === 0 && !weakBox.checked;

    const topicCount = new Set(items.filter((i) => i.topicId).map((i) => i.topicId)).size;
    const schedule = `${s.durationDays} days × ${dailyText(s.dailyMinutes)} = about ${approxHours(capacity.available)}`;
    summaryBox.replaceChildren(
      el('p', { class: 'plan-summary-main' }, items.length
        ? `${topicCount} topic${topicCount === 1 ? '' : 's'} · ${items.length} activit${items.length === 1 ? 'y' : 'ies'} · about ${approxHours(capacity.required)} of study`
        : 'Nothing to schedule yet'),
      el('p', { class: 'small muted' }, items.length ? `Your schedule: ${schedule}.` : explainEmpty(s, topics)));

    if (!items.length || capacity.fits) {
      overload = false;
      capacityBox.replaceChildren(items.length ? el('p', { class: 'plan-fits small' }, icon('check', 16), el('span', {}, `Fits your schedule, with about ${approxHours(capacity.available - capacity.required)} to spare.`)) : '');
      return;
    }
    const need = sameRounding(capacity.required, capacity.available);
    capacityBox.replaceChildren(el('div', { class: 'callout callout-warning plan-over' },
      el('p', {}, el('strong', {}, `Your selected content requires approximately ${need[0]}, but your current schedule provides only ${need[1]}.`)),
      el('div', { class: 'plan-over-actions' },
        el('button', { class: 'btn btn-secondary btn-sm', type: 'button', 'data-fix': 'extend' }, `Extend duration to ${capacity.daysNeeded} days`),
        el('button', { class: 'btn btn-secondary btn-sm', type: 'button', 'data-fix': 'daily' }, `Increase daily time to ${formatMinutes(capacity.dailyNeeded)}`),
        el('button', { class: 'btn btn-secondary btn-sm', type: 'button', 'data-fix': 'reduce' }, 'Reduce topics'),
        el('button', { class: 'btn btn-secondary btn-sm', type: 'button', 'data-fix': 'continue', 'aria-pressed': String(overload) }, 'Continue anyway')),
      overload ? el('p', { class: 'small' }, `Days will hold about ${formatMinutes(Math.ceil(capacity.required / s.durationDays))} instead of ${formatMinutes(s.dailyMinutes)}.`) : null));
  }

  capacityBox.addEventListener('click', (event) => {
    const fix = event.target.closest('button[data-fix]')?.dataset.fix;
    if (!fix) return;
    const { capacity } = preview();
    if (fix === 'extend') {
      if (capacity.daysNeeded > 365) { showError('That would need more than 365 days. Reduce topics or increase the daily time.'); return; }
      duration.set(capacity.daysNeeded);
      announce(`Duration set to ${capacity.daysNeeded} days`);
    } else if (fix === 'daily') {
      if (capacity.dailyNeeded > 600) { showError('That would need more than 10 hours a day. Extend the duration or reduce topics.'); return; }
      daily.set(capacity.dailyNeeded);
      announce(`Daily time set to ${formatMinutes(capacity.dailyNeeded)}`);
    } else if (fix === 'reduce') {
      tree.querySelector('input, button')?.focus();
      tree.scrollIntoView({ block: 'start', behavior: 'auto' });
      return;
    } else if (fix === 'continue') {
      overload = !overload;
    }
    changed();
    capacityBox.querySelector(`button[data-fix="${fix}"]`)?.focus();
  });

  for (const control of [...topicLevelBoxes, ...questionLevelBoxes, ...modeBoxes, skipBox, weakBox, revisionSelect]) control.addEventListener('change', changed);
  duration.onChange(changed);
  daily.onChange(changed);

  // ---- Save ----------------------------------------------------------------------------------
  function showError(message, focusTarget) {
    formError.textContent = message;
    focusTarget?.focus();
  }

  async function submit(event) {
    event.preventDefault();
    formError.textContent = '';
    const title = nameInput.value.trim();
    const s = currentSettings();
    if (!title) return showError('Give the plan a name.', nameInput);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startInput.value)) return showError('Choose a start date.', startInput);
    if (!s.durationDays || s.durationDays < 1 || s.durationDays > 365) return showError('Duration must be between 1 and 365 days.', duration.focusTarget());
    if (!s.dailyMinutes || s.dailyMinutes < 10 || s.dailyMinutes > 600) return showError('Daily study time must be between 10 and 600 minutes.', daily.focusTarget());
    if (!s.topicLevels.length) return showError('Choose at least one lesson level.', topicLevelBoxes[0]);
    if (!s.questionLevels.length) return showError('Choose at least one question difficulty.', questionLevelBoxes[0]);
    if (!s.modes.length) return showError('Choose at least one study mode.', modeBoxes.find((b) => !b.disabled) || tree);
    const { capacity, items, topics } = preview();
    if (!items.length) return showError('Nothing to schedule: select topics, or relax the filters.', tree.querySelector('input'));
    if (!capacity.fits && !overload) return showError('The plan does not fit the schedule. Choose one of the options above, or “Continue anyway”.', capacityBox.querySelector('button'));

    const result = await plans.generate(order, s, defs.defaults.modeMinutes);
    const keys = new Set(result.days.flat());
    const done = Object.fromEntries(Object.entries(existing?.done || {}).filter(([key]) => keys.has(key)));
    // Built-in stages stay the milestones of plans that came from one; other plans get one per subject.
    const fromStages = (base?.kind === 'builtin' || base?.basedOn) && base.milestones?.length;
    const milestones = fromStages ? base.milestones : P.subjectMilestones(topics, plans.lookup);
    const record = plans.put({
      ...(existing || {}),
      id: existing?.id || plans.newId(),
      kind: existing?.kind || 'custom',
      ...(existing?.kind === 'builtin' ? { plan: existing.plan, variant: existing.variant } : {}),
      ...(base?.basedOn ? { basedOn: base.basedOn } : {}),
      title: title.slice(0, MAX_NAME),
      created: existing?.created || new Date().toISOString(),
      start: startInput.value,
      settings: s,
      topics: order.slice(),
      milestones,
      minutes: { ...defs.defaults.modeMinutes },
      days: result.days,
      done,
    });
    announce(existing ? 'Plan saved and schedule rebuilt' : 'Plan created');
    navigate(href(['plans', 'p', record.id]));
    return null;
  }

  // ---- Page ------------------------------------------------------------------------------------
  const selectAll = el('button', { class: 'btn btn-secondary btn-sm', type: 'button' }, 'Select everything');
  const clearAll = el('button', { class: 'btn btn-ghost btn-sm', type: 'button' }, 'Clear selection');
  selectAll.addEventListener('click', () => {
    addTopics(subjects.flatMap((c) => c.topics.map((t) => t.id)));
    changed();
    announce('Every topic selected');
  });
  clearAll.addEventListener('click', () => {
    removeTopics([...selected]);
    changed();
    announce('Selection cleared');
  });

  const title = existing ? `Edit: ${existing.title}` : 'Create a study plan';
  const form = el('form', { class: 'plan-builder', novalidate: true },
    el('section', { class: 'panel plan-step', 'aria-labelledby': 'pb-step-content' },
      el('h2', { id: 'pb-step-content', class: 'plan-panel-title' }, '1. Choose what to study'),
      el('p', { class: 'small muted' }, 'Tick a whole subject, a module or single topics. Use the arrow buttons to open a subject or module.'),
      el('div', { class: 'plan-tree-tools' }, selectAll, clearAll, selectionLine),
      tree,
      el('div', { class: 'plan-order-tools' }, orderBox, sortButton)),
    el('section', { class: 'panel plan-step', 'aria-labelledby': 'pb-step-level' },
      el('h2', { id: 'pb-step-level', class: 'plan-panel-title' }, '2. Difficulty'),
      el('fieldset', { class: 'plan-fieldset' },
        el('legend', {}, 'Lesson level'),
        el('div', { class: 'plan-checks' }, topicLevelBoxes.map((box) => checkRow(box, DIFFICULTY_LABELS[box.value]))),
        levelCounts,
        el('p', { class: 'field-hint' }, 'Keeps the selected topics whose lesson has this level (from the topic metadata).')),
      el('fieldset', { class: 'plan-fieldset' },
        el('legend', {}, 'Question difficulty'),
        el('div', { class: 'plan-checks' }, questionLevelBoxes.map((box) => checkRow(box, LEVEL_NAMES[box.value]))),
        el('p', { class: 'field-hint' }, 'Practice, interview and flashcard sessions show only these questions. A question uses its own difficulty; interview questions use their Beginner / Intermediate / Advanced section; anything else uses its topic’s level.'))),
    el('section', { class: 'panel plan-step', 'aria-labelledby': 'pb-step-time' },
      el('h2', { id: 'pb-step-time', class: 'plan-panel-title' }, '3. Schedule'),
      el('div', { class: 'plan-fields' },
        duration.node, daily.node,
        el('div', { class: 'field' }, el('label', { for: 'pb-start' }, 'Start date'), startInput))),
    el('section', { class: 'panel plan-step', 'aria-labelledby': 'pb-step-modes' },
      el('h2', { id: 'pb-step-modes', class: 'plan-panel-title' }, '4. Study modes'),
      el('fieldset', { class: 'plan-fieldset' },
        el('legend', { class: 'sr-only' }, 'Study modes'),
        el('div', { class: 'plan-mode-grid' }, modeBoxes.map((box) => el('div', { class: 'check-row' }, box,
          el('label', { for: box.id }, el('strong', {}, P.MODE_LABELS[box.value]), el('span', { class: 'field-hint' }, MODE_HINTS[box.value]), modeCounts.get(box.value)))))),
      el('div', { class: 'field plan-revision-field' }, el('label', { for: 'pb-revision' }, 'Revision sheet'), revisionSelect),
      el('fieldset', { class: 'plan-fieldset' },
        el('legend', {}, 'Options'),
        el('div', { class: 'check-row' }, skipBox, el('label', { for: 'pb-skip' }, skipLabel)),
        el('div', { class: 'check-row' }, weakBox, el('label', { for: 'pb-weak' }, weakLabel,
          el('span', { class: 'field-hint' }, 'Weak areas come from your own answers: at least 3 recorded and fewer than 60% right.'))))),
    el('section', { class: 'panel plan-step plan-step-final', 'aria-labelledby': 'pb-step-save' },
      el('h2', { id: 'pb-step-save', class: 'plan-panel-title' }, existing ? '5. Save' : '5. Name and create'),
      el('div', { class: 'field' }, el('label', { for: 'pb-name' }, 'Plan name'), nameInput),
      summaryBox,
      capacityBox,
      existing ? notice('Saving rebuilds the day-by-day schedule from these settings. Finished activities stay finished; activities you moved by hand go back to their place.', 'info') : null,
      formError,
      el('div', { class: 'plan-start' },
        el('button', { class: 'btn btn-primary btn-lg', type: 'submit' }, existing ? 'Save and rebuild schedule' : 'Create plan'),
        el('a', { class: 'btn btn-secondary btn-lg', href: existing ? href(['plans', 'p', existing.id]) : '#/plans' }, 'Cancel')),
      privacyNote()));
  form.addEventListener('submit', submit);

  main.replaceChildren(el('div', { class: 'page plans-page' },
    pageHeader({
      crumbs: [{ label: 'Dashboard', href: '#/' }, { label: 'Study plans', href: '#/plans' }, ...(existing ? [{ label: existing.title, href: href(['plans', 'p', existing.id]) }] : []), { label: existing ? 'Edit' : 'New plan' }],
      title,
      lead: existing ? 'Change the topics, difficulty, schedule or study modes, then rebuild the schedule.' : 'Pick subjects, modules or single topics, set the difficulty and your time, and StudyHub lays out the days.',
    }),
    form));
  changed();
  return { title };
}

/** Why nothing would be scheduled, in the learner's terms. */
function explainEmpty(settings, topics) {
  if (!settings.modes.length) return 'Choose at least one study mode.';
  if (!topics.length) return 'Select topics in step 1 (or relax the lesson level and “skip completed” filters).';
  return 'None of the chosen study modes is available for these topics.';
}

/** Two durations rounded the same way, falling back to exact minutes when rounding hides the gap. */
function sameRounding(required, available) {
  const a = approxHours(required);
  const b = approxHours(available);
  return a === b ? [formatMinutes(required), formatMinutes(available)] : [a, b];
}

/**
 * A preset select with a "Custom…" number field (duration, daily time).
 * value() is the chosen number; set(n) selects the preset or fills the custom field.
 */
function choiceControl(id, label, presets, initial, format, { min, max, unit }) {
  const select = el('select', { class: 'select', id },
    presets.map((n) => el('option', { value: n }, format(n))), el('option', { value: 'custom' }, 'Custom…'));
  const custom = el('input', { class: 'input plan-custom-number', id: `${id}-custom`, type: 'number', inputmode: 'numeric', min, max, step: 1, 'aria-label': `${label} in ${unit}` });
  const customWrap = el('span', { class: 'plan-custom' }, custom, el('span', { class: 'small muted', 'aria-hidden': 'true' }, unit));
  const listeners = [];
  function set(n) {
    if (presets.includes(n)) {
      select.value = String(n);
      customWrap.hidden = true;
    } else {
      select.value = 'custom';
      custom.value = String(n);
      customWrap.hidden = false;
    }
  }
  set(initial);
  select.addEventListener('change', () => {
    customWrap.hidden = select.value !== 'custom';
    if (select.value === 'custom' && !custom.value) custom.value = String(initial);
    if (select.value === 'custom') custom.focus();
    listeners.forEach((fn) => fn());
  });
  custom.addEventListener('input', () => listeners.forEach((fn) => fn()));
  return {
    node: el('div', { class: 'field' }, el('label', { for: id }, label), el('div', { class: 'plan-choice' }, select, customWrap)),
    value: () => (select.value === 'custom' ? Math.round(Number(custom.value)) || 0 : Number(select.value)),
    set(n) { set(n); listeners.forEach((fn) => fn()); },
    onChange: (fn) => listeners.push(fn),
    focusTarget: () => (select.value === 'custom' ? custom : select),
  };
}
