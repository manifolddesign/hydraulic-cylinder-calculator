// Password handling (client-side, stored in localStorage)
const PWD_KEY = 'manifold_pwd_hash';
const PASSWORD = 'Manifold@2025'; // default password for first use (will be hashed and saved if no existing)
function hash(s){
  let h=2166136261; for(let i=0;i<s.length;i++){h ^= s.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);} return (h>>>0).toString(16)
}
function hasPwd(){ return !!localStorage.getItem(PWD_KEY) }
function setDefaultPwd(){
  if(!hasPwd()){
    localStorage.setItem(PWD_KEY, hash(PASSWORD));
  }
}
setDefaultPwd();

const lockDiv = document.getElementById('lock');
const calcDiv = document.getElementById('calculator');
const pwdInput = document.getElementById('pwd');
const unlockBtn = document.getElementById('unlock');
const setPwdBtn = document.getElementById('setPwd');

unlockBtn.addEventListener('click', ()=>{
  const v = pwdInput.value||'';
  const stored = localStorage.getItem(PWD_KEY);
  if(hash(v) === stored){ unlock(); } else { alert('Incorrect password'); }
});

setPwdBtn.addEventListener('click', ()=>{
  const current = prompt('Enter current password to change:');
  if(!current) return;
  if(hash(current) !== localStorage.getItem(PWD_KEY)){ alert('Current password incorrect'); return; }
  const nw = prompt('Enter new password:');
  if(!nw) return;
  localStorage.setItem(PWD_KEY, hash(nw));
  alert('Password changed');
});

function unlock(){
  lockDiv.style.display = 'none';
  calcDiv.style.display = 'block';
}

// Calculator logic
const els = ['bore','rod','stroke','nCyl','timeOpt','timeVal','pressure','force','eff','regen'].reduce((o,id)=>{ o[id]=document.getElementById(id); return o },{});
const outs = ['areaB','areaR','speed','flowB','flowR','flowEff','flowT','forceOut','pressureOut','power'].reduce((o,id)=>{ o[id]=document.getElementById(id); return o },{});

function mmToM(x){ return x/1000; }
function areaFromDia_mm(d){ return Math.PI * Math.pow(mmToM(d)/2,2); }

function compute(){
  const bore = parseFloat(els.bore.value) || 0;
  const rod = parseFloat(els.rod.value) || 0;
  const stroke = parseFloat(els.stroke.value) || 0;
  const n = parseInt(els.nCyl.value) || 1;
  const areaB = areaFromDia_mm(bore);
  const areaR = Math.max(areaB - areaFromDia_mm(rod), 0);

  // speed m/min
  const opt = els.timeOpt.value;
  const tv = parseFloat(els.timeVal.value) || 0;
  let speed_m_per_min = 0;
  if(opt==='sec'){
    const stroke_m = mmToM(stroke);
    const sp_m_s = tv>0 ? (stroke_m / tv) : 0;
    speed_m_per_min = sp_m_s * 60;
  } else if(opt==='mmsec'){
    const sp_m_s = tv/1000;
    speed_m_per_min = sp_m_s * 60;
  } else if(opt==='mmin'){
    speed_m_per_min = tv;
  }

  const flowB = areaB * speed_m_per_min * 1000;
  const flowR = areaR * speed_m_per_min * 1000;

  // regeneration: add rod flow to bore for extension speed
  const regenEnabled = els.regen.checked;
  const effectiveFlow = regenEnabled ? (flowB + flowR) : flowB;
  const totalFlowAll = (flowB + flowR) * n;

  // force and pressure interplay
  let pressure_val = parseFloat(els.pressure.value);
  let force_val = parseFloat(els.force.value);
  let forceFromP=null, pFromF=null;
  if(!isNaN(pressure_val) && pressure_val>0){
    forceFromP = (pressure_val * 1e5) * areaB; // N
  }
  if(!isNaN(force_val) && force_val>0){
    const FN = force_val*1000;
    pFromF = (FN / areaB) / 1e5; // bar
  }

  // hydraulic power (approx): P(bar) * Q(L/min) / 600 / (efficiency)
  const effPerc = parseFloat(els.eff.value) || 90;
  const eff = Math.max(0.001, effPerc/100);
  const P_for_power = (!isNaN(pressure_val) && pressure_val>0) ? pressure_val : (pFromF || 0);
  const power_kW = P_for_power ? (P_for_power * effectiveFlow) / 600 / eff : null;

  // populate
  outs.areaB.textContent = areaB? areaB.toExponential(6) + ' m²' : '0';
  outs.areaR.textContent = areaR? areaR.toExponential(6) + ' m²' : '0';
  outs.speed.textContent = speed_m_per_min? speed_m_per_min.toFixed(4) + ' m/min' : '0';
  outs.flowB.textContent = flowB? flowB.toFixed(3) + ' L/min' : '0';
  outs.flowR.textContent = flowR? flowR.toFixed(3) + ' L/min' : '0';
  outs.flowEff.textContent = effectiveFlow? effectiveFlow.toFixed(3) + ' L/min' : '0';
  outs.flowT.textContent = totalFlowAll? totalFlowAll.toFixed(3) + ' L/min (all cylinders)' : '0';
  outs.forceOut.textContent = forceFromP? ((forceFromP/1000).toFixed(3) + ' kN (at ' + pressure_val + ' bar)') : (force_val? (force_val.toFixed(3) + ' kN (input)') : '--');
  outs.pressureOut.textContent = pFromF? (pFromF.toFixed(3) + ' bar (to achieve ' + force_val + ' kN)') : (pressure_val? pressure_val+' bar (input)':'--');
  outs.power.textContent = power_kW? (power_kW.toFixed(3) + ' kW') : '--';
}

document.getElementById('calc').addEventListener('click', compute);
document.getElementById('clear').addEventListener('click', ()=>{
  ['bore','rod','stroke','nCyl','timeVal','pressure','force'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('regen').checked=false;
  compute();
});
document.getElementById('export').addEventListener('click', ()=>{
  const blob = new Blob([document.documentElement.outerHTML], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='manifold_index.html'; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
});

// label update for time option
document.getElementById('timeOpt').addEventListener('change', (e)=>{
  const map={'sec':'Time value (sec)','mmsec':'Time value (mm/sec)','mmin':'Time value (m/min)'};
  document.getElementById('timeLabel').textContent = map[e.target.value];
});

// initial compute after unlock
// auto-unlock if hashed default present and matches default password
(function tryAutoUnlock(){
  const stored = localStorage.getItem(PWD_KEY);
  if(stored === hash(PASSWORD)) {
    // keep locked to require user to click unlock, but allow skipping entering password
    // show hint
  }
})();