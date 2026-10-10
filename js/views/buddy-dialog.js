// Header menu → StudyHub Buddy: the customization studio.
//
// Works whether or not Buddy is visible — this is the one place to switch it
// back on. Every change applies at once and is saved (js/buddy/settings.js);
// the preview at the top shows the look (and, on request, a feeling) live.
//
// Layout: the on/off switch with the preview, quick actions (pause, rescue,
// toss, quiz, fact), then eight sections as tabs (one visible at a time, so
// there is a single scroll area): Appearance · Personality · Movement ·
// Emotions · Interactions · Study · Accessibility · Profiles.
//
// Controls are built once per opening; refresh() re-reads the settings and
// syncs every control, so presets, profiles, Surprise Me and resets (which
// change many fields at once) show up everywhere without rebuilding the DOM
// (and without moving keyboard focus).

import { el, announce } from '../util.js';
import * as settings from '../buddy/settings.js';
import { ask, toss, rescue, resetPosition } from '../buddy/buddy.js';
import { createCharacter, restPose, growthStage } from '../buddy/character.js';
import { emotionPose } from '../buddy/emotion.js';
import { completedTopicCount } from '../buddy/companion.js';

const SECTIONS = [
  ['appearance', 'Appearance'],
  ['personality', 'Personality'],
  ['movement', 'Movement'],
  ['emotions', 'Emotions'],
  ['interactions', 'Interactions'],
  ['study', 'Study'],
  ['accessibility', 'Accessibility'],
  ['profiles', 'Profiles'],
];
const FEELINGS = [['neutral', 'Calm'], ['happy', 'Happy'], ['curious', 'Curious'], ['dizzy', 'Dizzy'], ['frightened', 'Frightened'], ['crying', 'Crying'], ['comforted', 'Comforted'], ['sleepy', 'Sleepy']];
const PERSONALITY_HINTS = {
  gentle: 'Subtle movement, soft expressions, fewer optional reactions and prompts.',
  playful: 'Varied idle habits, playful faces and bouncier (still bounded) reactions.',
  curious: 'Looks around more and explores safe surfaces such as the sidebar edge.',
  sleepy: 'Rests and yawns more, with sleepy expressions.',
  energetic: 'Livelier idle poses and bigger celebrations for real learning milestones.',
  custom: 'Your own mix: every control below and in the other sections is yours to set.',
};
const MOTION_HINTS = {
  system: 'Full movement, but calm whenever your device asks for reduced motion.',
  full: 'All movement, even if your device asks for reduced motion. Choose this only if motion does not bother you.',
  gentle: 'Fewer hops and climbs, softer optional movement and less frequent idle activity.',
  minimal: 'Buddy sits still: no walking, climbing or throwing, and no decorative effects.',
};

let activeSection = 'appearance'; // remembered while the page is open
let undoLook = null; // the look before the last Surprise Me

export function openBuddySettings() {
  const dialog = document.getElementById('buddy-dialog');
  render(dialog.querySelector('.dialog-body'));
  if (!dialog.open) dialog.showModal();
}

