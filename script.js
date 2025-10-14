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

  // reset logic
  document.getElementById('resetBtn').addEventListener('click', ()=>{
    document.querySelectorAll('input[type=number]').forEach(i=> i.value = '');
    document.getElementById('nCyl').value = 1;
    document.getElementById('stroke').value = 1500;
    document.getElementById('boreDia').value = 320;
    document.getElementById('rodDia').value = 220;
    computeAll();
  });

  // export to Excel using SheetJS
  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const ws_data = [
      ['Bore Side', '','', 'Rod Side','',''],
      ['Parameter','Value','Unit','Parameter','Value','Unit'],
      ['Bore diameter', document.getElementById('boreDia').value, 'mm', 'Rod diameter', document.getElementById('rodDia').value, 'mm'],
      ['Stroke', document.getElementById('stroke').value, 'mm', 'No. of cylinders', document.getElementById('nCyl').value, ''],
      ['','','','','',''],
      ['Bore Calculations','','','Rod Calculations','',''],
      ['Area', document.getElementById('areaB').textContent, 'mm²', 'Rod cross area', document.getElementById('areaR').textContent, 'mm²'],
      ['Annular area', document.getElementById('areaAnn').textContent, 'mm²', '','', ''],
      ['Speed', document.getElementById('speedB').textContent, '', 'Speed', document.getElementById('speedR').textContent, ''],
      ['Time', document.getElementById('timeOutB').textContent, 's', 'Time', document.getElementById('timeOutR').textContent, 's'],
      ['Flow (per cyl)', document.getElementById('flowB').textContent, 'L/min', 'Flow (per cyl)', document.getElementById('flowR').textContent, 'L/min'],
      ['Total Flow', document.getElementById('flowBtot').textContent, 'L/min', 'Total Flow', document.getElementById('flowRtot').textContent, 'L/min'],
      ['Pressure', document.getElementById('pressureB').textContent, 'bar', 'Pressure', document.getElementById('pressureR').textContent, 'bar'],
      ['Force', document.getElementById('forceB').textContent, 'kN', 'Force', document.getElementById('forceR').textContent, 'kN'],
      ['Power (per cyl)', document.getElementById('powerB').textContent, 'kW', 'Power (per cyl)', document.getElementById('powerR').textContent, 'kW'],
      ['Power (total)', document.getElementById('powerBtot').textContent, 'kW', 'Power (total)', document.getElementById('powerRtot').textContent, 'kW'],
      ['','','','','',''],
      ['Final Totals','','','','',''],
      ['Bore Power Total', document.getElementById('finalBore').textContent, 'kW', 'Rod Power Total', document.getElementById('finalRod').textContent, 'kW']
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // try applying cell fill colors for final totals (may not be supported in all viewers)
    try{
      const finalRow = ws_data.length;
      const boreValCell = 'B' + (finalRow);
      const rodValCell = 'E' + (finalRow);
      if(ws[boreValCell]) ws[boreValCell].s = {fill: {fgColor: {rgb: "E7F3FF"}}};
      if(ws[rodValCell]) ws[rodValCell].s = {fill: {fgColor: {rgb: "FFF6EA"}}};
    }catch(e){ console.log('styling error', e); }

    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'Cylinder_Calculation_Results.xlsx');
  });

  // initial compute
  computeAll();
});