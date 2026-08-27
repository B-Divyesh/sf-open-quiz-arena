import assert from 'node:assert/strict';

const base = process.env.BASE_URL || 'https://open-quiz-arena.sociobot.in';
const wsBase = base.replace(/^http/, 'ws');
const evidence = { checks: [], timings_ms: {} };
const mark = (name, detail) => evidence.checks.push({ name, detail });

async function request(path, init = {}) {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers || {}) },
  });
  const text = await response.text();
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: response.status, body, headers: Object.fromEntries(response.headers) };
}

async function createRoom(questionCount = 8) {
  const quiz = {
    title: `Independent ${questionCount}`,
    questions: Array.from({ length: questionCount }, (_, i) => ({
      prompt: `Independent question ${i + 1}?`,
      answers: [`Correct ${i + 1}`, `Wrong ${i + 1}`, `Other ${i + 1}`],
      correct_index: 0,
      time_limit_seconds: 20,
    })),
  };
  const created = await request('/api/rooms', { method: 'POST', body: JSON.stringify({ quiz }) });
  assert.equal(created.status, 201);
  assert.match(created.body.code, /^\d{6}$/);
  assert.match(created.body.host_token, /^[a-f0-9]{32}$/);
  return created.body;
}

function socket(role, code, token) {
  const states = [];
  const waiters = [];
  const ws = new WebSocket(`${wsBase}/ws/${code}?role=${role}&token=${encodeURIComponent(token)}`);
  ws.addEventListener('message', ({ data }) => {
    const state = JSON.parse(data);
    states.push(state);
    for (const waiter of [...waiters]) {
      if (waiter.predicate(state)) {
        clearTimeout(waiter.timer);
        waiters.splice(waiters.indexOf(waiter), 1);
        waiter.resolve(state);
      }
    }
  });
  const opened = new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true });
    ws.addEventListener('error', () => reject(new Error(`WebSocket failed: ${role}/${code}`)), { once: true });
  });
  const wait = async (predicate, timeout = 10000) => {
    const existing = [...states].reverse().find(predicate);
    if (existing) return existing;
    return new Promise((resolve, reject) => {
      const waiter = { predicate, resolve, timer: undefined };
      waiter.timer = setTimeout(() => {
        waiters.splice(waiters.indexOf(waiter), 1);
        reject(new Error(`Timed out waiting for ${role}/${code}; last=${JSON.stringify(states.at(-1))}`));
      }, timeout);
      waiters.push(waiter);
    });
  };
  return { ws, states, opened, wait };
}

const health = await request('/health');
assert.equal(health.status, 200);
assert.equal(health.body.status, 'ok');
mark('health', health.body);

const invalid = await request('/api/rooms/not-a-code');
assert.equal(invalid.status, 404);
assert.match(invalid.body.error, /not active/i);
mark('invalid room code', { status: invalid.status, error: invalid.body.error });

const room = await createRoom(8);
const code = room.code;
const hostToken = room.host_token;

const ada = await request(`/api/rooms/${code}/join`, { method: 'POST', body: JSON.stringify({ nickname: 'Ada' }) });
const duplicate = await request(`/api/rooms/${code}/join`, { method: 'POST', body: JSON.stringify({ nickname: 'ada' }) });
const dirty = await request(`/api/rooms/${code}/join`, { method: 'POST', body: JSON.stringify({ nickname: '  <script>Ada</script>\u0000  ' }) });
assert.equal(ada.body.nickname, 'Ada');
assert.equal(duplicate.body.nickname, 'ada · 2');
assert.equal(dirty.body.nickname, 'scriptAdascript');
mark('duplicate and sanitized nicknames', [ada.body.nickname, duplicate.body.nickname, dirty.body.nickname]);

const reconnect = await request(`/api/rooms/${code}/join`, {
  method: 'POST',
  body: JSON.stringify({ nickname: 'Changed', reconnect_token: ada.body.player_token }),
});
assert.equal(reconnect.status, 200);
assert.equal(reconnect.body.reconnected, true);
assert.equal(reconnect.body.player_id, ada.body.player_id);
assert.equal(reconnect.body.nickname, 'Ada');
mark('reconnect token', { status: reconnect.status, same_player_id: true, nickname: reconnect.body.nickname });

