(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.VetCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[.,;:!?()]/g, ' ').replace(/[\u2010-\u2015-]/g, ' ').replace(/\s+/g, ' ').trim();
  function equivalent(value, expected) {
    const a = normalize(value), b = normalize(expected);
    if (!a) return false;
    if (a === b) return true;
    if (/^\d+(?:\s+(?:a|e)?\s*\d+)?$/.test(b)) {
      const numeric = a.replace(/\b(semanas?|meses?|anos?|cm|centimetros?)\b/g, '').replace(/\s+/g, ' ').trim();
      if (/^\d+(?:\s+(?:a|e)?\s*\d+)?$/.test(numeric)) return numeric.match(/\d+/g).join('|') === b.match(/\d+/g).join('|');
    }
    return false;
  }
  function grade(question, response) {
    if (question.type === 'choice') {
      const correct = response === question.answer;
      return { score: correct ? 1 : 0, correct, parts: [correct] };
    }
    const values = Array.isArray(response) ? response : [];
    const expected = question.type === 'match' ? question.pairs.map(pair => [pair.answer]) : question.answers;
    const seen = new Set();
    const parts = expected.map((aliases, i) => {
      let good = aliases.some(a => equivalent(values[i], a));
      if (good && question.distinct) {
        let token = normalize(values[i]);
        if (question.distinctGroups) token = String(question.distinctGroups.findIndex(group => group.some(a => equivalent(values[i], a))));
        if (seen.has(token)) good = false;
        seen.add(token);
      }
      return good;
    });
    const score = parts.filter(Boolean).length / expected.length;
    return { score, correct: score === 1, parts };
  }
  function shuffle(list, random = Math.random) {
    const result = [...list];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function sampleBalanced(chapters, limit, random = Math.random) {
    const pools = shuffle(chapters.map(c => shuffle(c.questions.map(q => q.id), random)), random);
    const result = [];
    while (result.length < limit && pools.some(p => p.length)) {
      for (const pool of pools) {
        if (pool.length && result.length < limit) result.push(pool.pop());
      }
    }
    return shuffle(result, random);
  }
  function markForReview(record, good, now = Date.now()) {
    const level = good ? Math.min((record.flashLevel || 0) + 1, 4) : 0;
    const days = [0, 1, 3, 7, 14][level];
    return { ...record, flashLevel: level, due: now + days * 86400000 };
  }
  function scoreSession(session) {
    return session.ids.reduce((sum, id) => sum + (session.results[id]?.score || 0), 0) / session.ids.length * 10;
  }
  return { normalize, equivalent, grade, shuffle, sampleBalanced, markForReview, scoreSession };
});
