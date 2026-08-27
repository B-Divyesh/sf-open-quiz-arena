import './style.css';
import { decodeQuiz, encodeQuiz, parseCsv, type Question, type Quiz } from './quiz';

type Phase = 'lobby' | 'question' | 'leaderboard' | 'finished';
interface Current { number: number; total: number; prompt: string; answers: string[]; correct_index?: number; time_limit_seconds: number; answered: number }
interface Leader { nickname: string; score: number; streak: number }
interface Me { nickname: string; score: number; answered: boolean; choice?: number; correct?: boolean; points?: number }
interface RoomState { type: 'state'; code: string; quiz_title: string; phase: Phase; player_count: number; host_connected: boolean; current?: Current; leaderboard: Leader[]; me?: Me; revision: number }

const app = document.querySelector<HTMLDivElement>('#app') as HTMLDivElement;
if (!app) throw new Error('App root is missing');

let draft: Quiz = loadSharedQuiz() ?? {
  title: '', questions: [blankQuestion(), blankQuestion()]
};
let socket: WebSocket | undefined;
let roomState: RoomState | undefined;
let reconnectAttempts = 0;
let socketRole: 'host' | 'player' | undefined;
let socketCode = '';
let socketToken = '';
let connectionStatus: 'connecting' | 'live' | 'offline' = 'connecting';

function blankQuestion(): Question { return { prompt: '', answers: ['', '', '', ''], correct_index: 0, time_limit_seconds: 20 }; }
function escapeHtml(value: unknown): string { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character); }
function shell(content: string, options: { compact?: boolean } = {}): string {
  return `<div class="site-shell ${options.compact ? 'site-shell--compact' : ''}">
    <header class="topbar"><a class="brand" href="/" data-route aria-label="Open Quiz Arena home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>OPEN QUIZ ARENA</span></a><span class="no-account">No accounts. No player cap.</span></header>
    <main id="main" tabindex="-1">${content}</main>
    <footer><span>Built for the whole room.</span><nav aria-label="Legal"><a href="/privacy" data-route>Privacy</a><a href="/terms" data-route>Terms</a></nav></footer>
  </div>`;
}

function route(): void {
  closeSocket();
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  if (path === '/privacy') return renderLegal('Privacy');
  if (path === '/terms') return renderLegal('Terms');
  if (path === '/create') return renderEditor();
  if (path === '/host' && params.get('room')) return restoreHost(params.get('room')!);
  if (path === '/play' && params.get('room')) { void renderNickname(params.get('room')!); return; }
  if (path === '/play') return renderJoin();
  renderHome();
}

function navigate(path: string): void { history.pushState({}, '', path); route(); }

function renderHome(): void {
  app.innerHTML = shell(`<section class="hero">
    <div class="hero-copy"><p class="eyebrow"><span></span> The free lane is open</p><h1>One live quiz.<br><em>Everybody plays.</em></h1>
      <p class="lede">Run a fast classroom game for 4 or 400—no student accounts, no artificial cap, no quiz library left behind.</p>
      <div class="hero-actions"><button class="button button--lime" data-nav="/create">Build a quiz <span aria-hidden="true">→</span></button><button class="button button--ghost" data-nav="/play">Join a room</button></div>
      <ul class="trust-row" aria-label="Product promises"><li>6-digit entry</li><li>Quiz-as-link</li><li>Auto-deleted rooms</li></ul>
    </div>
    <div class="arena-preview" aria-label="Illustration of a live quiz scoreboard">
      <div class="preview-head"><span>LIVE · Q 4/8</span><span>27 PLAYING</span></div>
      <p class="preview-question">Which layer of Earth moves beneath the crust?</p>
      <div class="preview-lanes"><span><b>A</b> Inner core</span><span><b>B</b> Mantle</span><span><b>C</b> Outer core</span><span><b>D</b> Atmosphere</span></div>
      <div class="signal-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    </div>
  </section><section class="how"><p class="section-number">01 / HOW IT RUNS</p><h2>From blank page to full-room energy in three moves.</h2><ol><li><b>Build or import</b><span>Type questions or drop in a clean CSV.</span></li><li><b>Put up the code</b><span>Learners enter one nickname on any phone.</span></li><li><b>Control the pace</b><span>You reveal every answer and the final podium.</span></li></ol></section>`);
  bindGlobal();
}

