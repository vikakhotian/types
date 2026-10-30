(() => {
 'use strict';
 const config=window.SAMANTA_SITE_CONFIG,settings=config.booking;
 const $=s=>document.querySelector(s),form=$('#booking-form');
 const consultation=new URLSearchParams(location.search).get('kind')==='consultation';
 const product=consultation?settings.consultation:settings.course;
 const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
 const fieldNames={vk:'ВКонтакте',telegram:'Телеграм',whatsapp:'WhatsApp',email:'e-mail'};
 if(settings.deliveryMode==='telegram-draft'){const note=document.createElement('p');note.className='field-help delivery-intro';note.textContent='Форма подготовит сообщение для Вики в Telegram. Затем отправь его в чате. Для ответа выбери любой удобный контакт.';form.prepend(note);}

 const submitLabel=text=>{
  const button=$('#booking-submit');button.textContent=text;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','action-arrow');svg.setAttribute('viewBox','0 0 100 60');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','2');svg.setAttribute('stroke-linecap','round');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M5 40C33 50 39 8 64 12c15 2 17 15 22 25M68 29l20 12 7-24');svg.append(path);button.append(svg);
 };

 if(consultation){
  $('#booking-title').textContent='Запись на индивидуальную консультацию';
  const offer=$('#booking-offer');offer.replaceChildren();
  for(const text of ['Три онлайн-встречи с разбором твоих запросов и вопросов. С записью встреч.','Стоимость — '+money(product.price)]){const p=document.createElement('p');p.textContent=text;offer.append(p);}
  $('#booking-next-copy').textContent='Оставь удобный контакт. Вика свяжется с тобой, чтобы обсудить запрос и договориться о встречах.';
 }
 const choices=[...form.querySelectorAll('[name="channel"]')];
 const error=$('#booking-error');
 choices.forEach(check=>check.addEventListener('change',()=>{
  const pane=form.querySelector(`[data-channel="${check.value}"]`),input=pane.querySelector('input');
  pane.hidden=!check.checked;input.disabled=!check.checked;input.required=check.checked;input.setCustomValidity('');error.textContent='';
 }));
 form.querySelectorAll('.text-input').forEach(input=>input.addEventListener('input',()=>{input.setCustomValidity('');error.textContent='';}));
 const clean=(key,value)=>{
  let v=value.trim();
  if(key==='telegram')v=v.replace(/^https?:\/\/(?:www\.)?t\.me\//i,'').replace(/\/$/,'');
  if(key==='vk')v=v.replace(/^https?:\/\/(?:www\.)?vk\.com\//i,'').replace(/\/$/,'');
  return v;
 };
 const validate=()=>{
  error.textContent='';
  const name=$('#booking-name');name.value=name.value.trim();
  if(name.value.length<2)name.setCustomValidity('Напиши, пожалуйста, свое имя');
  if(!choices.some(x=>x.checked)){error.textContent='Выбери, где удобнее с тобой связаться';choices[0].focus();return false;}
  for(const check of choices.filter(x=>x.checked)){
   const input=form.querySelector(`[name="${check.value}"]:not([type="checkbox"])`);input.value=clean(check.value,input.value);
   if(check.value==='telegram'&&!/^@?[A-Za-z0-9_]{3,32}$/.test(input.value))input.setCustomValidity('Напиши юзернейм, например @your_name');
   if(check.value==='vk'&&!/^[A-Za-z0-9_.-]{2,80}$/.test(input.value))input.setCustomValidity('Напиши ID или короткое имя, например id123456789');
   if(check.value==='whatsapp'&&!/^\+?[\d\s()\-]{8,30}$/.test(input.value))input.setCustomValidity('Напиши номер телефона с кодом страны');
   if(check.value==='whatsapp'&&(input.value.replace(/\D/g,'').length<8||input.value.replace(/\D/g,'').length>15))input.setCustomValidity('Проверь количество цифр в номере');
  }
  if(!form.checkValidity()){form.reportValidity();error.textContent='Проверь имя и выбранные контакты';return false;}
  return true;
 };
 const utc=date=>date.toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
 let calendarFile=null;
 const setupCalendar=()=>{
  const event=settings.course;
  if(consultation)return;
  const timed=Boolean(event.startISO&&event.durationMinutes);
  const start=new Date(timed?event.startISO:event.date+'T00:00:00Z');if(!Number.isFinite(+start))return;
  const end=new Date(+start+(timed?event.durationMinutes*60000:86400000));
  const day=date=>date.toISOString().slice(0,10).replace(/-/g,'');
  const details=`Первый уровень курса «Саманта: Коды к мужчинам». Стоимость ${money(event.price)}. Участие подтверждает Вика: ${config.telegramUrl}`;
  const google=new URL('https://calendar.google.com/calendar/render');
  for(const [k,v] of Object.entries({action:'TEMPLATE',text:event.title,dates:timed?utc(start)+'/'+utc(end):day(start)+'/'+day(end),details:details+(timed?'':' Время встречи уточняется.')}))google.searchParams.set(k,v);
  if(timed)google.searchParams.set('ctz',event.timeZone);
  $('#google-calendar').href=google.href;
  const esc=s=>s.replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
  const calendarLines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Samantha//Course booking//RU','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT','UID:samanta-level-1-'+event.date+'@vikakhotian.github.io','DTSTAMP:'+utc(new Date()),(timed?'DTSTART:'+utc(start):'DTSTART;VALUE=DATE:'+day(start)),(timed?'DTEND:'+utc(end):'DTEND;VALUE=DATE:'+day(end)),'SUMMARY:'+esc(event.title),'DESCRIPTION:'+esc(details+(timed?'':' Время встречи уточняется.')),'URL:'+config.homeUrl,'END:VEVENT','END:VCALENDAR',''];
  const fold=line=>{let result='',part='',bytes=0;const encoder=new TextEncoder();for(const c of line){const n=encoder.encode(c).length;if(bytes+n>74){result+=part+'\r\n';part=' '+c;bytes=1+n;}else{part+=c;bytes+=n;}}return result+part;};
  const ics=calendarLines.map(fold).join('\r\n');
  if(calendarFile)URL.revokeObjectURL(calendarFile);
  calendarFile=URL.createObjectURL(new Blob([ics],{type:'text/calendar;charset=utf-8'}));
  $('#yandex-calendar').href=calendarFile;$('#calendar-section').hidden=false;
  $('#calendar-section').querySelector('.calendar-time-note')?.remove();
  if(!timed){const p=document.createElement('p');p.className='calendar-time-note';p.textContent='Пока в календарь добавится только дата — 1 ноября. Время встречи уточняется.';$('#calendar-section').prepend(p);}
 };
 let prepared='';
 $('#copy-request').addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(prepared);$('#copy-status').textContent='Текст заявки скопирован';}
  catch{const range=document.createRange();range.selectNodeContents($('#booking-message'));const selection=getSelection();selection.removeAllRanges();selection.addRange(range);$('#copy-status').textContent='Текст выделен. Скопируй его и отправь Вике';}
 });
 form.addEventListener('submit',async e=>{
  e.preventDefault();if(!validate())return;
  const contacts=Object.fromEntries(choices.filter(x=>x.checked).map(x=>[x.value,form.querySelector(`[name="${x.value}"]:not([type="checkbox"])`).value.trim()]));
  const payload={product:product.id,name:$('#booking-name').value,contacts};
  prepared=[consultation?'Заявка на индивидуальную консультацию':'Заявка на первый уровень курса «Саманта: Коды к мужчинам»',consultation?'Три онлайн-встречи. Стоимость 15 000 ₽':'Ближайший поток: 1 ноября 2026. Стоимость 1 800 ₽','Имя: '+payload.name,...Object.entries(contacts).map(([k,v])=>fieldNames[k]+': '+v)].join('\n');
  if(settings.deliveryMode==='pending'){
   error.textContent='Доставка заявок пока настраивается. Заявка не отправлена. Можно связаться с Викой в Telegram: @vikanio';return;
  }
  const submit=$('#booking-submit');submit.disabled=true;submit.textContent='Подожди…';
  try{
   if(settings.deliveryMode==='endpoint'){
    if(!settings.deliveryEndpoint)throw new Error('missing-endpoint');
    const response=await fetch(settings.deliveryEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',body:JSON.stringify(payload)});
    if(!response.ok)throw new Error('delivery-failed');
    const result=await response.json();if(result.ok!==true)throw new Error('delivery-failed');
    $('#booking-status').textContent='Заявка отправлена';
    $('#delivery-status').textContent='Вика свяжется с тобой по указанным контактам и подтвердит детали.';
    $('#send-in-telegram').hidden=true;
   }else if(settings.deliveryMode==='telegram-draft'){
    $('#booking-status').textContent='Заявка подготовлена';
    $('#delivery-status').textContent='Открой Telegram и отправь сообщение Вике. До нажатия «Отправить» в Telegram заявка к ней не поступит.';
    const target=new URL(config.telegramUrl);target.searchParams.set('text',prepared);$('#send-in-telegram').href=target.href;$('#send-in-telegram').hidden=false;
   }else throw new Error('unknown-mode');
   $('#booking-message').textContent=prepared;$('#copy-status').textContent='';$('#booking-next').hidden=false;setupCalendar();
   $('#booking-status').focus({preventScroll:true});$('#booking-next').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
  }catch{error.textContent='Не получилось передать заявку. Она не отправлена. Попробуй еще раз или напиши Вике в Telegram: @vikanio';}
  finally{submit.disabled=false;submitLabel(settings.deliveryMode==='endpoint'?'Отправить заявку':'Подготовить заявку');}
 });
 submitLabel(settings.deliveryMode==='endpoint'?'Отправить заявку':'Подготовить заявку');
 $('#booking-submit').disabled=false;
})();
