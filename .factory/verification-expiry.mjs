import assert from 'node:assert/strict';

const base = 'https://open-quiz-arena.sociobot.in';
const quiz = { title: 'Expiry probe', questions: [{ prompt: 'Q?', answers: ['A', 'B'], correct_index: 0, time_limit_seconds: 20 }] };
const createResponse = await fetch(`${base}/api/rooms`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ quiz }) });
const room = await createResponse.json();
assert.equal(createResponse.status, 201);

let ended;
let endAttempts = 0;
while (endAttempts < 30 && ended !== 200) {
  endAttempts += 1;
  const response = await fetch(`${base}/api/rooms/${room.code}/action`, { method: 'POST', headers: { 'content-type': 'application/json', connection: 'close' }, body: JSON.stringify({ host_token: room.host_token, action: 'end' }) });
  ended = response.status;
  if (ended !== 200) await new Promise(resolve => setTimeout(resolve, 200));
}
assert.equal(ended, 200);

const started = Date.now();
const samples = [];
async function sample(label) {
  const statuses = await Promise.all(Array.from({ length: 30 }, (_, index) => fetch(`${base}/api/rooms/${room.code}?expiry_probe=${label}-${index}`, { headers: { connection: 'close' } }).then(response => response.status)));
  samples.push({ label, elapsed_seconds: Math.round((Date.now() - started) / 1000), status_counts: Object.fromEntries([...new Set(statuses)].sort().map(status => [status, statuses.filter(value => value === status).length])) });
  console.log(JSON.stringify({ room: room.code, end_attempts: endAttempts, latest: samples.at(-1) }));
}

await sample('immediate');
for (const seconds of [300, 570, 630]) {
  const remaining = started + seconds * 1000 - Date.now();
  if (remaining > 0) await new Promise(resolve => setTimeout(resolve, remaining));
  await sample(`t${seconds}`);
}
assert(samples[0].status_counts['200'] > 0);
assert.equal(samples.at(-1).status_counts['200'] || 0, 0);
console.log(JSON.stringify({ room: room.code, end_attempts: endAttempts, samples }, null, 2));