function renderJoin(error = ''): void {
  app.innerHTML = shell(`<section class="center-panel"><p class="eyebrow"><span></span> Player entry</p><h1>Enter the arena.</h1><p>Your host has a six-digit code.</p>
    ${error ? alertBox(error) : ''}<form id="join-code" class="join-form"><label for="room-code">Room code</label><input class="code-input" id="room-code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required autofocus aria-describedby="code-hint"><small id="code-hint">Six numbers, shown on the host screen.</small><button class="button button--lime">Continue <span aria-hidden="true">→</span></button></form></section>`);
  bindGlobal();
  document.querySelector<HTMLFormElement>('#join-code')?.addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const code = new FormData(form).get('code')?.toString().replace(/\D/g, ''); if (code?.length === 6) navigate(`/play?room=${code}`); });
}

async function renderNickname(code: string, error = ''): Promise<void> {
  const stored = sessionStorage.getItem(`arena:player:${code}`);
  if (stored) { const parsed = JSON.parse(stored) as { token: string; nickname: string }; return connectPlayer(code, parsed.token, parsed.nickname); }
  app.innerHTML = shell(`<section class="center-panel"><p class="room-chip">ROOM ${escapeHtml(code)}</p><h1>Choose your arena name.</h1><p>Use a name your teacher will recognize. We discard it when the room expires.</p>${error ? alertBox(error) : ''}
  <form id="nickname-form" class="join-form"><label for="nickname">Nickname</label><input id="nickname" name="nickname" maxlength="24" autocomplete="nickname" required autofocus><button class="button button--lime">Join room <span aria-hidden="true">→</span></button></form></section>`);
  bindGlobal();
  document.querySelector<HTMLFormElement>('#nickname-form')?.addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const button = form.querySelector('button'); if (button) button.setAttribute('disabled', '');
    try {
      const result = await api<{ player_token: string; nickname: string }>(`/api/rooms/${code}/join`, { method: 'POST', body: JSON.stringify({ nickname: new FormData(form).get('nickname') }) });
      sessionStorage.setItem(`arena:player:${code}`, JSON.stringify({ token: result.player_token, nickname: result.nickname })); connectPlayer(code, result.player_token, result.nickname);
    } catch (reason) { renderNickname(code, messageOf(reason)); }
  });
}

function syncDraft(form?: HTMLFormElement | null): void {
  if (!form) return;
  const data = new FormData(form);
  draft.title = data.get('title')?.toString() ?? '';
  draft.questions = draft.questions.map((_, index) => ({
    prompt: data.get(`q${index}-prompt`)?.toString() ?? '',
    answers: [0, 1, 2, 3].map(answer => data.get(`q${index}-a${answer}`)?.toString() ?? ''),
    correct_index: Number(data.get(`q${index}-correct`) ?? 0),
    time_limit_seconds: Number(data.get(`q${index}-time`) ?? 20)
  }));
}

