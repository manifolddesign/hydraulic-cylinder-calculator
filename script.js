
const DEFAULT_PWD = 'Hydraulics@2025';
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const topbar = $('topbar'), app = $('app');
  let templateFileName = 'Hydraulic Cylinder Reports.xlsx';
  const savedCyls = [];

  $('pwdBtn').addEventListener('click', ()=>{
    const v = ($('pwdInput').value||'').trim();
    if(v === DEFAULT_PWD){ document.getElementById('pwdOverlay').style.display='none'; topbar.style.display='flex'; app.style.display='block'; }
    else { $('pwdError').textContent = 'Incorrect password'; }
  });

  function renderList(){ const tbody = $('savedList').querySelector('tbody'); tbody.innerHTML=''; savedCyls.forEach((c,idx)=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td><input type="checkbox" class="cylSelect" data-index="${idx}" checked></td><td>${c.name}</td><td>${c.bore}×${c.rod}×${c.stroke}</td><td><button class="btn editBtn" data-index="${idx}">Edit</button> <button class="btn deleteBtn" data-index="${idx}">Delete</button></td>`; tbody.appendChild(tr); }); attachListEvents(); }
  function attachListEvents(){ document.querySelectorAll('.deleteBtn').forEach(btn=>btn.onclick=(e)=>{ const i=parseInt(e.currentTarget.dataset.index); savedCyls.splice(i,1); renderList(); }); document.querySelectorAll('.editBtn').forEach(btn=>btn.onclick=(e)=>{ const i=parseInt(e.currentTarget.dataset.index); const c=savedCyls[i]; $('cylName').value=c.name; $('boreDia').value=c.bore; $('rodDia').value=c.rod; $('stroke').value=c.stroke; $('nCyl').value=c.nCyl||1; })}

  $('addBtn').addEventListener('click', ()=>{
    const name = $('cylName').value || 'Untitled'; const bore=$('boreDia').value||''; const rod=$('rodDia').value||''; const stroke=$('stroke').value||''; const nCyl=$('nCyl').value||1;
    if(!bore||!rod||!stroke){ alert('Enter bore, rod, stroke'); return; }
    savedCyls.push({name,bore,rod,stroke,nCyl}); renderList();
  });

  $('uploadBtn').addEventListener('click', ()=> $('uploadTemplate').click() );
  $('uploadTemplate').addEventListener('change', (e)=>{
    const f = e.target.files[0]; if(!f) return; templateFileName = f.name; $('templateName').textContent = templateFileName;
    const reader = new FileReader();
    reader.onload = function(ev){ window._uploadedTemplate = ev.target.result; };
    reader.readAsArrayBuffer(f);
  });

  // Export: fetch bundled template if no upload, then fill specified cells
  $('exportBtn').addEventListener('click', async ()=>{
    let arrayBuffer;
    if(window._uploadedTemplate){ arrayBuffer = window._uploadedTemplate; }
    else { const resp = await fetch('Hydraulic Cylinder Reports.xlsx'); arrayBuffer = await resp.arrayBuffer(); }
    const wb = XLSX.read(arrayBuffer, {type:'array'});
    const wsName = wb.SheetNames[0]; const ws = wb.Sheets[wsName];

    function writeCell(col, row, value, t='s'){ const addr = col+row; ws[addr] = {t:t, v: value}; }
    function colLetterForIndex(idx){ const base = 3 + idx; let col=''; let n=base; while(n>0){ let rem=(n-1)%26; col=String.fromCharCode(65+rem)+col; n=Math.floor((n-1)/26);} return col; }

    // selected list
    const checks = Array.from(document.querySelectorAll('.cylSelect')).filter(c=>c.checked).map(c=>savedCyls[parseInt(c.dataset.index)]);
    const current = {name:$('cylName').value||'', bore:$('boreDia').value||'', rod:$('rodDia').value||'', stroke:$('stroke').value||'', boreFlow:'', rodFlow:'', boreForce:'', rodForce:'', borePressure:'', rodPressure:'', totalBore:'', totalRod:'', regen: $('regen').checked ? 'Yes':'No', borePower:'', rodPower:'', timeUnitB:$('timeUnitB')?$('timeUnitB').value:'', timeUnitR:$('timeUnitR')?$('timeUnitR').value:''};
    if(current.name && !checks.some(c=>c.name===current.name)) checks.push(current);

    checks.forEach((cyl, idx)=>{
      const col = colLetterForIndex(idx);
      writeCell(col,2, cyl.name||'');
      writeCell(col,3, cyl.bore||'');
      writeCell(col,4, cyl.rod||'');
      writeCell(col,5, cyl.stroke||'');
      writeCell(col,6, cyl.boreFlow||'');
      writeCell(col,7, cyl.rodFlow||'');
      writeCell(col,8, cyl.boreForce||'');
      writeCell(col,9, cyl.rodForce||'');
      writeCell(col,10, cyl.borePressure||'');
      writeCell(col,11, cyl.rodPressure||'');
      writeCell(col,14, cyl.totalBore||'');
      writeCell(col,15, cyl.totalRod||'');
      writeCell(col,16, cyl.regen||'');
      writeCell(col,17, cyl.borePower||'');
      writeCell(col,18, cyl.rodPower||'');
      const timeColIdx = 5 + idx; let col2=''; let n=timeColIdx; while(n>0){ let rem=(n-1)%26; col2=String.fromCharCode(65+rem)+col2; n=Math.floor((n-1)/26); }
      writeCell(col2,6, cyl.timeUnitB||'');
      writeCell(col2,7, cyl.timeUnitR||'');
    });

    const lastColIdx = 3 + checks.length - 1;
    const unitsColIdx = lastColIdx + 2;
    let unitsCol=''; let n=unitsColIdx; while(n>0){ let rem=(n-1)%26; unitsCol=String.fromCharCode(65+rem)+unitsCol; n=Math.floor((n-1)/26); }
    ws[unitsCol+'1'] = {t:'s', v:'Units'};

    XLSX.writeFile(wb, 'Hydraulic_Calculation_Report_v1.3.0.xlsx');
  });

});
