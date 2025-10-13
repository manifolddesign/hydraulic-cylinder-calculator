// Default password
const DEFAULT_PWD = 'Manifold@2025';

// Password modal logic
document.getElementById('loginBtn').addEventListener('click', ()=>{
  const v = document.getElementById('passwordInput').value || '';
  if(v === DEFAULT_PWD){ document.getElementById('passwordModal').style.display='none'; document.getElementById('calcApp').style.display='block'; computeAll(); }
  else document.getElementById('errorMsg').textContent = 'Incorrect password';
});

// Helpers
function area_mm2(d){ return Math.PI * Math.pow(d/2,2); } // mm^2
function to_m_per_s_from_unit(val, unit, stroke_mm){
  // returns speed in m/s
  if(!val || val===0) return 0;
  if(unit==='sec'){ // val is time in sec for stroke mm -> speed m/s = (stroke mm /1000) / time_s
    return (stroke_mm/1000)/val;
  }
  if(unit==='mmsec'){ // val is mm/s -> convert to m/s
    return val/1000;
  }
  if(unit==='msec'){ // val is m/s already
    return val;
  }
  if(unit==='mmin'){ // m/min to m/s
    return val/60;
  }
  return 0;
}

// Core calculation
function computeAll(){
  // inputs
  const n = parseInt(document.getElementById('numCylinders').value) || 1;

  const boreDia = parseFloat(document.getElementById('boreDia').value) || 0;
  const rodDia = parseFloat(document.getElementById('rodDia').value) || 0;
  const stroke = parseFloat(document.getElementById('stroke').value) || 0;

  const boreTimeUnit = document.getElementById('boreTimeUnit').value;
  const boreTimeVal = parseFloat(document.getElementById('boreTimeVal').value) || 0;
  const rodTimeUnit = document.getElementById('rodTimeUnit').value;
  const rodTimeVal = parseFloat(document.getElementById('rodTimeVal').value) || 0;

  const inputBorePressure = parseFloat(document.getElementById('borePressure').value) || 0;
  const inputBoreForce = parseFloat(document.getElementById('boreForce').value) || 0;
  const inputRodPressure = parseFloat(document.getElementById('rodPressure').value) || 0;
  const inputRodForce = parseFloat(document.getElementById('rodForce').value) || 0;

  const regen = document.getElementById('regen').checked;

  // areas
  const Ab = area_mm2(boreDia); // mm^2
  const Ar_cross = area_mm2(rodDia); // rod cross-section mm^2
  const Aann = Math.max(Ab - Ar_cross, 0); // annulus for rod flow mm^2

  // speeds (m/s)
  const Vb_m_s = to_m_per_s_from_unit(boreTimeVal, boreTimeUnit, stroke);
  const Vr_m_s = to_m_per_s_from_unit(rodTimeVal, rodTimeUnit, stroke);

  // times (s)
  const timeB_s = Vb_m_s>0 ? (stroke/1000)/Vb_m_s : 0;
  const timeR_s = Vr_m_s>0 ? (stroke/1000)/Vr_m_s : 0;

  // flows L/min per cyl: Q = area(m^2) * speed(m/min) *1000
  const Ab_m2 = Ab / 1e6;
  const Aann_m2 = Aann / 1e6;
  const Vb_m_min = Vb_m_s * 60;
  const Vr_m_min = Vr_m_s * 60;
  const Qb = Ab_m2 * Vb_m_min * 1000; // L/min per cyl
  const Qr = Aann_m2 * Vr_m_min * 1000; // L/min per cyl

  const Qb_tot = Qb * n;
  const Qr_tot = Qr * n;

  // pressure <-> force conversion (using annular area for rod)
  // Force (kN) = Area_mm2 * Pressure_bar * 0.0001
  // Pressure (bar) = Force_kN * 10000 / Area_mm2
  let pressureB = inputBorePressure, forceB = inputBoreForce;
  if(pressureB>0 && (!forceB || forceB===0)) forceB = (Ab * pressureB * 0.1) / 1000; // kN
  if((!pressureB || pressureB===0) && forceB>0) pressureB = (forceB * 1000) / (Ab * 0.1);

  let pressureR = inputRodPressure, forceR = inputRodForce;
  if(pressureR>0 && (!forceR || forceR===0)) forceR = (Aann * pressureR * 0.1) / 1000;
  if((!pressureR || pressureR===0) && forceR>0) pressureR = (forceR * 1000) / (Aann * 0.1);

  // Power (kW): Power = P(bar) * Q(L/min) / 600 ; regeneration affects bore power: use (Qb - Qr) if regen
  const Qb_for_power = regen ? Math.max(Qb - Qr, 0) : Qb;
  const powerB_per = (pressureB > 0 && Qb_for_power > 0) ? (pressureB * Qb_for_power) / 600 : 0;
  const powerR_per = (pressureR > 0 && Qr > 0) ? (pressureR * Qr) / 600 : 0;
  const powerB_tot = powerB_per * n;
  const powerR_tot = powerR_per * n;

  // write outputs
  function fmt(v){ return isNaN(v) ? '--' : v.toFixed(2); }

  document.getElementById('areaB').textContent = Ab ? fmt(Ab) + ' mm²' : '--';
  document.getElementById('areaR').textContent = Ar_cross ? fmt(Ar_cross) + ' mm²' : '--';
  document.getElementById('areaAnn').textContent = Aann ? fmt(Aann) + ' mm²' : '--';
  document.getElementById('speedB').textContent = Vb_m_s>0 ? ( (Vb_m_s*1000).toFixed(2)+' mm/s • '+Vb_m_s.toFixed(4)+' m/s • '+(Vb_m_s*60).toFixed(2)+' m/min') : '--';
  document.getElementById('speedR').textContent = Vr_m_s>0 ? ( (Vr_m_s*1000).toFixed(2)+' mm/s • '+Vr_m_s.toFixed(4)+' m/s • '+(Vr_m_s*60).toFixed(2)+' m/min') : '--';
  document.getElementById('timeOutB').textContent = timeB_s>0 ? fmt(timeB_s) + ' s' : '--';
  document.getElementById('timeOutR').textContent = timeR_s>0 ? fmt(timeR_s) + ' s' : '--';
  document.getElementById('flowB').textContent = Qb>0 ? fmt(Qb) + ' L/min' : '--';
  document.getElementById('flowR').textContent = Qr>0 ? fmt(Qr) + ' L/min' : '--';
  document.getElementById('flowBtot').textContent = Qb_tot>0 ? fmt(Qb_tot) + ' L/min' : '--';
  document.getElementById('flowRtot').textContent = Qr_tot>0 ? fmt(Qr_tot) + ' L/min' : '--';
  document.getElementById('pressureB').textContent = pressureB>0 ? fmt(pressureB) + ' bar' : '--';
  document.getElementById('forceB').textContent = forceB>0 ? fmt(forceB) + ' kN' : '--';
  document.getElementById('pressureR').textContent = pressureR>0 ? fmt(pressureR) + ' bar' : '--';
  document.getElementById('forceR').textContent = forceR>0 ? fmt(forceR) + ' kN' : '--';
  document.getElementById('powerB').textContent = powerB_per>0 ? fmt(powerB_per) + ' kW' : '--';
  document.getElementById('powerR').textContent = powerR_per>0 ? fmt(powerR_per) + ' kW' : '--';
  document.getElementById('powerBtot').textContent = powerB_tot>0 ? fmt(powerB_tot) + ' kW' : '--';
  document.getElementById('powerRtot').textContent = powerR_tot>0 ? fmt(powerR_tot) + ' kW' : '--';
  document.getElementById('totalPower').textContent = fmt(powerB_per + powerR_per) + ' kW (per cyl) / Total: ' + fmt(powerB_tot + powerR_tot) + ' kW';
}

