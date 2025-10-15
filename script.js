// Default password
const DEFAULT_PWD = 'Manifold@2025';

document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('pwdOverlay');
  const pwdInput = document.getElementById('pwdInput');
  const pwdBtn = document.getElementById('pwdBtn');
  const pwdError = document.getElementById('pwdError');
  const app = document.getElementById('app');

  pwdBtn.addEventListener('click', ()=>{
    const v = pwdInput.value || '';
    if(v === DEFAULT_PWD){
      overlay.style.display = 'none';
      app.style.display = 'block';
      computeAll();
    } else {
      pwdError.textContent = 'Incorrect password';
    }
  });

  const $ = id => document.getElementById(id);
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

    const Ab = area_mm2(boreDia);
    const Ar_cross = area_mm2(rodDia);
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

  // attach auto-update listeners
  const inputs = document.querySelectorAll('input, select');
  inputs.forEach(i=> i.addEventListener('input', computeAll));
  document.getElementById('regen').addEventListener('change', computeAll);

  // reset logic - clear all inputs and outputs
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    document.querySelectorAll('input[type=number], input[type=text], input[type=password]').forEach(i=> i.value = '');
    document.querySelectorAll('select').forEach(s => s.selectedIndex = 0);
    document.getElementById('regen').checked = false;
    document.querySelectorAll('.output').forEach(o => o.textContent = '--');
  });

  // saved cylinders list management
  const savedCyls = [];
  function renderList(){
    const tbody = document.querySelector('#savedList tbody');
    tbody.innerHTML = '';
    savedCyls.forEach((cyl, idx)=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="cylSelect" data-index="${idx}" checked></td>
        <td>${cyl.name}</td>
        <td>${cyl.bore} × ${cyl.rod} × ${cyl.stroke} mm</td>
        <td><button class="btn deleteBtn" data-index="${idx}">Delete</button></td>
      `;
      tbody.appendChild(tr);
    });
    // attach delete handlers
    document.querySelectorAll('.deleteBtn').forEach(btn=> btn.addEventListener('click', (e)=>{
      const i = parseInt(e.currentTarget.dataset.index);
      if(!isNaN(i)) { savedCyls.splice(i,1); renderList(); }
    }));
  }

  document.getElementById('addBtn').addEventListener('click', ()=>{
    computeAll(); // ensure latest values
    const name = $('cylName').value.trim() || 'Untitled';
    const bore = $('boreDia').value;
    const rod = $('rodDia').value;
    const stroke = $('stroke').value;
    const nCyl = $('nCyl').value || 1;
    const powerB = $('finalBore').textContent;
    const powerR = $('finalRod').textContent;
    const flowB = $('flowBtot').textContent;
    const flowR = $('flowRtot').textContent;

    if(!bore || !rod || !stroke){ alert('Please enter bore, rod and stroke before adding.'); return; }

    savedCyls.push({name, bore, rod, stroke, nCyl, powerB, powerR, flowB, flowR});
    renderList();
  });

  // export selected cylinders to Excel
  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const selected = Array.from(document.querySelectorAll('.cylSelect'))
      .filter(chk => chk.checked)
      .map(chk => savedCyls[chk.dataset.index]);
    if(selected.length === 0){ alert('Please select at least one cylinder to export.'); return; }

    const ws_data = [['Name','Bore Dia (mm)','Rod Dia (mm)','Stroke (mm)','No. of Cyl','Bore Power','Rod Power','Total Bore Flow','Total Rod Flow']];
    selected.forEach(c=> ws_data.push([c.name, c.bore, c.rod, c.stroke, c.nCyl, c.powerB, c.powerR, c.flowB, c.flowR]));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Cylinders');
    XLSX.writeFile(wb, 'Selected_Cylinders.xlsx');
  });

  // initial compute
  computeAll();
});