(() => {
  const dialog=document.querySelector('#fit-dialog');
  if(!dialog)return;
  let trigger=null;
  const open=(column,button)=>{
    trigger=button;
    const heading=column.querySelector('h2');
    dialog.querySelector('#fit-dialog-title').textContent=heading.textContent;
    dialog.classList.toggle('fit-dialog-no',column.classList.contains('no'));
    const list=column.querySelector('ul').cloneNode(true);
    list.querySelectorAll('[data-source-line],[id]').forEach(el=>{el.removeAttribute('data-source-line');el.removeAttribute('id');});
    dialog.querySelector('.fit-dialog-content').replaceChildren(list);
    dialog.showModal();document.body.style.overflow='hidden';
  };
  document.querySelectorAll('.fit-column').forEach(column=>{
    const button=column.querySelector('[data-fit-expand]');
    column.addEventListener('click',e=>{
      if(window.getSelection()?.toString()&&!e.target.closest('[data-fit-expand]'))return;
      if(e.target.closest('a,input'))return;
      open(column,button);
    });
  });
  dialog.querySelector('.fit-dialog-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{
    if(e.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
  });
  dialog.addEventListener('close',()=>{document.body.style.overflow='';trigger?.focus({preventScroll:true});});
})();
