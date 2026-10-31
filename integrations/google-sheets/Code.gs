/* Приемник заявок Саманты. Таблица остается закрытой. URL CRM не возвращается посетителям. */
const CRM_FIELDS = ['name', 'lead_source', 'channels', 'links', 'registered_at', 'event_date'];
const CRM_LABELS = {vk:'ВКонтакте', telegram:'Телеграм', whatsapp:'WhatsApp', email:'email'};

function doGet() {
  return ContentService.createTextOutput('Samantha booking receiver').setMimeType(ContentService.MimeType.TEXT);
}
function doPost(e) {
  let request = {}, result;
  try {
    const raw = e && e.parameter && e.parameter.payload;
    if (!raw || raw.length > 8000) throw new Error('invalid_request');
    request = JSON.parse(raw);
    const lead = validateBooking(request);
    const lock = LockService.getScriptLock();
    if (!lock.tryLock(20000)) throw new Error('busy');
    try {
      const cache = CacheService.getScriptCache(), key = 'booking:' + request.requestId;
      if (!cache.get(key)) {
        saveLead(lead);
        cache.put(key, 'saved', 21600);
      }
      result = {ok:true};
    } finally { lock.releaseLock(); }
  } catch (error) {
    const allowed = ['invalid_request','invalid_name','invalid_contacts','invalid_date','busy'];
    result = {ok:false, code:allowed.indexOf(error.message) >= 0 ? error.message : 'crm_unavailable'};
  }
  // HTML + postMessage gives an acknowledged result without CORS-dependent fetch or a no-cors false success.
  const config = PropertiesService.getScriptProperties();
  const origin = config.getProperty('SITE_ORIGIN') || 'https://vikakhotian.github.io';
  const id = typeof request.requestId === 'string' && /^[a-zA-Z0-9-]{16,80}$/.test(request.requestId) ? request.requestId : '';
  const message = JSON.stringify({type:'samanta:booking', requestId:id, ok:result.ok, code:result.code || ''}).replace(/</g,'\\u003c');
  const html = '<!doctype html><meta charset="utf-8"><script>window.top.postMessage(' + message + ',' + JSON.stringify(origin) + ');</script>';
  return HtmlService.createHtmlOutput(html).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function validateBooking(r) {
  if (!r || !/^[a-zA-Z0-9-]{16,80}$/.test(r.requestId || '') || r.website) throw new Error('invalid_request');
  const name = typeof r.name === 'string' ? r.name.trim() : '';
  if (name.length < 2 || name.length > 80 || /[\u0000-\u001f]/.test(name)) throw new Error('invalid_name');
  if (!['level-1','level-1-offline','consultation'].includes(r.product)) throw new Error('invalid_request');
  const contacts = r.contacts;
  if (!contacts || typeof contacts !== 'object' || Array.isArray(contacts)) throw new Error('invalid_contacts');
  const keys = Object.keys(contacts);
  if (!keys.length || keys.length > 4 || keys.some(k => !CRM_LABELS[k])) throw new Error('invalid_contacts');
  const links = [], labels = [];
  keys.forEach(key => {
    const value = String(contacts[key]).trim(); let url;
    if (key === 'telegram') {
      const username = value.replace(/^https?:\/\/(?:www\.)?t\.me\//i,'').replace(/^@/,'').replace(/\/$/,'');
      if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) throw new Error('invalid_contacts');
      url = 'https://t.me/' + username;
    } else if (key === 'vk') {
      const id = value.replace(/^https?:\/\/(?:www\.)?vk\.(?:com|ru)\//i,'').replace(/\/$/,'');
      if (!/^[a-zA-Z0-9_.-]{2,80}$/.test(id)) throw new Error('invalid_contacts');
      url = 'https://vk.ru/' + id;
    } else if (key === 'whatsapp') {
      let phone = value.replace(/\D/g,'');
      if (phone.length === 11 && phone[0] === '8') phone = '7' + phone.slice(1);
      if (phone.length === 10 && phone[0] === '9') phone = '7' + phone;
      if (!/^\d{8,15}$/.test(phone)) throw new Error('invalid_contacts');
      url = 'https://wa.me/' + phone;
    } else {
      if (value.length > 160 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error('invalid_contacts');
      url = 'mailto:' + value;
    }
    labels.push(CRM_LABELS[key]); links.push(url);
  });
  let date = '';
  if (r.product !== 'consultation') {
    date = r.date;
    if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('invalid_date');
    const parsed = new Date(date + 'T12:00:00Z');
    if (!isFinite(+parsed) || parsed.toISOString().slice(0,10) !== date || +date.slice(0,4) < 2026 || +date.slice(0,4) > 2100) throw new Error('invalid_date');
  }
  return {name:name, labels:labels, links:links, date:date};
}
function getCRM() {
  const props = PropertiesService.getScriptProperties();
  const book = SpreadsheetApp.openById(props.getProperty('SPREADSHEET_ID'));
  const sheet = book.getSheetById(Number(props.getProperty('CRM_SHEET_ID')));
  if (!sheet) throw new Error('crm_unavailable');
  const columns = {};
  book.createDeveloperMetadataFinder().withKey('SAMANTA_CRM_FIELD').find().forEach(item => {
    const col = item.getLocation().getColumn();
    if (col && col.getSheet().getSheetId() === sheet.getSheetId()) {
      const field = item.getValue();
      if (columns[field]) throw new Error('crm_unavailable');
      columns[field] = col.getColumn();
    }
  });
  if (CRM_FIELDS.some(field => !columns[field])) throw new Error('crm_unavailable');
  return {book:book,sheet:sheet,columns:columns};
}
function saveLead(lead) {
  const crm = getCRM(), sheet = crm.sheet, col = crm.columns;
  const row = sheet.getLastRow() + 1;
  if (row > sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 100);
  // Formatting only: never copy another client's values, links, notes or formulas.
  if (row > 2) sheet.getRange(row-1,1,1,sheet.getLastColumn()).copyTo(sheet.getRange(row,1,1,sheet.getLastColumn()),SpreadsheetApp.CopyPasteType.PASTE_FORMAT,false);
  const plain = (field,text) => sheet.getRange(row,col[field]).setRichTextValue(SpreadsheetApp.newRichTextValue().setText(text).build());
  plain('name',lead.name); plain('lead_source','сайт'); plain('channels',lead.labels.join('\n'));
  const joined = lead.links.join('\n'), rich = SpreadsheetApp.newRichTextValue().setText(joined);
  let offset = 0;
  lead.links.forEach(url => { rich.setLinkUrl(offset,offset+url.length,url); offset += url.length+1; });
  sheet.getRange(row,col.links).setRichTextValue(rich.build()).setWrap(true);
  sheet.getRange(row,col.channels).setWrap(true);
  sheet.getRange(row,col.registered_at).setValue(new Date()).setNumberFormat('dd.mm.yyyy');
  if (lead.date) sheet.getRange(row,col.event_date).setValue(Utilities.parseDate(lead.date+' 12:00','Europe/Moscow','yyyy-MM-dd HH:mm')).setNumberFormat('dd.mm.yyyy');
  SpreadsheetApp.flush();
  // Readback before acknowledgement. Failure never produces a success confirmation.
  if (sheet.getRange(row,col.name).getDisplayValue() !== lead.name || sheet.getRange(row,col.lead_source).getDisplayValue() !== 'сайт' || sheet.getRange(row,col.links).getDisplayValue() !== joined) throw new Error('crm_unavailable');
}
function checkConnection() {
  const crm = getCRM();
  console.log('CRM подключена. Поля: ' + CRM_FIELDS.join(', '));
  return true;
}
function setupConnection() {
 const book = SpreadsheetApp.getActiveSpreadsheet();
 if (!book) throw new Error('Открой редактор из своей Google-таблицы через Расширения → Apps Script');
 const sheet = book.getSheetByName('CRM');
 if (!sheet) throw new Error('В этой таблице нет вкладки CRM');
 PropertiesService.getScriptProperties().setProperties({SPREADSHEET_ID:book.getId(),CRM_SHEET_ID:String(sheet.getSheetId()),SITE_ORIGIN:'https://vikakhotian.github.io'});
 return checkConnection();
}
