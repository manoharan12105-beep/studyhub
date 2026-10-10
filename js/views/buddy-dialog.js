// Header menu → StudyHub Buddy: turn Buddy on or off and customise it.
// Works whether or not Buddy is visible — this is the one place to switch it
// back on. Every change applies at once and is saved (js/buddy/settings.js).

import { el, announce } from '../util.js';
import * as settings from '../buddy/settings.js';
import { ask, toss } from '../buddy/buddy.js';
import { createCharacter, restPose, growthStage } from '../buddy/character.js';
import { completedTopicCount } from '../buddy/companion.js';

let preview = null;

export function openBuddySettings() {
  const dialog = document.getElementById('buddy-dialog');
  render(dialog.querySelector('.dialog-body'));
  if (!dialog.open) dialog.showModal();
}

function render(body) {
  const s = settings.get();
  const save = (patch) => {
    settings.save(patch);
    refresh();
  };

  // Live preview of the chosen look (decorative).
  preview = createCharacter();
  preview.applyAppearance(s);
  preview.applyPose({ ...restPose(), turn: 0.4 });

  // ---- On / off ----
  const stateText = el('span', { class: 'buddy-switch-state', id: 'buddy-enabled-state' });
  const toggle = el('input', { type: 'checkbox', role: 'switch', id: 'buddy-enabled', class: 'buddy-switch-input', 'aria-describedby': 'buddy-enabled-state' });
  toggle.checked = s.enabled;
  toggle.addEventListener('change', () => {
    save({ enabled: toggle.checked });
    announce(toggle.checked ? 'StudyHub Buddy enabled' : 'StudyHub Buddy disabled');
  });

  // ---- Appearance ----
  const colorChoices = settings.COLORS.map((c) => {
    const input = el('input', { type: 'radio', name: 'buddy-color', id: `buddy-color-${c.id}`, value: c.value, class: 'buddy-chip-input' });
    input.checked = s.color === c.value;
    input.addEventListener('change', () => save({ color: c.value }));
    return el('span', { class: 'buddy-chip' }, input,
      el('label', { for: input.id }, el('span', { class: 'buddy-dot', style: `background:${c.value}`, 'aria-hidden': 'true' }), c.label));
  });
  const custom = el('input', { type: 'color', id: 'buddy-color-custom', class: 'buddy-color-input', value: s.color });
  custom.addEventListener('change', () => save({ color: custom.value }));

  const select = (field, label, hint) => {
    const node = el('select', { class: 'select', id: `buddy-${field}`, 'aria-describedby': hint ? `buddy-${field}-hint` : null },
      settings.OPTIONS[field].map(([value, text]) => el('option', { value, selected: s[field] === value }, text)));
    node.addEventListener('change', () => save({ [field]: node.value }));
    return el('div', { class: 'field' }, el('label', { for: node.id }, label), node,
      hint ? el('span', { class: 'field-hint', id: `buddy-${field}-hint` }, hint) : null);
  };
  const check = (field, label, hint) => {
    const input = el('input', { type: 'checkbox', id: `buddy-${field}` });
    input.checked = s[field];
    input.addEventListener('change', () => save({ [field]: input.checked }));
    return el('div', { class: 'check-row' }, input,
      el('label', { for: input.id }, el('span', {}, label), hint ? el('span', { class: 'field-hint' }, hint) : null));
  };

  const quizBtn = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', id: 'buddy-try-quiz' }, 'Quiz me now');
  const factBtn = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', id: 'buddy-try-fact' }, 'Tell me a fact');
  for (const [button, kind] of [[quizBtn, 'quiz'], [factBtn, 'fact']]) {
    button.addEventListener('click', () => {
      document.getElementById('buddy-dialog').close();
      ask(kind);
    });
  }
  // The keyboard and screen-reader alternative to picking Buddy up and throwing it.
  const tossBtn = el('button', { type: 'button', class: 'btn btn-secondary btn-sm', id: 'buddy-toss' }, 'Toss Buddy');
  tossBtn.addEventListener('click', () => {
    document.getElementById('buddy-dialog').close();
    announce(toss() ? 'Buddy tossed into the air' : 'Buddy can’t be tossed right now');
  });
  const resetBtn = el('button', { type: 'button', class: 'btn btn-ghost btn-sm', id: 'buddy-reset' }, 'Reset preferences');
  resetBtn.addEventListener('click', () => {
    settings.reset();
    render(body);
    announce('Buddy preferences reset to defaults');
    document.getElementById('buddy-reset')?.focus();
  });

  body.replaceChildren(
    el('div', { class: 'buddy-switch' },
      el('span', { class: 'buddy-preview', 'aria-hidden': 'true' }, preview.root),
      el('div', { class: 'buddy-switch-text' },
        el('label', { for: 'buddy-enabled', class: 'buddy-switch-label' }, 'StudyHub Buddy'),
        el('p', { class: 'muted small' }, 'A small companion that lives at the edges of the page: it climbs the sidebar, offers optional quiz questions from topics you have studied, and shares the odd fact. It never covers what you are reading on purpose and never plays sound.')),
      el('span', { class: 'buddy-switch-control' }, toggle, stateText)),

    el('fieldset', { class: 'plan-fieldset buddy-fieldset' },
      el('legend', {}, 'Appearance'),
      el('div', { class: 'buddy-chips', role: 'radiogroup', 'aria-label': 'Body colour' }, colorChoices),
      el('div', { class: 'buddy-fields' },
        el('div', { class: 'field' }, el('label', { for: custom.id }, 'Custom colour'), custom),
        select('eyes', 'Eyes'),
        select('accessory', 'Accessory'))),

    el('fieldset', { class: 'plan-fieldset buddy-fieldset' },
      el('legend', {}, 'Behaviour'),
      el('div', { class: 'buddy-fields' },
        select('movement', 'Movement'),
        select('quiz', 'Quiz questions'),
        select('personality', 'Personality'),
        select('motion', 'Motion', 'Always calm: Buddy sits still, without walking or climbing (reduced motion in your system settings does the same).')),
      check('facts', 'Facts', 'Short science, nature, history and maths facts'),
      check('motivation', 'Motivational messages', 'Only after things you really did, such as completing a topic'),
      check('quiet', 'Quiet mode', 'No unprompted messages or quizzes; Buddy mostly rests and its leaf droops')),

    el('div', { class: 'dialog-actions buddy-actions' }, quizBtn, factBtn, tossBtn, el('span', { class: 'backup-spacer' }), resetBtn),
    el('p', { class: 'muted small buddy-note' }, 'Saved only in this browser, separately from your progress. Progress backups do not include Buddy’s settings.'));

  function refresh() {
    const now = settings.get();
    stateText.textContent = now.enabled ? 'Enabled' : 'Disabled';
    quizBtn.disabled = !now.enabled;
    factBtn.disabled = !now.enabled;
    tossBtn.disabled = !now.enabled || now.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    custom.value = now.color;
    preview.applyAppearance(now);
    preview.applyGrowth(growthStage(completedTopicCount())); // the sprout as it is now, from real progress
  }
  refresh();
}
