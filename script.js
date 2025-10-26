/* script v1.3.4 - updates:
   - ISO bore auto-select next-larger standard
   - ISO rod updates automatically when ISO bore changes (and when rodType changes)
   - End Condition images preview added
   - Reset in Find modal clears values
   - Minor robustness fixes
*/
const DEFAULT_PWD = 'Hydra@25';
document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // login
  const pwdOverlay = $('pwdOverlay'), pwdInput = $('pwdInput'), pwdBtn = $('pwdBtn'), pwdError = $('pwdError');
  if(pwdInput){ pwdInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') pwdBtn.click(); }); }
  const topbar = $('topbar'), app = $('app');
  pwdBtn.addEventListener('click', ()=>{
    const v = (pwdInput.value||'').trim();
    if(!v){ pwdError.textContent = 'Please enter password.'; return; }
    if(v === DEFAULT_PWD){ pwdError.textContent = 'Unlocked successfully.'; pwdOverlay.style.display='none'; topbar.style.display='flex'; app.style.display='block'; computeAll(); }
    else { pwdError.textContent = 'Incorrect password — please try again.'; pwdInput.focus(); }
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
  function nextLargerISO(list, value){
    if(!value || isNaN(value)) return list[0];
    const sorted = list.slice().sort((a,b)=>a-b);
    for(let i=0;i<sorted.length;i++){
      if(sorted[i] >= value) return sorted[i];
    }
    return sorted[sorted.length-1];
  }
  function nearestIso(list, value){
    if(!value||isNaN(value)) return list[0];
    let nearest=list[0], mind=Math.abs(value-nearest);
    list.forEach(v=>{ const d=Math.abs(value-v); if(d<mind){mind=d;nearest=v;} });
    return nearest;
  }

  const ISO_BORES=[32,40,50,63,80,100,125,140,160,180,200,220,250,280,320,350,400];
  const ISO_RODS=[16,20,25,28,32,36,40,45,50,56,63,70,80,90,100,110,125,140,160,180,200,220];

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
    // Use consistent flow calc: Q(L/min) = Area(mm2)*velocity(m/s)*60 / 1000 (to convert L)
    const Qb = (Ab?Ab:0) * (Vb*60) / 1e6 * 1000; // simplified to previous behavior but robust
    const Qr = (Aann?Aann:0) * (Vr*60) / 1e6 * 1000;
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
    const selHeader = document.getElementById('selectAllHeader'); if(selHeader) selHeader.checked=false;
    document.querySelectorAll('.cylSelect').forEach(c=> c.checked=false);
    const rodStatus = document.getElementById('rodSafetyStatus'); if(rodStatus){ rodStatus.textContent='--'; rodStatus.className='safety-status'; }
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
    const savedTitle = document.querySelector('.savedTitle'); const savedTable = document.getElementById('savedList');
    if(savedCyls.length>0){ if(savedTitle) savedTitle.style.display='block'; if(savedTable) savedTable.style.display='table'; }
    else { if(savedTitle) savedTitle.style.display='none'; if(savedTable) savedTable.style.display='none'; }
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
    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet(rows); XLSX.utils.book_append_sheet(wb, ws, 'Cylinder_Results'); XLSX.writeFile(wb, 'Hydraulic_Cylinder_Results_v1.3.4.xlsx');
  });

  // Find modal logic - corrected 'all cylinders hold' behavior, iso/rod link, pictures, reset fix
  const findOverlay = $('findModalOverlay'); const findBtn = $('findBtn'); const closeFind = $('closeFind'); const applyFind = $('applyFind');
  const isoSelect = $('isoBore'); const isoRod = $('isoRod'); const resetFind = $('resetFind');

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

    let perCyl_kN = total_kN;
    if(cap>0){
      perCyl_kN = total_kN;
    } else {
      if(qty <= 1) perCyl_kN = total_kN;
      else if(equal) perCyl_kN = total_kN / Math.max(qty,1);
      else perCyl_kN = total_kN;
    }
    $('calcPerCyl').textContent = fmt(perCyl_kN) + ' kN';
    let result = pressure>0? computeFromPressure(perCyl_kN, pressure, rodRatio) : computeFromNoPressure(perCyl_kN, rodRatio);
    $('calcBore').textContent = fmt(result.bore) + ' mm';

    // select next larger ISO bore
    const chosenIso = nextLargerISO(ISO_BORES, result.bore);
    isoSelect.value = chosenIso;
    $('calcIso').textContent = chosenIso + ' mm';

    // compute rod recommendations and set isoRod automatically based on chosenIso and rodType
    const lightRod = Math.round((chosenIso*0.3)/5)*5; const standardRod = Math.round((chosenIso*0.4)/5)*5; const heavyRod = Math.round((chosenIso*0.5)/5)*5;
    $('calcRod').textContent = 'Light: '+lightRod+' mm • Std: '+standardRod+' mm • Heavy: '+heavyRod+' mm';
    const desiredRod = (rodType==='light'?lightRod:rodType==='heavy'?heavyRod:standardRod);
    const nearestRod = nearestIso(ISO_RODS, desiredRod);
    isoRod.value = nearestRod;
    findOverlay.dataset.bore = chosenIso; findOverlay.dataset.rod = nearestRod;

    // update end condition preview (in case user changed it)
    const sel = $('rodEndCondition');
    const prev = document.getElementById('endCondPreview');
    if(prev) prev.innerHTML = endConditionSVG[sel.value] || '';
  }

  // wire modal inputs to update
  ['inputWeight','weightUnit','inputCapacity','capUnit','inputQty','inputEqual','inputPressure','rodType'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('input', updateFindCalc); });

  // when user manually changes ISO bore, update isoRod automatically
  isoSelect.addEventListener('change', ()=>{
    const b = parseFloat(isoSelect.value)||0;
    if(b>0){
      const rodType = $('rodType')? $('rodType').value : 'standard';
      const lightRod = Math.round((b*0.3)/5)*5; const standardRod = Math.round((b*0.4)/5)*5; const heavyRod = Math.round((b*0.5)/5)*5;
      const desiredRod = (rodType==='light'?lightRod:rodType==='heavy'?heavyRod:standardRod);
      const nearestRod = nearestIso(ISO_RODS, desiredRod);
      isoRod.value = nearestRod;
      $('calcIso').textContent = b + ' mm';
      $('calcRod').textContent = 'Light: '+lightRod+' mm • Std: '+standardRod+' mm • Heavy: '+heavyRod+' mm';
      findOverlay.dataset.bore = b; findOverlay.dataset.rod = nearestRod;
      // also compute rod safety if modal has stroke and perCyl present
      setTimeout(()=>{ computeRodSafety(); }, 50);
    }
  });

  // when user changes rodType, update isoRod suggestion
  const rodTypeEl = $('rodType');
  if(rodTypeEl) rodTypeEl.addEventListener('change', ()=>{
    const b = parseFloat(isoSelect.value)||0;
    if(b>0) isoSelect.dispatchEvent(new Event('change'));
    updateFindCalc();
  });

  // resetFind behavior - fully clear modal values and results
  if(resetFind) resetFind.addEventListener('click', ()=>{
    ['inputWeight','inputCapacity','inputQty','inputPressure','rodSafetyStroke'].forEach(id=>{
      const el = document.getElementById(id); if(el) el.value='';
    });
    $('weightUnit').selectedIndex=0; $('capUnit').selectedIndex=0; $('inputQty').value=1; $('inputEqual').checked=true; $('rodType').selectedIndex=1;
    isoSelect.selectedIndex = 0; isoRod.selectedIndex = 0;
    ['calcPerCyl','calcBore','calcRod','calcIso'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent='--'; });
    delete findOverlay.dataset.bore; delete findOverlay.dataset.rod;
    // reset rod safety
    const rodStatus = document.getElementById('rodSafetyStatus'); if(rodStatus){ rodStatus.textContent='--'; rodStatus.className='safety-status'; }
  });

  findBtn.addEventListener('click', ()=>{ findOverlay.style.display='flex'; updateFindCalc(); });
  closeFind.addEventListener('click', ()=>{ findOverlay.style.display='none'; });

  applyFind.addEventListener('click', ()=>{
    const b = parseFloat(findOverlay.dataset.bore||0); const r = parseFloat(findOverlay.dataset.rod||0);
    if(!b || !r){ alert('Please enter valid weight/capacity and ensure selections.'); return; }
    if($('boreDia')) $('boreDia').value = b.toFixed(2); if($('rodDia')) $('rodDia').value = r.toFixed(2);
    computeAll(); findOverlay.style.display='none';
  });


  // ---------------- Rod Safety (Euler buckling) ----------------
  const E_mod = 2.1e5; // N/mm2 (Young's modulus)
  function computeRodSafety(){
    const statusDiv = document.getElementById('rodSafetyStatus');
    try{
      const strokeInput = document.getElementById('rodSafetyStroke');
      const endCond = document.getElementById('rodEndCondition');
      const isoRodSel = document.getElementById('isoRod');
      const perCylText = document.getElementById('calcPerCyl');
      if(!statusDiv || !strokeInput || !endCond || !isoRodSel || !perCylText){
        if(statusDiv) { statusDiv.textContent='--'; statusDiv.className='safety-status'; }
        return;
      }
      const L = parseFloat(strokeInput.value) || 0;
      const K = parseFloat(endCond.value) || 1.0;
      const d = parseFloat(isoRodSel.value) || 0; // mm
      const perText = perCylText.textContent || '';
      const perVal = parseFloat(perText.replace(/[^\d\.\-]/g,'')) || 0; // kN
      if(L <= 0 || d <= 0 || perVal <= 0){
        statusDiv.textContent='--';
        statusDiv.className='safety-status';
        return;
      }
      const I = (Math.PI * Math.pow(d,4)) / 64.0; // mm^4
      const Pcr = (Math.pow(Math.PI,2) * E_mod * I) / Math.pow(K * L, 2);
      const loadN = perVal * 1000.0; // kN -> N
      const ratio = Pcr / loadN;
      const ratioText = 'Buckling ratio: ' + (ratio? ratio.toFixed(2) : '--');
      if(Pcr > 2.0 * loadN){
        statusDiv.textContent = 'Rod Safe — ' + ratioText;
        statusDiv.className = 'safety-status safety-safe';
      } else if (Pcr > 1.5 * loadN) {
        statusDiv.textContent = 'Rod Warning — ' + ratioText;
        statusDiv.className = 'safety-status safety-warning';
      } else {
        statusDiv.textContent = 'Rod Not Safe — ' + ratioText;
        statusDiv.className = 'safety-status safety-unsafe';
      }
    }catch(e){
      statusDiv.textContent='--';
      statusDiv.className='safety-status';
      console.error('Rod safety compute error', e);
    }
  }

  // auto-update rod safety when relevant fields change
  ['rodSafetyStroke','rodEndCondition','isoRod','calcPerCyl'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', computeRodSafety);
  });

  // observe calcPerCyl changes
  const calcPerNode = document.getElementById('calcPerCyl');
  if(calcPerNode){
    const mo = new MutationObserver(()=> computeRodSafety());
    mo.observe(calcPerNode, { characterData: true, childList: true, subtree: true });
  }

  // ensure updateFindCalc triggers safety update as well
  if(typeof updateFindCalc === 'function'){
    const _orig = updateFindCalc;
    updateFindCalc = function(){
      _orig();
      computeRodSafety();
    };
  }

  // initial compute
  computeAll();
});
// --- Enhance Rod End Condition Dropdown with Images ---
document.addEventListener("DOMContentLoaded", () => {
  const rodEndSelect = document.getElementById("rodEndCondition");
  if (!rodEndSelect) return;

  const rodOptions = [
    { value: "2.0", text: "Fixed–Free", img: "fixed-free.png" },
    { value: "1.0", text: "Pinned–Pinned", img: "pinned-pinned.png" },
    { value: "0.7", text: "Fixed–Pinned", img: "fixed-pinned.png" },
    { value: "0.5", text: "Fixed–Fixed", img: "fixed-fixed.png" }
  ];

  // Clear existing options and rebuild with images
  rodEndSelect.innerHTML = "";
  rodOptions.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt.value;
    option.textContent = opt.text;
    rodEndSelect.appendChild(option);
  });

  // Replace with custom dropdown UI using images
  const wrapper = document.createElement("div");
  wrapper.className = "rod-end-wrapper";
  rodEndSelect.parentNode.insertBefore(wrapper, rodEndSelect);
  wrapper.appendChild(rodEndSelect);

  const dropdown = document.createElement("div");
  dropdown.className = "rod-end-custom";
  dropdown.style.position = "relative";
  wrapper.appendChild(dropdown);

  const selected = document.createElement("div");
  selected.className = "rod-end-selected";
  selected.style.display = "flex";
  selected.style.alignItems = "center";
  selected.style.gap = "8px";
  selected.style.cursor = "pointer";
  selected.style.border = "1px solid #e6eef8";
  selected.style.borderRadius = "10px";
  selected.style.padding = "8px";
  selected.style.background = "#fff";
  dropdown.appendChild(selected);

  const selectedImg = document.createElement("img");
  selectedImg.src = "pinned-pinned.png";
  selectedImg.style.width = "40px";
  selectedImg.style.height = "24px";
  selectedImg.style.objectFit = "contain";
  selected.appendChild(selectedImg);

  const selectedText = document.createElement("span");
  selectedText.textContent = "Pinned–Pinned";
  selected.appendChild(selectedText);

  const list = document.createElement("div");
  list.style.position = "absolute";
  list.style.left = "0";
  list.style.right = "0";
  list.style.top = "100%";
  list.style.background = "#fff";
  list.style.border = "1px solid #e6eef8";
  list.style.borderRadius = "10px";
  list.style.boxShadow = "0 4px 10px rgba(0,0,0,0.1)";
  list.style.zIndex = "999";
  list.style.display = "none";
  dropdown.appendChild(list);

  rodOptions.forEach(opt => {
    const item = document.createElement("div");
    item.className = "rod-end-option";
    item.style.padding = "6px 8px";
    item.style.display = "flex";
    item.style.alignItems = "center";
    item.style.gap = "8px";
    item.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = opt.img;
    img.width = 40;
    img.height = 24;
    img.style.objectFit = "contain";
    img.style.border = "1px solid #e0e0e0";
    img.style.borderRadius = "4px";
    item.appendChild(img);

    const span = document.createElement("span");
    span.textContent = opt.text;
    item.appendChild(span);

    item.addEventListener("click", () => {
      rodEndSelect.value = opt.value;
      selectedImg.src = opt.img;
      selectedText.textContent = opt.text;
      list.style.display = "none";
    });

    list.appendChild(item);
  });

  selected.addEventListener("click", () => {
    list.style.display = list.style.display === "none" ? "block" : "none";
  });

  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target)) list.style.display = "none";
  });

  rodEndSelect.style.display = "none";
});

