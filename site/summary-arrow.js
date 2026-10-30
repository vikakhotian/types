(() => {
 const box=document.querySelector('.course-summary');
 if(!box)return;
 const title=box.querySelector('h2'),note=box.querySelector('.method-note');
 const ns='http://www.w3.org/2000/svg';const svg=document.createElementNS(ns,'svg');
 svg.setAttribute('class','summary-arrow');svg.setAttribute('aria-hidden','true');svg.setAttribute('data-ui','');
 const path=document.createElementNS(ns,'path');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.8');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);box.append(svg);
 const render=()=>{
  const root=box.getBoundingClientRect(),t=title.getBoundingClientRect(),n=note.getBoundingClientRect();
  const range=document.createRange();range.selectNodeContents(title);const lines=[...range.getClientRects()];const last=lines.at(-1)||t;
  const side=n.left>t.right+15;
  const sx=(side?last.right+9:Math.min(last.right-8,t.left+t.width*.65))-root.left;
  const sy=last.bottom-root.top+5;
  const ex=(side?n.left-14:n.left+n.width*.5)-root.left;
  const ey=(side?n.top+n.height*.78:n.top-13)-root.top;
  let d,cx,cy;
  if(side){const low=Math.max(sy+45,ey+28);cx=ex-28;cy=ey+23;d=`M${sx} ${sy} C${sx+72} ${sy+16} ${sx+5} ${low} ${sx+65} ${low} C${ex-48} ${low} ${cx} ${cy} ${ex} ${ey}`;}
  else{cx=ex-34;cy=ey-20;d=`M${sx} ${sy} C${sx+48} ${sy+14} ${cx} ${cy} ${ex} ${ey}`;}
  const len=Math.hypot(ex-cx,ey-cy)||1,ux=(ex-cx)/len,uy=(ey-cy)/len;
  const a=[ex-ux*13+uy*6,ey-uy*13-ux*6],b=[ex-ux*13-uy*6,ey-uy*13+ux*6];
  path.setAttribute('d',`${d} M${a[0]} ${a[1]} L${ex} ${ey} L${b[0]} ${b[1]}`);
  svg.setAttribute('viewBox',`0 0 ${root.width} ${root.height}`);
 };
 new ResizeObserver(render).observe(box);document.fonts.ready.then(render);addEventListener('resize',render);render();
})();
