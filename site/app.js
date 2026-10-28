(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollBehavior = () => reducedMotion() ? 'instant' : 'smooth';
  const menu = $('#main-nav');
  const menuToggle = $('#menu-toggle');
  const closeMenu = () => {
    menu.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Открыть меню');
  };
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menu.classList.toggle('open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  });
  $$('a', menu).forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      closeMenu();
      menuToggle.focus();
    }
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.site-header')) closeMenu();
  });

  const progress = $('#reading-progress');
  const backTop = $('#back-top');
  let scrollScheduled = false;
  const updateScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    backTop.hidden = scrollY < 650;
    scrollScheduled = false;
  };
  addEventListener('scroll', () => {
    if (!scrollScheduled) requestAnimationFrame(updateScroll);
    scrollScheduled = true;
  }, { passive: true });
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: scrollBehavior() });
    $('.wordmark').focus({ preventScroll: true });
  });
  updateScroll();

  const track = $('#topic-track');
  const cards = $$('.topic-card');
  const dots = $('#topic-dots');
  const topicPrev = $('#topics-prev');
  const topicNext = $('#topics-next');
  let pageStep = 0;
  let pages = 1;
  const calculateCarousel = () => {
    const gap = parseFloat(getComputedStyle(track).columnGap) || 20;
    const step = cards[0].getBoundingClientRect().width + gap;
    const visible = Math.max(1, Math.floor((track.clientWidth + gap + 1) / step));
    pageStep = step * visible;
    const nextPages = Math.ceil(cards.length / visible);
    if (nextPages !== pages || !dots.childElementCount) {
      pages = nextPages;
      dots.replaceChildren();
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Карточки: страница ${i + 1}`);
        dot.addEventListener('click', () => track.scrollTo({ left: i * pageStep, behavior: scrollBehavior() }));
        dots.append(dot);
      }
    }
    updateCarousel();
  };
  const updateCarousel = () => {
    const max = track.scrollWidth - track.clientWidth;
    const page = track.scrollLeft >= max - 4 ? pages - 1 : Math.round(track.scrollLeft / Math.max(1, pageStep));
    $$('.dots button').forEach((dot, i) => dot.setAttribute('aria-current', String(i === page)));
    topicPrev.disabled = track.scrollLeft < 4;
    topicNext.disabled = track.scrollLeft >= max - 4;
  };
  topicPrev.addEventListener('click', () => track.scrollBy({ left: -pageStep, behavior: scrollBehavior() }));
  topicNext.addEventListener('click', () => track.scrollBy({ left: pageStep, behavior: scrollBehavior() }));
  track.addEventListener('scroll', updateCarousel, { passive: true });
  track.addEventListener('keydown', e => {
    if (e.target !== track || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    track.scrollBy({ left: pageStep * (e.key === 'ArrowRight' ? 1 : -1), behavior: scrollBehavior() });
  });
  new ResizeObserver(calculateCarousel).observe(track);

  const topics = JSON.parse($('#topic-data').textContent);
  const reviews = JSON.parse($('#review-data').textContent);
  const dialog = $('#card-dialog');
  const dialogScene = $('#dialog-scene');
  let dialogTrigger = null;
  const openDialog = (trigger, title, text, scene = null, avatar = null) => {
    dialogTrigger = trigger;
    $('#dialog-title').textContent = title;
    $('#dialog-copy').textContent = text;
    dialog.classList.toggle('review-dialog', scene === null);
    const avatarEl = $('#dialog-avatar');
    avatarEl.hidden = avatar === null;
    avatarEl.className = 'review-avatar dialog-avatar' + (avatar === null ? '' : ` avatar-${avatar}`);
    dialogScene.hidden = scene === null;
    dialogScene.className = 'scene dialog-scene' + (scene === null ? '' : ` scene-${scene}`);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  };
  cards.forEach(card => card.addEventListener('click', () => {
    const topic = topics[Number(card.dataset.topic)];
    openDialog(card, topic.title, topic.question, topic.scene);
  }));
  $$('.review').forEach(card => card.addEventListener('click', () => {
    const review = reviews[Number(card.dataset.review)];
    openDialog(card, review.name, review.quote, null, Number(card.dataset.review));
  }));
  $('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', e => {
    if (e.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    dialogTrigger?.focus({ preventScroll: true });
  });

  const reviewTrack = $('#review-track');
  const reviewPrev = $('#reviews-prev');
  const reviewNext = $('#reviews-next');
  const updateReviews = () => {
    reviewPrev.disabled = reviewTrack.scrollLeft < 3;
    reviewNext.disabled = reviewTrack.scrollLeft >= reviewTrack.scrollWidth - reviewTrack.clientWidth - 3;
  };
  reviewPrev.addEventListener('click', () => reviewTrack.scrollBy({ left: -Math.max(280, reviewTrack.clientWidth * .8), behavior: scrollBehavior() }));
  reviewNext.addEventListener('click', () => reviewTrack.scrollBy({ left: Math.max(280, reviewTrack.clientWidth * .8), behavior: scrollBehavior() }));
  reviewTrack.addEventListener('scroll', updateReviews, { passive: true });
  new ResizeObserver(updateReviews).observe(reviewTrack);
  updateReviews();

  $$('[aria-disabled="true"]').forEach(button => button.addEventListener('click', e => e.preventDefault()));

  const video = $('#author-video');
  const overlay = $('#video-overlay');
  const play = $('#video-play');
  const seek = $('#video-seek');
  const time = $('#video-time');
  const mute = $('#video-mute');
  video.defaultPlaybackRate = 1.08;
  video.playbackRate = 1.08;
  video.preservesPitch = true;
  const rateButton = $('#video-rate');
  const rates = [1.08, 1, 1.15];
  let rateIndex = 0;
  rateButton.addEventListener('click', () => {
    rateIndex = (rateIndex + 1) % rates.length;
    video.playbackRate = rates[rateIndex];
    const label = String(rates[rateIndex]).replace('.', ',');
    rateButton.textContent = label + '×';
    rateButton.setAttribute('aria-label', `Скорость видео: ${label}. Нажать, чтобы изменить`);
  });
  const playPath = 'm7 3 15 9-15 9V3Z';
  const pausePath = 'M7 3v18M17 3v18';
  const formatTime = t => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const updateVideo = () => {
    overlay.hidden = !video.paused;
    play.setAttribute('aria-label', video.paused ? 'Воспроизвести видео' : 'Приостановить видео');
    $('path', play).setAttribute('d', video.paused ? playPath : pausePath);
    time.textContent = formatTime(video.currentTime);
    if (Number.isFinite(video.duration)) {
      seek.value = String(video.currentTime / video.duration * 100);
      seek.setAttribute('aria-valuetext', `${formatTime(video.currentTime)} из ${formatTime(video.duration)}`);
    }
  };
  const toggleVideo = async () => {
    if (!video.paused) return video.pause();
    try { await video.play(); } catch { $('#video-error').hidden = false; }
  };
  overlay.addEventListener('click', toggleVideo);
  play.addEventListener('click', toggleVideo);
  video.addEventListener('click', toggleVideo);
  ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata'].forEach(event => video.addEventListener(event, updateVideo));
  video.addEventListener('error', () => { $('#video-error').hidden = false; });
  seek.addEventListener('input', () => {
    if (Number.isFinite(video.duration)) video.currentTime = Number(seek.value) / 100 * video.duration;
    updateVideo();
  });
  mute.addEventListener('click', () => {
    video.muted = !video.muted;
    mute.setAttribute('aria-label', video.muted ? 'Включить звук' : 'Выключить звук');
    mute.setAttribute('aria-pressed', String(video.muted));
    mute.style.opacity = video.muted ? '.5' : '1';
  });
  $('#video-fullscreen').addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if ($('#video-player').requestFullscreen) await $('#video-player').requestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    } catch { /* Browser may reject fullscreen; inline playback remains available. */ }
  });
  updateVideo();
})();
