// Connects the page to core/ and the player. No rules live here.

import { ClipRange } from '../../core/clip-range.js';
import { parseVideoReference } from '../../core/video-reference.js';
import { buildLinks, DEFAULT_OPTIONS } from '../../core/youtube-embed.js';
import { formatClock, parseClock } from '../../core/time.js';
import { describeFailure } from '../../core/player-port.js';
import { IframePlayer } from './iframe-player.js';
import { mountSupportFooter } from './support-footer.js';

const el = (id) => document.getElementById(id);

const state = {
  videoId: null,
  range: ClipRange.unknown(),
  options: { ...DEFAULT_OPTIONS },
};

const player = new IframePlayer('player');
player.onFailure((error) => showAlert('embedWarn', describeFailure(error.reason)));

mountSupportFooter(el('support'), 'web');

/* ---------- rendering ---------- */

/** Built when asked for. Nothing is stored for the buttons to look up later. */
function currentLinks() {
  if (!state.videoId || state.range.isUnknown) return null;
  return buildLinks(state.videoId, state.range, state.options);
}

function render() {
  const { range } = state;

  el('rStart').max = el('rEnd').max = Math.max(1, range.duration);
  el('rStart').value = range.start;
  el('rEnd').value = range.end;

  // Leave a time box alone while someone is typing in it.
  if (document.activeElement !== el('tStart')) el('tStart').value = formatClock(range.start);
  if (document.activeElement !== el('tEnd')) el('tEnd').value = formatClock(range.end);

  const percent = (v) => (range.duration ? (v / range.duration) * 100 : 0);
  el('fill').style.left = `${percent(range.start)}%`;
  el('fill').style.width = `${Math.max(0, percent(range.end) - percent(range.start))}%`;

  el('len').textContent = formatClock(range.length);
  el('len').className = `len${range.isLong ? ' bad' : ''}`;

  const links = currentLinks();
  el('outClip').textContent = links?.clip ?? '-';
  el('outFallback').textContent = links?.fallback ?? '-';
  for (const id of ['copyClip', 'shareClip', 'openClip', 'copyFallback']) {
    el(id).disabled = links === null;
  }
}

function setRange(next) {
  state.range = next;
  render();
}

function toast(message) {
  const node = el('toast');
  node.textContent = message;
  node.classList.add('on');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => node.classList.remove('on'), 1600);
}

function showAlert(id, message) {
  const node = el(id);
  node.textContent = message ?? '';
  node.classList.toggle('on', Boolean(message));
}

/* ---------- loading a video ---------- */

async function loadFrom(text) {
  const reference = parseVideoReference(text);
  if (!reference) {
    showAlert('urlErr', 'Couldn’t find a YouTube link in that. Paste a full link, or the 11-character video ID.');
    return;
  }

  showAlert('urlErr', '');
  showAlert('embedWarn', '');
  state.videoId = reference.id;
  setRange(ClipRange.unknown());

  el('stage').classList.add('on');
  el('dur').textContent = 'Loading…';
  setTimeout(() => el('stage').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);

  try {
    const { duration } = await player.load(reference.id, {
      startAt: reference.startAt,
      ...state.options,
    });
    el('dur').textContent = `Full video: ${formatClock(duration)}`;
    setRange(state.range.withDuration(duration, reference.startAt));
  } catch (error) {
    el('dur').textContent = '';
    showAlert(
      error.reason === 'not-found' || error.reason === 'bad-id' ? 'urlErr' : 'embedWarn',
      describeFailure(error.reason),
    );
  }
}

/** Privacy mode uses a different origin, so the preview has to be rebuilt. */
async function rebuildPreview() {
  if (!state.videoId || state.range.isUnknown) return;
  try {
    await player.load(state.videoId, { startAt: state.range.start, ...state.options });
  } catch (error) {
    showAlert('embedWarn', describeFailure(error.reason));
  }
}

/* ---------- wiring ---------- */

el('load').addEventListener('click', () => loadFrom(el('url').value));
el('url').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadFrom(el('url').value);
});

el('rStart').addEventListener('input', (e) => {
  stopPreview();
  setRange(state.range.withStart(Number(e.target.value)));
  player.seek(state.range.start);
});