function renderEditor(error = '', focusId = ''): void {
  app.innerHTML = shell(`<section class="editor"><div class="editor-heading"><div><p class="eyebrow"><span></span> Host desk</p><h1>Build tonight’s board.</h1><p>Questions stay in this browser until you start a live room or copy a share link.</p></div><button class="button button--ghost" id="show-import">Import CSV</button></div>
    ${error ? alertBox(error) : ''}<section id="csv-panel" class="csv-panel" hidden aria-labelledby="csv-title"><h2 id="csv-title">Import questions from CSV</h2><p>Columns: <code>question,answer1,answer2,answer3,answer4,correct,time</code>. Correct is the answer number.</p><div id="csv-errors" tabindex="-1"></div><label for="csv-file">Choose a .csv file</label><input id="csv-file" type="file" accept=".csv,text/csv"><label for="csv-text">Or paste CSV</label><textarea id="csv-text" rows="6" placeholder="question,answer1,answer2,correct,time"></textarea><div class="button-row"><button class="button button--cyan" id="import-csv">Use these questions</button><button class="button button--quiet" id="close-import">Cancel</button></div></section>
    <form id="quiz-form"><label class="title-field" for="quiz-title">Quiz title<input id="quiz-title" name="title" maxlength="100" required value="${escapeHtml(draft.title)}" placeholder="e.g. Friday science sprint"></label>
      <div class="question-list">${draft.questions.map(questionEditor).join('')}</div><div class="editor-actions"><button type="button" class="button button--ghost" id="add-question">+ Add question</button><button class="button button--lime" data-testid="create-room">Open live room <span aria-hidden="true">→</span></button></div></form>
    <p class="data-note">Nothing is uploaded until you open a room. Live room data is automatically erased.</p></section>`);
  bindGlobal(); bindEditor();
  if (focusId) document.getElementById(focusId)?.focus();
}

function questionEditor(question: Question, index: number): string {
  return `<fieldset class="question-card"><legend><span>Q${String(index + 1).padStart(2, '0')}</span> Question ${index + 1}</legend><label for="q${index}-prompt">Prompt<input id="q${index}-prompt" name="q${index}-prompt" maxlength="240" required value="${escapeHtml(question.prompt)}" placeholder="Ask something precise"></label><div class="answer-grid">${question.answers.map((answer, answerIndex) => `<label class="answer-field answer-field--${answerIndex}" for="q${index}-a${answerIndex}"><span>${String.fromCharCode(65 + answerIndex)}</span><input id="q${index}-a${answerIndex}" name="q${index}-a${answerIndex}" maxlength="120" ${answerIndex < 2 ? 'required' : ''} value="${escapeHtml(answer)}" placeholder="${answerIndex < 2 ? 'Required answer' : 'Optional answer'}"></label>`).join('')}</div><div class="question-meta"><label for="q${index}-correct">Correct answer<select id="q${index}-correct" name="q${index}-correct">${[0,1,2,3].map(value => `<option value="${value}" ${question.correct_index === value ? 'selected' : ''}>${String.fromCharCode(65 + value)}</option>`).join('')}</select></label><label for="q${index}-time">Time limit<select id="q${index}-time" name="q${index}-time">${[10,15,20,30,45,60].map(value => `<option value="${value}" ${question.time_limit_seconds === value ? 'selected' : ''}>${value} seconds</option>`).join('')}</select></label>${draft.questions.length > 1 ? `<button type="button" class="remove-question" data-remove="${index}" aria-label="Remove question ${index + 1}">Remove</button>` : ''}</div></fieldset>`;
}

