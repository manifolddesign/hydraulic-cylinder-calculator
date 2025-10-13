// Password (client-side)
const PWD_KEY = 'dh_pwd_v5';
const DEFAULT_PWD = 'Manifold@2025';
function hash(s){let h=2166136261; for(let i=0;i<s.length;i++){h ^= s.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return (h>>>0).toString(16);}
if(!localStorage.getItem(PWD_KEY)) localStorage.setItem(PWD_KEY, hash(DEFAULT_PWD));

const unlockBtn = document.getElementById('unlock');
const changePwdBtn = document.getElementById('changePwd');
unlockBtn.addEventListener('click', ()=>{
  const v = document.getElementById('pwd').value || '';
  if(hash(v) === localStorage.getItem(PWD_KEY)){ document.getElementById('lock').style.display='none'; document.getElementById('app').style.display='block'; } else { alert('Incorrect password'); }
});
changePwdBtn.addEventListener('click', ()=>{
  const cur = prompt('Enter current password'); if(!cur) return;
  if(hash(cur) !== localStorage.getItem(PWD_KEY)){ alert('Current password incorrect'); return; }
  const nw = prompt('Enter new password'); if(!nw) return; localStorage.setItem(PWD_KEY, hash(nw)); alert('Password changed');
});

// Elements and helpers
const $ = id => document.getElementById(id);
const elems = ['boreDia','rodDia','stroke','timeUnitB','timeValB','timeUnitR','timeValR','pfModeB','pfValB','pfModeR','pfValR','nCyl','regen'];
const E = {}; elems.forEach(id=>E[id]=$(id));

const O_ids = ['areaB','areaR','speedB','speedR','timeOutB','timeOutR','flowB','flowR','flowBtot','flowRtot','pressureB','forceB','pressureR','forceR','powerB','powerR','powerBtot','powerRtot'];
const O = {}; O_ids.forEach(id=>O[id]=$(id));

function area_mm2(d){ return Math.PI * Math.pow(d/2,2); } // mm^2

function unitSpeedTo_mm_per_s(val, unit, stroke){
  if(!val || val<=0) return 0;
  if(unit === 'sec') return stroke / val;
  if(unit === 'mmsec') return val;
  if(unit === 'msec') return val * 1000;
  if(unit === 'mmin') return (val * 1000) / 60;
  return 0;
}

function mmps_to_m_per_s(v){ return v/1000; }
function mmps_to_m_per_min(v){ return (v/1000)*60; }

function computeAll(){
  const boreDia = parseFloat(E.boreDia.value) || 0;
  const rodDia = parseFloat(E.rodDia.value) || 0;
  const stroke = parseFloat(E.stroke.value) || 0;
  const n = parseInt(E.nCyl.value) || 1;

  const Ab = area_mm2(boreDia);
  const Ar = Math.PI * Math.pow(rodDia/2,2);
  const Aann = Math.max(Ab - Ar, 0);

  const S_b_mm_s = unitSpeedTo_mm_per_s(parseFloat(E.timeValB.value), E.timeUnitB.value, stroke);
  const S_r_mm_s = unitSpeedTo_mm_per_s(parseFloat(E.timeValR.value), E.timeUnitR.value, stroke);
  const timeB = S_b_mm_s>0 ? (stroke / S_b_mm_s) : 0;
  const timeR = S_r_mm_s>0 ? (stroke / S_r_mm_s) : 0;

  const speed_b_m_min = mmps_to_m_per_min(S_b_mm_s);
  const speed_r_m_min = mmps_to_m_per_min(S_r_mm_s);
  const Ab_m2 = Ab / 1e6;
  const Aann_m2 = Aann / 1e6;
  const Qb = Ab_m2 * speed_b_m_min * 1000;
  const Qr = Aann_m2 * speed_r_m_min * 1000;

  const Qb_tot = Qb * n;
  const Qr_tot = Qr * n;

  let pressureB = NaN, forceB = NaN, pressureR = NaN, forceR = NaN;
  const modeB = E.pfModeB.value; const valB = parseFloat(E.pfValB.value);
  const modeR = E.pfModeR.value; const valR = parseFloat(E.pfValR.value);

  if(modeB === 'pressure'){
    if(!isNaN(valB) && valB>0){ pressureB = valB; forceB = (Ab * pressureB * 0.1) / 1000; }
  } else {
    if(!isNaN(valB) && valB>0){ forceB = valB; pressureB = (forceB * 1000) / (Ab * 0.1); }
  }

  if(modeR === 'pressure'){
    if(!isNaN(valR) && valR>0){ pressureR = valR; forceR = (Aann * pressureR * 0.1) / 1000; }
  } else {
    if(!isNaN(valR) && valR>0){ forceR = valR; pressureR = (forceR * 1000) / (Aann * 0.1); }
  }

  const regen = E.regen.checked;
  const Qb_for_power = regen ? Math.max(Qb - Qr, 0) : Qb;

  const powerB_per = (!isNaN(pressureB) && pressureB>0) ? (pressureB * Qb_for_power) / 600 : NaN;
  const powerR_per = (!isNaN(pressureR) && pressureR>0) ? (pressureR * Qr) / 600 : NaN;
  const powerB_tot = !isNaN(powerB_per) ? powerB_per * n : NaN;
  const powerR_tot = !isNaN(powerR_per) ? powerR_per * n : NaN;

  O.areaB.textContent = Ab ? Ab.toFixed(3)+' mm²' : '--';
  O.areaR.textContent = Ar ? Ar.toFixed(3)+' mm²' : '--';
  O.speedB.textContent = S_b_mm_s>0 ? S_b_mm_s.toFixed(3)+' mm/s • '+mmps_to_m_per_s(S_b_mm_s).toFixed(4)+' m/s • '+mmps_to_m_per_min(S_b_mm_s).toFixed(3)+' m/min' : '--';
  O.speedR.textContent = S_r_mm_s>0 ? S_r_mm_s.toFixed(3)+' mm/s • '+mmps_to_m_per_s(S_r_mm_s).toFixed(4)+' m/s • '+mmps_to_m_per_min(S_r_mm_s).toFixed(3)+' m/min' : '--';
  O.timeOutB.textContent = timeB>0 ? timeB.toFixed(3)+' s' : '--';
  O.timeOutR.textContent = timeR>0 ? timeR.toFixed(3)+' s' : '--';
  O.flowB.textContent = Qb>0 ? Qb.toFixed(3)+' L/min' : '--';
  O.flowR.textContent = Qr>0 ? Qr.toFixed(3)+' L/min' : '--';
  O.flowBtot.textContent = Qb_tot>0 ? Qb_tot.toFixed(3)+' L/min' : '--';
  O.flowRtot.textContent = Qr_tot>0 ? Qr_tot.toFixed(3)+' L/min' : '--';
  O.pressureB.textContent = !isNaN(pressureB) ? pressureB.toFixed(3)+' bar' : '--';
  O.forceB.textContent = !isNaN(forceB) ? forceB.toFixed(3)+' kN' : '--';
  O.pressureR.textContent = !isNaN(pressureR) ? pressureR.toFixed(3)+' bar' : '--';
  O.forceR.textContent = !isNaN(forceR) ? forceR.toFixed(3)+' kN' : '--';
  O.powerB.textContent = !isNaN(powerB_per) ? powerB_per.toFixed(3)+' kW' : '--';
  O.powerR.textContent = !isNaN(powerR_per) ? powerR_per.toFixed(3)+' kW' : '--';
  O.powerBtot.textContent = !isNaN(powerB_tot) ? powerB_tot.toFixed(3)+' kW' : '--';
  O.powerRtot.textContent = !isNaN(powerR_tot) ? powerR_tot.toFixed(3)+' kW' : '--';
}

// attach events
function attachEvents(){
  elems.forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', computeAll);
  });
  const calcBtn = document.getElementById('calcBtn'); if(calcBtn) calcBtn.addEventListener('click', computeAll);
  const resetBtn = document.getElementById('resetBtn'); if(resetBtn) resetBtn.addEventListener('click', ()=>{
    ['boreDia','rodDia','stroke','timeValB','timeValR','pfValB','pfValR','nCyl'].forEach(id=>{ const e=document.getElementById(id); if(e) e.value=''; });
    document.getElementById('regen').checked=false;
    computeAll();
  });
}

attachEvents();
computeAll();
