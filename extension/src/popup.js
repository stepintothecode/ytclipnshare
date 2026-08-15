// Connects the popup to core/ and the tab's player. No rules live here.

import { ClipRange } from '../core/clip-range.js';
import { parseVideoReference } from '../core/video-reference.js';
import { buildLinks, DEFAULT_OPTIONS } from '../core/youtube-embed.js';
import { formatClock, parseClock } from '../core/time.js';
import { TabPlayer } from './tab-player.js';

const el = (id) => document.getElementById(id);

const state = {
  videoId: null,
  range: ClipRange.unknown(),
  options: { ...DEFAULT_OPTIONS },
  player: /** @type {TabPlayer|null} */ (null),
  previewing: false,
};

/* ---------- rendering ---------- */

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
  el('dur').textContent = range.isUnknown ? '' : `Full video: ${formatClock(range.duration)}`;

  const links = currentLinks();
  el('outClip').textContent = links?.clip ?? '-';
  el('outFallback').textContent = links?.fallback ?? '-';
  for (const id of ['copyClip', 'openClip', 'copyFallback']) {
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
  toast.timer = setTimeout(() => node.classList.remove('on'), 1400);
}

function showNotice(message) {
  el('noticeText').textContent = message;
  el('notice').classList.add('on');
  el('stage').classList.remove('on');
}

/* ---------- start-up ---------- */

async function start() {
  const player = await TabPlayer.forActiveTab();
  if (!player) {
    showNotice('Open a YouTube video, then click YTClipNShare again.');
    return;
  }

  const tab = await player.read();
  if (!tab.videoId) {
    showNotice('This YouTube page isn’t a video. Open one, then click YTClipNShare again.');
    return;
  }
  if (tab.duration === 0) {
    showNotice('Give the video a second to load, then click YTClipNShare again.');
    return;
  }

  state.player = player;
  state.videoId = tab.videoId;
  el('videoTitle').textContent = tab.title || 'Share just the part that matters';
  el('videoTitle').title = tab.title ?? '';
  el('notice').classList.remove('on');
  el('stage').classList.add('on');
  setRange(ClipRange.of(tab.duration));
}

/* ---------- wiring ---------- */

el('rStart').addEventListener('input', (e) => {
  stopPreview();
  setRange(state.range.withStart(Number(e.target.value)));
  state.player?.seek(state.range.start);
});

el('rEnd').addEventListener('input', (e) => {
  stopPreview();
  setRange(state.range.withEnd(Number(e.target.value)));
  state.player?.seek(state.range.end);
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
    state.player?.seek(isStart ? state.range.start : state.range.end);
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
  button.addEventListener('click', async () => {
    if (!state.player) return;
    const isStart = button.dataset.set === 'start';
    const at = await state.player.currentTime();
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
  state.player?.seek(state.range.start);
});

el('nudgeFwd').addEventListener('click', () => {
  setRange(state.range.nudgeEnd(1));
  state.player?.seek(state.range.end);
});

function stopPreview() {
  if (!state.previewing) return;
  state.previewing = false;
  el('preview').textContent = '▶︎ Preview in tab';
  state.player?.stop();
}

el('preview').addEventListener('click', () => {
  if (state.previewing) {
    stopPreview();
    return;
  }
  state.previewing = true;
  el('preview').textContent = '⏸ Stop preview';
  state.player?.playRange(state.range.start, state.range.end);
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
  });
}

/* ---------- copy and open ---------- */

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copied');
  } catch {
    toast('Copy failed, select it manually');
  }
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
  if (links) chrome.tabs.create({ url: links.clip });
});

/* ---------- when the popup opens off YouTube ---------- */

el('open').addEventListener('click', async () => {
  const reference = parseVideoReference(el('url').value);
  if (!reference) {
    el('urlErr').textContent = 'Couldn’t find a YouTube link in that.';
    el('urlErr').classList.add('on');
    return;
  }
  const at = reference.startAt > 0 ? `&t=${reference.startAt}` : '';
  await TabPlayer.openInActiveTab(
    `https://www.youtube.com/watch?v=${reference.id}${at}`,
  );
  window.close();
});

el('url').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') el('open').click();
});

/* ---------- hint ---------- */

el('hintBtn').addEventListener('click', () => el('hintDlg').showModal());
el('hintClose').addEventListener('click', () => el('hintDlg').close());
el('hintDlg').addEventListener('click', (e) => {
  // A click on the backdrop lands on the dialog element itself.
  if (e.target === el('hintDlg')) el('hintDlg').close();
});

start();