function bindEditor(): void {
  const form = document.querySelector<HTMLFormElement>('#quiz-form');
  document.querySelector('#add-question')?.addEventListener('click', () => { syncDraft(form); if (draft.questions.length < 50) { draft.questions.push(blankQuestion()); renderEditor('', `q${draft.questions.length - 1}-prompt`); } });
  document.querySelectorAll<HTMLElement>('[data-remove]').forEach(button => button.addEventListener('click', () => { syncDraft(form); draft.questions.splice(Number(button.dataset.remove), 1); renderEditor(); }));
  document.querySelector('#show-import')?.addEventListener('click', () => { const panel = document.querySelector<HTMLElement>('#csv-panel'); if (panel) { panel.hidden = false; panel.querySelector('input')?.focus(); } });
  document.querySelector('#close-import')?.addEventListener('click', () => { const panel = document.querySelector<HTMLElement>('#csv-panel'); if (panel) panel.hidden = true; });
  document.querySelector<HTMLInputElement>('#csv-file')?.addEventListener('change', async event => { const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; if (file) { const area = document.querySelector<HTMLTextAreaElement>('#csv-text'); if (area) area.value = await file.text(); } });
  document.querySelector('#import-csv')?.addEventListener('click', () => {
    const source = document.querySelector<HTMLTextAreaElement>('#csv-text')?.value ?? '';
    const result = parseCsv(source, draft.title || 'Imported quiz'); const summary = document.querySelector<HTMLDivElement>('#csv-errors');
    if (result.errors.length) { if (summary) { summary.innerHTML = `<div class="alert" role="alert"><strong>Fix ${result.errors.length} CSV ${result.errors.length === 1 ? 'issue' : 'issues'}:</strong><ul>${result.errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul></div>`; summary.focus(); } return; }
    if (result.quiz) { draft = result.quiz; renderEditor('', 'quiz-title'); }
  });
  form?.addEventListener('submit', async event => {
    event.preventDefault(); syncDraft(form); draft.questions.forEach(question => { question.answers = question.answers.filter(answer => answer.trim()); });
    const button = form.querySelector<HTMLButtonElement>('[data-testid="create-room"]'); button?.setAttribute('disabled', '');
    try {
      const result = await api<{ code: string; host_token: string }>('/api/rooms', { method: 'POST', body: JSON.stringify({ quiz: draft }) });
      sessionStorage.setItem(`arena:host:${result.code}`, result.host_token); sessionStorage.setItem(`arena:quiz:${result.code}`, JSON.stringify(draft)); history.replaceState({}, '', `/host?room=${result.code}`); connectHost(result.code, result.host_token);
    } catch (reason) { renderEditor(messageOf(reason)); }
  });
}

function restoreHost(code: string): void {
  const token = sessionStorage.getItem(`arena:host:${code}`);
  if (!token) { app.innerHTML = shell(`<section class="center-panel"><h1>Host key not found.</h1><p>This browser no longer has the private key for room ${escapeHtml(code)}.</p><button class="button button--lime" data-nav="/create">Build a new room</button></section>`); bindGlobal(); return; }
  const savedQuiz = sessionStorage.getItem(`arena:quiz:${code}`); if (savedQuiz) draft = JSON.parse(savedQuiz) as Quiz;
  connectHost(code, token);
}

function connectHost(code: string, token: string): void { socketRole = 'host'; socketCode = code; socketToken = token; roomState = undefined; renderLive(); openSocket(); }
function connectPlayer(code: string, token: string, nickname: string): void { socketRole = 'player'; socketCode = code; socketToken = token; roomState = undefined; renderLive(nickname); openSocket(); }

function openSocket(): void {
  closeSocket(false); connectionStatus = 'connecting'; renderLive();
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  socket = new WebSocket(`${protocol}//${location.host}/ws/${socketCode}?role=${socketRole}&token=${encodeURIComponent(socketToken)}`);
  socket.addEventListener('open', () => { reconnectAttempts = 0; connectionStatus = 'live'; renderLive(); });
  socket.addEventListener('message', event => { roomState = JSON.parse(event.data as string) as RoomState; renderLive(); });
  socket.addEventListener('close', () => {
    if (!socketRole) return; connectionStatus = 'offline'; renderLive();
    if (reconnectAttempts < 6) { const wait = Math.min(1000 * 2 ** reconnectAttempts, 10_000); reconnectAttempts += 1; window.setTimeout(openSocket, wait); }
  });
}
function closeSocket(clear = true): void { if (socket) { socket.onclose = null; socket.close(); socket = undefined; } if (clear) socketRole = undefined; }

function renderLive(fallbackName = ''): void {
  const state = roomState; const role = socketRole;
  if (!state) {
    app.innerHTML = shell(`<section class="center-panel"><div class="pulse-mark" aria-hidden="true"></div><h1>Connecting to room ${escapeHtml(socketCode)}…</h1><p id="connection-message" role="status">${connectionStatus === 'offline' ? `Connection interrupted. Retry ${reconnectAttempts} of 6…` : 'Opening a live channel…'}</p></section>`, { compact: true }); bindGlobal(); return;
  }
  app.innerHTML = shell(role === 'host' ? hostBoard(state) : playerBoard(state, fallbackName), { compact: true }); bindGlobal(); bindLive();
}

