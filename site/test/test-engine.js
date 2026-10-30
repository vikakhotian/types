/* Только вычисления в памяти. Никакого хранения или отправки ответов. */
(() => {
  'use strict';
  const score = (question, selected) => {
    const answers = [...new Set(selected)];
    if (answers.some(i => !Number.isInteger(i) || i < 0 || i >= question.options.length)) {
      throw new RangeError('Неизвестный вариант ответа');
    }
    if (!answers.length) return 0;
    if (!question.multi && answers.length > 1) throw new RangeError('Выбери один вариант');
    if (question.maxSelect && answers.length > question.maxSelect) throw new RangeError('Слишком много вариантов');
    if (question.onlyChoice !== undefined) return answers.length === 1 && answers[0] === question.onlyChoice ? 2 : 0;
    if (question.maxSelect) return Math.max(...answers.map(i => question.scores[i]));
    if (!question.multi) return question.scores[answers[0]];
    if (answers.some(i => !question.correct.includes(i))) return 0;
    return answers.length === question.correct.length ? 2 : 1;
  };
  const resultIndex = points => {
    if (points.length !== 12 || points.some(n => ![0, 1, 2].includes(n))) throw new RangeError('Некорректные баллы');
    const total = points.reduce((sum, n) => sum + n, 0);
    if (total >= 22 && !points.includes(0)) return 0;
    if (total >= 18) return 1;
    if (total >= 14) return 2;
    return 3;
  };
  window.SAMANTA_TEST_ENGINE = Object.freeze({ score, resultIndex });
})();
