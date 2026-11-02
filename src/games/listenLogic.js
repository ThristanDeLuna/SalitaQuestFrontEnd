// The Jeepney stop rules, in plain JavaScript (no React), so they can be tested with `npm test`.
//
// The player hears one word at a time (the "driver" says it) and picks its meaning
// from 4 options. One question is on screen at a time; there is no Back button.
// State shape:
//   { questions: [{ word_id, audio_url, options: string[] }],  as the server sent them
//     index:     number,                                      the question on screen (0 = first)
//     choices:   { [wordId]: string|null } }                  the option picked for each question
// The reducer never changes the old state object: it returns a new one, or the very
// same object when nothing changes (React then skips the re-render).

// The start of a quiz: first question, nothing chosen.
export function initialQuiz(questions) {
  const list = [...questions];
  return {
    questions: list,
    index: 0,
    choices: Object.fromEntries(list.map((q) => [q.word_id, null])),
  };
}

export function currentQuestion(state) {
  return state.questions[state.index] ?? null;
}

export function isLastQuestion(state) {
  return state.questions.length > 0 && state.index === state.questions.length - 1;
}

const isAnswered = (state, q) => q !== null && q !== undefined && typeof state.choices[q.word_id] === 'string';

// "Next" is allowed when the question on screen has a choice and another question follows.
export function canNext(state) {
  return isAnswered(state, currentQuestion(state)) && !isLastQuestion(state);
}

// "Finish" is allowed on the last question once every question has a choice.
export function canFinish(state) {
  return isLastQuestion(state) && state.questions.every((q) => isAnswered(state, q));
}

export function quizReducer(state, action) {
  switch (action?.type) {
    case 'choose': {
      const q = currentQuestion(state);
      // Only one of this question's own options counts; anything else is ignored.
      if (!q || !q.options.includes(action.option)) return state;
      if (state.choices[q.word_id] === action.option) return state;   // already chosen
      return { ...state, choices: { ...state.choices, [q.word_id]: action.option } };
    }
    case 'next':
      return canNext(state) ? { ...state, index: state.index + 1 } : state;
    default:
      return state;   // unknown action: the same object
  }
}

// The body the server wants: [{word_id, choice}] for every question, in question order.
export function buildAnswers(state) {
  if (!state.questions.every((q) => isAnswered(state, q))) {
    throw new Error('Every question needs a choice before the quiz can be sent.');
  }
  return state.questions.map((q) => ({ word_id: q.word_id, choice: state.choices[q.word_id] }));
}

// "Question 3 of 5"
export function progressLabel(state) {
  return `Question ${state.index + 1} of ${state.questions.length}`;
}

// The rows for the results card. The server answers {word_id, your_choice, right_choice, correct}
// per question. A listening round has no word text, so each row names its question number
// (its place in the round), with its own sentence in `summary`.
export function listeningRows(results, questions) {
  const order = new Map((questions ?? []).map((q, i) => [q.word_id, i + 1]));
  return (results ?? []).map((r, i) => {
    const n = order.get(r.word_id) ?? i + 1;
    return {
      key: r.word_id,
      word: `Question ${n}`,
      rightMeaning: r.right_choice,
      yourMeaning: r.your_choice,
      correct: r.correct === true,
      summary: `Question ${n}: the answer was ${r.right_choice}`,
    };
  });
}