const unauthorized = await request(`/api/rooms/${code}/action`, {
  method: 'POST', body: JSON.stringify({ host_token: 'wrong', action: 'start' }),
});
assert.equal(unauthorized.status, 401);
mark('host authorization', { invalid_token_status: unauthorized.status });

const hostWs = socket('host', code, hostToken);
await hostWs.opened;
await hostWs.wait(state => state.host_connected === true && state.player_count === 3);
await request(`/api/rooms/${code}/action`, { method: 'POST', body: JSON.stringify({ host_token: hostToken, action: 'start' }) });
await hostWs.wait(state => state.phase === 'question' && state.current.number === 1);

const late = await request(`/api/rooms/${code}/join`, { method: 'POST', body: JSON.stringify({ nickname: 'Late Player' }) });
assert.equal(late.status, 201);
const lateWs = socket('player', code, late.body.player_token);
await lateWs.opened;
const lateState = await lateWs.wait(state => state.phase === 'question');
assert.equal(lateState.me.nickname, 'Late Player');
mark('late join', { status: late.status, phase: lateState.phase, can_answer_current: true });

const firstAnswer = await request(`/api/rooms/${code}/answer`, {
  method: 'POST', body: JSON.stringify({ player_token: ada.body.player_token, choice: 0 }),
});
const duplicateAnswer = await request(`/api/rooms/${code}/answer`, {
  method: 'POST', body: JSON.stringify({ player_token: ada.body.player_token, choice: 1 }),
});
assert.equal(firstAnswer.status, 200);
assert.equal(duplicateAnswer.status, 409);
await request(`/api/rooms/${code}/answer`, { method: 'POST', body: JSON.stringify({ player_token: duplicate.body.player_token, choice: 1 }) });
await request(`/api/rooms/${code}/answer`, { method: 'POST', body: JSON.stringify({ player_token: dirty.body.player_token, choice: 0 }) });
await request(`/api/rooms/${code}/answer`, { method: 'POST', body: JSON.stringify({ player_token: late.body.player_token, choice: 0 }) });
await request(`/api/rooms/${code}/action`, { method: 'POST', body: JSON.stringify({ host_token: hostToken, action: 'advance' }) });
const board1 = await hostWs.wait(state => state.phase === 'leaderboard' && state.current.number === 1);
assert(board1.leaderboard.find(player => player.nickname === 'Ada').score > 0);
assert.equal(board1.leaderboard.find(player => player.nickname === 'ada · 2').score, 0);
mark('answer idempotency and scoring', { first_status: firstAnswer.status, duplicate_status: duplicateAnswer.status, leaderboard: board1.leaderboard });

hostWs.ws.close();
await new Promise(resolve => setTimeout(resolve, 300));
const afterLoss = await request(`/api/rooms/${code}`);
assert.equal(afterLoss.body.host_connected, false);
const restoredHostWs = socket('host', code, hostToken);
await restoredHostWs.opened;
await restoredHostWs.wait(state => state.host_connected === true);
mark('host loss and recovery', { disconnected_visible: true, token_reconnect: true, phase_preserved: afterLoss.body.phase });

