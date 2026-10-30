(() => {
 const config = window.SAMANTA_SITE_CONFIG;
 if (!config) return;
 const bind = (selector, url) => document.querySelectorAll(selector).forEach(el => {
   if (url) { el.href = url; el.removeAttribute('aria-disabled'); el.removeAttribute('aria-describedby'); }
   else { el.removeAttribute('href'); el.setAttribute('aria-disabled','true'); }
 });
 bind('[data-site-home]', config.homeUrl);
 bind('[data-site-contact]', config.contactUrl);
 bind('[data-site-test]', config.testUrl);
 bind('[data-site-consultation]',config.consultationUrl);
 bind('[data-booking-consultation]',config.consultationBookingUrl);
 document.addEventListener('click', e => {
  const el=e.target.closest('.cta,[data-site-contact],[data-site-home]');
  if (!el) return;
  if (el.getAttribute('aria-disabled')==='true') {e.preventDefault(); return;}
  el.classList.add('was-pressed'); setTimeout(()=>el.classList.remove('was-pressed'),900);
 });
})();
