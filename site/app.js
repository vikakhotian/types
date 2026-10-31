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

  function infiniteCarousel(track, itemSelector, prev, next, dots=null) {
    const originals=[...track.querySelectorAll(itemSelector)];
    const count=originals.length;
    for(const side of ['before','after']) {
      const fragment=document.createDocumentFragment();
      originals.forEach((el,i)=>{const clone=el.cloneNode(true);clone.dataset.clone='true';clone.setAttribute('aria-hidden','true');clone.tabIndex=-1;clone.removeAttribute('data-source-line');clone.querySelectorAll('[data-source-line]').forEach(n=>n.removeAttribute('data-source-line'));fragment.append(clone);});
      if(side==='before')track.prepend(fragment);else track.append(fragment);
    }
    let cycle=0, step=0, visible=1, timer, navigationIndex=null;
    const moveTo=x=>{
      navigationIndex=((Math.round((x-cycle)/step)%count)+count)%count;
      track.scrollTo({left:x,behavior:scrollBehavior()});
    };
    const jump=x=>{track.style.scrollSnapType='none';track.scrollTo({left:x,behavior:'instant'});requestAnimationFrame(()=>track.style.scrollSnapType='');};
    const normalize=()=>{
      if(!cycle)return;
      const card=Math.round((track.scrollLeft-cycle)/step);
      const logical=(card%count+count)%count;
      // A cancelled animation may emit scrollend before the latest request
      // arrives. Do not replace that request with an intermediate card.
      if(navigationIndex!==null && logical!==navigationIndex)return;
      if(card<0 || card>=count)jump(cycle+logical*step);
      navigationIndex=null;
    };
    const update=()=>{
      if(dots && step && dots.children.length){
        // Round to the nearest card, wrap within the original set, then clamp
        // the page: fractional scrolling near the seam must always select a dot.
        const card=((Math.round((track.scrollLeft-cycle)/step)%count)+count)%count;
        const page=Math.min(dots.children.length-1,Math.floor(card/visible));
        [...dots.children].forEach((d,i)=>d.setAttribute('aria-current',String(i===page)));
      }
      clearTimeout(timer);timer=setTimeout(normalize,140);
    };
    const resize=()=>{
      const gap=parseFloat(getComputedStyle(track).columnGap)||0;
      // offsetLeft/offsetWidth round fractional grid columns to whole pixels.
      // Repeating that rounded value would slowly shift the infinite seam.
      const cardWidth=parseFloat(getComputedStyle(originals[0]).width);
      const logical=step?((Math.round((track.scrollLeft-cycle)/step)%count)+count)%count:0;
      step=cardWidth+gap;cycle=step*count;
      const styles=getComputedStyle(track);
      const inner=track.clientWidth-parseFloat(styles.paddingLeft)-parseFloat(styles.paddingRight);
      visible=Math.max(1,Math.floor((inner+gap+.5)/step));
      if(dots){dots.replaceChildren();for(let i=0;i<Math.ceil(count/visible);i++){const d=document.createElement('button');d.type='button';d.setAttribute('aria-label',`Карточки: страница ${i+1}`);d.addEventListener('click',()=>moveTo(cycle+i*visible*step));dots.append(d);}}
      prev.disabled=false;next.disabled=false;navigationIndex=null;jump(cycle+logical*step);update();
    };
    const advance=direction=>{
      const pending=navigationIndex;
      if(pending===null)normalize();
      const actual=Math.round((track.scrollLeft-cycle)/step);
      const current=pending===null?((actual%count+count)%count):pending;
      const nextIndex=((current+direction*visible)%count+count)%count;
      navigationIndex=nextIndex;
      // Rapid clicks count every requested group and settle it directly;
      // a single click retains the normal smooth transition.
      if(pending!==null){jump(cycle+nextIndex*step);update();return;}
      let destination=cycle+(current+direction*visible)*step;
      const max=track.scrollWidth-track.clientWidth;
      if(destination<0 || destination>max){
        const shift=destination<0?cycle:-cycle;
        destination+=shift;
        const shifted=track.scrollLeft+shift;
        if(shifted<0 || shifted>max){jump(cycle+nextIndex*step);update();return;}
        jump(shifted);
      }
      moveTo(destination);
    };
    prev.addEventListener('click',()=>advance(-1));
    next.addEventListener('click',()=>advance(1));
    ['pointerdown','touchstart','wheel'].forEach(event=>track.addEventListener(event,()=>{navigationIndex=null;},{passive:true}));
    track.addEventListener('scroll',update,{passive:true});track.addEventListener('scrollend',normalize);
    track.addEventListener('keydown',e=>{if(e.target===track&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();advance(e.key==='ArrowRight'?1:-1);}});
    new ResizeObserver(resize).observe(track);resize();
    return originals;
  }
  const track=$('#topic-track');
  const cards=infiniteCarousel(track,'.topic-card',$('#topics-prev'),$('#topics-next'),$('#topic-dots'));

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
    if(avatar===3)avatarEl.classList.add('portrait-tatyana-urda');
    if(avatar===2)avatarEl.classList.add('real-avatar','portrait-alexandra-tursunova');
    if(avatar===6)avatarEl.classList.add('real-avatar','portrait-alexander-andreev');
    const newPortraits={0:'portrait-alina',1:'portrait-zhanna',4:'portrait-mikhail'};
    if(newPortraits[avatar])avatarEl.classList.add('new-portrait',newPortraits[avatar]);
    const latestPortraits={5:'portrait-natalia',7:'portrait-tatyana-mironova',8:'portrait-roman',9:'portrait-maria',10:'portrait-stanislav'};
    if(latestPortraits[avatar])avatarEl.classList.add('latest-portrait',latestPortraits[avatar]);
    dialogScene.hidden = scene === null;
    dialogScene.className = 'scene dialog-scene' + (scene === null ? '' : ` scene-${scene}`);
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  };
  track.addEventListener('click', e => {
    const card=e.target.closest('.topic-card'); if(!card)return;
    const i=Number(card.dataset.topic),topic=topics[i];
    openDialog(cards.find(card=>Number(card.dataset.topic)===i),topic.title,topic.question,topic.scene);
  });
  $('#review-track').addEventListener('click',e=>{
    const card=e.target.closest('.review');if(!card)return;
    const i=Number(card.dataset.review),review=reviews[i];
    openDialog($('#review-track').querySelector(`.review:not([data-clone])[data-review="${i}"]`),review.name,review.quote,null,i);
  });
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

  infiniteCarousel($('#review-track'),'.review',$('#reviews-prev'),$('#reviews-next'));

  $$('[aria-disabled="true"]').forEach(button => button.addEventListener('click', e => e.preventDefault()));

  const video = $('#author-video');
  const overlay = $('#video-overlay');
  const play = $('#video-play');
  const seek = $('#video-seek');
  const time = $('#video-time');
  const mute = $('#video-mute');
  // Сам файл уже ускорен на 1.1x; множитель плеера считается от этой базы.
  video.defaultPlaybackRate=1.5;video.playbackRate=1.5;video.preservesPitch=true;
  video.volume=0.25;video.muted=false;
  mute.setAttribute("aria-label","Настроить громкость: 25 процентов");
  $('#video-rate').addEventListener('change', e=>{video.playbackRate=Number(e.target.value);});
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
    try { await video.play(); $('#video-error').hidden=true; } catch(error) { if(error.name!=='AbortError')$('#video-error').hidden=false; }
  };
  overlay.addEventListener('click', toggleVideo);
  play.addEventListener('click', toggleVideo);
  video.addEventListener('click', toggleVideo);
  ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata'].forEach(event => video.addEventListener(event, updateVideo));
  video.addEventListener('error', () => { if(video.error?.code!==1)$('#video-error').hidden=false; });
  ['loadeddata','canplay','playing'].forEach(name=>video.addEventListener(name,()=>{$('#video-error').hidden=true;}));
  $('#video-retry').addEventListener('click',()=>{video.load();$('#video-error').hidden=true;toggleVideo();});
  const enlarge=$('#video-enlarge'),videoDialog=$('#video-dialog'),player=$('#video-player');
  let anchor=null,restorePlaying=false;
  enlarge.addEventListener('click',()=>{
    restorePlaying=!video.paused;anchor=document.createComment('video-player');player.before(anchor);
    videoDialog.querySelector('.video-dialog-content').append(player);videoDialog.showModal();document.body.style.overflow='hidden';
    if(restorePlaying)video.play().catch(()=>{});
  });
  videoDialog.querySelector('.video-dialog-close').addEventListener('click',()=>videoDialog.close());
  videoDialog.addEventListener('click',e=>{if(e.target===videoDialog){const r=videoDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)videoDialog.close();}});
  videoDialog.addEventListener('close',()=>{const wasPlaying=!video.paused;anchor.replaceWith(player);document.body.style.overflow='';enlarge.focus({preventScroll:true});if(wasPlaying)video.play().catch(()=>{});});
  seek.addEventListener('input', () => {
    if (Number.isFinite(video.duration)) video.currentTime = Number(seek.value) / 100 * video.duration;
    updateVideo();
  });
  mute.addEventListener('click', () => {
    const panel=$('#video-volume-panel');panel.hidden=!panel.hidden;
    mute.setAttribute('aria-expanded',String(!panel.hidden));
  });
  $('#video-volume').addEventListener('input',e=>{
    video.volume=Number(e.target.value);video.muted=false;
    mute.setAttribute('aria-label',`Настроить громкость: ${Math.round(video.volume*100)} процентов`);
  });
  updateVideo();
})();
