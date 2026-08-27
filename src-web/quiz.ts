export interface Question { prompt: string; answers: string[]; correct_index: number; time_limit_seconds: number }
export interface Quiz { title: string; questions: Question[] }

export interface CsvResult { quiz?: Quiz; errors: string[] }

export function parseCsv(source: string, title = 'Imported quiz'): CsvResult {
  const rows = parseRows(source.replace(/^\uFEFF/, ''));
  if (rows.length === 0) return { errors: ['The CSV is empty. Add a header row and at least one question.'] };
  const headers = rows[0]?.map(value => value.trim().toLowerCase()) ?? [];
  const required = ['question', 'answer1', 'answer2', 'correct'];
  const missing = required.filter(header => !headers.includes(header));
  if (missing.length) return { errors: [`Missing required column${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}.`] };
  const at = (row: string[], name: string) => row[headers.indexOf(name)]?.trim() ?? '';
  const questions: Question[] = [];
  const errors: string[] = [];
  rows.slice(1).forEach((row, index) => {
    const line = index + 2;
    if (row.every(value => !value.trim())) return;
    const prompt = at(row, 'question');
    const answers = ['answer1', 'answer2', 'answer3', 'answer4'].map(name => at(row, name)).filter(Boolean);
    const rawCorrect = at(row, 'correct');
    const correct = Number(rawCorrect) - 1;
    const rawTime = at(row, 'time') || '20';
    const time = Number(rawTime);
    if (!prompt) errors.push(`Row ${line}: question is empty.`);
    if (answers.length < 2) errors.push(`Row ${line}: provide at least two answers.`);
    if (!Number.isInteger(correct) || correct < 0 || correct >= answers.length) errors.push(`Row ${line}: correct must be an answer number from 1 to ${Math.max(answers.length, 2)}.`);
    if (!Number.isInteger(time) || time < 5 || time > 120) errors.push(`Row ${line}: time must be 5–120 seconds.`);
    if (prompt && answers.length >= 2 && Number.isInteger(correct) && correct >= 0 && correct < answers.length && Number.isInteger(time) && time >= 5 && time <= 120) {
      questions.push({ prompt, answers, correct_index: correct, time_limit_seconds: time });
    }
  });
  if (!questions.length && !errors.length) errors.push('The CSV has no question rows.');
  return errors.length ? { errors } : { quiz: { title, questions }, errors: [] };
}

function parseRows(source: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const character = source[i];
    if (character === '"') {
      if (quoted && source[i + 1] === '"') { field += '"'; i += 1; }
      else quoted = !quoted;
    } else if (character === ',' && !quoted) { row.push(field); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && source[i + 1] === '\n') i += 1;
      row.push(field); rows.push(row); row = []; field = '';
    } else { field += character; }
  }
  row.push(field);
  if (row.length > 1 || row[0]) rows.push(row);
  return rows;
}

export function encodeQuiz(quiz: Quiz): string {
  const bytes = new TextEncoder().encode(JSON.stringify(quiz));
  let binary = '';
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export function decodeQuiz(value: string): Quiz | null {
  try {
    const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as Quiz;
  } catch { return null; }
}