const playerTokens = [ada.body.player_token, duplicate.body.player_token, dirty.body.player_token, late.body.player_token];
for (let question = 2; question <= 8; question += 1) {
  await request(`/api/rooms/${code}/action`, { method: 'POST', body: JSON.stringify({ host_token: hostToken, action: 'advance' }) });
  await restoredHostWs.wait(state => state.phase === 'question' && state.current.number === question);
  const answers = await Promise.all(playerTokens.map(player_token => request(`/api/rooms/${code}/answer`, {
    method: 'POST', body: JSON.stringify({ player_token, choice: 0 }),
  })));
  assert(answers.every(answer => answer.status === 200));
  await request(`/api/rooms/${code}/action`, { method: 'POST', body: JSON.stringify({ host_token: hostToken, action: 'advance' }) });
  await restoredHostWs.wait(state => state.phase === 'leaderboard' && state.current.number === question);
}
await request(`/api/rooms/${code}/action`, { method: 'POST', body: JSON.stringify({ host_token: hostToken, action: 'advance' }) });
const finished = await restoredHostWs.wait(state => state.phase === 'finished');
assert.equal(finished.current.number, 8);
assert.equal(finished.leaderboard.length, 4);
mark('eight-question API lifecycle', { phase: finished.phase, final_question: finished.current.number, players: finished.player_count, top_three: finished.leaderboard.slice(0, 3) });
restoredHostWs.ws.close();
lateWs.ws.close();

const oversized = JSON.stringify({ quiz: { title: 'x'.repeat(270000), questions: [] } });
const oversizedResult = await request('/api/rooms', { method: 'POST', body: oversized });
assert.equal(oversizedResult.status, 413);
const tooMany = await request('/api/rooms', {
  method: 'POST',
  body: JSON.stringify({ quiz: { title: 'Limits', questions: Array.from({ length: 51 }, (_, i) => ({ prompt: `Q${i}`, answers: ['A', 'B'], correct_index: 0, time_limit_seconds: 20 })) } }),
});
assert.equal(tooMany.status, 400);
mark('payload and quiz limits', { over_256KiB_status: oversizedResult.status, fifty_one_questions_status: tooMany.status });

await new Promise(resolve => setTimeout(resolve, 1100));
const fanoutRoom = await createRoom(1);
const fanoutStart = performance.now();
const joins = await Promise.all(Array.from({ length: 40 }, (_, index) => request(`/api/rooms/${fanoutRoom.code}/join`, {
  method: 'POST', body: JSON.stringify({ nickname: `Load ${String(index + 1).padStart(2, '0')}` }),
})));
assert(joins.every(join => join.status === 201));
const fanoutHost = socket('host', fanoutRoom.code, fanoutRoom.host_token);
const players = joins.map(join => socket('player', fanoutRoom.code, join.body.player_token));
await Promise.all([fanoutHost.opened, ...players.map(player => player.opened)]);
const lobby40 = await fanoutHost.wait(state => state.phase === 'lobby' && state.player_count === 40);
assert.equal(lobby40.leaderboard.length, 40);
await request(`/api/rooms/${fanoutRoom.code}/action`, { method: 'POST', body: JSON.stringify({ host_token: fanoutRoom.host_token, action: 'start' }) });
await Promise.all(players.map(player => player.wait(state => state.phase === 'question')));
const answerResponses = await Promise.all(joins.map(join => request(`/api/rooms/${fanoutRoom.code}/answer`, {
  method: 'POST', body: JSON.stringify({ player_token: join.body.player_token, choice: 0 }),
})));
assert(answerResponses.every(answer => answer.status === 200));
const locked40 = await fanoutHost.wait(state => state.phase === 'question' && state.current.answered === 40);
assert.equal(locked40.current.answered, 40);
await request(`/api/rooms/${fanoutRoom.code}/action`, { method: 'POST', body: JSON.stringify({ host_token: fanoutRoom.host_token, action: 'advance' }) });
const playerResults = await Promise.all(players.map(player => player.wait(state => state.phase === 'leaderboard' && state.me.correct === true)));
assert.equal(playerResults.length, 40);
assert(playerResults.every(state => state.player_count === 40));
evidence.timings_ms.forty_player_join_answer_reveal = Math.round(performance.now() - fanoutStart);
mark('40-player WebSocket fan-out', { joined: 40, host_observed_answers: 40, player_result_frames: playerResults.length, elapsed_ms: evidence.timings_ms.forty_player_join_answer_reveal });
fanoutHost.ws.close();
players.forEach(player => player.ws.close());

console.log(JSON.stringify(evidence, null, 2));
