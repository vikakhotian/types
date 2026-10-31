const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const c={};vm.createContext(c);vm.runInContext(fs.readFileSync('integrations/google-sheets/Code.gs','utf8'),c);
const base=()=>({requestId:'test-request-0000001',product:'level-1',date:'2026-11-01',name:'Тест',contacts:{telegram:'@example_user'},website:''});
test('Четыре канала превращаются в точные ссылки, включая несколько контактов',()=>{
 const r=base();r.contacts={telegram:'https://t.me/example_user',vk:'https://vk.ru/id12345',whatsapp:'8 (916) 000-00-00',email:'test@example.com'};
 const lead=c.validateBooking(r);assert.deepEqual(Array.from(lead.links),['https://t.me/example_user','https://vk.ru/id12345','https://wa.me/79160000000','mailto:test@example.com']);assert.equal(lead.name,'Тест');
});
test('Дата берется из текущего предложения, не из дня отправки',()=>{
 for(const date of ['2026-11-01','2026-11-08','2027-02-03']){const r=base();r.date=date;assert.equal(c.validateBooking(r).date,date);}
 const r=base();r.product='consultation';delete r.date;assert.equal(c.validateBooking(r).date,'консультация');
 const labeled=base();labeled.product='consultation';labeled.date='консультация';assert.equal(c.validateBooking(labeled).date,'консультация');
});
test('Ошибочные даты, пустые контакты, неизвестный канал и ловушка ботов отклоняются',()=>{
 for(const patch of [{date:'2026-02-30'},{date:'bad'},{contacts:{}},{contacts:{other:'bad'}},{website:'spam'},{contacts:{email:'bad'}},{name:'A'},{requestId:'x'}])assert.throws(()=>c.validateBooking({...base(),...patch}));
 const consultation=base();consultation.product='consultation';consultation.date='2026-11-01';assert.throws(()=>c.validateBooking(consultation));
});
test('Переименование и перестановка столбцов не меняет смысл записи',()=>{
 const columns={name:8,lead_source:3,channels:6,links:2,registered_at:7,event_date:10};
 c.PropertiesService={getScriptProperties:()=>({getProperty:key=>key==='CRM_SHEET_ID'?'42':'private-id'})};
 c.SpreadsheetApp={openById:()=>({getSheetById:()=>({getSheetId:()=>42}),createDeveloperMetadataFinder:()=>({withKey(){return this;},find:()=>Object.entries(columns).map(([field,col])=>({getValue:()=>field,getLocation:()=>({getColumn:()=>({getSheet:()=>({getSheetId:()=>42}),getColumn:()=>col})})}))})})};
 assert.deepEqual(JSON.parse(JSON.stringify(c.getCRM().columns)),columns);
});