function connectionBadge(state: RoomState): string { return `<div class="connection connection--${connectionStatus}" role="status"><i></i>${connectionStatus === 'live' ? 'Live' : connectionStatus === 'connecting' ? 'Connecting' : `Reconnecting · ${reconnectAttempts}/6`}${socketRole === 'player' && !state.host_connected ? '<span>Host is reconnecting</span>' : ''}</div>`; }
function hostBoard(state: RoomState): string {
  const current = state.current;
  if (state.phase === 'lobby') return `<section class="board lobby-board"><div class="board-top"><div><p>JOIN AT <strong>${escapeHtml(location.host)}/play</strong></p><h1 aria-label="Room code ${state.code.split('').join(' ')}">${state.code}</h1></div>${connectionBadge(state)}</div><div class="lobby-main"><div><p class="eyebrow"><span></span> ${escapeHtml(state.quiz_title)}</p><h2>Room is open.</h2><p class="big-status"><strong>${state.player_count}</strong> ${state.player_count === 1 ? 'player' : 'players'} ready</p><div class="player-cloud">${state.leaderboard.map(player => `<span>${escapeHtml(player.nickname)}</span>`).join('') || '<span class="muted">Waiting for the first player…</span>'}</div></div><aside class="host-tools"><a class="button button--cyan" href="/play?room=${state.code}" target="_blank">Open player entry</a><button class="button button--ghost" id="copy-join">Copy join link</button><button class="button button--ghost" id="copy-quiz">Copy reusable quiz link</button><button class="button button--lime" data-action="start" ${state.player_count < 1 ? 'disabled aria-describedby="start-hint"' : ''}>Start quiz <span aria-hidden="true">→</span></button>${state.player_count < 1 ? '<small id="start-hint">Waiting for at least one player.</small>' : ''}<p id="copy-status" class="sr-status" role="status"></p></aside></div></section>`;
  if (state.phase === 'question' && current) return `<section class="board question-board"><div class="board-strip"><span>Q ${current.number}/${current.total}</span><span>${current.answered}/${state.player_count} LOCKED IN</span>${connectionBadge(state)}</div><h1>${escapeHtml(current.prompt)}</h1><div class="host-answer-grid">${current.answers.map((answer, index) => answerLane(answer, index)).join('')}</div><div class="board-controls"><span>${current.time_limit_seconds}s question</span><button class="button button--lime" data-action="advance">Reveal answer <span aria-hidden="true">→</span></button></div></section>`;
  if (state.phase === 'leaderboard') return `<section class="board results-board"><div class="board-strip"><span>RESULTS · Q ${current?.number}/${current?.total}</span>${connectionBadge(state)}</div><div class="correct-call"><span>CORRECT</span><h1>${current ? `${String.fromCharCode(65 + (current.correct_index ?? 0))} · ${escapeHtml(current.answers[current.correct_index ?? 0])}` : ''}</h1></div>${leaderboard(state.leaderboard)}<div class="board-controls"><span>${state.player_count} in the arena</span><button class="button button--lime" data-action="advance">${current?.number === current?.total ? 'Show final podium' : 'Next question'} <span aria-hidden="true">→</span></button></div></section>`;
  return podium(state, true);
}

