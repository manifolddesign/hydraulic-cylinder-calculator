
// Password handling (client-side)
const PWD_KEY = 'manifold_pwd_hash_v2';
const DEFAULT_PWD = 'Manifold@2025';
function hash(s){ let h=2166136261; for(let i=0;i<s.length;i++){h ^= s.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return (h>>>0).toString(16) }
function hasPwd(){ return !!localStorage.getItem(PWD_KEY) }
function setDefaultPwd(){ if(!hasPwd()) localStorage.setItem(PWD_KEY, hash(DEFAULT_PWD)); }
setDefaultPwd();

const lockDiv = document.getElementById('lock');
const calcDiv = document.getElementById('calculator');
const pwdInput = document.getElementById('pwd');
const unlockBtn = document.getElementById('unlock');
const setPwdBtn = document.getElementById('setPwd');

unlockBtn.addEventListener('click', ()=>{
  const v = pwdInput.value || '';
  const stored = localStorage.getItem(PWD_KEY) || '';
  if(hash(v) === stored){ unlock(); } else { alert('Incorrect password'); }
});
setPwdBtn.addEventListener('click', ()=>{
  const cur = prompt('Enter current password to change:');
  if(!cur) return;
  if(hash(cur) !== localStorage.getItem(PWD_KEY)){ alert('Current password incorrect'); return; }
  const nw = prompt('Enter new password:');
  if(!nw) return;
  localStorage.setItem(PWD_KEY, hash(nw));
  alert('Password changed');
});
function unlock(){ lockDiv.style.display='none'; calcDiv.style.display='block'; }

// Elements
const ids = ['bore','rod','stroke','nCyl','timeOpt','timeVal','pOrF','pOrFVal','eff','regen'];
const E = {}; ids.forEach(id=>E[id]=document.getElementById(id));
const outs = ['areaB','areaR','areaA','speed','timeOut','flowB','flowR','flowPower','flowT','forceOut','pressureOut','power'];
const O = {}; outs.forEach(id=>O[id]=document.getElementById(id));

function mm2m(x){ return x/1000; }
function area_mm2(d){ return Math.PI * Math.pow(d/2,2); } // mm^2

function updatePOrFLabel(){
  const mode = E.pOrF.value;
  document.getElementById('pOrFLabel').textContent = mode === 'pressure' ? 'Pressure (bar)' : 'Force (kN)';
}
E.pOrF.addEventListener('change', updatePOrFLabel);

function timeLabelUpdate(){
  const map = {'sec':'Time value (sec)','mmsec':'Speed (mm/sec)','msec':'Speed (m/sec)','mmin':'Speed (m/min)'};
  document.getElementById('timeLabel').textContent = map[E.timeOpt.value] || 'Value';
}
E.timeOpt.addEventListener('change', timeLabelUpdate);

// Core compute: mirrors Excel logic
function compute(){
  const bore = parseFloat(E.bore.value) || 0;
  const rod = parseFloat(E.rod.value) || 0;
  const stroke = parseFloat(E.stroke.value) || 0;
  const n = parseInt(E.nCyl.value) || 1;

  const Ab = area_mm2(bore); // mm^2
  const Ar = area_mm2(rod); // mm^2
  const Aa = Math.max(Ab - Ar, 0); // annular area mm^2

  // speed S in mm/sec
  const opt = E.timeOpt.value;
  const tv = parseFloat(E.timeVal.value) || 0;
  let S_mm_s = 0;
  if(opt === 'sec'){
    S_mm_s = tv > 0 ? (stroke / tv) : 0; // mm/sec
  } else if(opt === 'mmsec'){
    S_mm_s = tv;
  } else if(opt === 'msec'){
    S_mm_s = tv * 1000;
  } else if(opt === 'mmin'){
    // m/min to mm/sec: (m/min *1000) /60
    S_mm_s = (tv * 1000) / 60;
  }

  // Time to complete stroke (sec)
  const time_sec = S_mm_s > 0 ? (stroke / S_mm_s) : 0;

  // Flows (L/min)
  // convert area mm^2 to m^2: divide by 1e6. speed mm/sec to m/min: (S_mm_s/1000)*60
  const speed_m_min = (S_mm_s/1000) * 60;
  const Ab_m2 = Ab / 1e6;
  const Aa_m2 = Aa / 1e6;
  const Qb = Ab_m2 * speed_m_min * 1000; // L/min (area m^2 * m/min *1000)
  const Qa = Aa_m2 * speed_m_min * 1000; // L/min

  // Regeneration affects power only per user instruction:
  // If regen ENABLED: power uses bore flow (Qb)
  // If regen DISABLED: power uses (Qb - Qa) [i.e. bore flow - rod flow]
  const regen = E.regen.checked;
  const Q_for_power_single = regen ? Qb : Math.max(Qb - Qa, 0);
  const Q_total_all = (Qb + Qa) * n; // total combined flows across cylinders (for supply sizing)
  const Q_power_total = Q_for_power_single * n; // used in power calc

  // Pressure <-> Force bidirectional (force in kN, pressure in bar)
  let pressure_bar = NaN;
  let force_kN = NaN;
  const mode = E.pOrF.value;
  const val = parseFloat(E.pOrFVal.value);
  if(mode === 'pressure'){
    if(!isNaN(val) && val > 0){
      pressure_bar = val;
      // Force on bore: F = Ab(mm^2) * P(bar) * 0.1 / 1000 => kN
      force_kN = (Ab * pressure_bar * 0.1) / 1000;
    }
  } else {
    if(!isNaN(val) && val > 0){
      force_kN = val;
      // Pressure required: P = F(kN)*1000 / (Ab * 0.1)
      pressure_bar = (force_kN * 1000) / (Ab * 0.1);
    }
  }

  // Power (kW) = P(bar) * Q(L/min) / 600  (use Q_for_power_total) ; account for efficiency
  const effPerc = parseFloat(E.eff.value) || 90;
  const eff = Math.max(0.001, effPerc / 100);
  const power_kW = (!isNaN(pressure_bar) && pressure_bar > 0 && Q_power_total > 0) ? (pressure_bar * Q_power_total) / 600 / eff : NaN;

  // Populate outputs with units and Excel-matching precision
  O.areaB.textContent = Ab.toFixed(3) + ' mm²';
  O.areaR.textContent = Ar.toFixed(3) + ' mm²';
  O.areaA.textContent = Aa.toFixed(3) + ' mm²';
  O.speed.textContent = (S_mm_s>0? S_mm_s.toFixed(3)+' mm/sec • ' + (S_mm_s/1000).toFixed(4)+' m/sec • '+ ((S_mm_s/1000)*60).toFixed(3)+' m/min' : '0 mm/sec • 0 m/sec • 0 m/min');
  O.timeOut.textContent = time_sec>0? time_sec.toFixed(3) + ' sec' : '0 sec';
  O.flowB.textContent = Qb>0? Qb.toFixed(3) + ' L/min' : '0 L/min';
  O.flowR.textContent = Qa>0? Qa.toFixed(3) + ' L/min' : '0 L/min';
  O.flowPower.textContent = Q_for_power_single>0? Q_for_power_single.toFixed(3) + ' L/min' : '0 L/min';
  O.flowT.textContent = Q_total_all>0? Q_total_all.toFixed(3) + ' L/min' : '0 L/min';
  O.forceOut.textContent = !isNaN(force_kN)? force_kN.toFixed(3) + ' kN' : '-- kN';
  O.pressureOut.textContent = !isNaN(pressure_bar)? pressure_bar.toFixed(3) + ' bar' : '-- bar';
  O.power.textContent = !isNaN(power_kW)? power_kW.toFixed(3) + ' kW' : '-- kW';
}

// Event listeners
document.getElementById('calc').addEventListener('click', compute);
document.getElementById('clear').addEventListener('click', ()=>{
  ['bore','rod','stroke','nCyl','timeVal','pOrFVal','eff'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('timeVal').value = '';
  document.getElementById('regen').checked = false;
  compute();
});
document.getElementById('export').addEventListener('click', ()=>{
  const blob = new Blob([document.documentElement.outerHTML], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='manifold_index.html'; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});
// update labels
updatePOrFLabel();
timeLabelUpdate();
// initial compute to show defaults
compute();