function render(body) {
  const syncs = []; // functions (s) => void that bring a control up to date
  let previewFeeling = 'neutral';
  const save = (patch) => {
    settings.save(patch);
    refresh();
  };
  const closeDialog = () => document.getElementById('buddy-dialog').close();

  // ---- Live preview (decorative) ----
  const preview = createCharacter();
  function drawPreview(s) {
    preview.applyAppearance(s);
    preview.applyGrowth(growthStage(completedTopicCount())); // the sprout as it is now, from real progress
    const pose = { ...restPose(), turn: 0.4 };
    if (previewFeeling !== 'neutral') emotionPose(pose, previewFeeling, { t: 0.6, phase: 0.4, calm: true, particles: true, intensity: 1 });
    preview.applyPose(pose);
  }

  // ---- Small control builders ----
  const fieldId = (path) => `buddy-${path.replace('features.', 'f-').replace('interact.', 'i-')}`;
  const readPath = (s, path) => path.split('.').reduce((o, k) => o?.[k], s);
  const patchFor = (path, value) => {
    const [a, b] = path.split('.');
    return b ? { [a]: { [b]: value } } : { [a]: value };
  };

  function select(field, label, hint, { onChange, describe } = {}) {
    const hintNode = hint || describe ? el('span', { class: 'field-hint', id: `buddy-${field}-hint` }, hint || '') : null;
    const node = el('select', { class: 'select', id: `buddy-${field}`, 'aria-describedby': hintNode ? `buddy-${field}-hint` : null },
      settings.OPTIONS[field].map(([value, text]) => el('option', { value }, text)));
    node.addEventListener('change', () => (onChange ? onChange(node.value) : save({ [field]: node.value })));
    syncs.push((s) => {
      node.value = s[field];
      if (describe) hintNode.textContent = describe(s);
    });
    return el('div', { class: 'field' }, el('label', { for: node.id }, label), node, hintNode);
  }

  function check(path, label, hint) {
    const input = el('input', { type: 'checkbox', id: fieldId(path) });
    input.addEventListener('change', () => save(patchFor(path, input.checked)));
    syncs.push((s) => { input.checked = Boolean(readPath(s, path)); });
    return el('div', { class: 'check-row' }, input,
      el('label', { for: input.id }, el('span', {}, label), hint ? el('span', { class: 'field-hint' }, hint) : null));
  }

  /** Low / Balanced / High as a radio group (one Tab stop; arrow keys choose). */
  function level(field, label, hint) {
    const name = `buddy-${field}`;
    const inputs = settings.LEVELS.map(([value, text]) => {
      const input = el('input', { type: 'radio', name, id: `${name}-${value}`, value, class: 'buddy-seg-input' });
      input.addEventListener('change', () => { if (input.checked) save({ [field]: value }); });
      return [input, el('label', { for: input.id, class: 'buddy-seg-label' }, text)];
    });
    syncs.push((s) => { for (const [input] of inputs) input.checked = input.value === s[field]; });
    return el('fieldset', { class: 'buddy-level', 'aria-describedby': hint ? `${name}-hint` : null },
      el('legend', {}, label),
      el('div', { class: 'buddy-seg' }, inputs.flat()),
      hint ? el('span', { class: 'field-hint', id: `${name}-hint` }, hint) : null);
  }

  function range(field, label, { min, max, step, format }) {
    const out = el('output', { class: 'buddy-range-value', for: `buddy-${field}` });
    const input = el('input', { type: 'range', id: `buddy-${field}`, min, max, step, class: 'buddy-range' });
    input.addEventListener('input', () => {
      out.textContent = format(Number(input.value));
      settings.save({ [field]: Number(input.value) });
      drawPreview(settings.get()); // live while dragging; the full refresh happens on change
    });
    input.addEventListener('change', () => refresh());
    syncs.push((s) => {
      input.value = String(s[field]);
      out.textContent = format(s[field]);
      input.setAttribute('aria-valuetext', format(s[field]));
    });
    return el('div', { class: 'field' }, el('label', { for: input.id }, label, ' ', out), input);
  }

  function color(field, label) {
    const input = el('input', { type: 'color', id: field === 'color' ? 'buddy-color-custom' : `buddy-${field}`, class: 'buddy-color-input' });
    input.addEventListener('change', () => save({ [field]: input.value }));
    syncs.push((s) => { input.value = s[field] || '#ffffff'; });
    return el('div', { class: 'field' }, el('label', { for: input.id }, label), input);
  }

  const button = (text, id, onClick, variant = 'secondary') => {
    const b = el('button', { type: 'button', class: `btn btn-${variant} btn-sm`, id }, text);
    b.addEventListener('click', onClick);
    return b;
  };
  const section = (title, ...children) => el('section', { class: 'buddy-group' }, el('h3', { class: 'buddy-group-title' }, title), ...children);
  const fields = (...children) => el('div', { class: 'buddy-fields' }, ...children);

  // ---- Header: on/off + preview ----
  const stateText = el('span', { class: 'buddy-switch-state', id: 'buddy-enabled-state' });
  const toggle = el('input', { type: 'checkbox', role: 'switch', id: 'buddy-enabled', class: 'buddy-switch-input', 'aria-describedby': 'buddy-enabled-state' });
  toggle.addEventListener('change', () => {
    save({ enabled: toggle.checked });
    announce(toggle.checked ? 'StudyHub Buddy enabled' : 'StudyHub Buddy disabled');
  });
  syncs.push((s) => {
    toggle.checked = s.enabled;
    stateText.textContent = s.enabled ? 'Enabled' : 'Disabled';
  });

  // Preview a feeling on the picture (nothing is saved).
  const feelingButtons = FEELINGS.map(([kind, text]) => {
    const b = el('button', { type: 'button', class: 'buddy-feel', 'aria-pressed': String(kind === previewFeeling) }, text);
    b.addEventListener('click', () => {
      previewFeeling = kind;
      for (const other of feelingButtons) other.setAttribute('aria-pressed', String(other === b));
      drawPreview(settings.get());
    });
    return b;
  });

  // ---- Quick actions ----
  const pauseStatus = el('span', { class: 'buddy-pause-status', id: 'buddy-pause-status', 'aria-live': 'polite' });
  const pause5 = button('Pause 5 min', 'buddy-pause-5', () => { settings.pause(5 * 60_000); refresh(); announce('Buddy paused for 5 minutes'); });
  const pause30 = button('Pause 30 min', 'buddy-pause-30', () => { settings.pause(30 * 60_000); refresh(); announce('Buddy paused for 30 minutes'); });
  const resume = button('Resume', 'buddy-resume', () => { settings.pause(0); refresh(); announce('Buddy resumed'); });
  const rescueBtn = button('Rescue Buddy', 'buddy-rescue', () => {
    announce(rescue() ? 'Buddy is back on a safe spot' : 'Buddy is switched off');
  });
  const quizBtn = button('Quiz me now', 'buddy-try-quiz', () => { closeDialog(); ask('quiz'); });
  const factBtn = button('Tell me a fact', 'buddy-try-fact', () => { closeDialog(); ask('fact'); });
  // The keyboard and screen-reader alternative to picking Buddy up and throwing it.
  const tossBtn = button('Toss Buddy', 'buddy-toss', () => {
    closeDialog();
    announce(toss() ? 'Buddy tossed into the air' : 'Buddy can’t be tossed right now');
  });
  syncs.push((s) => {
    const paused = settings.isPaused(s);
    const reduced = s.motion === 'minimal' || (s.motion !== 'full' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    pauseStatus.textContent = paused ? `Paused until ${new Date(s.pausedUntil).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '';
    for (const b of [pause5, pause30, rescueBtn, quizBtn, factBtn]) b.disabled = !s.enabled;
    pause5.hidden = paused;
    pause30.hidden = paused;
    resume.hidden = !paused;
    tossBtn.disabled = !s.enabled || reduced || paused || !s.interact.toss;
  });

  // ---- Appearance ----
  const paletteChips = settings.PALETTES.map((p) => {
    const input = el('input', { type: 'radio', name: 'buddy-palette', id: `buddy-color-${p.id}`, value: p.id, class: 'buddy-chip-input' });
    input.addEventListener('change', () => { if (input.checked) save({ color: p.color, leafColor: p.leafColor, accent: p.accent }); });
    syncs.push(() => { input.checked = settings.paletteOf()?.id === p.id; });
    return el('span', { class: 'buddy-chip' }, input,
      el('label', { for: input.id },
        el('span', { class: 'buddy-swatch', 'aria-hidden': 'true' },
          el('span', { style: `background:${p.color}` }), el('span', { style: `background:${p.leafColor}` }), el('span', { style: `background:${p.accent || p.color}` })),
        p.label));
  });
  const customChip = el('span', { class: 'buddy-chip buddy-chip-custom' }, el('span', { class: 'buddy-custom-label', id: 'buddy-palette-custom' }, 'Custom colours'));
  syncs.push(() => { customChip.classList.toggle('is-active', !settings.paletteOf()); });

  const accentOn = el('input', { type: 'checkbox', id: 'buddy-accent-on' });
  const accentInput = el('input', { type: 'color', id: 'buddy-accent', class: 'buddy-color-input', 'aria-label': 'Accent colour' });
  accentOn.addEventListener('change', () => save({ accent: accentOn.checked ? accentInput.value : '' }));
  accentInput.addEventListener('change', () => save({ accent: accentInput.value }));
  syncs.push((s) => {
    accentOn.checked = Boolean(s.accent);
    accentInput.disabled = !s.accent;
    accentInput.value = s.accent || '#7b5cd6';
  });

  const surpriseStatus = el('p', { class: 'field-hint buddy-status', 'aria-live': 'polite' });
  const undoBtn = button('Undo surprise', 'buddy-undo-surprise', () => {
    if (!undoLook) return;
    settings.save(undoLook);
    undoLook = null;
    refresh();
    surpriseStatus.textContent = 'Your previous look is back.';
  }, 'ghost');
  syncs.push(() => { undoBtn.disabled = !undoLook; });
  const appearance = el('div', {},
    section('Colours',
      el('div', { class: 'buddy-chips', role: 'radiogroup', 'aria-label': 'Colour palette' }, paletteChips, customChip),
      fields(color('color', 'Body colour'), color('leafColor', 'Leaf colour'),
        el('div', { class: 'field' },
          el('div', { class: 'check-row buddy-accent-row' }, accentOn, el('label', { for: accentOn.id }, el('span', {}, 'Accent for accessories'))),
          accentInput))),
    section('Body and face',
      fields(select('body', 'Body shape'), select('eyes', 'Eyes'), select('shine', 'Eye shine'),
        range('eyeSize', 'Eye size', { min: 0.8, max: 1.25, step: 0.05, format: (v) => `${Math.round(v * 100)}%` }),
        range('eyeSpacing', 'Eye spacing', { min: -3, max: 3, step: 1, format: (v) => (v === 0 ? 'Normal' : v > 0 ? `Wider ${v}` : `Closer ${-v}`) }),
        select('blush', 'Blush'), select('brows', 'Eyebrows', 'Feelings stay readable with every eye style.'))),
    section('Leaf',
      fields(select('leafShape', 'Leaf shape'), select('leafSize', 'Leaf size'), select('leafDetail', 'Leaf detail')),
      check('leafVein', 'Leaf vein', 'A fine line along the leaf'),
      el('p', { class: 'field-hint' }, 'The second leaf, bud and flower still grow only from topics you complete.')),
    section('Accessories',
      fields(select('accessory', 'On the head'), select('extra', 'On the body')),
      check('features.accessories', 'Show accessories', 'Hide them all without losing your choices')),
    el('div', { class: 'buddy-row' },
      button('Surprise me', 'buddy-surprise', () => {
        undoLook = settings.appearanceOf();
        settings.save(settings.surprise());
        refresh();
        surpriseStatus.textContent = 'A new look! Only colours, eyes, leaf and accessories changed. Use “Undo surprise” to go back.';
      }),
      undoBtn,
      button('Reset appearance', 'buddy-reset-appearance', () => {
        undoLook = settings.appearanceOf();
        settings.resetAppearance();
        refresh();
        surpriseStatus.textContent = 'Appearance reset. “Undo surprise” brings the previous look back.';
      }, 'ghost')),
    surpriseStatus);

  // ---- Personality ----
  const adjusted = el('p', { class: 'field-hint', id: 'buddy-personality-adjusted' });
  syncs.push((s) => {
    adjusted.textContent = s.personality !== 'custom' && !settings.matchesPersonality(s) ? 'Adjusted: you have changed some of this preset’s levels.' : '';
  });
  const personality = el('div', {},
    section('Personality',
      fields(select('personality', 'Personality', null, {
        onChange: (value) => { settings.applyPersonality(value); refresh(); announce(`Personality: ${value}. Its levels were applied; you can still change each one.`); },
        describe: (s) => PERSONALITY_HINTS[s.personality],
      })),
      adjusted,
      el('p', { class: 'field-hint' }, 'A preset sets the movement, expression, curiosity and celebration levels once. Change any of them afterwards.')),
    section('Talking',
      fields(select('quiz', 'Optional prompts', 'How often Buddy offers a quiz question or a fact')),
      check('facts', 'Facts', 'Short science, nature, history and maths facts'),
      check('features.bubbles', 'Speech bubbles', 'Unprompted messages. Off: Buddy only talks when you click it or ask here')));

  // ---- Movement ----
  const movement = el('div', {},
    section('How Buddy moves',
      fields(select('movement', 'Idle movement frequency')),
      level('speed', 'Movement speed', 'Walking and climbing only — falls and throws keep their real physics.'),
      level('jumps', 'Jumping'),
      level('curiosity', 'Curiosity', 'Looking around and exploring safe surfaces')),
    section('Habits and exploring',
      check('features.habits', 'Idle habits', 'Inspecting, shifting weight, fiddling with the leaf, hops'),
      check('features.glances', 'Glances', 'Eyes follow a nearby mouse; glances at search and around'),
      check('interact.explore', 'Explore the sidebar', 'Climbing the sidebar edge when it is open'),
      check('features.nearMiss', 'Balancing at edges', 'Arms out when it lands at the very end of the floor'),
      check('features.catching', 'Catch edges while falling', 'Grab the sidebar edge if it is really within reach')),
    section('Where Buddy rests',
      fields(select('rest', 'Resting preference', 'A preference only: Buddy always moves off anything you need.')),
      check('rememberSpot', 'Remember my spot', 'Return to the last clear spot during this visit (nothing is stored)'),
      el('p', { class: 'field-hint' }, 'Buddy always steps aside from text, controls, search results, quizzes, editors and the knowledge map.')));

  // ---- Emotions ----
  const emotions = el('div', {},
    section('How strongly Buddy feels',
      level('expression', 'Expression intensity', 'How big faces are'),
      level('emotion', 'Emotional reactions', 'Low: no tears after a big fall'),
      level('recovery', 'Recovery time', 'How long dizziness, fear and tears last (always brief)')),
    section('Feelings and effects',
      check('features.dizzy', 'Dizzy after spinning', 'Spin Buddy fast while holding it: swirly eyes and wobbly steps'),
      check('features.fear', 'Fear and tears', 'After a high fall: a frightened face, and sometimes a short cry'),
      check('features.particles', 'Decorative particles', 'Stars around the head'),
      check('features.dust', 'Landing dust'),
      check('features.speedLines', 'Speed lines'),
      el('p', { class: 'field-hint' }, 'Turning effects off never turns off safe landings.')));

  // ---- Interactions ----
  const interactions = el('div', {},
    section('Picking Buddy up',
      check('interact.drag', 'Drag Buddy', 'Press and move (touch: press and hold first)'),
      check('interact.throw', 'Throw Buddy', 'Off: letting go just drops it'),
      check('interact.toss', 'Toss button', 'The “Toss Buddy” button above')),
    section('Petting',
      check('features.petting', 'Petting reactions', 'A tap, or stroking back and forth over Buddy; a pat comforts it after a scare'),
      level('petting', 'Petting sensitivity', 'High: one stroke is enough'),
      check('interact.interrupt', 'Clicks interrupt idle habits', 'Buddy stops a small gesture when you reach for it')));

  // ---- Study ----
  const study = el('div', {},
    section('While you study',
      check('features.focusAware', 'Quieter while studying', 'In quizzes, practice, notes, search, simulators and forms: less moving, no unprompted messages'),
      check('quiet', 'Quiet mode', 'No unprompted messages or quizzes; Buddy mostly rests and its leaf droops')),
    section('Celebrations',
      check('features.celebrations', 'Learning celebrations', 'Only after real events: a topic completed, a correct answer'),
      level('celebration', 'Celebration size'),
      check('motivation', 'Motivational messages', 'Only after things you really did, such as completing a topic')));

  // ---- Accessibility ----
  const systemNote = el('p', { class: 'field-hint', id: 'buddy-system-motion' });
  syncs.push(() => {
    systemNote.textContent = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'Your device currently asks for reduced motion.'
      : 'Your device does not ask for reduced motion.';
  });
  const resetStatus = el('p', { class: 'field-hint buddy-status', 'aria-live': 'polite' });
  const accessibility = el('div', {},
    section('Motion',
      fields(select('motion', 'Motion', null, { describe: (s) => MOTION_HINTS[s.motion] })),
      systemNote,
      el('p', { class: 'field-hint' }, 'Pausing is different: it stops Buddy’s optional activity for a while without changing these settings.')),
    section('Reset',
      el('div', { class: 'buddy-row' },
        button('Reset position', 'buddy-reset-position', () => { resetStatus.textContent = resetPosition() ? 'Buddy moved to its resting spot.' : 'Buddy is switched off.'; }),
        button('Reset all Buddy settings', 'buddy-reset', () => {
          settings.reset();
          undoLook = null;
          refresh();
          resetStatus.textContent = 'Buddy settings reset to defaults. Your progress, notes, bookmarks and plans are untouched.';
          announce('Buddy preferences reset to defaults');
        }, 'ghost')),
      resetStatus));

  // ---- Profiles ----
  const profileStatus = el('p', { class: 'field-hint buddy-status', 'aria-live': 'polite', id: 'buddy-profile-status' });
  const profileList = el('ul', { class: 'buddy-profiles', 'aria-label': 'Buddy profiles' });
  const nameInput = el('input', { type: 'text', class: 'input', id: 'buddy-profile-name', maxlength: settings.MAX_NAME, value: 'My Buddy', autocomplete: 'off' });
  const saveProfileBtn = button('Save current settings', 'buddy-profile-save', () => {
    const r = settings.saveProfile(nameInput.value);
    profileStatus.textContent = r.ok ? `Saved “${r.profile.name}”.` : r.reason;
    drawProfiles();
  }, 'primary');
  function drawProfiles() {
    const custom = settings.listProfiles();
    const row = (p, builtIn) => {
      const name = el('span', { class: 'buddy-profile-name' }, p.name, builtIn ? el('span', { class: 'buddy-profile-tag' }, 'Built-in') : null);
      const apply = button('Apply', null, () => {
        const r = settings.applyProfile(p.id);
        refresh();
        profileStatus.textContent = r.ok ? `Applied “${p.name}”.` : r.reason;
      });
      apply.setAttribute('aria-label', `Apply ${p.name}`);
      const dup = button('Duplicate', null, () => {
        const r = settings.duplicateProfile(p.id);
        profileStatus.textContent = r.ok ? `Saved a copy: “${r.profile.name}”.` : r.reason;
        drawProfiles();
      }, 'ghost');
      dup.setAttribute('aria-label', `Duplicate ${p.name}`);
      const actions = [apply, dup];
      if (!builtIn) {
        const rename = button('Rename', null, () => startRename(item, p), 'ghost');
        rename.setAttribute('aria-label', `Rename ${p.name}`);
        const del = button('Delete', null, () => {
          const r = settings.deleteProfile(p.id);
          profileStatus.textContent = r.ok ? `Deleted “${p.name}”.` : r.reason;
          drawProfiles();
          saveProfileBtn.focus();
        }, 'ghost');
        del.setAttribute('aria-label', `Delete ${p.name}`);
        actions.push(rename, del);
      }
      const item = el('li', { class: 'buddy-profile' }, name, el('span', { class: 'buddy-profile-actions' }, actions));
      return item;
    };
    profileList.replaceChildren(...settings.BUILTIN_PROFILES.map((p) => row(p, true)), ...custom.map((p) => row(p, false)));
    saveProfileBtn.disabled = custom.length >= settings.MAX_PROFILES;
  }
  function startRename(item, p) {
    const input = el('input', { type: 'text', class: 'input', maxlength: settings.MAX_NAME, value: p.name, 'aria-label': `New name for ${p.name}` });
    const ok = button('Save name', null, () => {
      const r = settings.renameProfile(p.id, input.value);
      profileStatus.textContent = r.ok ? `Renamed to “${r.profile.name}”.` : r.reason;
      drawProfiles();
    }, 'primary');
    const cancel = button('Cancel', null, () => drawProfiles(), 'ghost');
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') ok.click();
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); drawProfiles(); }
    });
    item.replaceChildren(input, el('span', { class: 'buddy-profile-actions' }, ok, cancel));
    input.focus();
    input.select();
  }
  drawProfiles();
  const profiles = el('div', {},
    section('Profiles',
      el('p', { class: 'field-hint' }, `Save up to ${settings.MAX_PROFILES} named sets of Buddy settings and switch between them. Profiles hold Buddy’s settings only — never your notes, bookmarks, plans or progress.`),
      profileList,
      el('div', { class: 'buddy-profile-new' },
        el('div', { class: 'field' }, el('label', { for: nameInput.id }, 'Profile name'), nameInput),
        saveProfileBtn),
      profileStatus));

  // ---- Tabs ----
  const panels = { appearance, personality, movement, emotions, interactions, study, accessibility, profiles };
  const tabs = SECTIONS.map(([id, label]) => el('button', {
    type: 'button', role: 'tab', id: `buddy-tab-${id}`, class: 'buddy-tab', 'aria-controls': `buddy-panel-${id}`,
  }, label));
  const panelNodes = SECTIONS.map(([id]) => el('div', {
    role: 'tabpanel', id: `buddy-panel-${id}`, class: 'buddy-panel', 'aria-labelledby': `buddy-tab-${id}`, tabindex: '-1',
  }, panels[id]));
  function showSection(id, { focusTab = false } = {}) {
    activeSection = id;
    SECTIONS.forEach(([sid], i) => {
      const on = sid === id;
      tabs[i].setAttribute('aria-selected', String(on));
      tabs[i].tabIndex = on ? 0 : -1;
      panelNodes[i].hidden = !on;
      if (on && focusTab) tabs[i].focus();
    });
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => showSection(SECTIONS[i][0]));
    tab.addEventListener('keydown', (event) => {
      const n = SECTIONS.length;
      const to = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 }[event.key];
      if (to === undefined) return;
      event.preventDefault();
      showSection(SECTIONS[(to + n) % n][0], { focusTab: true });
    });
  });

  body.replaceChildren(
    el('div', { class: 'buddy-switch' },
      el('span', { class: 'buddy-preview', 'aria-hidden': 'true' }, preview.root),
      el('div', { class: 'buddy-switch-text' },
        el('label', { for: 'buddy-enabled', class: 'buddy-switch-label' }, 'StudyHub Buddy'),
        el('p', { class: 'muted small' }, 'A small companion that lives at the edges of the page. It reacts to how it is handled and to what you really study, steps out of your way, and never plays sound.')),
      el('span', { class: 'buddy-switch-control' }, toggle, stateText)),
    el('div', { class: 'buddy-feelings', role: 'group', 'aria-label': 'Preview a feeling on the picture' },
      el('span', { class: 'buddy-feelings-label' }, 'Preview:'), feelingButtons),
    el('div', { class: 'buddy-quick', role: 'group', 'aria-label': 'Quick actions' },
      pause5, pause30, resume, rescueBtn, tossBtn, quizBtn, factBtn, pauseStatus),
    el('div', { class: 'buddy-tabs', role: 'tablist', 'aria-label': 'Buddy settings sections' }, tabs),
    ...panelNodes,
    el('p', { class: 'muted small buddy-note' }, 'Saved only in this browser, separately from your progress. Progress backups do not include Buddy’s settings or profiles.'));
  showSection(activeSection);

  function refresh() {
    const s = settings.get();
    for (const sync of syncs) sync(s);
    drawPreview(s);
  }
  refresh();
}
