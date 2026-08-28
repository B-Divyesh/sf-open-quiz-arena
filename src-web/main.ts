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
let demoStep = 0;
let demoAnswers = new Set<string>();
const demoQuiz: Quiz = { title: 'Climate check', questions: [{ prompt: 'Which action saves the most household electricity?', answers: ['Turn off idle devices', 'Leave lights on', 'Open the freezer', 'Run an empty washer'], correct_index: 0, time_limit_seconds: 20 }] };
let firstRoute = true;

function blankQuestion(): Question { return { prompt: '', answers: ['', '', '', ''], correct_index: 0, time_limit_seconds: 20 }; }
function escapeHtml(value: unknown): string { return String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character); }
function shell(content: string, options: { compact?: boolean; demo?: boolean } = {}): string {
  return `<div class="site-shell ${options.compact ? 'site-shell--compact' : ''}">
    <header class="topbar"><a class="brand" href="/" data-route aria-label="Open Quiz Arena home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>OPEN QUIZ ARENA</span></a><nav class="site-nav" aria-label="Main navigation"><a href="/demo" data-route>Demo</a><a href="/create" data-route>Create</a><a href="/play" data-route>Join</a><a href="/privacy" data-route>Privacy</a></nav></header>
    ${options.demo ? `<aside class="demo-banner" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved</strong><span><button class="demo-link" id="reset-demo">Reset demo</button><button class="demo-link" id="start-real">Start for real</button></span></aside>` : ''}
    <main id="main" tabindex="-1">${content}</main>
    <footer><span>Free live classroom quizzes. No accounts.</span><nav aria-label="Legal"><a href="/privacy" data-route>Privacy</a><a href="/terms" data-route>Terms</a><span>Built by Param Factory · ${escapeHtml((import.meta.env.VITE_BUILD_SHA ?? 'dev').slice(0, 12))}</span></nav></footer>
  </div>`;
}

function route(restoreScroll = false): void {
  const moveFocus = !firstRoute;
  firstRoute = false;
  closeSocket();
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  const demoRoute = path === '/demo' || params.get('demo') === '1';
  if (!demoRoute) clearDemoStorage();
  if (path === '/privacy') renderLegal('Privacy');
  else if (path === '/terms') renderLegal('Terms');
  else if (path === '/create') renderEditor();
  else if (demoRoute) renderDemo();
  else if (path === '/host' && params.get('room')) restoreHost(params.get('room')!);
  else if (path === '/play' && params.get('room')) void renderNickname(params.get('room')!);
  else if (path === '/play') renderJoin();
  else if (path === '/' ) renderHome();
  else renderNotFound();
  if (!restoreScroll) window.scrollTo(0, 0);
  completeRoute(demoRoute ? '/demo' : path, restoreScroll, moveFocus);
}

function navigate(path: string): void { history.replaceState({ scrollY: window.scrollY }, ''); history.pushState({ scrollY: 0 }, '', path); route(); }

