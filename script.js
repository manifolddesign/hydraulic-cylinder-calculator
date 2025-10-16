
const DEFAULT_PWD = 'Hydraulics@2025';

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // password modal controls
  const pwdOverlay = $('pwdOverlay');
  const pwdInput = $('pwdInput');
  const pwdBtn = $('pwdBtn');
  const pwdError = $('pwdError');
  const app = $('app');
  const topbar = $('topbar');

  pwdBtn.addEventListener('click', () => {
    const val = (pwdInput.value || '').trim();
    if (val === DEFAULT_PWD) {
      pwdOverlay.style.display = 'none';
      app.style.display = 'block';
      topbar.style.display = 'flex';
      computeAll();
    } else {
      pwdError.textContent = 'Incorrect password';
      pwdInput.focus();
    }
  });

  // helpers
  function area_mm2(d){ return Math.PI * Math.pow(d/2,2); }
  function unitTo_mps(val, unit, stroke_mm){
    if(!val || val===0) return 0;
    if(unit === 'sec') return (stroke_mm/1000)/val;
    if(unit === 'mmsec') return val/1000;
    if(unit === 'msec') return val;
    if(unit === 'mmin') return val/60;
    return 0;
  }
  function fmt(v){ return (isNaN(v) ? '--' : v.toFixed(2)); }
  function mm_from_area(area_mm2){ return Math.sqrt((4*area_mm2)/Math.PI); }
  function nearestIso(list, value){
    if(!value || isNaN(value)) return list[0];
    let nearest = list[0]; let mind = Math.abs(value - nearest);
    list.forEach(v=>{ const d = Math.abs(value - v); if(d < mind){ mind = d; nearest = v; }});
    return nearest;
  }

  const ISO_BORES = [32,40,50,63,80,100,125,140,160,180,200,220,250,280,320,350,400];
  const ISO_RODS = [16,20,25,28,32,36,40,45,50,56,63,70,80,90,100];

  // main calculations for the page
  function computeAll(){
    const n = parseInt($('nCyl').value) || 1;
    const stroke = parseFloat($('stroke').value) || 0;

    const boreDia = parseFloat($('boreDia').value) || 0;
    const timeUnitB = $('timeUnitB').value;
    const timeValB = parseFloat($('timeValB').value) || 0;
    const pfModeB = $('pfModeB').value;
    const pfValB = parseFloat($('pfValB').value) || 0;

    const rodDia = parseFloat($('rodDia').value) || 0;
    const timeUnitR = $('timeUnitR').value;
    const timeValR = parseFloat($('timeValR').value) || 0;
    const pfModeR = $('pfModeR').value;
    const pfValR = parseFloat($('pfValR').value) || 0;
    const regen = $('regen').checked;

    const Ab = boreDia>0 ? area_mm2(boreDia) : 0;
    const Ar_cross = rodDia>0 ? area_mm2(rodDia) : 0;
    const Aann = Math.max(Ab - Ar_cross, 0);

    const Vb = unitTo_mps(timeValB, timeUnitB, stroke);
    const Vr = unitTo_mps(timeValR, timeUnitR, stroke);
    const timeB = Vb>0 ? (stroke/1000)/Vb : 0;
    const timeR = Vr>0 ? (stroke/1000)/Vr : 0;

    const Qb = (Ab/1e6) * (Vb*60) * 1000;
    const Qr = (Aann/1e6) * (Vr*60) * 1000;
    const Qb_tot = Qb * n;
    const Qr_tot = Qr * n;

    let pressureB = 0, forceB = 0, pressureR = 0, forceR = 0;
    if(pfModeB === 'pressure'){ pressureB = pfValB; forceB = (Ab * pressureB * 0.1) / 1000; }
    else { forceB = pfValB; pressureB = (forceB * 1000) / (Ab * 0.1); }
    if(pfModeR === 'pressure'){ pressureR = pfValR; forceR = (Aann * pressureR * 0.1) / 1000; }
    else { forceR = pfValR; pressureR = (forceR * 1000) / (Aann * 0.1); }

    const Qb_for_power = regen ? Math.max(Qb - Qr, 0) : Qb;
    const powerB_per = (pressureB>0 && Qb_for_power>0) ? (pressureB * Qb_for_power) / 600 : 0;
    const powerR_per = (pressureR>0 && Qr>0) ? (pressureR * Qr) / 600 : 0;
    const powerB_tot = powerB_per * n;
    const powerR_tot = powerR_per * n;

    $('areaB').textContent = Ab ? fmt(Ab) + ' mm²' : '--';
    $('areaR').textContent = Ar_cross ? fmt(Ar_cross) + ' mm²' : '--';
    $('areaAnn').textContent = Aann ? fmt(Aann) + ' mm²' : '--';
    $('speedB').textContent = Vb>0 ? ((Vb*1000).toFixed(2)+' mm/s • '+Vb.toFixed(4)+' m/s • '+(Vb*60).toFixed(2)+' m/min') : '--';
    $('speedR').textContent = Vr>0 ? ((Vr*1000).toFixed(2)+' mm/s • '+Vr.toFixed(4)+' m/s • '+(Vr*60).toFixed(2)+' m/min') : '--';
    $('timeOutB').textContent = timeB>0 ? fmt(timeB) + ' s' : '--';
    $('timeOutR').textContent = timeR>0 ? fmt(timeR) + ' s' : '--';
    $('flowB').textContent = Qb>0 ? fmt(Qb) + ' L/min' : '--';
    $('flowR').textContent = Qr>0 ? fmt(Qr) + ' L/min' : '--';
    $('flowBtot').textContent = Qb_tot>0 ? fmt(Qb_tot) + ' L/min' : '--';
    $('flowRtot').textContent = Qr_tot>0 ? fmt(Qr_tot) + ' L/min' : '--';
    $('pressureB').textContent = pressureB>0 ? fmt(pressureB) + ' bar' : '--';
    $('forceB').textContent = forceB>0 ? fmt(forceB) + ' kN' : '--';
    $('pressureR').textContent = pressureR>0 ? fmt(pressureR) + ' bar' : '--';
    $('forceR').textContent = forceR>0 ? fmt(forceR) + ' kN' : '--';
    $('powerB').textContent = powerB_per>0 ? fmt(powerB_per) + ' kW' : '--';
    $('powerR').textContent = powerR_per>0 ? fmt(powerR_per) + ' kW' : '--';
    $('powerBtot').textContent = powerB_tot>0 ? fmt(powerB_tot) + ' kW' : '--';
    $('powerRtot').textContent = powerR_tot>0 ? fmt(powerR_tot) + ' kW' : '--';
    $('finalBore').textContent = powerB_tot>0 ? fmt(powerB_tot) + ' kW' : '-- kW';
    $('finalRod').textContent = powerR_tot>0 ? fmt(powerR_tot) + ' kW' : '-- kW';
  }

  // wire inputs to computeAll
  document.querySelectorAll('input, select').forEach(i => i.addEventListener('input', computeAll));
  document.getElementById('regen').addEventListener('change', computeAll);
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.querySelectorAll('input[type=number], input[type=text]').forEach(i=> i.value = '');
    document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    document.getElementById('regen').checked = false;
    document.querySelectorAll('.output').forEach(o => o.textContent = '--');
    $('nCyl').value = 1;
    $('stroke').value = 1500;
  });

  // saved cylinders management
  const savedCyls = [];
  let editingIndex = -1;

  function renderList(){
    const tbody = document.querySelector('#savedList tbody');
    tbody.innerHTML = '';
    savedCyls.forEach((cyl, idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="cylSelect" data-index="${idx}" checked></td>
        <td>${cyl.name}</td>
        <td>${cyl.bore} × ${cyl.rod} × ${cyl.stroke} mm</td>
        <td>
          <button class="btn editBtn" data-index="${idx}">Edit</button>
          <button class="btn deleteBtn" data-index="${idx}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    document.querySelectorAll('.deleteBtn').forEach(btn=> btn.addEventListener('click', (e)=>{
      const i = parseInt(e.currentTarget.dataset.index);
      if(!isNaN(i)) { savedCyls.splice(i,1); renderList(); }
    }));
    document.querySelectorAll('.editBtn').forEach(btn=> btn.addEventListener('click', (e)=>{
      const i = parseInt(e.currentTarget.dataset.index);
      if(isNaN(i)) return;
      const cyl = savedCyls[i];
      $('cylName').value = cyl.name;
      $('boreDia').value = cyl.bore;
      $('rodDia').value = cyl.rod;
      $('stroke').value = cyl.stroke;
      $('nCyl').value = cyl.nCyl || 1;
      editingIndex = i;
      $('addBtn').textContent = 'Update Cylinder';
      computeAll();
      window.scrollTo({top:0, behavior:'smooth'});
    }));
  }

  $('addBtn').addEventListener('click', ()=>{
    computeAll();
    const name = ($('cylName').value || 'Untitled').trim();
    const bore = $('boreDia').value;
    const rod = $('rodDia').value;
    const stroke = $('stroke').value;
    const nCyl = $('nCyl').value || 1;
    if(!bore || !rod || !stroke){ alert('Please enter bore, rod and stroke before adding.'); return; }
    const entry = {name, bore, rod, stroke, nCyl};
    if(editingIndex >= 0){
      savedCyls[editingIndex] = entry;
      editingIndex = -1;
      $('addBtn').textContent = 'Add Cylinder';
    } else {
      savedCyls.push(entry);
    }
    renderList();
  });

  // header select all checkbox behavior
  const selectAllHeader = $('selectAllHeader');
  selectAllHeader.addEventListener('change', (e) => {
    const checks = document.querySelectorAll('.cylSelect');
    checks.forEach((c, i) => c.checked = selectAllHeader.checked);
  });
  document.addEventListener('change', (e) => {
    if(e.target && e.target.classList && e.target.classList.contains('cylSelect')){
      const checks = document.querySelectorAll('.cylSelect');
      const allChecked = checks.length>0 && Array.from(checks).every(c => c.checked);
      selectAllHeader.checked = allChecked;
    }
  });

  // Export to Excel - include all user inputs + computed fields for each selected saved cylinder + current form
  $('exportBtn').addEventListener('click', ()=>{
    const selectedIdx = Array.from(document.querySelectorAll('.cylSelect')).map(ch=>parseInt(ch.dataset.index)).filter(i=>!isNaN(i) && document.querySelectorAll('.cylSelect')[i].checked);
    const rows = [];
    // header
    rows.push(['Source','Name','Bore Dia (mm)','Rod Dia (mm)','Stroke (mm)','No. of Cyl','Bore Area mm2','Rod Area mm2','Annular Area mm2','Bore Pressure (bar)','Bore Force (kN)','Rod Pressure (bar)','Rod Force (kN)','Bore Flow L/min (per)','Rod Flow L/min (per)','Bore Power kW (per)','Rod Power kW (per)']);
    // include current form as first row
    const current = {
      name: $('cylName').value || 'Current',
      bore: parseFloat($('boreDia').value) || '',
      rod: parseFloat($('rodDia').value) || '',
      stroke: parseFloat($('stroke').value) || '',
      nCyl: parseInt($('nCyl').value) || 1
    };
    function computeFields(entry){
      const bore = parseFloat(entry.bore) || 0;
      const rod = parseFloat(entry.rod) || 0;
      const stroke = parseFloat(entry.stroke) || 0;
      const n = parseInt(entry.nCyl) || 1;
      const Ab = bore>0 ? Math.PI*Math.pow(bore/2,2) : '';
      const Ar = rod>0 ? Math.PI*Math.pow(rod/2,2) : '';
      const Aann = (Ab && Ar) ? Math.max(Ab - Ar,0) : '';
      // pressures and forces use current pf inputs if available
      let pressureB = 0, forceB = '';
      let pressureR = 0, forceR = '';
      const pfModeB = $('pfModeB').value, pfValB = parseFloat($('pfValB').value) || 0;
      const pfModeR = $('pfModeR').value, pfValR = parseFloat($('pfValR').value) || 0;
      if(Ab && pfModeB === 'pressure'){ pressureB = pfValB; forceB = (Ab * pressureB * 0.1) / 1000; }
      else if(Ab && pfModeB === 'force'){ forceB = pfValB; pressureB = (forceB * 1000) / (Ab * 0.1); }
      if(Aann && pfModeR === 'pressure'){ pressureR = pfValR; forceR = (Aann * pressureR * 0.1) / 1000; }
      else if(Aann && pfModeR === 'force'){ forceR = pfValR; pressureR = (forceR * 1000) / (Aann * 0.1); }
      const Vb = unitTo_mps(parseFloat($('timeValB').value)||0, $('timeUnitB').value, stroke);
      const Vr = unitTo_mps(parseFloat($('timeValR').value)||0, $('timeUnitR').value, stroke);
      const Qb = (Ab?Ab:0)/1e6 * (Vb*60) * 1000;
      const Qr = (Aann?Aann:0)/1e6 * (Vr*60) * 1000;
      const regen = $('regen').checked;
      const Qb_for_power = regen ? Math.max(Qb - Qr, 0) : Qb;
      const powerB_per = (pressureB>0 && Qb_for_power>0) ? (pressureB * Qb_for_power) / 600 : '';
      const powerR_per = (pressureR>0 && Qr>0) ? (pressureR * Qr) / 600 : '';
      return [entry.name, bore||'', rod||'', stroke||'', n||'', Ab?Ab.toFixed(2):'', Ar?Ar.toFixed(2):'', Aann?Aann.toFixed(2):'', pressureB?pressureB:'', forceB?forceB.toFixed(3):'', pressureR?pressureR:'', forceR?forceR.toFixed(3):'', Qb?Qb.toFixed(2):'', Qr?Qr.toFixed(2):'', powerB_per?powerB_per.toFixed(3):'', powerR_per?powerR_per.toFixed(3):''];
    }
    rows.push(['Current', ...computeFields(current)]);

    // include selected saved cylinders
    const checks = document.querySelectorAll('.cylSelect');
    checks.forEach(ch => {
      if(ch.checked){
        const idx = parseInt(ch.dataset.index);
        const c = savedCyls[idx];
        if(c) rows.push(['Saved', ...computeFields(c)]);
      }
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Cylinders');
    XLSX.writeFile(wb, 'Hydraulic_Cylinders_Export.xlsx');
  });

  // Find modal implementation
  const findOverlay = $('findModalOverlay');
  const findBtn = $('findBtn');
  const closeFind = $('closeFind');
  const applyFind = $('applyFind');
  const isoSelect = $('isoBore');
  const isoRod = $('isoRod');
  const clearFind = $('clearFind');

  // populate iso lists
  ISO_BORES.forEach(b => { const o = document.createElement('option'); o.value = b; o.textContent = b+' mm'; isoSelect.appendChild(o); });
  ISO_RODS.forEach(r => { const o = document.createElement('option'); o.value = r; o.textContent = r+' mm'; isoRod.appendChild(o); });

  function computeFromPressure(perCyl_kN, pressure_bar, rodRatio){
    const area_mm2 = (perCyl_kN * 1000) / (pressure_bar * 0.1);
    const bore = mm_from_area(area_mm2);
    const rod = bore * rodRatio;
    return {bore, rod};
  }
  function computeFromNoPressure(perCyl_kN, rodRatio){
    const stress = 20;
    const area_mm2 = (perCyl_kN * 1000) / stress;
    const bore = mm_from_area(area_mm2);
    const rod = bore * rodRatio;
    return {bore, rod};
  }
  function mm_from_area(area_mm2){ return Math.sqrt((4*area_mm2)/Math.PI); }

  function updateFindCalc(){
    const weight = parseFloat($('inputWeight').value) || 0;
    const weightUnit = $('weightUnit').value;
    const cap = parseFloat($('inputCapacity').value) || 0;
    const capUnit = $('capUnit').value;
    const qty = parseInt($('inputQty').value) || 1;
    const pressure = parseFloat($('inputPressure').value);
    const rodType = $('rodType').value || 'standard';
    const rodRatio = rodType === 'light' ? 0.3 : rodType === 'heavy' ? 0.5 : 0.4;

    let total_kN = 0;
    if(cap > 0){
      if(capUnit === 'kN') total_kN = cap;
      else total_kN = cap / 1000.0;
    } else if(weight > 0){
      if(weightUnit === 'kg'){
        const tonnes = weight / 1000.0;
        total_kN = tonnes * 9.81;
      } else {
        total_kN = weight * 9.81;
      }
    } else {
      $('calcPerCyl').textContent='--'; $('calcBore').textContent='--'; $('calcRod').textContent='--'; $('calcIso').textContent='--';
      $('inputQty').disabled = false; $('inputEqual').disabled = false;
      delete findOverlay.dataset.bore; delete findOverlay.dataset.rod;
      return;
    }

    if(cap > 0){
      $('inputQty').disabled = true;
      $('inputEqual').disabled = true;
    } else {
      $('inputQty').disabled = false;
      $('inputEqual').disabled = false;
    }

    let perCyl_kN = total_kN;
    // weight logic per user's latest spec:
    // if weight input and qty>1 => perCyl = total/qty; if qty==1 => perCyl = total
    if(cap > 0){
      perCyl_kN = total_kN;
    } else {
      if(qty <= 1) perCyl_kN = total_kN;
      else perCyl_kN = total_kN / qty;
    }

    $('calcPerCyl').textContent = fmt(perCyl_kN) + ' kN';

    let result;
    if(pressure && pressure > 0){
      result = computeFromPressure(perCyl_kN, pressure, rodRatio);
    } else {
      result = computeFromNoPressure(perCyl_kN, rodRatio);
    }

    $('calcBore').textContent = fmt(result.bore) + ' mm';
    const nearest = nearestIso(ISO_BORES, result.bore);
    isoSelect.value = nearest;
    $('calcIso').textContent = nearest + ' mm';

    const lightRod = Math.round((nearest * 0.3) / 5) * 5;
    const standardRod = Math.round((nearest * 0.4) / 5) * 5;
    const heavyRod = Math.round((nearest * 0.5) / 5) * 5;
    $('calcRod').textContent = 'Light: '+lightRod+' mm • Std: '+standardRod+' mm • Heavy: '+heavyRod+' mm';
    const desiredRod = (rodType==='light'?lightRod:rodType==='heavy'?heavyRod:standardRod);
    const nearestRod = nearestIso(ISO_RODS, desiredRod);
    isoRod.value = nearestRod;

    findOverlay.dataset.bore = nearest;
    findOverlay.dataset.rod = nearestRod;
  }

  ['inputWeight','weightUnit','inputCapacity','capUnit','inputQty','inputEqual','inputPressure','rodType'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', updateFindCalc);
  });

  isoSelect.addEventListener('input', ()=>{
    const b = parseFloat(isoSelect.value)||0;
    if(b>0){
      $('calcIso').textContent = b + ' mm';
      const lightRod = Math.round((b * 0.3) / 5) * 5;
      const standardRod = Math.round((b * 0.4) / 5) * 5;
      const heavyRod = Math.round((b * 0.5) / 5) * 5;
      $('calcRod').textContent = 'Light: '+lightRod+' mm • Std: '+standardRod+' mm • Heavy: '+heavyRod+' mm';
      const nearestRod = nearestIso(ISO_RODS, standardRod);
      isoRod.value = nearestRod;
      findOverlay.dataset.bore = b;
      findOverlay.dataset.rod = nearestRod;
    }
  });
  isoRod.addEventListener('input', ()=>{ findOverlay.dataset.rod = parseFloat(isoRod.value)||0; });

  clearFind.addEventListener('click', ()=>{
    ['inputWeight','inputCapacity','inputQty','inputPressure'].forEach(id=>{ const el=document.getElementById(id); if(el) el.value=''; });
    $('weightUnit').selectedIndex = 0; $('capUnit').selectedIndex = 0; $('inputQty').value = 1; $('inputEqual').checked = true; $('rodType').selectedIndex = 1;
    isoSelect.selectedIndex = 0; isoRod.selectedIndex = 0;
    ['calcPerCyl','calcBore','calcRod','calcIso'].forEach(id=>document.getElementById(id).textContent='--');
    delete findOverlay.dataset.bore; delete findOverlay.dataset.rod;
    $('inputQty').disabled = false; $('inputEqual').disabled = false;
  });

  findBtn.addEventListener('click', ()=>{ findOverlay.style.display='flex'; updateFindCalc(); });
  closeFind.addEventListener('click', ()=>{ findOverlay.style.display='none'; });
  findOverlay.addEventListener('click', (e)=>{ if(e.target===findOverlay) findOverlay.style.display='none'; });

  applyFind.addEventListener('click', ()=>{
    const b = parseFloat(findOverlay.dataset.bore||0);
    const r = parseFloat(findOverlay.dataset.rod||0);
    if(!b || !r){ alert('Please enter valid weight/capacity and ensure selections.'); return; }
    $('boreDia').value = b.toFixed(2);
    $('rodDia').value = r.toFixed(2);
    computeAll();
    findOverlay.style.display='none';
  });

  // initial compute
  computeAll();
});