function playerBoard(state: RoomState, fallbackName: string): string {
  const current = state.current; const name = state.me?.nickname || fallbackName;
  if (state.phase === 'lobby') return `<section class="player-screen waiting-screen"><div class="player-top"><span>ROOM ${state.code}</span>${connectionBadge(state)}</div><div class="pulse-mark" aria-hidden="true"></div><h1>You’re in, ${escapeHtml(name)}.</h1><p>Look up—the host will start the first question.</p><div class="score-tag">${state.player_count} ready</div></section>`;
  if (state.phase === 'question' && current) return `<section class="player-screen answer-screen"><div class="player-top"><span>Q ${current.number}/${current.total}</span><span>${escapeHtml(name)} · ${state.me?.score ?? 0} pts</span>${connectionBadge(state)}</div><h1>${escapeHtml(current.prompt)}</h1>${state.me?.answered ? `<div class="locked"><div class="lock-symbol" aria-hidden="true">✓</div><h2>Answer locked.</h2><p>Watch the main screen for the reveal.</p></div>` : `<div class="player-answers" role="group" aria-label="Answer choices">${current.answers.map((answer, index) => `<button class="answer-button answer-button--${index}" data-choice="${index}"><b>${String.fromCharCode(65 + index)}</b><span>${escapeHtml(answer)}</span></button>`).join('')}</div>`}</section>`;
  if (state.phase === 'leaderboard') { const correct = state.me?.correct; return `<section class="player-screen personal-result"><div class="player-top"><span>Q ${current?.number}/${current?.total}</span>${connectionBadge(state)}</div><p class="result-signal">${correct === true ? 'NICE HIT' : correct === false ? 'NEXT ONE' : 'SPECTATING'}</p><h1>${correct === true ? `+${state.me?.points ?? 0}` : correct === false ? 'Not this time.' : 'Joined between questions.'}</h1><p>${correct === true ? 'Speed points added.' : `Correct answer: ${escapeHtml(current?.answers[current.correct_index ?? 0])}`}</p><div class="score-tag">Total · ${state.me?.score ?? 0}</div></section>`; }
  return podium(state, false);
}

function answerLane(answer: string, index: number): string { return `<div class="host-answer host-answer--${index}"><b>${String.fromCharCode(65 + index)}</b><span>${escapeHtml(answer)}</span></div>`; }
function leaderboard(leaders: Leader[]): string { return `<ol class="leaderboard">${leaders.slice(0, 5).map((leader, index) => `<li><span class="rank">${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(leader.nickname)}</strong><span>${leader.score.toLocaleString()} pts</span></li>`).join('') || '<li class="empty-row">No scores yet</li>'}</ol>`; }
function podium(state: RoomState, host: boolean): string { const top = state.leaderboard.slice(0, 3); return `<section class="board podium"><p class="eyebrow"><span></span> Final board</p><h1>${host ? 'Tonight’s podium.' : 'That’s the game.'}</h1><div class="podium-steps">${[1,0,2].map((sourceIndex, visualIndex) => { const player = top[sourceIndex]; const place = sourceIndex + 1; return `<div class="podium-place podium-place--${visualIndex + 1}"><span>${place}</span><strong>${player ? escapeHtml(player.nickname) : '—'}</strong><small>${player ? `${player.score.toLocaleString()} pts` : 'Open'}</small></div>`; }).join('')}</div>${host ? `<div class="final-actions"><button class="button button--ghost" id="copy-quiz">Copy quiz for next time</button><button class="button button--lime" data-nav="/create">Build another</button><p id="copy-status" role="status"></p></div>` : `<p class="final-note">You scored <strong>${state.me?.score ?? 0}</strong> points. You can close this tab—nothing follows you out.</p>`}</section>`; }

function bindLive(): void {
  document.querySelectorAll<HTMLElement>('[data-action]').forEach(button => button.addEventListener('click', async () => {
    button.setAttribute('disabled', ''); try { await api(`/api/rooms/${socketCode}/action`, { method: 'POST', body: JSON.stringify({ host_token: socketToken, action: button.dataset.action }) }); } catch (reason) { showToast(messageOf(reason)); button.removeAttribute('disabled'); }
  }));
  document.querySelectorAll<HTMLElement>('[data-choice]').forEach(button => button.addEventListener('click', async () => {
    document.querySelectorAll('[data-choice]').forEach(item => item.setAttribute('disabled', ''));
    try { await api(`/api/rooms/${socketCode}/answer`, { method: 'POST', body: JSON.stringify({ player_token: socketToken, choice: Number(button.dataset.choice) }) }); } catch (reason) { showToast(messageOf(reason)); document.querySelectorAll('[data-choice]').forEach(item => item.removeAttribute('disabled')); }
  }));
  document.querySelector('#copy-join')?.addEventListener('click', () => copyText(`${location.origin}/play?room=${socketCode}`, 'Join link copied.'));
  document.querySelector('#copy-quiz')?.addEventListener('click', () => copyText(`${location.origin}/create#quiz=${encodeQuiz(draft)}`, 'Reusable quiz link copied.'));
}