function completeRoute(path: string, restoreScroll: boolean, moveFocus: boolean): void {
  const page: [string, string] = path === '/demo' ? ['Demo — Open Quiz Arena', 'Try a sample live quiz with host controls and sample learners.'] : path === '/create' ? ['Create a quiz — Open Quiz Arena', 'Create a live classroom quiz and open a room code.'] : path === '/play' ? ['Join a quiz — Open Quiz Arena', 'Join a live classroom quiz with a room code and nickname.'] : path === '/host' ? ['Host a quiz — Open Quiz Arena', 'Control questions, answers, rankings, and the final podium.'] : path === '/privacy' ? ['Privacy — Open Quiz Arena', 'How temporary live quiz rooms handle data.'] : path === '/terms' ? ['Terms — Open Quiz Arena', 'Terms for using Open Quiz Arena.'] : path === '/404' ? ['Page not found — Open Quiz Arena', 'This page does not exist.'] : ['Open Quiz Arena — quizzes tested with 40 learners', 'Teachers and trainers run live quizzes tested with 40 learners. Each learner joins by code on a phone.'];
  document.title = page[0];
  document.querySelector('meta[name="description"]')?.setAttribute('content', page[1]);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${location.origin}${path === '/404' ? '/404' : path}`);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', page[0]);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', page[1]);
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', page[0]);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', page[1]);
  requestAnimationFrame(() => requestAnimationFrame(() => { if (moveFocus) { const heading = document.querySelector<HTMLElement>('main h1'); heading?.setAttribute('tabindex', '-1'); heading?.focus({ preventScroll: true }); announce(page[0]); } window.scrollTo(0, restoreScroll ? Number((history.state as { scrollY?: number } | null)?.scrollY ?? 0) : 0); }));
}
function announce(message: string): void { let status = document.querySelector<HTMLElement>('#route-status'); if (!status) { status = document.createElement('p'); status.id = 'route-status'; status.className = 'sr-only'; status.setAttribute('aria-live', 'polite'); document.body.append(status); } status.textContent = message; }

function renderHome(): void {
  app.innerHTML = shell(`<section class="hero">
    <div class="hero-copy"><p class="eyebrow"><span></span> Free live classroom quiz</p><h1>Run one live quiz for your class.</h1>
      <p class="lede">Teachers and trainers host. Learners join by code and answer on their phones.</p>
      <div class="hero-actions"><button class="button button--lime" data-nav="/demo">Try it with sample data <span aria-hidden="true">→</span></button><span class="action-note">Opens a sample host screen with learners already joined.</span><button class="button button--ghost" data-nav="/create">Create a quiz</button><button class="button button--ghost" data-nav="/play">Join a room</button></div>
      <ul class="trust-row" aria-label="Key facts"><li>Free</li><li>No accounts</li><li>Internet required</li><li>Tested with 40 learners in one room</li></ul>
    </div>
    <div class="arena-preview" aria-label="Illustration of a live quiz scoreboard">
      <div class="preview-head"><span>LIVE · Q 4/8</span><span>27 PLAYING</span></div>
      <p class="preview-question">Which layer of Earth moves beneath the crust?</p>
      <div class="preview-lanes"><span><b>A</b> Inner core</span><span><b>B</b> Mantle</span><span><b>C</b> Outer core</span><span><b>D</b> Atmosphere</span></div>
      <div class="signal-bars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
    </div>
  </section><section class="how"><p class="section-number">01 / HOW IT WORKS</p><h2>Run a quiz in three steps.</h2><ol><li><b>Create or import</b><span>Type questions or import a CSV file.</span></li><li><b>Share the code</b><span>Learners enter one nickname on their phones.</span></li><li><b>Reveal results</b><span>Show each answer, rankings, and the final podium.</span></li></ol></section><section class="data-limits"><h2>Data and limits</h2><p>Internet is required for a live room. There is no homework mode or analytics dashboard.</p><p>Rooms are temporary. Active rooms expire after two hours without activity. Finished rooms expire after ten minutes.</p></section>`);
  bindGlobal();
}

function renderDemo(): void {
  const stored = localStorage.getItem('demo:open-quiz-arena:step');
  if (stored !== null) demoStep = Math.max(0, Math.min(2, Number(stored) || 0));
  const phase = demoStep === 0 ? 'lobby' : demoStep === 1 ? 'question' : 'leaderboard';
  const people = ['Maya', 'Ibrahim', 'Lena'];
  const sampleQuestion = demoQuiz.questions[0]!;
  const answered = demoAnswers.size || (phase === 'leaderboard' ? 3 : 0);
  const body = phase === 'lobby'
    ? `<section class="board lobby-board"><div class="board-top"><div><p>SAMPLE ROOM CODE</p><h1 aria-label="Sample room code 046610">046610</h1></div><div class="connection connection--live"><i></i>Sample live</div></div><div class="lobby-main"><div><p class="eyebrow"><span></span> Climate check</p><h2>Sample learners are ready.</h2><p class="big-status"><strong>3</strong> learners joined</p><div class="player-cloud">${people.map(person => `<span>${person}</span>`).join('')}</div></div><aside class="host-tools"><button class="button button--lime" id="demo-start">Start sample question <span aria-hidden="true">→</span></button><p>Use this host screen to see the quiz flow.</p></aside></div></section>`
    : phase === 'question'
      ? `<section class="board question-board"><div class="board-strip"><span>SAMPLE · Q 1/1</span><span>${answered}/3 ANSWERED</span><div class="connection connection--live"><i></i>Sample live</div></div><h1>${sampleQuestion.prompt}</h1><div class="host-answer-grid">${sampleQuestion.answers.map(answerLane).join('')}</div><section class="demo-learners" aria-label="Sample learner phones"><h2>Sample learner phones</h2>${people.map(person => `<button class="button button--ghost" data-demo-answer="${person}" ${demoAnswers.has(person) ? 'disabled' : ''}>${demoAnswers.has(person) ? `${person} answered` : `${person} answers A`}</button>`).join('')}</section><div class="board-controls"><span>Choose learner answers, then reveal.</span><button class="button button--lime" id="demo-reveal" ${answered < 3 ? 'disabled' : ''}>Reveal sample result <span aria-hidden="true">→</span></button></div></section>`
      : `<section class="board results-board"><div class="board-strip"><span>SAMPLE RESULTS · Q 1/1</span><div class="connection connection--live"><i></i>Sample live</div></div><div class="correct-call"><span>CORRECT ANSWER</span><h1>A · Turn off idle devices</h1></div><ol class="leaderboard"><li><span class="rank">01</span><strong>Maya</strong><span>998 pts</span></li><li><span class="rank">02</span><strong>Ibrahim</strong><span>996 pts</span></li><li><span class="rank">03</span><strong>Lena</strong><span>994 pts</span></li></ol><div class="board-controls"><span>The host reveals rankings after each question.</span><button class="button button--lime" id="demo-podium">Show sample podium <span aria-hidden="true">→</span></button></div></section>`;
  app.innerHTML = shell(body, { demo: true, compact: true });
  bindGlobal();
  document.querySelector('#demo-start')?.addEventListener('click', () => { demoStep = 1; demoAnswers.clear(); persistDemo(); renderDemo(); });
  document.querySelectorAll<HTMLElement>('[data-demo-answer]').forEach(button => button.addEventListener('click', () => { demoAnswers.add(button.dataset.demoAnswer ?? ''); persistDemo(); renderDemo(); }));
  document.querySelector('#demo-reveal')?.addEventListener('click', () => { demoStep = 2; persistDemo(); renderDemo(); });
  document.querySelector('#demo-podium')?.addEventListener('click', renderDemoPodium);
  document.querySelector('#reset-demo')?.addEventListener('click', resetDemo);
  document.querySelector('#start-real')?.addEventListener('click', startForReal);
}
function persistDemo(): void { localStorage.setItem('demo:open-quiz-arena:step', String(demoStep)); }
function clearDemoStorage(): void {
  Object.keys(localStorage).filter(key => key.startsWith('demo:open-quiz-arena:')).forEach(key => localStorage.removeItem(key));
}
function resetDemo(): void { clearDemoStorage(); demoStep = 0; demoAnswers.clear(); renderDemo(); }
function startForReal(): void { clearDemoStorage(); demoStep = 0; demoAnswers.clear(); navigate('/create'); }
function renderDemoPodium(): void {
  app.innerHTML = shell(`<section class="board podium"><p class="eyebrow"><span></span> Sample result</p><h1>Sample podium.</h1><div class="podium-steps"><div class="podium-place podium-place--1"><span>2</span><strong>Ibrahim</strong><small>996 pts</small></div><div class="podium-place podium-place--2"><span>1</span><strong>Maya</strong><small>998 pts</small></div><div class="podium-place podium-place--3"><span>3</span><strong>Lena</strong><small>994 pts</small></div></div><div class="final-actions"><button class="button button--lime" id="reset-demo">Run the sample again</button></div></section>`, { demo: true, compact: true });
  bindGlobal();
  document.querySelector('#reset-demo')?.addEventListener('click', resetDemo);
  document.querySelector('#start-real')?.addEventListener('click', startForReal);
}
function renderNotFound(): void { app.innerHTML = shell(`<section class="center-panel"><p class="eyebrow"><span></span> 404</p><h1>Page not found.</h1><p>This address does not lead to a quiz, demo, or policy page.</p><div class="hero-actions"><button class="button button--lime" data-nav="/">Go home</button><button class="button button--ghost" data-nav="/demo">Try the sample quiz</button></div></section>`); bindGlobal(); }

function renderJoin(error = ''): void {
  app.innerHTML = shell(`<section class="center-panel"><p class="eyebrow"><span></span> Learner entry</p><h1>Enter your room code.</h1><p>Your host shows a six-digit code.</p>
    ${error ? alertBox(error) : ''}<form id="join-code" class="join-form"><label for="room-code">Room code</label><input class="code-input" id="room-code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code" required autofocus aria-describedby="code-hint"><small id="code-hint">Six numbers, shown on the host screen.</small><button class="button button--lime">Enter nickname <span aria-hidden="true">→</span></button></form></section>`);
  bindGlobal();
  document.querySelector<HTMLFormElement>('#join-code')?.addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget as HTMLFormElement; const code = new FormData(form).get('code')?.toString().replace(/\D/g, ''); if (code?.length === 6) navigate(`/play?room=${code}`); });
}

async function renderNickname(code: string, error = ''): Promise<void> {
  const stored = sessionStorage.getItem(`arena:player:${code}`);
  if (stored) { const parsed = JSON.parse(stored) as { token: string; nickname: string }; return connectPlayer(code, parsed.token, parsed.nickname); }
  app.innerHTML = shell(`<section class="center-panel"><p class="room-chip">ROOM ${escapeHtml(code)}</p><h1>Enter your nickname.</h1><p>Use a name your teacher will recognize. The room deletes temporary data after its stated timeout.</p>${error ? alertBox(error) : ''}
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
  app.innerHTML = shell(`<section class="editor"><div class="editor-heading"><div><p class="eyebrow"><span></span> Host controls</p><h1>Create a live quiz.</h1><p>Your browser keeps the quiz while you edit. Open a room when you are ready.</p></div><button class="button button--ghost" id="show-import">Import CSV</button></div>
    ${error ? alertBox(error) : ''}<section id="csv-panel" class="csv-panel" hidden aria-labelledby="csv-title"><h2 id="csv-title">Import questions from CSV</h2><p>Columns: <code>question,answer1,answer2,answer3,answer4,correct,time</code>. Correct is the answer number.</p><div id="csv-errors" tabindex="-1"></div><label for="csv-file">Choose a .csv file</label><input id="csv-file" type="file" accept=".csv,text/csv"><label for="csv-text">Or paste CSV</label><textarea id="csv-text" rows="6" placeholder="question,answer1,answer2,correct,time"></textarea><div class="button-row"><button class="button button--cyan" id="import-csv">Use these questions</button><button class="button button--quiet" id="close-import">Cancel</button></div></section>
    <form id="quiz-form"><label class="title-field" for="quiz-title">Quiz title<input id="quiz-title" name="title" maxlength="100" required value="${escapeHtml(draft.title)}" placeholder="e.g. Friday science sprint"></label>
      <div class="question-list">${draft.questions.map(questionEditor).join('')}</div><div class="editor-actions"><button type="button" class="button button--ghost" id="add-question">+ Add question</button><button class="button button--lime" data-testid="create-room">Open live room <span aria-hidden="true">→</span></button></div></form>
    <p class="data-note">A room is temporary. Active rooms expire after two hours without activity. Finished rooms expire after ten minutes.</p></section>`);
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
      sessionStorage.setItem(`arena:host:${result.code}`, result.host_token); sessionStorage.setItem(`arena:quiz:${result.code}`, JSON.stringify(draft)); history.replaceState({}, '', `/host?room=${result.code}`); connectHost(result.code, result.host_token); completeRoute('/host', false, false);
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
  const privacy = `<p><strong>Short version:</strong> Sociobot operates Open Quiz Arena. The service asks learners for a nickname to show during a live room.</p><h2>Data during a game</h2><p>A live room receives the quiz, nickname, and reconnect token needed to show the quiz. Please avoid using a full legal name as a nickname.</p><h2>Temporary rooms</h2><p>Active rooms expire after two hours without activity. Finished rooms expire after ten minutes. The service removes an expired room from the running application.</p><h2>Your browser</h2><p>The browser stores a reconnect token for the current browser session. A reusable quiz link keeps quiz data after the # sign in the address.</p><h2>Questions and contact</h2><p>For a privacy request while a room is active, email <a class="legal-contact" href="mailto:privacy@sociobot.in?subject=Open%20Quiz%20Arena%20privacy%20request">privacy@sociobot.in</a> with the room code.</p>`;
  const terms = `<p>Open Quiz Arena is a free live quiz tool operated by Sociobot. Use it lawfully and in a way suitable for your classroom or event.</p><h2>Your content</h2><p>You are responsible for the quiz content you enter and for having permission to use it.</p><h2>Fair use</h2><p>Do not disrupt rooms, automate abusive traffic, impersonate others, or bypass safety limits. We may end abusive sessions to protect the service.</p><h2>Temporary room data</h2><p>Keep important quiz content in a reusable link or source CSV. Live room data is temporary. See <a class="legal-contact" href="/privacy" data-route>Privacy</a> for timing and contact details. Contact <a class="legal-contact" href="mailto:privacy@sociobot.in?subject=Open%20Quiz%20Arena%20terms">privacy@sociobot.in</a> with terms questions.</p>`;
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

window.addEventListener('popstate', () => route(true));
route();
