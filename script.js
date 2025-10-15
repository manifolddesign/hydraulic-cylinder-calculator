
const DEFAULT_PWD = 'Manifold@2025';

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // Password modal
  const pwdOverlay = $('pwdOverlay');
  const pwdInput = $('pwdInput');
  const pwdBtn = $('pwdBtn');
  const pwdError = $('pwdError');
  const app = $('app');

  pwdBtn.addEventListener('click', () => {
    const val = (pwdInput.value || '').trim();
    if (val === DEFAULT_PWD) {
      pwdOverlay.style.display = 'none';
      app.style.display = 'block';
      computeAll();
    } else {
      pwdError.textContent = 'Incorrect password';
      pwdInput.focus();
    }
  });

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

  // ISO bore sizes list
  const ISO_BORES = [32,40,50,63,80,100,125,140,160,180,200,220,250,280,320,350,400];

  // computeAll (complete calculations)
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

    // speeds and times
    const Vb = unitTo_mps(timeValB, timeUnitB, stroke);
    const Vr = unitTo_mps(timeValR, timeUnitR, stroke);
    const timeB = Vb>0 ? (stroke/1000)/Vb : 0;
    const timeR = Vr>0 ? (stroke/1000)/Vr : 0;

    // flows L/min
    const Qb = (Ab/1e6) * (Vb*60) * 1000;
    const Qr = (Aann/1e6) * (Vr*60) * 1000;
    const Qb_tot = Qb * n;
    const Qr_tot = Qr * n;

    // pressures and forces
    let pressureB = 0, forceB = 0, pressureR = 0, forceR = 0;
    if(pfModeB === 'pressure'){ pressureB = pfValB; forceB = (Ab * pressureB * 0.1) / 1000; }
    else { forceB = pfValB; pressureB = (forceB * 1000) / (Ab * 0.1); }
    if(pfModeR === 'pressure'){ pressureR = pfValR; forceR = (Aann * pressureR * 0.1) / 1000; }
    else { forceR = pfValR; pressureR = (forceR * 1000) / (Aann * 0.1); }

    // power
    const Qb_for_power = regen ? Math.max(Qb - Qr, 0) : Qb;
    const powerB_per = (pressureB>0 && Qb_for_power>0) ? (pressureB * Qb_for_power) / 600 : 0;
    const powerR_per = (pressureR>0 && Qr>0) ? (pressureR * Qr) / 600 : 0;
    const powerB_tot = powerB_per * n;
    const powerR_tot = powerR_per * n;

    // write outputs
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
    document.querySelectorAll('input[type=number], input[type=text], input[type=password]').forEach(i=> i.value = '');
    document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    document.getElementById('regen').checked = false;
    document.querySelectorAll('.output').forEach(o => o.textContent = '--');
    $('nCyl').value = 1;
    $('stroke').value = 1500;
  });

  // saved cylinders management with checkbox header
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

    // handlers
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

  // export using header checkbox selection
  $('exportBtn').addEventListener('click', ()=>{
    const selected = Array.from(document.querySelectorAll('.cylSelect'))
      .filter(chk => chk.checked)
      .map(chk => savedCyls[parseInt(chk.dataset.index)])
      .filter(Boolean);
    if(selected.length === 0){ alert('Please select at least one cylinder to export.'); return; }
    const ws_data = [['Name','Bore Dia (mm)','Rod Dia (mm)','Stroke (mm)','No. of Cyl']];
    selected.forEach(c=> ws_data.push([c.name, c.bore, c.rod, c.stroke, c.nCyl]));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Cylinders');
    XLSX.writeFile(wb, 'Selected_Cylinders.xlsx');
  });

  // ---------- Find Cylinder Size Modal with ISO selection and equal distribution ----------
  const findOverlay = $('findModalOverlay');
  const findBtn = $('findBtn');
  const closeFind = $('closeFind');
  const applyFind = $('applyFind');
  const isoSelect = $('isoBore');

  // populate ISO bore list
  ISO_BORES.forEach(b => {
    const opt = document.createElement('option');
    opt.value = b;
    opt.textContent = b + ' mm';
    isoSelect.appendChild(opt);
  });

  function nearestIso(value){
    if(!value || isNaN(value)) return ISO_BORES[0];
    let nearest = ISO_BORES[0];
    let mindiff = Math.abs(value - nearest);
    ISO_BORES.forEach(v => {
      const d = Math.abs(value - v);
      if(d < mindiff){ mindiff = d; nearest = v; }
    });
    return nearest;
  }

  function computeFromCapacity(perCyl_kN, pressure_bar, rodRatio){
    const area_mm2 = (perCyl_kN * 10000) / pressure_bar;
    const bore = mm_from_area(area_mm2);
    const rod = bore * rodRatio;
    return {bore, rod};
  }
  function computeFromWeightNoPressure(perCyl_kN, rodRatio){
    const stress = 20; // N/mm2
    const area_mm2 = (perCyl_kN * 1000) / stress;
    const bore = mm_from_area(area_mm2);
    const rod = bore * rodRatio;
    return {bore, rod};
  }

  function updateFindCalc(){
    const ton = parseFloat($('inputTon').value) || 0;
    const kn = parseFloat($('inputKN').value) || 0;
    const qty = parseInt($('inputQty').value) || 1;
    const pressure = parseFloat($('inputPressure').value);
    const equal = $('inputEqual').checked;
    const rodType = $('rodType').value || 'standard';
    const rodRatio = rodType === 'light' ? 0.3 : rodType === 'heavy' ? 0.5 : 0.4;

    let total_kN = 0;
    if(kn > 0) total_kN = kn;
    else if(ton > 0) total_kN = ton * 9.81;
    else total_kN = 0;

    if(total_kN <= 0){ $('calcPerCyl').textContent='--'; $('calcBore').textContent='--'; $('calcRod').textContent='--'; $('calcIso').textContent='--'; delete findOverlay.dataset.bore; delete findOverlay.dataset.rod; return; }

    // decide per-cylinder
    let perCyl;
    if(equal){
      perCyl = total_kN / Math.max(qty,1);
    } else {
      // if not equal, assume single cylinder holds whole load (user can change qty to 1)
      perCyl = total_kN;
    }
    $('calcPerCyl').textContent = fmt(perCyl) + ' kN';

    let result;
    if(pressure && pressure > 0){
      result = computeFromCapacity(perCyl, pressure, rodRatio);
    } else {
      result = computeFromWeightNoPressure(perCyl, rodRatio);
    }
    $('calcBore').textContent = fmt(result.bore) + ' mm';
    $('calcRod').textContent = fmt(result.rod) + ' mm';

    // select nearest ISO bore by default and set iso select
    const nearest = nearestIso(result.bore);
    isoSelect.value = nearest;
    $('calcIso').textContent = nearest + ' mm';

    // compute recommended rod options (nearest standard sizes) - simple rounding to nearest 5 mm
    const lightRod = Math.round((nearest * 0.3) / 5) * 5;
    const standardRod = Math.round((nearest * 0.4) / 5) * 5;
    const heavyRod = Math.round((nearest * 0.5) / 5) * 5;
    // show choices by replacing calcRod with list (create small chooser)
    const rodHtml = `Light: ${lightRod} mm • Standard: ${standardRod} mm • Heavy: ${heavyRod} mm`;
    $('calcRod').textContent = rodHtml;
    // store default selected rod based on selected rodType
    let selectedRod = standardRod;
    if(rodType === 'light') selectedRod = lightRod;
    if(rodType === 'heavy') selectedRod = heavyRod;
    findOverlay.dataset.bore = nearest;
    findOverlay.dataset.rod = selectedRod;
  }

  ['inputTon','inputKN','inputQty','inputPressure','rodType','inputEqual'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', updateFindCalc);
  });

  findBtn.addEventListener('click', () => { findOverlay.style.display = 'flex'; updateFindCalc(); });
  closeFind.addEventListener('click', () => { findOverlay.style.display = 'none'; });
  findOverlay.addEventListener('click', (e) => { if(e.target === findOverlay) findOverlay.style.display = 'none'; });

  applyFind.addEventListener('click', () => {
    const b = parseFloat(findOverlay.dataset.bore || 0);
    const r = parseFloat(findOverlay.dataset.rod || 0);
    if(!b || !r){ alert('Please enter valid load/capacity.'); return; }
    $('boreDia').value = b.toFixed(2);
    $('rodDia').value = r.toFixed(2);
    computeAll();
    findOverlay.style.display = 'none';
  });

  // initial compute
  computeAll();
});
