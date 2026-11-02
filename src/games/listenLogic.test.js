// Tests for the Jeepney stop rules in listenLogic.js. Run with: npm test
// They use only Node's built-in test runner (node:test), so no extra packages are needed.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAnswers, canFinish, canNext, currentQuestion, initialQuiz, isLastQuestion, listeningRows,
  progressLabel, quizReducer,
} from './listenLogic.js';

// 5 questions like the server sends: word_id, audio_url, 4 meanings as options.
const QUESTIONS = [
  { word_id: 11, audio_url: 'https://x/11.mp3', options: ['water', 'fire', 'house', 'love'] },
  { word_id: 12, audio_url: 'https://x/12.mp3', options: ['sun', 'moon', 'star', 'sky'] },
  { word_id: 13, audio_url: 'https://x/13.mp3', options: ['dog', 'cat', 'bird', 'fish'] },
  { word_id: 14, audio_url: 'https://x/14.mp3', options: ['red', 'blue', 'green', 'white'] },
  { word_id: 15, audio_url: 'https://x/15.mp3', options: ['one', 'two', 'three', 'four'] },
];
const start = () => initialQuiz(QUESTIONS);
const choose = (s, option) => quizReducer(s, { type: 'choose', option });
const next = (s) => quizReducer(s, { type: 'next' });
// Choose the first option of each question and go on, stopping on question `upTo` (0-based).
function answerUpTo(upTo) {
  let s = start();
  for (let i = 0; i < upTo; i += 1) s = next(choose(s, QUESTIONS[i].options[0]));
  return s;
}

test('initial state: first question, nothing chosen', () => {
  const s = start();
  assert.equal(s.index, 0);
  assert.equal(currentQuestion(s), QUESTIONS[0]);
  assert.ok(Object.values(s.choices).every((c) => c === null));
  assert.equal(Object.keys(s.choices).length, 5);
});

test('choose sets the current question\'s choice, and the choice can change', () => {
  let s = choose(start(), 'fire');
  assert.equal(s.choices[11], 'fire');
  s = choose(s, 'love');
  assert.equal(s.choices[11], 'love');
  assert.equal(s.choices[12], null);
});

test('choose with an option that is not on the current question is ignored', () => {
  const s = start();
  assert.equal(choose(s, 'moon'), s);       // an option of question 2, not question 1
  assert.equal(choose(s, 'nonsense'), s);
});

test('next is ignored without a choice, works with one, and is ignored on the last question', () => {
  const s = start();
  assert.equal(next(s), s);
  const moved = next(choose(s, 'water'));
  assert.equal(moved.index, 1);
  const last = answerUpTo(4);
  assert.equal(last.index, 4);
  const lastChosen = choose(last, 'two');
  assert.equal(next(lastChosen), lastChosen);
});

test('canNext and canFinish at every stage: canFinish only true at the very end', () => {
  for (let i = 0; i < 4; i += 1) {
    const s = answerUpTo(i);
    assert.equal(isLastQuestion(s), false, `q${i + 1} is not last`);
    assert.equal(canNext(s), false, `q${i + 1} unanswered: no Next`);
    assert.equal(canFinish(s), false, `q${i + 1} unanswered: no Finish`);
    const chosen = choose(s, QUESTIONS[i].options[1]);
    assert.equal(canNext(chosen), true, `q${i + 1} answered: Next`);
    assert.equal(canFinish(chosen), false, `q${i + 1} answered: still no Finish`);
  }
  const last = answerUpTo(4);
  assert.equal(isLastQuestion(last), true);
  assert.equal(canNext(last), false);
  assert.equal(canFinish(last), false);
  const done = choose(last, 'three');
  assert.equal(canNext(done), false);
  assert.equal(canFinish(done), true);
});

test('buildAnswers returns 5 answers in question order', () => {
  const done = choose(answerUpTo(4), 'three');
  assert.deepEqual(buildAnswers(done), [
    { word_id: 11, choice: 'water' },
    { word_id: 12, choice: 'sun' },
    { word_id: 13, choice: 'dog' },
    { word_id: 14, choice: 'red' },
    { word_id: 15, choice: 'three' },
  ]);
});

test('buildAnswers throws when any question is unanswered', () => {
  assert.throws(() => buildAnswers(start()));
  assert.throws(() => buildAnswers(answerUpTo(4)));   // last one not chosen
});

test('progressLabel for each question', () => {
  for (let i = 0; i < 5; i += 1) assert.equal(progressLabel(answerUpTo(i)), `Question ${i + 1} of 5`);
});

test('the reducer never changes the previous state, and unknown actions return the same object', () => {
  let s = start();
  const actions = [
    { type: 'choose', option: 'fire' }, { type: 'choose', option: 'love' }, { type: 'next' },
    { type: 'next' }, { type: 'choose', option: 'nope' }, { type: 'choose', option: 'moon' }, { type: 'next' },
  ];
  for (const action of actions) {
    const before = structuredClone(s);
    const after = quizReducer(s, action);
    assert.deepEqual(s, before, `state changed by ${JSON.stringify(action)}`);
    s = after;
  }
  assert.equal(quizReducer(s, { type: 'honk' }), s);
  assert.equal(quizReducer(s, undefined), s);
});

test('listeningRows uses the server keys and names each question', () => {
  const results = [
    { word_id: 11, your_choice: 'water', right_choice: 'water', correct: true },
    { word_id: 13, your_choice: 'cat', right_choice: 'dog', correct: false },
  ];
  assert.deepEqual(listeningRows(results, QUESTIONS), [
    { key: 11, word: 'Question 1', rightMeaning: 'water', yourMeaning: 'water', correct: true,
      summary: 'Question 1: the answer was water' },
    { key: 13, word: 'Question 3', rightMeaning: 'dog', yourMeaning: 'cat', correct: false,
      summary: 'Question 3: the answer was dog' },
  ]);
});