function renderLegal(which: 'Privacy' | 'Terms'): void {
  const privacy = `<p><strong>Short version:</strong> Open Quiz Arena does not create accounts, use trackers, or keep a quiz library.</p><h2>Data during a game</h2><p>We process the quiz content, a moderated nickname, answers, score, and random session tokens only to run the live room. Do not use a full legal name as a nickname.</p><h2>Automatic deletion</h2><p>Active rooms expire after two hours without activity. Finished rooms expire after ten minutes. Room data is held in server memory and is not written to a database or backup.</p><h2>Local data</h2><p>Your browser temporarily stores random reconnect tokens in session storage. Closing the tab or browser session clears them. Quiz share links contain the quiz itself in the URL fragment; the fragment is not sent to our server until you choose to open a room.</p><h2>Contact</h2><p>For privacy requests, contact the operator listed by your school or deployment administrator.</p>`;
  const terms = `<p>Open Quiz Arena is a free live facilitation tool. By using it, you agree to use it lawfully and in a way suitable for your classroom or event.</p><h2>Your content</h2><p>You keep ownership of quiz content you enter. You are responsible for having permission to use it and for avoiding personal, harmful, or unlawful material.</p><h2>Fair use</h2><p>Do not disrupt rooms, automate abusive traffic, impersonate others, or try to bypass safety limits. We may end abusive sessions to protect the service.</p><h2>Availability</h2><p>The service is provided as-is without a guarantee of uninterrupted availability. Keep a copy of important quiz content in its share link or source CSV because rooms are deliberately temporary.</p>`;
  app.innerHTML = shell(`<article class="legal"><p class="eyebrow"><span></span> Plain-language policy</p><h1>${which}</h1><p class="effective">Effective 27 August 2026</p>${which === 'Privacy' ? privacy : terms}</article>`); bindGlobal();
}

function bindGlobal(): void {
  document.querySelectorAll<HTMLElement>('[data-nav]').forEach(element => element.addEventListener('click', () => navigate(element.dataset.nav ?? '/')));
  document.querySelectorAll<HTMLAnchorElement>('a[data-route]').forEach(link => link.addEventListener('click', event => { event.preventDefault(); navigate(link.pathname + link.search); }));
}
async function api<T = unknown>(url: string, init?: RequestInit): Promise<T> { const response = await fetch(url, { ...init, headers: { 'content-type': 'application/json', ...init?.headers } }); const data = await response.json().catch(() => ({})) as T & { error?: string }; if (!response.ok) throw new Error(data.error || 'The request could not be completed.'); return data; }
function alertBox(message: string): string { return `<div class="alert" role="alert"><strong>Couldn’t continue.</strong><p>${escapeHtml(message)}</p></div>`; }
function messageOf(reason: unknown): string { return reason instanceof Error ? reason.message : 'Something went wrong. Try again.'; }
function showToast(message: string): void { let toast = document.querySelector<HTMLDivElement>('#toast'); if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; toast.className = 'toast'; toast.setAttribute('role', 'alert'); document.body.append(toast); } toast.textContent = message; }
async function copyText(value: string, success: string): Promise<void> { await navigator.clipboard.writeText(value); const status = document.querySelector<HTMLElement>('#copy-status'); if (status) status.textContent = success; }
function loadSharedQuiz(): Quiz | null { const match = location.hash.match(/(?:^#|&)quiz=([^&]+)/); return match?.[1] ? decodeQuiz(match[1]) : null; }

window.addEventListener('popstate', route);
route();
