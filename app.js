(function () {
  'use strict';
  const data = window.VET_CONTENT, core = window.VetCore;
  const chapters = data.chapters;
  const questions = chapters.flatMap(c => c.questions.map(q => ({ ...q, chapterId: c.id, chapterTitle: c.title })));
  const byId = Object.fromEntries(questions.map(q => [q.id, q]));
  const main = document.getElementById('main');
  const KEY = 'bibia-estudos-vet-v1';
  let storageAvailable = true;
  const blankState = () => ({ version: 1, records: {}, history: [], active: null, lastResult: null });
  let state = blankState();
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved?.version === 1 && saved.records && Array.isArray(saved.history)) state = { ...blankState(), ...saved };
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (_) { storageAvailable = false; }
  if (!storageAvailable) document.getElementById('storage-warning').hidden = false;
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (_) { document.getElementById('storage-warning').hidden = false; }
  }
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rich = s => escape(s).replace(/&lt;(\/?b|br\s*\/?)&gt;/g, '<$1>');
  const pct = n => Math.round(n * 100);
  const gradeText = n => Number(n).toFixed(1).replace('.', ',');
  const dateText = n => new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(n));
  const icons = {
    home: '<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-8h6v8"/>',
    book: '<path d="M12 5v16M12 5C8 2 4 3 2 4v16c3-1 6-1 10 1 4-2 7-2 10-1V4c-2-1-6-2-10 1Z"/>',
    play: '<path d="m9 5 11 7-11 7z"/>',
    cards: '<rect x="6" y="3" width="14" height="17" rx="3"/><path d="M3 7v13a2 2 0 0 0 2 2h11M10 8h6M10 12h6"/>',
    chart: '<path d="M4 3v17h17M8 16v-4M13 16V7M18 16V4"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    check: '<path d="m5 12 4 4L19 6"/><circle cx="12" cy="12" r="10"/>',
    retry: '<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7v1"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
  const button = (label, action, extra = '', style = '') => `<button class="button ${style}" data-action="${action}" ${extra}>${label}</button>`;
  function announce(s) { document.getElementById('announcer').textContent = s; }
  function chapterStats(c) {
    const seen = c.questions.filter(q => state.records[q.id]?.attempts > 0);
    const mastered = seen.filter(q => state.records[q.id].lastScore === 1);
    return { seen: seen.length, mastered: mastered.length, total: c.questions.length, ratio: mastered.length / c.questions.length };
  }
  function totals() {
    const records = Object.entries(state.records).filter(([id, r]) => byId[id] && r.attempts > 0);
    const attempts = records.reduce((n, [, r]) => n + r.attempts, 0);
    const earned = records.reduce((n, [, r]) => n + (r.earned || 0), 0);
    const mastered = records.filter(([, r]) => r.lastScore === 1).length;
    return { seen: records.length, attempts, earned, mastered, accuracy: attempts ? earned / attempts : null, ratio: mastered / questions.length };
  }
  const mistakes = () => questions.filter(q => state.records[q.id]?.attempts > 0 && state.records[q.id].lastScore < 1);
  const dueCards = () => questions.filter(q => state.records[q.id]?.due != null && state.records[q.id].due <= Date.now());
  function updateNav(route) {
    const active = route.startsWith('capitulo') ? 'capitulos' : ['sessao', 'resultado', 'simulado', 'revisar'].includes(route) ? 'praticar' : route;
    document.getElementById('nav').innerHTML = [['inicio', 'home', 'Início'], ['capitulos', 'book', 'Capítulos'], ['praticar', 'play', 'Praticar'], ['cartoes', 'cards', 'Cartões'], ['progresso', 'chart', 'Progresso']].map(([r, i, label]) => `<a class="nav-link ${active === r ? 'active' : ''}" href="#${r}" ${active === r ? 'aria-current="page"' : ''}>${icon(i)}${label}</a>`).join('');
  }
  function header(eyebrow, title, subtitle = '', pill = '') {
    return `<div class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1>${subtitle ? `<p class="lead">${subtitle}</p>` : ''}</div>${pill ? `<span class="pill">${pill}</span>` : ''}</div>`;
  }
  function featureArt() {
    return '<svg class="feature-art" viewBox="0 0 130 150" aria-hidden="true"><rect x="19" y="17" width="92" height="119" rx="13" fill="#ffffff18" stroke="#ffffff38"/><rect x="10" y="9" width="92" height="119" rx="13" fill="#edf1ff"/><path d="M29 38h50M29 51h38M29 77h50M29 90h34" stroke="#6b80ce" stroke-width="5" stroke-linecap="round"/><circle cx="93" cy="110" r="25" fill="#66d8bb"/><path d="m82 111 8 8 15-17" fill="none" stroke="#164b43" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function moduleCard(c) {
    const s = chapterStats(c);
    const group = c.id === 6 ? 'group-allergy' : c.id >= 7 ? 'group-vaccine' : '';
    return `<article class="card module-card ${group}"><div class="module-top"><span class="module-number">${String(c.id).padStart(2, '0')}</span><span class="module-meta">${s.total} exercícios</span></div><h3><a href="#capitulo/${c.id}">${escape(c.title)}</a></h3><div class="module-progress" aria-label="${s.mastered} de ${s.total} exercícios dominados"><span style="width:${pct(s.ratio)}%"></span></div><div class="module-bottom"><span>${s.mastered} / ${s.total} dominados</span><a class="text-link" href="#capitulo/${c.id}">Estudar</a></div></article>`;
  }
  function groupsHTML(list = chapters) {
    return ['Imunologia', 'Hipersensibilidade alimentar', 'Vacinação'].map(group => {
      const cs = list.filter(c => c.group === group);
      return cs.length ? `<div class="group-label">${group}${group === 'Vacinação' ? ' · parte final' : ''}</div><div class="module-grid">${cs.map(moduleCard).join('')}</div>` : '';
    }).join('');
  }
  function continuation() {
    const a = state.active;
    if (!a || a.finished) return '';
    return `<div class="continuation"><p><strong>Há uma sessão em andamento.</strong><br>${a.kind === 'flash' ? 'Cartão' : 'Exercício'} ${a.index + 1} de ${a.ids.length} · ${escape(a.label)}</p>${button('Continuar sessão', 'resume')}</div>`;
  }
  function home() {
    const t = totals(), errors = mistakes().length;
    return header('Seu espaço de estudo', 'Vamos estudar, Bibia?', 'Escolha um assunto ou faça uma sessão curta. As respostas aparecem depois da sua tentativa.', '14 capítulos · 153 exercícios') + continuation() +
      `<div class="start-grid"><section class="card session-feature"><div><div class="eyebrow">UM POUCO A CADA DIA</div><h2>10 perguntas.<br>Um passo a mais.</h2><p>Uma seleção de assuntos para praticar e descobrir o que merece revisão.</p><div class="button-row">${button('Começar prática', 'start', 'data-mode="practice" data-scope="all"')}${button('Revisar erros' + (errors ? ` (${errors})` : ''), 'start', 'data-mode="review" data-scope="all"', 'secondary')}</div></div>${featureArt()}</section><section class="card ring-card"><div class="ring" style="--progress:${pct(t.ratio)}%"><div class="ring-value">${pct(t.ratio)}%<small>DOMINADO</small></div></div><div><h3>Seu progresso</h3><p>${t.mastered} de ${questions.length} exercícios<br>com acerto completo na última tentativa.</p></div></section></div>` +
      `<div class="stats"><div class="card stat"><div class="stat-icon">${icon('target')}</div><div><div class="stat-value">${t.accuracy === null ? '—' : pct(t.accuracy) + '%'}</div><div class="stat-label">Acertos nas tentativas</div></div></div><div class="card stat"><div class="stat-icon">${icon('check')}</div><div><div class="stat-value">${t.seen}</div><div class="stat-label">Exercícios praticados</div></div></div><div class="card stat"><div class="stat-icon">${icon('cards')}</div><div><div class="stat-value">${dueCards().length}</div><div class="stat-label">Cartões para revisar</div></div></div></div>` +
      `<div class="section-head"><h2>Seu caminho de estudo</h2><a class="text-link" href="#capitulos">Ver todos os capítulos</a></div>${groupsHTML()}`;
  }
  function chapterList() {
    return header('Conteúdo', 'Um assunto de cada vez.', 'Imunologia primeiro, hipersensibilidade alimentar depois e vacinação na parte final.') + groupsHTML();
  }
  function diagram(id) {
    const flows = {
      1: [['Barreiras', 'Pele, mucosas e microbiota'], ['Imunidade inata', 'Resposta rápida'], ['Adaptativa', 'Especificidade e memória']],
      3: [['MHC I', 'Apresentação de antígenos'], ['T CD8+', 'Reconhecimento'], ['Citotoxicidade', 'Destruição do alvo']],
      5: [['Primeiro contato', 'Forma memória'], ['Novo contato', 'Ativa memória'], ['Resposta secundária', 'Mais rápida e duradoura']],
      6: [['Eliminação', 'Retira o alimento suspeito'], ['Melhora dos sinais', 'Avalia a resposta'], ['Provocação', 'Verifica a recaída']],
      10: [['6–8 semanas', 'Início da série de rotina'], ['2–4 semanas', 'Intervalos entre doses'], ['≥16 semanas', 'Idade mínima da última dose']],
      13: [['3 meses', 'Persistência da massa'], ['>2 cm', 'Diâmetro da massa'], ['1 mês', 'Crescimento após aplicação']],
    };
    if (!flows[id]) return '';
    const titles = { 1: 'CAMADAS DE DEFESA', 3: 'MHC I E RESPOSTA CITOTÓXICA', 5: 'COMO A MEMÓRIA MUDA A RESPOSTA', 6: 'CAMINHO DO DIAGNÓSTICO', 10: 'SÉRIE PRIMÁRIA DE ROTINA', 13: 'REGRA 3-2-1: QUALQUER CRITÉRIO EXIGE INVESTIGAÇÃO' };
    const caption = { 1: 'As respostas interagem; este esquema organiza as três camadas.', 3: 'MHC II apresenta antígenos para T CD4+, que coordena outras células.', 10: 'Em alto risco, concluir entre 18 e 20 semanas. Abrigos usam outro protocolo. O guia prevê revacinação em torno de 26 semanas ou avaliação sorológica.', 13: 'Não é necessário que os três critérios estejam presentes juntos.' };
    return `<div class="diagram"><div class="diagram-title">${titles[id]}</div><div class="diagram-flow">${flows[id].map((n, i) => `${i ? '<span class="diagram-join" aria-hidden="true">›</span>' : ''}<div class="diagram-node"><b>${n[0]}</b>${n[1]}</div>`).join('')}</div>${caption[id] ? `<p class="diagram-caption">${caption[id]}</p>` : ''}</div>`;
  }
  function lesson(id) {
    const c = chapters.find(c => c.id === Number(id));
    if (!c) return chapterList();
    const lessonHTML = c.lesson.map(b => {
      if (b.type === 'heading') return `<h2 class="lesson-heading">${escape(b.text)}</h2>`;
      if (b.type === 'table') return `<div class="table-wrap"><table><thead><tr>${b.headers.map(h => `<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${b.rows.map(row => `<tr>${row.map((v, i) => i ? `<td>${escape(v)}</td>` : `<th scope="row">${escape(v)}</th>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      if (b.type === 'qa') return `<details class="lesson-qa"><summary>${escape(b.question)}</summary><div class="lesson-answer"><strong>Resposta explicada</strong>${escape(b.answer)}</div></details>`;
      return `<p class="lesson-paragraph">${rich(b.html).replace(/\[  \]/g, '□')}</p>`;
    }).join('');
    return `<a class="text-link" href="#capitulos">Todos os capítulos</a><div style="height:18px"></div>` + header(`Capítulo ${String(c.id).padStart(2, '0')} · ${c.group}`, escape(c.title), 'Leia os conceitos e abra as respostas quando quiser conferir.', `${c.questions.length} exercícios`) +
      `<div class="lesson-layout"><div class="lesson-main">${diagram(c.id)}<section class="card">${lessonHTML}</section><div class="button-row">${c.id > 1 ? `<a class="button secondary" href="#capitulo/${c.id - 1}">Capítulo anterior</a>` : ''}${c.id < 14 ? `<a class="button secondary" href="#capitulo/${c.id + 1}">Próximo capítulo</a>` : ''}</div></div><aside class="card lesson-aside"><h3>O que levar deste capítulo</h3><ul>${c.summary.map(s => `<li>${escape(s)}</li>`).join('')}</ul>${button('Praticar este capítulo', 'start', `data-mode="practice" data-scope="${c.id}"`)}${button('Revisar com cartões', 'start-flash', `data-scope="${c.id}"`, 'secondary')}<p class="compact-meta" style="margin-top:18px;margin-bottom:0">A leitura tem o gabarito completo. Na prática, as discursivas foram adaptadas para perguntas objetivas.</p></aside></div>`;
  }
  function scopeSelect(id = 'scope') {
    return `<label for="${id}">O que estudar<select id="${id}"><option value="all">Todos os capítulos</option>${chapters.map(c => `<option value="${c.id}">${c.id}. ${escape(c.title)}</option>`).join('')}</select></label>`;
  }
  function practicePage() {
    return header('Exercícios', 'Escolha como praticar.', 'Tente responder antes de conferir. Uma nota ajuda a acompanhar; entender o erro ajuda a aprender.') + continuation() + `<div class="scope-bar">${scopeSelect()}</div><div class="modes"><section class="card mode-card"><div class="stat-icon">${icon('play')}</div><h2>Prática rápida</h2><p>Até 10 exercícios com correção e explicação logo após responder.</p><p class="mode-note">Sem limite de tempo. Acertos parciais contam proporcionalmente.</p>${button('Começar prática', 'start', 'data-mode="practice" data-select="scope"')}</section><section class="card mode-card"><div class="stat-icon">${icon('target')}</div><h2>Simulado</h2><p>Até 20 exercícios. Você vê as respostas e a nota ao terminar.</p><p class="mode-note">A nota usa a primeira resposta de cada exercício da sessão.</p>${button('Fazer simulado', 'start', 'data-mode="exam" data-select="scope"', 'secondary')}</section><section class="card mode-card"><div class="stat-icon">${icon('retry')}</div><h2>Revisar erros</h2><p>Uma rodada com os exercícios que ainda precisam de atenção.</p><p class="mode-note">${mistakes().length} exercícios para revisar neste navegador.</p>${button('Revisar erros', 'start', 'data-mode="review" data-select="scope"', 'secondary')}</section></div><div class="notice">${icon('info')}<span>As lacunas aceitam variações de acentuação e os sinônimos previstos no gabarito. Em associações e lacunas múltiplas, cada item correto contribui para a nota.</span></div>`;
  }
  function changeRoute(hash) {
    if (location.hash === '#' + hash) render();
    else location.hash = hash;
  }
  function selectedScope(el) { return el.dataset.select ? document.getElementById(el.dataset.select).value : el.dataset.scope || 'all'; }
  function getChapters(scope) { return scope === 'all' ? chapters : chapters.filter(c => c.id === Number(scope)); }
  function begin(mode, scope, idsOverride) {
    const cs = getChapters(scope);
    let ids = idsOverride || (mode === 'review' ? core.shuffle(mistakes().filter(q => scope === 'all' || q.chapterId === Number(scope)).map(q => q.id)).slice(0, 10) : core.sampleBalanced(cs, mode === 'exam' ? 20 : 10));
    if (!ids.length) {
      main.innerHTML = header('Revisão', 'Nenhum erro para revisar aqui.', 'Os erros e os acertos parciais aparecem depois das suas tentativas.') + `<div class="empty-state">${icon('check')}<h2>Você pode seguir para uma nova prática.</h2><p>Troque o capítulo ou faça uma rodada com todos os assuntos.</p>${button('Praticar todos os capítulos', 'start', 'data-mode="practice" data-scope="all"')}</div>`;
      announce('Nenhum erro neste conjunto de capítulos.');
      return;
    }
    const label = mode === 'exam' ? 'Simulado' : mode === 'review' ? 'Revisão dos erros' : 'Prática rápida';
    state.active = { kind: 'quiz', mode, scope, ids, index: 0, label, createdAt: Date.now(), results: {}, drafts: {}, options: {}, finished: false };
    ids.forEach(id => { if (byId[id].type === 'choice') state.active.options[id] = core.shuffle(byId[id].options); });
    save(); changeRoute('sessao');
  }
  function correctAnswers(q) {
    if (q.type === 'choice') return escape(q.answer);
    if (q.type === 'match') return q.pairs.map(p => `${escape(p.text)} → ${escape(q.labels[Number(p.answer) - 1])}`).join('<br>');
    return q.answers.map((a, i) => `${q.answers.length > 1 ? `${i + 1}. ` : ''}${escape(q.referenceAnswers?.[i] || a[0])}`).join('<br>');
  }
  function displayedResponse(q, response) {
    if (q.type === 'choice') return escape(response || 'Sem resposta');
    const values = Array.isArray(response) ? response : [];
    if (q.type === 'match') return values.map((v, i) => `${i + 1}. ${escape(q.labels[Number(v) - 1] || 'Sem resposta')}`).join(' · ');
    return values.map(v => escape(v)).join(' · ');
  }
  function feedback(q, result) {
    const partial = result.score > 0 && result.score < 1;
    return `<section class="feedback ${result.correct ? '' : partial ? 'partial' : 'wrong'}" role="status"><h2>${result.correct ? 'Acertou!' : partial ? `${result.parts.filter(Boolean).length} de ${result.parts.length} itens corretos.` : 'Vale revisar este conceito.'}</h2>${!result.correct ? `<p><strong>Resposta de referência:</strong><br>${correctAnswers(q)}</p>` : ''}<p>${escape(q.explanation)}</p>${q.distinct ? '<p>Mais de uma combinação é válida. Os itens precisam ser diferentes.</p>' : ''}</section>`;
  }
  function quizPage() {
    const a = state.active;
    if (!a || a.kind !== 'quiz') return practicePage();
    if (a.finished) return resultPage();
    const q = byId[a.ids[a.index]];
    if (!q) { state.active = null; save(); return practicePage(); }
    const result = a.results[q.id], draft = result?.response ?? a.drafts[q.id];
    let fields;
    if (q.type === 'choice') {
      fields = `<fieldset class="options" style="border:0;padding:0;margin:0"><legend class="sr-only">Escolha uma resposta</legend>${a.options[q.id].map((option, i) => {
        const checked = draft === option, show = result && a.mode !== 'exam';
        const cls = show && option === q.answer ? 'correct-option' : show && checked && option !== q.answer ? 'wrong-option' : '';
        return `<label class="option ${cls}"><input type="radio" name="choice" value="${escape(option)}" ${checked ? 'checked' : ''} ${result ? 'disabled' : ''}><span>${escape(option)}</span></label>`;
      }).join('')}</fieldset>`;
    } else if (q.type === 'fill') {
      fields = `<div class="fill-fields">${q.answers.map((_, i) => `<div class="fill-field"><label for="answer-${i}">${q.answers.length > 1 ? `Lacuna ${i + 1}` : 'Sua resposta'}</label><input id="answer-${i}" name="answer-${i}" autocomplete="off" autocapitalize="off" spellcheck="false" value="${escape(draft?.[i] || '')}" ${result ? 'disabled' : ''} class="${result && a.mode !== 'exam' && !result.parts[i] ? 'invalid' : ''}"></div>`).join('')}</div>${q.distinct ? '<p class="compact-meta" style="margin-top:12px;margin-bottom:0">A ordem pode variar; use itens diferentes em cada lacuna.</p>' : ''}`;
    } else {
      fields = `<div class="match-fields">${q.pairs.map((pair, i) => `<div class="match-row"><label for="match-${i}">${escape(pair.text)}</label><select id="match-${i}" name="match-${i}" ${result ? 'disabled' : ''}><option value="">Escolha um conceito</option>${q.labels.map((label, j) => `<option value="${j + 1}" ${String(draft?.[i]) === String(j + 1) ? 'selected' : ''}>${escape(label)}</option>`).join('')}</select></div>`).join('')}</div>`;
    }
    const last = a.index === a.ids.length - 1;
    return `<div class="quiz-wrap"><div class="quiz-top"><span>${escape(a.label)} · ${a.index + 1} de ${a.ids.length}</span>${button('Pausar', 'pause', '', 'ghost')}</div><div class="quiz-progress" aria-label="Exercício ${a.index + 1} de ${a.ids.length}"><span style="width:${(a.index + 1) / a.ids.length * 100}%"></span></div><article class="card question-card"><div class="question-tag">${q.chapterId}. ${escape(q.chapterTitle)} · ${escape(q.ref)}</div>${q.context ? `<p class="context">${escape(q.context)}</p>` : ''}<h1>${escape(q.prompt)}</h1><form id="question-form" novalidate>${fields}<p id="validation" class="validation" hidden role="alert">Responda todos os itens antes de continuar.</p>${result && a.mode !== 'exam' ? feedback(q, result) : ''}<div class="question-actions"><p>${a.mode === 'exam' ? 'O gabarito aparece ao terminar o simulado.' : 'Sua primeira resposta conta para a nota desta sessão.'}</p>${result ? button(last ? 'Ver resultado' : 'Próximo exercício', 'next') : `<button class="button" type="submit">${a.mode === 'exam' ? (last ? 'Responder e finalizar' : 'Responder e continuar') : 'Conferir resposta'}</button>`}</div></form></article></div>`;
  }
  function readResponse(q) {
    if (q.type === 'choice') return document.querySelector('input[name="choice"]:checked')?.value || '';
    const prefix = q.type === 'fill' ? 'answer' : 'match';
    const length = q.type === 'fill' ? q.answers.length : q.pairs.length;
    return Array.from({ length }, (_, i) => document.getElementById(`${prefix}-${i}`).value.trim());
  }
  function submitQuestion(event) {
    event.preventDefault();
    const a = state.active;
    if (!a || a.kind !== 'quiz' || a.finished) return;
    const q = byId[a.ids[a.index]];
    if (a.results[q.id]) return;
    const response = readResponse(q);
    const complete = q.type === 'choice' ? Boolean(response) : response.every(Boolean);
    if (!complete) { document.getElementById('validation').hidden = false; announce('Responda todos os itens.'); return; }
    const result = { ...core.grade(q, response), response };
    a.results[q.id] = result;
    const record = state.records[q.id] || { attempts: 0, earned: 0 };
    state.records[q.id] = core.markForReview({ ...record, attempts: record.attempts + 1, earned: (record.earned || 0) + result.score, lastScore: result.score, lastAt: Date.now() }, result.correct);
    save();
    if (a.mode === 'exam') nextQuestion();
    else { render(false); announce(result.correct ? 'Acertou! A explicação está abaixo.' : 'Confira a resposta e a explicação abaixo.'); document.querySelector('.feedback')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }
  function nextQuestion() {
    const a = state.active;
    if (!a || !a.results[a.ids[a.index]]) return;
    if (a.index < a.ids.length - 1) { a.index++; save(); render(); }
    else finishQuiz();
  }
  function finishQuiz() {
    const a = state.active;
    if (!a || a.finished) return;
    a.finished = true; a.finishedAt = Date.now();
    state.lastResult = JSON.parse(JSON.stringify(a));
    state.history.unshift({ date: a.finishedAt, label: a.label, mode: a.mode, count: a.ids.length, score: core.scoreSession(a), scope: a.scope });
    state.history = state.history.slice(0, 50);
    save(); changeRoute('resultado');
  }
  function resultPage() {
    const a = state.lastResult;
    if (!a) return practicePage();
    const score = core.scoreSession(a), full = a.ids.filter(id => a.results[id].correct).length;
    const partial = a.ids.filter(id => a.results[id].score > 0 && a.results[id].score < 1).length;
    const errorIds = a.ids.filter(id => !a.results[id].correct);
    return `<div class="quiz-wrap">${header('Seu resultado', escape(a.label), '')}<section class="card result-head"><div class="eyebrow">${a.ids.length} EXERCÍCIOS CONCLUÍDOS</div><div class="result-score">${gradeText(score)}<small> / 10</small></div><h2>${score >= 8 ? 'Você está construindo uma boa base.' : 'Agora você sabe o que revisar.'}</h2><p>${full} acertos completos${partial ? ` · ${partial} parciais` : ''} · ${a.ids.length - full - partial} para retomar.<br>Nota = soma dos pontos ÷ exercícios × 10.</p><div class="button-row">${errorIds.length ? button('Revisar os erros desta sessão', 'retry-result') : button('Nova prática', 'start', 'data-mode="practice" data-scope="all"')}<a class="button secondary" href="#progresso">Ver progresso</a><a class="button secondary" href="#inicio">Voltar ao início</a></div></section><div class="section-head"><h2>Confira as explicações</h2><p>Primeira resposta da sessão</p></div><div class="result-review">${a.ids.map((id, i) => {
      const q = byId[id], r = a.results[id];
      return `<article class="card result-item"><div class="question-tag"><span>Exercício ${i + 1} · capítulo ${q.chapterId}</span><span class="${r.correct ? 'badge-correct' : r.score > 0 ? 'badge-partial' : 'badge-wrong'}">${r.correct ? 'Correto' : r.score > 0 ? 'Parcial' : 'Revisar'}</span></div>${q.context ? `<p class="compact-meta">${escape(q.context)}</p>` : ''}<h3>${escape(q.prompt)}</h3><p class="answer-line"><strong>Sua resposta:</strong> ${displayedResponse(q, r.response)}</p>${!r.correct ? `<p class="answer-line"><strong>Referência:</strong> ${correctAnswers(q)}</p>` : ''}<p class="explanation">${escape(q.explanation)}</p><a href="#capitulo/${q.chapterId}" class="text-link">Rever o capítulo</a></article>`;
    }).join('')}</div></div>`;
  }
  function flashPage() {
    const a = state.active;
    if (a?.kind === 'flash' && !a.finished && location.hash === '#sessao') {
      const q = byId[a.ids[a.index]];
      return `<div class="quiz-wrap"><div class="quiz-top"><span>Cartão ${a.index + 1} de ${a.ids.length}</span>${button('Pausar', 'pause', '', 'ghost')}</div><div class="quiz-progress"><span style="width:${(a.index + 1) / a.ids.length * 100}%"></span></div><article class="card question-card flash-card"><div class="question-tag">${q.chapterId}. ${escape(q.chapterTitle)}</div>${q.context ? `<p class="context">${escape(q.context)}</p>` : ''}<h1>${escape(q.prompt)}</h1>${!a.revealed ? `<p class="compact-meta">Tente responder de memória antes de revelar.</p>${button('Mostrar resposta', 'reveal')}` : `<div class="flash-answer">${correctAnswers(q)}</div><p class="compact-meta">${escape(q.explanation)}</p><div class="button-row">${button('Preciso rever', 'mark-flash', 'data-good="no"', 'secondary')}${button('Lembrei bem', 'mark-flash', 'data-good="yes"', 'teal')}</div>`}</article><p class="compact-meta" style="text-align:center;margin-top:20px">Cartões são autoavaliação e não alteram a nota dos exercícios.</p></div>`;
    }
    return header('Revisão espaçada', 'Lembre hoje. Retome depois.', 'Cartões para tentar lembrar sem olhar. Marque com sinceridade o que já está claro.') + continuation() + `<div class="scope-bar">${scopeSelect('flash-scope')}</div><section class="card"><div class="page-head"><div><h2>${dueCards().length ? `${dueCards().length} cartões prontos para revisão.` : 'Comece com uma rodada de cartões.'}</h2><p class="lead">Até 12 cartões por sessão. A revisão usa intervalos de 1, 3, 7 e 14 dias conforme seus acertos e sua autoavaliação.</p></div><div class="stat-icon">${icon('cards')}</div></div><div class="button-row">${button('Começar cartões', 'start-flash', 'data-select="flash-scope"')}</div></section><div class="notice">${icon('info')}<span>Os intervalos organizam a prática; você pode revisar a qualquer momento. Os cartões ajudam a lembrar, mas a nota vem apenas dos exercícios corrigidos.</span></div>`;
  }
  function beginFlash(scope) {
    const due = core.shuffle(dueCards().filter(q => scope === 'all' || q.chapterId === Number(scope)).map(q => q.id));
    const ids = due.length ? due.slice(0, 12) : core.sampleBalanced(getChapters(scope), 12);
    state.active = { kind: 'flash', ids, index: 0, revealed: false, label: 'Cartões de revisão', finished: false, remembered: 0 };
    save(); changeRoute('sessao');
  }
  function markFlash(good) {
    const a = state.active;
    if (!a || a.kind !== 'flash' || !a.revealed) return;
    const id = a.ids[a.index];
    state.records[id] = core.markForReview(state.records[id] || { attempts: 0, earned: 0 }, good);
    if (good) a.remembered++;
    if (a.index < a.ids.length - 1) { a.index++; a.revealed = false; save(); render(); }
    else {
      a.finished = true; save();
      main.innerHTML = `<div class="quiz-wrap">${header('Cartões', 'Rodada concluída.', '')}<div class="card result-head">${icon('check')}<h2>${a.remembered} de ${a.ids.length} cartões lembrados.</h2><p>A autoavaliação ajustou as próximas revisões. As notas dos exercícios permanecem separadas.</p><div class="button-row"><a class="button" href="#cartoes">Ver revisões</a><a class="button secondary" href="#inicio">Voltar ao início</a></div></div></div>`;
      announce('Rodada de cartões concluída.'); window.scrollTo(0, 0);
    }
  }
  function progressPage() {
    const t = totals();
    return header('Seu progresso', 'Veja o que está ficando claro.', '“Dominado” significa acerto completo na última tentativa. Cartões não aumentam artificialmente a sua nota.') + `<div class="stats"><div class="card stat"><div class="stat-icon">${icon('check')}</div><div><div class="stat-value">${t.mastered} / ${questions.length}</div><div class="stat-label">Exercícios dominados</div></div></div><div class="card stat"><div class="stat-icon">${icon('target')}</div><div><div class="stat-value">${t.accuracy === null ? '—' : pct(t.accuracy) + '%'}</div><div class="stat-label">Acertos em ${t.attempts} tentativas</div></div></div><div class="card stat"><div class="stat-icon">${icon('retry')}</div><div><div class="stat-value">${mistakes().length}</div><div class="stat-label">Exercícios para revisar</div></div></div></div><div class="section-head"><h2>Seu histórico de estudo</h2></div><div class="progress-grid"><section class="card"><h3>Domínio por capítulo</h3>${chapters.map(c => { const s = chapterStats(c); return `<div class="progress-row"><div class="title"><a href="#capitulo/${c.id}">${c.id}. ${escape(c.title)}</a><div class="module-progress"><span style="width:${pct(s.ratio)}%"></span></div></div><div class="numbers">${s.mastered} / ${s.total}</div></div>`; }).join('')}</section><section class="card"><h3>Notas das sessões</h3>${state.history.length ? state.history.map(h => `<div class="progress-row"><div><div class="title">${escape(h.label)} · ${h.count} exercícios</div><div class="compact-meta">${dateText(h.date)}${h.scope !== 'all' ? ` · capítulo ${escape(h.scope)}` : ''}</div></div><div class="history-score">${gradeText(h.score)}<small> / 10</small></div></div>`).join('') : '<p class="compact-meta">Conclua sua primeira prática ou simulado para ver a nota aqui.</p>'}</section></div><div class="notice">${icon('info')}<span>O progresso fica neste navegador. Ele não é enviado a um servidor e não sincroniza automaticamente entre dispositivos. Limpar os dados do navegador apaga o histórico.</span></div><div class="button-row">${button('Baixar uma cópia do progresso', 'export', '', 'secondary')}${button('Apagar progresso', 'ask-reset', '', 'ghost')}</div>`;
  }
  function materialsPage() {
    return header('Seu material', 'Site ou PDF: escolha seu jeito.', 'O mesmo estudo dirigido, com exercícios e respostas para consultar quando precisar.') + `<div class="resource-grid"><section class="card resource-card"><div class="stat-icon">${icon('book')}</div><div><h2>Guia de exercícios</h2><p>14 páginas com lacunas, associações e situações-problema. Espaço para escrever suas respostas.</p><a class="button secondary" href="guia-exercicios.pdf" target="_blank" rel="noopener">Abrir PDF de exercícios</a></div></section><section class="card resource-card"><div class="stat-icon">${icon('check')}</div><div><h2>Guia com respostas</h2><p>As mesmas questões, com lacunas preenchidas, tabelas completas e respostas explicadas.</p><a class="button secondary" href="guia-com-respostas.pdf" target="_blank" rel="noopener">Abrir PDF com respostas</a></div></section></div><section class="card source-card"><h2>Fontes e organização</h2><p>O site usa o texto fornecido e os dois guias elaborados a partir dele. Mantém imunologia e hipersensibilidade alimentar primeiro, com vacinação na parte final.</p><a href="https://wsava.org/wp-content/uploads/2024/04/WSAVA-Vaccination-guidelines-2024.pdf" target="_blank" rel="noopener">WSAVA · Diretrizes de vacinação de cães e gatos, 2024</a><p>Foram esclarecidos os trechos sobre FeLV, PIF, proteção contra CAV-1 com vacina CAV-2 e a dose em torno de 26 semanas. Um resultado sorológico negativo não mede toda a memória imunológica.</p><h3>Como as notas funcionam</h3><p>Questões objetivas valem 1 ponto. Nas lacunas múltiplas e associações, cada item vale uma fração desse ponto. A nota da sessão é a soma dos pontos dividida pelo número de exercícios, multiplicada por 10. Apenas a primeira resposta de cada exercício naquela sessão conta.</p><p>As discursivas originais aparecem no modo de leitura, com respostas-modelo. Suas versões objetivas são as usadas na correção automática. Cartões são autoavaliação e não entram na nota.</p></section>`;
  }
  function render(moveFocus = true) {
    const hash = location.hash.replace(/^#/, '') || 'inicio';
    const [route, id] = hash.split('/');
    updateNav(route);
    const pages = { inicio: home, capitulos: chapterList, capitulo: () => lesson(id), praticar: practicePage, sessao: () => state.active?.kind === 'flash' ? flashPage() : quizPage(), resultado: resultPage, cartoes: flashPage, progresso: progressPage, materiais: materialsPage };
    main.innerHTML = (pages[route] || home)();
    const title = main.querySelector('h1')?.textContent || 'Seu estudo';
    document.title = `${title} · Bibia Estudos`;
    if (moveFocus) { main.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  }
  document.addEventListener('submit', event => { if (event.target.id === 'question-form') submitQuestion(event); });
  document.addEventListener('input', () => {
    const a = state.active;
    if (location.hash === '#sessao' && a?.kind === 'quiz' && !a.finished) {
      const q = byId[a.ids[a.index]];
      if (q && !a.results[q.id]) { a.drafts[q.id] = readResponse(q); save(); }
    }
  });
  document.addEventListener('click', event => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;
    if (action === 'start') begin(el.dataset.mode, selectedScope(el));
    else if (action === 'start-flash') beginFlash(selectedScope(el));
    else if (action === 'resume') changeRoute('sessao');
    else if (action === 'pause') { save(); changeRoute('inicio'); }
    else if (action === 'next') nextQuestion();
    else if (action === 'retry-result') {
      const a = state.lastResult;
      begin('review', a.scope, a.ids.filter(id => !a.results[id].correct));
    }
    else if (action === 'reveal' && state.active?.kind === 'flash') { state.active.revealed = true; save(); render(false); }
    else if (action === 'mark-flash') markFlash(el.dataset.good === 'yes');
    else if (action === 'ask-reset') document.getElementById('reset-dialog').showModal();
    else if (action === 'cancel-reset') document.getElementById('reset-dialog').close();
    else if (action === 'confirm-reset') { state = blankState(); save(); document.getElementById('reset-dialog').close(); render(); announce('Progresso apagado deste navegador.'); }
    else if (action === 'export') {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob), anchor = document.createElement('a');
      anchor.href = url; anchor.download = 'bibia-progresso.json'; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
  window.addEventListener('hashchange', () => render());
  render(false);
})();
