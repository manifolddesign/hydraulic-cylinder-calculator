
/* script v1.2.0 - implements calculations, find modal, export, login */
const DEFAULT_PWD = 'Hydraulics@2025';
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // login
  const pwdOverlay = $('pwdOverlay'), pwdInput = $('pwdInput'), pwdBtn = $('pwdBtn'), pwdError = $('pwdError');
  const topbar = $('topbar'), app = $('app');
  pwdBtn.addEventListener('click', ()=>{
    const v = (pwdInput.value||'').trim();
    if(!v){ pwdError.textContent = 'Please enter password.'; return; }
    if(v === DEFAULT_PWD){ pwdError.textContent = 'Unlocked successfully.'; pwdOverlay.style.display='none'; topbar.style.display='flex'; app.style.display='block'; computeAll(); }
    else { pwdError.textContent = 'Incorrect password — please try again.'; pwdInput.focus(); }
  });
// Find Cylinder Size Modal
const findOverlay = document.getElementById('findModalOverlay');
const findBtn = document.getElementById('findBtn');
const closeFind = document.getElementById('closeFind');

if (findBtn && findOverlay) {
  findBtn.addEventListener('click', () => {
    findOverlay.style.display = 'flex';
  });
}

if (closeFind && findOverlay) {
  closeFind.addEventListener('click', () => {
    findOverlay.style.display = 'none';
  });
}

