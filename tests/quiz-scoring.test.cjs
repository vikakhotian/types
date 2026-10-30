const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const root = join(__dirname, '..');
const window = {};
for (const file of ['test-data.js', 'test-engine.js']) {
  runInNewContext(readFileSync(join(root, 'site/test', file), 'utf8'), { window });
}
const { questions } = window.SAMANTA_TEST_DATA;
const { score, resultIndex } = window.SAMANTA_TEST_ENGINE;
const q = id => questions.find(question => question.id === id);

test('Один вопрос дает не более двух баллов; каждый вариант учитывается', () => {
  const expected = { 1: [0, 2, 0], 2: [1, 2, 0], 4: [0, 1, 2, 0], 6: [1, 2, 0, 1], 7: [0, 2, 2], 8: [0, 2, 0], 9: [0, 0, 2] };
  for (const [id, values] of Object.entries(expected)) {
    assert.equal(q(+id).options.length, values.length);
    values.forEach((points, index) => assert.equal(score(q(+id), [index]), points, `Вопрос ${id}, вариант ${index + 1}`));
    assert.throws(() => score(q(+id), [0, 1]), { name: 'RangeError' });
  }
});

test('Множественный выбор: неполный набор, полный набор и лишний ответ', () => {
  for (const [id, correct, wrong] of [[3, [1, 2], 0], [5, [1, 3], 2], [10, [0, 1, 2], 3]]) {
    assert.equal(score(q(id), []), 0);
    assert.equal(score(q(id), [correct[0]]), 1);
    assert.equal(score(q(id), correct), 2);
    assert.equal(score(q(id), [...correct, wrong]), 0);
    assert.equal(score(q(id), [wrong]), 0);
    assert.equal(score(q(id), [...correct].reverse()), 2);
  }
});

test('Вопрос 11: действующее правило лучшего ответа и ограничение двух выборов', () => {
  assert.equal(score(q(11), [0]), 1);
  assert.equal(score(q(11), [1]), 2);
  assert.equal(score(q(11), [0, 2]), 1);
  assert.equal(score(q(11), [1, 4]), 2);
  assert.equal(score(q(11), [0, 1]), 2);
  assert.throws(() => score(q(11), [0, 1, 4]), { name: 'RangeError' });
});

test('Вопрос 12: максимум только за последний ответ без других героинь', () => {
  assert.equal(score(q(12), [4]), 2);
  for (let mask = 1; mask < 32; mask++) {
    const selected = Array.from({ length: 5 }, (_, i) => i).filter(i => mask & (1 << i));
    if (mask !== 16) assert.equal(score(q(12), selected), 0);
  }
});

test('Повторный индекс не удваивает баллы; неизвестный вариант отклоняется', () => {
  assert.equal(score(q(3), [1, 1, 2]), 2);
  for (const invalid of [-1, 99, 0.5]) assert.throws(() => score(q(1), [invalid]), { name: 'RangeError' });
});

test('Все допустимые выборы: целые 0–2 балла и достижимый максимум 24', () => {
  let states = new Map([['0:false', { total: 0, zero: false }]]);
  let selections = 0;
  for (const question of questions) {
    const available = new Set();
    for (let mask = 1; mask < (1 << question.options.length); mask++) {
      const selected = Array.from({ length: question.options.length }, (_, i) => i).filter(i => mask & (1 << i));
      if ((!question.multi && selected.length > 1) || (question.maxSelect && selected.length > question.maxSelect)) continue;
      const points = score(question, selected);
      assert.ok([0, 1, 2].includes(points)); available.add(points); selections++;
    }
    const next = new Map();
    for (const state of states.values()) for (const points of available) {
      const total = state.total + points, zero = state.zero || points === 0;
      next.set(`${total}:${zero}`, { total, zero });
    }
    states = next;
  }
  assert.equal(Math.max(...[...states.values()].map(state => state.total)), 24);
  assert.deepEqual([...new Set([...states.values()].map(state => state.total))].sort((a, b) => a - b), Array.from({ length: 24 }, (_, i) => i + 1));
  console.log(`Проверены ${selections} допустимых выборов по вопросам и все достижимые суммы 1–24`);
});

test('Все 531441 комбинации баллов попадают ровно в один результат', () => {
  const counts = [0, 0, 0, 0];
  for (let encoded = 0; encoded < 3 ** 12; encoded++) {
    let n = encoded;
    const points = Array.from({ length: 12 }, () => { const p = n % 3; n = Math.floor(n / 3); return p; });
    const total = points.reduce((a, b) => a + b, 0);
    const expected = total >= 22 && points.every(p => p > 0) ? 0 : total >= 18 ? 1 : total >= 14 ? 2 : 3;
    const actual = resultIndex(points);
    assert.equal(actual, expected); counts[actual]++;
  }
  assert.ok(counts.every(count => count > 0));
  assert.equal(counts.reduce((a, b) => a + b, 0), 531441);
  assert.equal(resultIndex([0, ...Array(11).fill(2)]), 1);
  assert.equal(resultIndex([1, 1, ...Array(10).fill(2)]), 0);
  assert.throws(() => resultIndex(Array(11).fill(2)), { name: 'RangeError' });
  assert.throws(() => resultIndex([3, ...Array(11).fill(2)]), { name: 'RangeError' });
  console.log('Распределение всех комбинаций по четырем результатам:', counts);
});
