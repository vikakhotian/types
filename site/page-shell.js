(() => {
 const menu=document.querySelector('#main-nav'),toggle=document.querySelector('#menu-toggle');
 if(menu&&toggle){
  const close=()=>{menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Открыть меню');};
  toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';menu.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Закрыть меню':'Открыть меню');});
  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))close();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.classList.contains('open')){close();toggle.focus();}});
 }
 const bar=document.querySelector('#reading-progress'),back=document.querySelector('#back-top');
 const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;if(bar)bar.style.transform=`scaleX(${max>0?Math.min(1,scrollY/max):0})`;if(back)back.hidden=scrollY<650;};
 addEventListener('scroll',update,{passive:true});addEventListener('resize',update);back?.addEventListener('click',()=>{scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});document.querySelector('.wordmark')?.focus({preventScroll:true});});update();
})();