// Prevent closing when clicking outside
findOverlay.addEventListener('click', (e) => {
  if (e.target === findOverlay) {
    // do nothing — modal stays open
    e.stopPropagation();
  }
});
  // helpers
  function area_mm2(d){ return Math.PI*Math.pow(d/2,2); }
  function mm_from_area(a){ return Math.sqrt((4*a)/Math.PI); }
  function fmt(v, p=2){ return (isNaN(v)||v==='' ? '--' : Number(v).toFixed(p)); }
  function unitTo_mps(val, unit, stroke_mm){
    if(!val || val===0) return 0;
    if(unit==='sec') return (stroke_mm/1000)/val;
    if(unit==='mmsec') return val/1000;
    if(unit==='msec') return val;
    if(unit==='mmin') return val/60;
    return 0;
  }
  function nearestIso(list, value){
    if(!value||isNaN(value)) return list[0];
    let nearest=list[0], mind=Math.abs(value-nearest);
    list.forEach(v=>{ const d=Math.abs(value-v); if(d<mind){mind=d;nearest=v;} });
    return nearest;
  }

  const ISO_BORES=[32,40,50,63,80,100,125,140,160,180,200,220,250,280,320,350,400];
  const ISO_RODS=[16,20,25,28,32,36,40,45,50,56,63,70,80,90,100];

  // compute main page values
  function computeAll(){
    const n = parseInt($('nCyl').value)||1;
    const stroke = parseFloat($('stroke').value)||0;
    const bore = parseFloat($('boreDia').value)||0;
    const rod = parseFloat($('rodDia').value)||0;
    const Ab = bore>0? area_mm2(bore):0;
    const Ar = rod>0? area_mm2(rod):0;
    const Aann = Math.max(Ab-Ar,0);

    // times and flows (L/min)
    const Vb = unitTo_mps(parseFloat($('timeValB').value)||0, $('timeUnitB').value, stroke);
    const Vr = unitTo_mps(parseFloat($('timeValR').value)||0, $('timeUnitR').value, stroke);
    const timeB = Vb>0? (stroke/1000)/Vb : 0;
    const timeR = Vr>0? (stroke/1000)/Vr : 0;
    const Qb = (Ab?Ab:0)/1e6 * (Vb*60) * 1000; // L/min per cyl
    const Qr = (Aann?Aann:0)/1e6 * (Vr*60) * 1000; // L/min per cyl
    const Qb_tot = Qb * n;
    const Qr_tot = Qr * n;

    // pressures / forces
    const pfModeB = $('pfModeB').value, pfValB = parseFloat($('pfValB').value)||0;
    const pfModeR = $('pfModeR').value, pfValR = parseFloat($('pfValR').value)||0;
    let pressureB=0, forceB=0, pressureR=0, forceR=0;
    if(Ab && pfModeB==='pressure'){ pressureB = pfValB; forceB = (Ab * pressureB * 0.1) / 1000; } // kN
    else if(Ab && pfModeB==='force'){ forceB = pfValB; pressureB = (forceB * 1000) / (Ab * 0.1); }
    if(Aann && pfModeR==='pressure'){ pressureR = pfValR; forceR = (Aann * pressureR * 0.1) / 1000; }
    else if(Aann && pfModeR==='force'){ forceR = pfValR; pressureR = (forceR * 1000) / (Aann * 0.1); }

    const regen = $('regen').checked;
    const Qb_for_power = regen ? Math.max(Qb - Qr, 0) : Qb;
    const powerB_per = (pressureB>0 && Qb_for_power>0)? (pressureB * Qb_for_power)/600 : 0;
    const powerR_per = (pressureR>0 && Qr>0)? (pressureR * Qr)/600 : 0;
    const powerB_tot = powerB_per * n;
    const powerR_tot = powerR_per * n;

    // update DOM
    $('areaB').textContent = Ab ? fmt(Ab) + ' mm²' : '--';
    $('areaR').textContent = Ar ? fmt(Ar) + ' mm²' : '--';
    $('timeOutB').textContent = timeB ? fmt(timeB) + ' s' : '--';
    $('timeOutR').textContent = timeR ? fmt(timeR) + ' s' : '--';
    $('flowB').textContent = Qb ? fmt(Qb) + ' L/min' : '--';
    $('flowR').textContent = Qr ? fmt(Qr) + ' L/min' : '--';
    $('volBtot').textContent = Qb_tot ? fmt(Qb_tot) + ' L/min' : '--';
    $('volRtot').textContent = Qr_tot ? fmt(Qr_tot) + ' L/min' : '--';
    $('pressureB').textContent = pressureB ? fmt(pressureB) + ' bar' : '--';
    $('pressureR').textContent = pressureR ? fmt(pressureR) + ' bar' : '--';
    $('forceB').textContent = forceB ? fmt(forceB) + ' kN' : (forceB===0 ? '0.00 kN' : '--');
    $('forceR').textContent = forceR ? fmt(forceR) + ' kN' : (forceR===0 ? '0.00 kN' : '--');
    $('powerBtot').textContent = powerB_tot ? fmt(powerB_tot) + ' kW' : '-- kW';
    $('powerRtot').textContent = powerR_tot ? fmt(powerR_tot) + ' kW' : '-- kW';
    $('finalBore').textContent = powerB_tot ? fmt(powerB_tot) + ' kW' : '-- kW';
    $('finalRod').textContent = powerR_tot ? fmt(powerR_tot) + ' kW' : '-- kW';
  }

  // wire inputs
  document.querySelectorAll('input, select').forEach(i=> i.addEventListener('input', computeAll));

  // reset top-level
  const resetBtn = $('resetBtn'); if(resetBtn) resetBtn.addEventListener('click', ()=>{
    document.querySelectorAll('input[type=number], input[type=text]').forEach(i=> i.value='');
    document.querySelectorAll('select').forEach(s=> s.selectedIndex=0);
    if($('regen')) $('regen').checked=false;
    document.querySelectorAll('.output').forEach(o=> o.textContent='--');
    if($('nCyl')) $('nCyl').value=1;
    if($('stroke')) $('stroke').value=1500;
  });

  // saved cylinders
  const savedCyls = []; let editingIndex=-1;
  function renderList(){
    const tbody = document.querySelector('#savedList tbody'); tbody.innerHTML='';
    savedCyls.forEach((c,idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td><input type="checkbox" class="cylSelect" data-index="${idx}" checked></td><td>${c.name}</td><td>${c.bore} × ${c.rod} × ${c.stroke} mm</td><td><button class="btn editBtn" data-index="${idx}">Edit</button> <button class="btn deleteBtn" data-index="${idx}">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    document.querySelectorAll('.deleteBtn').forEach(btn=> btn.addEventListener('click', (e)=>{ const i=parseInt(e.currentTarget.dataset.index); if(!isNaN(i)){ savedCyls.splice(i,1); renderList(); } }));
    document.querySelectorAll('.editBtn').forEach(btn=> btn.addEventListener('click', (e)=>{ const i=parseInt(e.currentTarget.dataset.index); if(isNaN(i)) return; const cyl=savedCyls[i]; if(cyl){ $('cylName').value=cyl.name; $('boreDia').value=cyl.bore; $('rodDia').value=cyl.rod; $('stroke').value=cyl.stroke; $('nCyl').value=cyl.nCyl||1; editingIndex=i; $('addBtn').textContent='Update Cylinder'; computeAll(); window.scrollTo({top:0,behavior:'smooth'}); } }));
  }
  if($('addBtn')) $('addBtn').addEventListener('click', ()=>{
    computeAll();
    const name = $('cylName')? $('cylName').value.trim() || 'Untitled' : 'Untitled';
    const bore = $('boreDia')? $('boreDia').value : '';
    const rod = $('rodDia')? $('rodDia').value : '';
    const stroke = $('stroke')? $('stroke').value : '';
    const nCyl = $('nCyl')? $('nCyl').value : 1;
    if(!bore || !rod || !stroke){ alert('Please enter bore, rod and stroke before adding.'); return; }
    const entry = {name,bore,rod,stroke,nCyl};
    if(editingIndex>=0){ savedCyls[editingIndex]=entry; editingIndex=-1; $('addBtn').textContent='Add Cylinder'; } else savedCyls.push(entry);
    renderList();
  });

  // select all behavior
  const selectAllHeader = $('selectAllHeader'); if(selectAllHeader) selectAllHeader.addEventListener('change', (e)=>{ const checks=document.querySelectorAll('.cylSelect'); checks.forEach(c=> c.checked=selectAllHeader.checked); });
  document.addEventListener('change', (e)=>{ if(e.target && e.target.classList && e.target.classList.contains('cylSelect')){ const checks=document.querySelectorAll('.cylSelect'); const allChecked=checks.length>0 && Array.from(checks).every(c=>c.checked); if(selectAllHeader) selectAllHeader.checked=allChecked; } });

  // export to excel - columns per user request, flows in L/min
  if($('exportBtn')) $('exportBtn').addEventListener('click', ()=>{
    const header=['Name','No. of Cylinders','Bore Dia (mm)','Rod Dia (mm)','Stroke (mm)','Time Option (Bore)','Time Value (Bore)','Time Option (Rod)','Time Value (Rod)','Pressure/Force Option (Bore)','Force Value (Bore) kN','Pressure (Bore) bar','Pressure/Force Option (Rod)','Force Value (Rod) kN','Pressure (Rod) bar','Total Flow (Bore) L/min','Total Flow (Rod) L/min','Total Power (Bore) kW','Total Power (Rod) kW','Bore Area mm2','Rod Area mm2'];
    const rows=[header];
    function computeRow(entry){
      const bore = parseFloat(entry.bore)||0; const rod = parseFloat(entry.rod)||0; const stroke = parseFloat(entry.stroke)||0; const n = parseInt(entry.nCyl)||1;
      const Ab = bore>0? Math.PI*Math.pow(bore/2,2):''; const Ar = rod>0? Math.PI*Math.pow(rod/2,2):''; const Aann = (Ab && Ar)? Math.max(Ab-Ar,0):'';
      const timeOptionB = $('timeUnitB')? $('timeUnitB').value : ''; const timeValB = $('timeValB')? parseFloat($('timeValB').value) || '' : '';
      const timeOptionR = $('timeUnitR')? $('timeUnitR').value : ''; const timeValR = $('timeValR')? parseFloat($('timeValR').value) || '' : '';
      const pfModeB = $('pfModeB')? $('pfModeB').value : ''; const pfValB = $('pfValB')? parseFloat($('pfValB').value) || 0 : 0;
      const pfModeR = $('pfModeR')? $('pfModeR').value : ''; const pfValR = $('pfValR')? parseFloat($('pfValR').value) || 0 : 0;
      let pressureB='', forceB=''; let pressureR='', forceR='';
      if(Ab && pfModeB==='pressure'){ pressureB=pfValB; forceB=(Ab*pressureB*0.1)/1000; } else if(Ab && pfModeB==='force'){ forceB=pfValB; pressureB=(forceB*1000)/(Ab*0.1); }
      if(Aann && pfModeR==='pressure'){ pressureR=pfValR; forceR=(Aann*pressureR*0.1)/1000; } else if(Aann && pfModeR==='force'){ forceR=pfValR; pressureR=(forceR*1000)/(Aann*0.1); }
      function unitTo_mps_local(val, unit, stroke_mm){
        if(!val || val===0) return 0;
        if(unit==='sec') return (stroke_mm/1000)/val;
        if(unit==='mmsec') return val/1000;
        if(unit==='msec') return val;
        if(unit==='mmin') return val/60;
        return 0;
      }
      const Vb = unitTo_mps_local(timeValB, timeOptionB, stroke);
      const Vr = unitTo_mps_local(timeValR, timeOptionR, stroke);
      const Qb = (Ab?Ab:0)/1e6 * (Vb*60) * 1000; const Qr = (Aann?Aann:0)/1e6 * (Vr*60) * 1000;
      const Qb_tot = Qb * n; const Qr_tot = Qr * n;
      const regen = $('regen')? $('regen').checked : false;
      const Qb_for_power = regen ? Math.max(Qb - Qr, 0) : Qb;
      const powerB_per = (pressureB>0 && Qb_for_power>0)? (pressureB * Qb_for_power)/600 : '';
      const powerR_per = (pressureR>0 && Qr>0)? (pressureR * Qr)/600 : '';
      const powerB_tot = powerB_per ? (powerB_per * n) : '';
      const powerR_tot = powerR_per ? (powerR_per * n) : '';
      return [entry.name||'', n||'', bore||'', rod||'', stroke||'', timeOptionB||'', timeValB||'', timeOptionR||'', timeValR||'', pfModeB||'', forceB?parseFloat(forceB).toFixed(3):'', pressureB?parseFloat(pressureB).toFixed(3):'', pfModeR||'', forceR?parseFloat(forceR).toFixed(3):'', pressureR?parseFloat(pressureR).toFixed(3):'', Qb_tot?parseFloat(Qb_tot).toFixed(3):0, Qr_tot?parseFloat(Qr_tot).toFixed(3):0, powerB_tot?parseFloat(powerB_tot).toFixed(3):0, powerR_tot?parseFloat(powerR_tot).toFixed(3):0, Ab?parseFloat(Ab).toFixed(3):'', Ar?parseFloat(Ar).toFixed(3):''];
    }
    const checks = document.querySelectorAll('.cylSelect'); const addedNames = new Set();
    checks.forEach(ch => { if(ch.checked){ const idx = parseInt(ch.dataset.index); const c = savedCyls[idx]; if(c){ rows.push(computeRow(c)); if(c.name) addedNames.add(c.name); } } });
    const current = {name: $('cylName')? $('cylName').value.trim() : '', bore: $('boreDia')? $('boreDia').value : '', rod: $('rodDia')? $('rodDia').value : '', stroke: $('stroke')? $('stroke').value : '', nCyl: $('nCyl')? $('nCyl').value : 1};
    if((current.bore || current.rod || current.stroke) && !addedNames.has(current.name || '')) rows.push(computeRow(current));
    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, 'Cylinder_Results'); XLSX.writeFile(wb, 'Hydraulic_Cylinder_Results_v1.3.1.xlsx');
  });

  // Find modal logic - corrected 'all cylinders hold' behavior
  const findOverlay = $('findModalOverlay'); const findBtn = $('findBtn'); const closeFind = $('closeFind'); const applyFind = $('applyFind');
  const isoSelect = $('isoBore'); const isoRod = $('isoRod'); const clearFind = $('clearFind'); const resetFind = $('resetFind');

  ISO_BORES.forEach(b=>{ const o=document.createElement('option'); o.value=b; o.textContent=b+' mm'; isoSelect.appendChild(o); });
  ISO_RODS.forEach(r=>{ const o=document.createElement('option'); o.value=r; o.textContent=r+' mm'; isoRod.appendChild(o); });

  function computeFromPressure(perCyl_kN, pressure_bar, rodRatio){ const area_mm2 = (perCyl_kN * 1000) / (pressure_bar * 0.1); const bore = mm_from_area(area_mm2); const rod = bore * rodRatio; return {bore, rod}; }
  function computeFromNoPressure(perCyl_kN, rodRatio){ const stress = 20; const area_mm2 = (perCyl_kN * 1000) / stress; const bore = mm_from_area(area_mm2); const rod = bore * rodRatio; return {bore, rod}; }

  function updateFindCalc(){
    const weight = parseFloat($('inputWeight').value) || 0;
    const weightUnit = $('weightUnit').value;
    const cap = parseFloat($('inputCapacity').value) || 0;
    const capUnit = $('capUnit').value;
    const qty = parseInt($('inputQty').value) || 1;
    const equal = !!$('inputEqual').checked;
    const pressure = parseFloat($('inputPressure').value) || 0;
    const rodType = $('rodType').value || 'standard';
    const rodRatio = rodType==='light'?0.3:rodType==='heavy'?0.5:0.4;
    let total_kN = 0;
    if(cap>0){ total_kN = (capUnit==='kN')? cap : cap/1000.0; }
    else if(weight>0){ if(weightUnit==='kg'){ const tonnes = weight/1000.0; total_kN = tonnes*9.81; } else { total_kN = weight*9.81; } }
    else { $('calcPerCyl').textContent='--'; $('calcBore').textContent='--'; $('calcRod').textContent='--'; $('calcIso').textContent='--'; $('inputQty').disabled=false; $('inputEqual').disabled=false; delete findOverlay.dataset.bore; delete findOverlay.dataset.rod; return; }

    if(cap>0){ $('inputQty').disabled=true; $('inputEqual').disabled=true; } else { $('inputQty').disabled=false; $('inputEqual').disabled=false; }

    // Behavior corrected:
    // If capacity provided -> perCyl = total_kN (capacity is per cyl or total? we treat capacity as total)
    // If weight provided and 'All cylinders hold' CHECKED -> load divided among cylinders
    // If weight provided and unchecked -> each cylinder must hold full entered weight
    let perCyl_kN = total_kN;
    if(cap>0){
      // capacity is treated as total required force (user may use per-cyl too)
      perCyl_kN = total_kN;
    } else {
      if(qty===1) perCyl_kN = total_kN;
      else if(equal) perCyl_kN = total_kN / Math.max(qty,1);
      else perCyl_kN = total_kN;
    }
    $('calcPerCyl').textContent = fmt(perCyl_kN) + ' kN';
    let result = pressure>0? computeFromPressure(perCyl_kN, pressure, rodRatio) : computeFromNoPressure(perCyl_kN, rodRatio);
    $('calcBore').textContent = fmt(result.bore) + ' mm';
    const nearest = nearestIso(ISO_BORES, result.bore);
    isoSelect.value = nearest;
    $('calcIso').textContent = nearest + ' mm';
    const lightRod = Math.round((nearest*0.3)/5)*5; const standardRod = Math.round((nearest*0.4)/5)*5; const heavyRod = Math.round((nearest*0.5)/5)*5;
    $('calcRod').textContent = 'Light: '+lightRod+' mm • Std: '+standardRod+' mm • Heavy: '+heavyRod+' mm';
    const desiredRod = (rodType==='light'?lightRod:rodType==='heavy'?heavyRod:standardRod);
    const nearestRod = nearestIso(ISO_RODS, desiredRod);
    isoRod.value = nearestRod;
    findOverlay.dataset.bore = nearest; findOverlay.dataset.rod = nearestRod;
  }

  ['inputWeight','weightUnit','inputCapacity','capUnit','inputQty','inputEqual','inputPressure','rodType'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('input', updateFindCalc); });

  isoSelect.addEventListener('input', ()=>{ const b=parseFloat(isoSelect.value)||0; if(b>0){ $('calcIso').textContent = b + ' mm'; const lightRod = Math.round((b*0.3)/5)*5; const standardRod = Math.round((b*0.4)/5)*5; const heavyRod = Math.round((b*0.5)/5)*5; $('calcRod').textContent = 'Light: '+lightRod+' mm • Std: '+standardRod+' mm • Heavy: '+heavyRod+' mm'; const nearestRod = nearestIso(ISO_RODS, standardRod); isoRod.value = nearestRod; findOverlay.dataset.bore = b; findOverlay.dataset.rod = nearestRod; } });
  isoRod.addEventListener('input', ()=>{ findOverlay.dataset.rod = parseFloat(isoRod.value)||0; });



  if(resetFind) resetFind.addEventListener('click', ()=>{ ['inputWeight','inputCapacity','inputQty','inputPressure','inputStroke'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; }); $('weightUnit').selectedIndex=0; $('capUnit').selectedIndex=0; $('inputQty').value=1; $('inputEqual').checked=false; $('rodType').selectedIndex=1; isoSelect.selectedIndex=0; isoRod.selectedIndex=0; ['calcPerCyl','calcBore','calcRod','calcIso','rodSFResult'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent='--'; }); delete findOverlay.dataset.bore; delete findOverlay.dataset.rod; $('inputQty').disabled=false; $('inputEqual').disabled=false; });
  findBtn.addEventListener('click', ()=>{ findOverlay.style.display='flex'; updateFindCalc(); });
  closeFind.addEventListener('click', ()=>{ findOverlay.style.display='none'; });
  // findOverlay outside click should NOT close the modal (per request)

  applyFind.addEventListener('click', ()=>{
    const b = parseFloat(findOverlay.dataset.bore||0); const r = parseFloat(findOverlay.dataset.rod||0);
    if(!b || !r){ alert('Please enter valid weight/capacity and ensure selections.'); return; }
    if($('boreDia')) $('boreDia').value = b.toFixed(2); if($('rodDia')) $('rodDia').value = r.toFixed(2);
    computeAll(); findOverlay.style.display='none';
  });


  // Rod Safety Factor check (uses stroke as column length)
  const checkRodBtn = $('checkRodSF');
  if(checkRodBtn) checkRodBtn.addEventListener('click', ()=>{
    const d = parseFloat($('calcIso').textContent) || parseFloat(findOverlay.dataset.bore) || 0;
    // if calcIso not numeric, try dataset
    const rodDia = parseFloat(findOverlay.dataset.rod) || parseFloat($('isoRod')? $('isoRod').value : 0) || 0;
    const stroke = parseFloat($('inputStroke').value) || parseFloat($('stroke')?.value) || 0;
    const K = parseFloat($('endCond')? $('endCond').value : $('endCond')?.value) || parseFloat($('endCond')?.value) || parseFloat($('endCond')||1.0);
    const endK = parseFloat($('endCond')? $('endCond').value : 1.0);
    const matY = parseFloat($('matYield').value) || 400;
    const targetSF = parseFloat($('buckSF').value) || 2.0;
    const perCyl_text = $('calcPerCyl').textContent || '--';
    let perCyl = 0;
    if(perCyl_text && perCyl_text.includes('kN')) perCyl = parseFloat(perCyl_text.replace(/[^\d.-]/g,'')) || 0;
    // if dataset bore/rod exist, use rodDia else use isoRod selection
    const d_use = rodDia || parseFloat($('rodDia').value) || 0;
    if(!d_use || !stroke || perCyl===0){ $('rodSFResult').textContent = 'Insufficient data'; $('rodSFResult').style.color = '#d97706'; return; }
    // Euler critical load Pcr = pi^3 * E * d^4 / (64 * (K*L)^2)
    const E = 210e9;
    const L = (stroke)/1000.0;
    const Kfactor = parseFloat($('endCond').value) || 1.0;
    const d_m = d_use/1000.0;
    const Pcr = Math.PI**3 * E * d_m**4 / (64 * (Kfactor * L)**2);
    const actualSF = Pcr / (perCyl*1000.0);
    const sfText = actualSF.toFixed(2);
    let color = '#16a34a'; let msg = 'Safe — SF = ' + sfText;
    if(actualSF < targetSF){ color = '#dc2626'; msg = 'Unsafe — SF = ' + sfText + ' (target ' + targetSF + ')'; }
    else if(actualSF < (targetSF + 0.5)){ color = '#d97706'; msg = 'Borderline — SF = ' + sfText; }
    $('rodSFResult').textContent = msg; $('rodSFResult').style.color = color;
  });

  // initial compute
  computeAll();
});
