(() => {
  'use strict';
  const { questions, results } = window.SAMANTA_TEST_DATA;
  const { score, resultIndex } = window.SAMANTA_TEST_ENGINE;
  const $ = selector => document.querySelector(selector);
  const form = $('#quiz');
  let answers = questions.map(() => []);
  const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
  const descriptions = [
    'Мужчина командует, творческая девушка держит блокнот',
    'Самодовольный мужчина любуется собой в зеркале',
    'Улыбчивый мужчина с длинным носом, гитарой, компьютером и несколькими идеями',
    'Уютный широкоплечий мужчина сложил большие ладони перед собой',
    'Девушка отправляет голосовые сообщения, мужчина коротко отвечает',
    'Мечтательный худощавый мужчина с длинными руками, ногами и носом',
    'Эмоциональный мужчина и сдержанная женщина в очках и с часами',
    'Мужчина спешит к женщине, которая уже ждет за столиком',
    'Подросток в яркой одежде и дорогих кроссовках с телефоном и покупками',
    'Увлеченный мужчина-изобретатель с длинным носом, идеями и планами',
    'Рок-музыкант с микрофоном, выразительными глазами и энергичным жестом',
    'Стилизованные портреты Саманты, Кэрри, Миранды и Шарлотты'
  ];
  const updateProgress = () => {
    const count = answers.filter(a => a.length).length;
    $('#answered-count').textContent = `Отвечено ${count} из 12`;
    $('#answer-progress').value = count;
  };
  const render = () => {
    questions.forEach((question, index) => {
      const section = document.createElement('section');
      section.className = 'test-question';
      section.id = `question-${index + 1}`;
      section.setAttribute('aria-labelledby', `question-title-${index + 1}`);
      const illustration = document.createElement('div');
      illustration.className = `question-art art-${index + 1}`;
      illustration.setAttribute('role', 'img');
      illustration.setAttribute('aria-label', descriptions[index]);
      const content = document.createElement('div');
      content.className = 'question-content';
      const number = document.createElement('p');
      number.className = 'question-number';
      number.textContent = `${String(index + 1).padStart(2, '0')} / 12`;
      const title = document.createElement('h2');
      title.id = `question-title-${index + 1}`;
      title.textContent = question.title;
      title.tabIndex = -1;
      const fieldset = document.createElement('fieldset');
      fieldset.className = 'question-choices';
      fieldset.setAttribute('aria-labelledby', title.id);
      const help = document.createElement('legend');
      help.id = `question-help-${index + 1}`;
      help.className = 'question-help';
      if (question.maxSelect) help.setAttribute('aria-live', 'polite');
      help.textContent = question.maxSelect ? 'Выбери не более двух вариантов' : question.onlyChoice !== undefined ? 'Возможен выбор одного или нескольких вариантов' : question.multi ? 'Можно выбрать несколько вариантов' : 'Выбери один вариант';
      fieldset.setAttribute('aria-describedby', help.id);
      fieldset.append(help);
      const options = [];
      question.options.forEach((option, optionIndex) => {
        const label = document.createElement('label');
        label.className = 'test-option';
        const input = document.createElement('input');
        input.type = question.multi ? 'checkbox' : 'radio';
        input.name = `question-${index + 1}`;
        input.value = String(optionIndex);
        input.id = `answer-${index + 1}-${optionIndex + 1}`;
        input.setAttribute('aria-describedby', help.id);
        const copy = document.createElement('span');
        copy.className = 'option-copy';
        if (option.lead) {
          const strong = document.createElement('strong');
          strong.textContent = option.lead;
          copy.append(strong);
        }
        copy.append(document.createTextNode(option.rest));
        label.append(input);
        if (index === 11 && optionIndex < 4) {
          const portrait = document.createElement('span');
          portrait.className = `answer-portrait portrait-${optionIndex}`;
          portrait.setAttribute('aria-hidden', 'true');
          label.append(portrait);
        }
        label.append(copy);
        options.push(input);
        input.addEventListener('change', () => {
          const current = options.filter(el => el.checked).map(el => Number(el.value));
          if (question.maxSelect && current.length > question.maxSelect) {
            input.checked = false;
            help.textContent = 'Можно выбрать только два варианта. Сначала сними один из выбранных';
            help.classList.add('selection-limit');
            return;
          }
          answers[index] = current;
          help.textContent = question.maxSelect ? 'Выбери не более двух вариантов' : help.textContent;
          help.classList.remove('selection-limit');
          section.classList.remove('question-missing');
          $('#quiz-alert').textContent = '';
          updateProgress();
        });
        fieldset.append(label);
      });
      content.append(number, title, fieldset);
      section.append(illustration, content);
      form.append(section);
    });
  };
  render();
  form.addEventListener('submit', event => {
    event.preventDefault();
    const missing = answers.findIndex(a => !a.length);
    if (missing !== -1) {
      $('#quiz-alert').textContent = `Ответь на все вопросы. Пропущен вопрос ${missing + 1}`;
      const section = $(`#question-${missing + 1}`);
      section.classList.add('question-missing');
      section.querySelector('h2').focus({ preventScroll: true });
      section.scrollIntoView({ behavior: motion(), block: 'center' });
      return;
    }
    const points = questions.map((q, i) => score(q, answers[i]));
    const result = results[resultIndex(points)];
    $('#result-title').textContent = result.title;
    $('#result-score').textContent = `${points.reduce((sum, n) => sum + n, 0)} из 26 баллов`;
    $('#result-text').replaceChildren(...result.text.split('\n\n').map(text => {
      const paragraph = document.createElement('p');
      paragraph.textContent = text;
      return paragraph;
    }));
    $('#quiz-area').hidden = true;
    $('#result').hidden = false;
    $('#result-title').focus({ preventScroll: true });
    $('#result').scrollIntoView({ behavior: motion(), block: 'start' });
    updateScroll();
  });
  $('#again').addEventListener('click', () => {
    answers = questions.map(() => []);
    form.reset();
    $('#result').hidden = true;
    $('#quiz-area').hidden = false;
    $('#quiz-alert').textContent = '';
    document.querySelectorAll('.question-missing').forEach(el => el.classList.remove('question-missing'));
    $('#question-help-11').textContent = 'Выбери не более двух вариантов';
    $('#question-help-11').classList.remove('selection-limit');
    updateProgress();
    $('#test-title').setAttribute('tabindex', '-1');
    $('#test-title').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: motion() });
    updateScroll();
  });
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    $('#reading-progress').style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    $('#back-top').hidden = scrollY < 650;
  };
  let scheduled = false;
  addEventListener('scroll', () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { updateScroll(); scheduled = false; });
  }, { passive: true });
  addEventListener('resize', updateScroll);
  $('#back-top').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: motion() });
    $('.wordmark').focus({ preventScroll: true });
  });
  updateScroll();
})();
