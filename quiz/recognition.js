(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const bank = window.QUIZ_QUESTIONS;
  const total = 10;
  let round = [], responses = [], position = 0, previousIds = [];
  const shuffle = values => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  function focusAt(element) {
    element.focus({preventScroll:true});
    const top = element.getBoundingClientRect().top;
    if (top < 80 || top > window.innerHeight * .7) element.scrollIntoView({block:'start'});
  }
  function start(firstId) {
    const first = bank.find(q => q.id === firstId);
    const easy = shuffle(bank.filter(q => q.level === 'easy' && q !== first)).slice(0, first?.level === 'easy' ? 3 : 4);
    const discovery = shuffle(bank.filter(q => q.level !== 'easy' && q !== first)).slice(0, first && first.level !== 'easy' ? 5 : 6);
    round = first ? [first, ...shuffle([...easy, ...discovery])] : [easy[0], ...shuffle([...easy.slice(1), ...discovery])];
    // Keep the selected first photo while changing at least one later photo on replay.
    if (previousIds.length && round.every(q => previousIds.includes(q.id))) {
      const replace = round.findIndex((q, i) => i > 0 && q.level === 'discovery');
      const newPhoto = shuffle(bank.filter(q => q.level === 'discovery' && !previousIds.includes(q.id)))[0];
      if (replace >= 0 && newPhoto) round[replace] = newPhoto;
    }
    previousIds = round.map(q => q.id);
    responses = [];
    position = 0;
    $('welcome').hidden = true;
    $('result').hidden = true;
    $('play').hidden = false;
    render();
  }
  function render() {
    const q = round[position];
    $('counter').textContent = `${position + 1} / ${total}`;
    $('progress').setAttribute('aria-valuenow', position);
    $('progress').firstElementChild.style.width = `${position * 10}%`;
    $('question-kind').textContent = position === 0 ? 'まずは、この1枚から。' : '形や色を、よく見てみよう。';
    $('question-title').textContent = q.prompt;
    $('image-error').hidden = true;
    $('photo').alt = `第${position + 1}問の車窓写真。${q.prompt}`;
    $('photo').src = q.image;
    $('credit').textContent = `写真：${q.credit}`;
    $('feedback').hidden = true;
    $('skip').hidden = false;
    $('choices').replaceChildren();
    shuffle(q.choices).forEach((label, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'choice';
      button.dataset.value = label;
      const letter = document.createElement('span');
      letter.className = 'choice-letter';
      letter.textContent = ['A','B','C'][i];
      letter.setAttribute('aria-hidden','true');
      const text = document.createElement('span');
      text.textContent = label;
      button.append(letter, text);
      button.addEventListener('click', () => answer(label));
      $('choices').append(button);
    });
    window.scrollTo({top:0,behavior:'instant'});
    $('question-title').focus({preventScroll:true});
  }
  function answer(value) {
    if (responses.length > position) return;
    const q = round[position];
    responses.push({value, correct:value === q.answer});
    for (const button of $('choices').children) {
      button.disabled = true;
      const isCorrect = button.dataset.value === q.answer;
      const isSelected = button.dataset.value === value;
      if (isCorrect || isSelected) {
        button.classList.add(isCorrect ? 'correct' : 'wrong');
        const state = document.createElement('span');
        state.className = 'choice-state';
        state.textContent = isCorrect ? '✓ 正解' : '選んだ答え';
        button.append(state);
      }
    }
    $('skip').hidden = true;
    $('photo').alt = q.alt;
    $('feedback').hidden = false;
    $('verdict').textContent = value === null ? 'ひとつ、発見。' : value === q.answer ? '正解！ よく見つけました。' : `なるほど、答えは「${q.answer}」。`;
    $('answer-title').textContent = q.name;
    $('explanation').textContent = q.explanation;
    $('location').textContent = `${q.area} ／ ${q.side}席側`;
    $('article').href = q.link;
    $('next').textContent = position === total - 1 ? '10枚を振り返る →' : '次の写真へ →';
    $('progress').setAttribute('aria-valuenow', position + 1);
    $('progress').firstElementChild.style.width = `${(position + 1) * 10}%`;
    focusAt($('answer-title'));
  }
  function finish() {
    $('play').hidden = true;
    $('result').hidden = false;
    const correct = responses.filter(r => r.correct).length;
    const skipped = responses.filter(r => r.value === null).length;
    $('score').replaceChildren();
    const number = document.createElement('strong');
    number.textContent = correct;
    $('score').append(number, ` / ${total}問 正解`);
    $('result-note').textContent = correct === total ? '全問正解！ 次に乗るときも、窓の向こうを探してみてください。' : `知っていた景色も、初めて知った景色も。気になった写真から、もう少し先へ。${skipped ? `（答えを見た問題：${skipped}問）` : ''}`;
    $('review').replaceChildren();
    round.forEach((q, i) => {
      const card = document.createElement('article');
      card.className = 'review-card';
      const img = document.createElement('img');
      img.src = q.image;
      img.alt = q.alt;
      img.loading = 'lazy';
      const body = document.createElement('div');
      body.className = 'review-body';
      const status = document.createElement('p');
      status.className = 'review-status';
      status.textContent = `${String(i+1).padStart(2,'0')}　${responses[i].correct ? '✓ 正解' : responses[i].value === null ? '答えを見た' : '新しい発見'}`;
      const title = document.createElement('h3');title.textContent = q.name;
      const explanation = document.createElement('p');explanation.textContent = q.explanation;
      const link = document.createElement('a');link.href = q.link;link.textContent = 'この景色をもっと知る ↗';link.target = '_blank';link.rel = 'noopener';
      const credit = document.createElement('small');credit.textContent = `写真：${q.credit}`;
      body.append(status,title,explanation,link,credit);card.append(img,body);$('review').append(card);
    });
    window.scrollTo({top:0,behavior:'instant'});
    $('result-title').focus({preventScroll:true});
  }
  document.querySelectorAll('.back-to-hub').forEach(button => button.addEventListener('click', () => {
    $('play').hidden = true;
    $('result').hidden = true;
    $('welcome').hidden = false;
    window.scrollTo({top:0,behavior:'instant'});
    $('welcome-title').focus({preventScroll:true});
  }));
  document.querySelectorAll('[data-start-question]').forEach(button => {
    button.disabled = false;
    button.addEventListener('click', () => start(button.dataset.startQuestion));
  });
  $('start').disabled = false;
  $('start').addEventListener('click', start);
  $('restart').addEventListener('click', start);
  $('skip').addEventListener('click', () => answer(null));
  $('next').addEventListener('click', () => {
    if (responses.length !== position + 1) return;
    if (++position === total) finish(); else render();
  });
  $('photo').addEventListener('error', () => { $('image-error').hidden = false; });
  $('zoom').addEventListener('click', () => {
    $('large-photo').src = $('photo').src;
    $('large-photo').alt = $('photo').alt;
    $('large-credit').textContent = $('credit').textContent;
    $('photo-dialog').showModal();
  });
  $('close-photo').addEventListener('click', () => $('photo-dialog').close());
  $('photo-dialog').addEventListener('click', event => { if (event.target === $('photo-dialog')) { const r = event.target.getBoundingClientRect(); if(event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
})();
