import { describe, expect, it } from 'vitest';
import { decodeQuiz, encodeQuiz, parseCsv } from '../src-web/quiz';

describe('CSV quiz import', () => {
  it('accepts quoted commas and validates answer numbers', () => {
    const result = parseCsv('question,answer1,answer2,correct,time\n"Capital of France, today?",Paris,Lyon,1,15');
    expect(result.errors).toEqual([]);
    expect(result.quiz?.questions[0]?.prompt).toBe('Capital of France, today?');
    expect(result.quiz?.questions[0]?.correct_index).toBe(0);
  });

  it('returns an accessible-summary-ready list of row errors', () => {
    const result = parseCsv('question,answer1,answer2,correct,time\n,A,,4,2');
    expect(result.errors).toHaveLength(4);
    expect(result.errors.join(' ')).toContain('Row 2');
  });

  it('round trips non-ASCII quiz links', () => {
    const quiz = { title: 'Café', questions: [{ prompt: '¿Qué?', answers: ['Sí', 'No'], correct_index: 0, time_limit_seconds: 20 }] };
    expect(decodeQuiz(encodeQuiz(quiz))).toEqual(quiz);
  });
});
