(() => {
 'use strict';
 const config=window.SAMANTA_SITE_CONFIG,form=document.querySelector('#booking-form');
 if(!config||!form)return;
 const settings=config.booking,$=s=>document.querySelector(s),params=new URLSearchParams(location.search);
 const consultation=!!document.querySelector('[data-booking-kind="consultation"]')||params.get('kind')==='consultation';
 const tabs=[...document.querySelectorAll('[data-booking-format]')],choices=[...form.querySelectorAll('[name=channel]')];
 const error=$('#booking-error'),status=$('#booking-status'),submit=$('#booking-submit');
 let format=params.get('format')==='offline'?'offline':'online',product=consultation?settings.consultation:format==='offline'?settings.offline:settings.course;
 let sending=false,requestId=null,submitted=false;
 const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
 const dateText=date=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Moscow'}).format(new Date(date+'T12:00:00Z')).replace(/ г\.$/,'');
 const updateDirect=()=>{
  const target=new URL(config.telegramUrl);
  target.searchParams.set('text',consultation?'Вика, привет! Хочу обсудить индивидуальную консультацию.':'Вика, привет! Хочу записаться на первый уровень.\n'+(format==='offline'?'Офлайн':'Онлайн')+', '+dateText(product.date)+'.');
  document.querySelectorAll('[data-direct-telegram]').forEach(a=>a.href=target.href);
 };
 const markEdited=()=>{if(sending)return;error.textContent='';status.textContent='';requestId=null;submitted=false;submit.disabled=false;};
 const selectFormat=value=>{
  if(sending)return;
  format=value;product=format==='offline'?settings.offline:settings.course;
  tabs.forEach(tab=>{const active=tab.dataset.bookingFormat===format;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;$('#'+tab.getAttribute('aria-controls')).hidden=!active;});
  markEdited();updateDirect();
 };
 if(consultation&& !document.querySelector('[data-booking-kind="consultation"]')){
  $('#booking-title').textContent='Запись на индивидуальную консультацию';$('.booking-tabs').hidden=true;
  $('#booking-offer').textContent='Три онлайн-встречи. Стоимость — '+money(product.price);
 }
 if(!consultation){
  // Offers, submission dates and prices share the same configuration.
  for(const [name,event] of [['online',settings.course],['offline',settings.offline]]){
   const pane=$('#booking-offer-'+name);pane.querySelector('.booking-date').textContent=dateText(event.date);pane.querySelector('.booking-price').textContent='Стоимость — '+money(event.price);
  }
  tabs.forEach(tab=>{
   tab.addEventListener('click',()=>selectFormat(tab.dataset.bookingFormat));
   tab.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?tabs[0]:e.key==='End'?tabs.at(-1):tabs[(tabs.indexOf(tab)+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length];next.focus();selectFormat(next.dataset.bookingFormat);});
  });selectFormat(format);
 }
 updateDirect();
 choices.forEach(check=>check.addEventListener('change',()=>{
  const pane=form.querySelector(`[data-channel="${check.value}"]`),input=pane.querySelector('input');
  pane.hidden=!check.checked;input.disabled=!check.checked;input.required=check.checked;input.setCustomValidity('');markEdited();
 }));
 form.querySelectorAll('.text-input').forEach(input=>input.addEventListener('input',()=>{input.setCustomValidity('');markEdited();}));
 const clean=(key,value)=>value.trim().replace(key==='telegram'?/^https?:\/\/(?:www\.)?t\.me\//i:key==='vk'?/^https?:\/\/(?:www\.)?vk\.(?:com|ru)\//i:/$^/,'').replace(/\/$/,'');
 const collect=()=>{
  error.textContent='';status.textContent='';const name=$('#booking-name');name.value=name.value.trim();name.setCustomValidity('');
  if(name.value.length<2)name.setCustomValidity('Напиши, пожалуйста, как к тебе обращаться');
  if(!choices.some(c=>c.checked)){error.textContent='Выбери, где удобнее с тобой связаться';choices[0].focus();return null;}
  const contacts={};
  for(const check of choices.filter(c=>c.checked)){
   const input=form.querySelector(`[name="${check.value}"]:not([type=checkbox])`);input.value=clean(check.value,input.value);input.setCustomValidity('');
   if(check.value==='telegram'&&!/^@?[a-zA-Z0-9_]{3,32}$/.test(input.value))input.setCustomValidity('Напиши юзернейм, например @your_name');
   if(check.value==='vk'&&!/^[a-zA-Z0-9_.-]{2,80}$/.test(input.value))input.setCustomValidity('Напиши ID или короткое имя ВКонтакте');
   if(check.value==='whatsapp'&&(!/^\+?[\d\s()\-]{8,30}$/.test(input.value)||input.value.replace(/\D/g,'').length<8||input.value.replace(/\D/g,'').length>15))input.setCustomValidity('Напиши номер телефона с кодом страны');
   contacts[check.value]=input.value;
  }
  if(!form.checkValidity()){form.reportValidity();error.textContent='Проверь имя и выбранные контакты';return null;}
  return {product:product.id,name:name.value,contacts,date:consultation?null:product.date,format:consultation?'online':format,website:form.querySelector('[name=website]').value};
 };
 const sendToCRM=payload=>new Promise((resolve,reject)=>{
  let endpoint;
  try{endpoint=new URL(settings.deliveryEndpoint);if(endpoint.origin!=='https://script.google.com'||!/^\/macros\/s\/[^/]+\/exec$/.test(endpoint.pathname))throw Error();}
  catch{reject(new Error('not-connected'));return;}
  const frame=document.createElement('iframe');frame.hidden=true;frame.title='Отправка заявки';frame.name='booking-'+payload.requestId;
  const post=document.createElement('form');post.hidden=true;post.method='POST';post.action=endpoint.href;post.target=frame.name;
  const field=document.createElement('input');field.name='payload';field.value=JSON.stringify(payload);post.append(field);
  const cleanup=()=>{clearTimeout(timer);removeEventListener('message',onMessage);post.remove();frame.remove();};
  const onMessage=event=>{
   if(event.origin!=='https://script.google.com'&&event.origin!=='https://script.googleusercontent.com'&&!/^https:\/\/[a-z0-9-]+(?:-script|\.script)\.googleusercontent\.com$/.test(event.origin))return;
   const data=event.data;if(!data||data.type!=='samanta:booking'||data.requestId!==payload.requestId)return;
   cleanup();data.ok===true?resolve(data):reject(new Error(data.code||'delivery-failed'));
  };
  const timer=setTimeout(()=>{cleanup();reject(new Error('timeout'));},45000);
  addEventListener('message',onMessage);document.body.append(frame,post);post.submit();
 });
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(sending||submitted)return;
  const payload=collect();if(!payload)return;
  requestId=requestId||(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-'));
  payload.requestId=requestId;sending=true;submit.disabled=true;submit.setAttribute('aria-busy','true');
  const controls=[...form.querySelectorAll('input:not(:disabled)')];controls.forEach(input=>input.disabled=true);tabs.forEach(tab=>tab.disabled=true);
  try{
   await sendToCRM(payload);submitted=true;status.textContent='Заявка отправлена';
  }catch(e){error.textContent=e.message==='not-connected'?'Форма пока недоступна. Напиши мне напрямую справа.':'Не получилось подтвердить отправку. Попробуй еще раз или напиши мне напрямую.';}
  finally{sending=false;controls.forEach(input=>input.disabled=false);tabs.forEach(tab=>tab.disabled=false);submit.disabled=submitted;submit.removeAttribute('aria-busy');}
 });
 const alignContacts=()=>{
  const aside=$('.booking-aside'),legend=form.querySelector('.contact-methods legend'),layout=$('.booking-layout');if(!aside||!legend)return;
  aside.style.paddingTop=innerWidth>760?Math.max(0,legend.getBoundingClientRect().top-layout.getBoundingClientRect().top)+'px':'';
 };
 new ResizeObserver(alignContacts).observe(form.querySelector('.form-field'));addEventListener('resize',alignContacts);document.fonts.ready.then(alignContacts);alignContacts();
 submit.disabled=false;
})();