// event wiring
document.getElementById('calc').addEventListener('click', computeAll);
document.getElementById('reset').addEventListener('click', ()=>{ document.querySelectorAll('input[type=number]').forEach(i=>i.value=''); document.getElementById('numCylinders').value=1; computeAll(); });
document.getElementById('export').addEventListener('click', ()=>{
  const rows = [
    ['No. of Cylinders', document.getElementById('numCylinders').value],
    ['Bore Dia (mm)', document.getElementById('boreDia').value],
    ['Rod Dia (mm)', document.getElementById('rodDia').value],
    ['Stroke (mm)', document.getElementById('stroke').value],
    ['Bore Time Unit', document.getElementById('boreTimeUnit').value],
    ['Bore Time Val', document.getElementById('boreTimeVal').value],
    ['Rod Time Unit', document.getElementById('rodTimeUnit').value],
    ['Rod Time Val', document.getElementById('rodTimeVal').value],
    ['Bore Pressure (bar)', document.getElementById('borePressure').value],
    ['Bore Force (kN)', document.getElementById('boreForce').value],
    ['Rod Pressure (bar)', document.getElementById('rodPressure').value],
    ['Rod Force (kN)', document.getElementById('rodForce').value],
    ['Bore Flow (L/min per cyl)', document.getElementById('flowB').textContent],
    ['Total Bore Flow (L/min)', document.getElementById('flowBtot').textContent],
    ['Rod Flow (L/min per cyl)', document.getElementById('flowR').textContent],
    ['Total Rod Flow (L/min)', document.getElementById('flowRtot').textContent],
    ['Bore Power (kW per cyl)', document.getElementById('powerB').textContent],
    ['Bore Power (kW total)', document.getElementById('powerBtot').textContent],
    ['Rod Power (kW per cyl)', document.getElementById('powerR').textContent],
    ['Rod Power (kW total)', document.getElementById('powerRtot').textContent],
    ['Regeneration', document.getElementById('regen').checked ? 'ON' : 'OFF']
  ];
  const csv = rows.map(r=>r.join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'cylinder_calculation.csv'; a.click(); URL.revokeObjectURL(url);
});

// initial compute
computeAll();