el('rEnd').addEventListener('input', (e) => {
  stopPreview();
  setRange(state.range.withEnd(Number(e.target.value)));
  player.seek(state.range.end);
});

function bindTimeBox(inputId, isStart) {
  const input = el(inputId);
  const apply = () => {
    const seconds = parseClock(input.value);
    // Text we cannot read snaps back to the range we already had.
    if (seconds === null) {
      render();
      return;
    }
    setRange(isStart ? state.range.withStart(seconds) : state.range.withEnd(seconds));
    player.seek(isStart ? state.range.start : state.range.end);
  };
  input.addEventListener('change', apply);
  input.addEventListener('blur', apply);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
  });
}
bindTimeBox('tStart', true);
bindTimeBox('tEnd', false);

for (const button of document.querySelectorAll('[data-set]')) {
  button.addEventListener('click', () => {
    const isStart = button.dataset.set === 'start';
    const at = player.currentTime();
    stopPreview();
    setRange(isStart ? state.range.withStart(at) : state.range.withEnd(at));
    toast(
      isStart
        ? `Start set to ${formatClock(state.range.start)}`
        : `End set to ${formatClock(state.range.end)}`,
    );
  });
}

el('nudgeBack').addEventListener('click', () => {
  setRange(state.range.nudgeStart(-1));
  player.seek(state.range.start);
});

el('nudgeFwd').addEventListener('click', () => {
  setRange(state.range.nudgeEnd(1));
  player.seek(state.range.end);
});

function stopPreview() {
  player.stop();
  el('preview').textContent = '▶︎ Preview clip';
}

el('preview').addEventListener('click', () => {
  if (player.isPreviewing) {
    stopPreview();
    player.pause();
    return;
  }
  player.playRange(state.range.start, state.range.end, stopPreview);
  el('preview').textContent = '⏸ Stop preview';
});

const OPTION_INPUTS = {
  oRel: 'hideRelated',
  oLoop: 'loop',
  oAuto: 'autoplay',
  oNoCookie: 'privacy',
};

for (const [inputId, option] of Object.entries(OPTION_INPUTS)) {
  el(inputId).addEventListener('change', (e) => {
    state.options = { ...state.options, [option]: e.target.checked };
    render();
    if (option === 'privacy') rebuildPreview();
  });
}

/* ---------- copy and share ---------- */

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied');
  } catch {
    legacyCopy(text);
  }
}

/** For browsers without clipboard access. */
function legacyCopy(text) {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  field.setSelectionRange(0, 99999);
  try {
    document.execCommand('copy');
    toast('Copied');
  } catch {
    toast('Copy failed, select it manually');
  }
  field.remove();
}

el('copyClip').addEventListener('click', () => {
  const links = currentLinks();
  if (links) copy(links.clip);
});

el('copyFallback').addEventListener('click', () => {
  const links = currentLinks();
  if (links) copy(links.fallback);
});

el('openClip').addEventListener('click', () => {
  const links = currentLinks();
  if (links) window.open(links.clip, '_blank', 'noopener');
});

el('shareClip').addEventListener('click', () => {
  const links = currentLinks();
  if (!links) return;
  const text = `Watch ${formatClock(state.range.start)} to ${formatClock(state.range.end)}`;
  if (navigator.share) {
    navigator.share({ title: 'YouTube clip', text, url: links.clip }).catch(() => {});
  } else {
    copy(links.clip);
  }
});

if (!navigator.share) el('shareClip').style.display = 'none';

/* ---------- hint ---------- */

el('hintBtn').addEventListener('click', () => el('hintDlg').showModal());
el('hintClose').addEventListener('click', () => el('hintDlg').close());
el('hintDlg').addEventListener('click', (e) => {
  // A click on the backdrop lands on the dialog element itself.
  if (e.target === el('hintDlg')) el('hintDlg').close();
});

/* ---------- opened from a link or an Android share ---------- */

// v= is the deep link and the shared URL. text= is what Android sends when it
// passes a title and a link together.
const params = new URLSearchParams(location.search);
const shared = params.get('v') ?? params.get('text');
if (shared) {
  el('url').value = shared;
  loadFrom(shared);
}

render();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
