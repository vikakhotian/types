(() => {
 const base='https://vikakhotian.github.io/types/';
 window.SAMANTA_SITE_CONFIG=Object.freeze({
  homeUrl:base,
  contactUrl:base+'booking/',
  telegramUrl:'https://t.me/vikanio',
  testUrl:base+'test/',
  consultationUrl:base+'consultation/',
  consultationBookingUrl:base+'booking/?kind=consultation',
  booking:Object.freeze({
   deliveryMode:'telegram-draft',
   deliveryEndpoint:'',
   course:Object.freeze({id:'level-1',title:'Саманта: Коды к мужчинам — первый уровень',date:'2026-11-01',startISO:null,durationMinutes:null,timeZone:'Europe/Moscow',price:1800}),
   consultation:Object.freeze({id:'consultation',title:'Индивидуальная консультация',price:15000,meetings:3})
  })
 });
})();
