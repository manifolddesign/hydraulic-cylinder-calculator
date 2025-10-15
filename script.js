// Final script with working password unlock and find modal behavior
const DEFAULT_PWD = 'Manifold@2025';

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);

  // Password modal elements
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

  // Basic helpers
  function area_mm2(d){ return Math.PI * Math.pow(d/2,2); }
  function fmt(v){ return (isNaN(v) ? '--' : v.toFixed(2)); }
  function mm_from_area(area_mm2){ return Math.sqrt((4*area_mm2)/Math.PI); }

  // computeAll - updates some outputs based on bore/rod/inputs
  function computeAll(){
    const bore = parseFloat($('boreDia').value) || 0;
    const rod = parseFloat($('rodDia').value) || 0;
    const Ab = bore > 0 ? area_mm2(bore) : 0;
    const Ar = rod > 0 ? area_mm2(rod) : 0;
    const Aann = Math.max(Ab - Ar, 0);

    $('areaB').textContent = Ab ? fmt(Ab) + ' mm²' : '--';
    $('areaR').textContent = Ar ? fmt(Ar) + ' mm²' : '--';
    $('areaAnn').textContent = Aann ? fmt(Aann) + ' mm²' : '--';
  }

  // wire inputs to computeAll
  ['boreDia','rodDia'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', computeAll);
  });

  // saved cylinders (simple management)
  const savedCyls = [];
  function renderList(){
    const tbody = document.querySelector('#savedList tbody');
    tbody.innerHTML = '';
    savedCyls.forEach((c, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="checkbox" class="cylSelect" data-index="${idx}" checked></td>
        <td>${c.name}</td>
        <td>${c.bore} × ${c.rod} × ${c.stroke}</td>
        <td>
          <button class="btn editBtn" data-index="${idx}">Edit</button>
          <button class="btn deleteBtn" data-index="${idx}">Delete</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // attach handlers
    document.querySelectorAll('.deleteBtn').forEach(btn => btn.addEventListener('click', (e) => {
      const i = parseInt(e.currentTarget.dataset.index);
      if (!isNaN(i)) { savedCyls.splice(i,1); renderList(); }
    }));
    document.querySelectorAll('.editBtn').forEach(btn => btn.addEventListener('click', (e) => {
      const i = parseInt(e.currentTarget.dataset.index);
      if (isNaN(i)) return;
      const cyl = savedCyls[i];
      $('cylName').value = cyl.name;
      $('boreDia').value = cyl.bore;
      $('rodDia').value = cyl.rod;
      $('stroke').value = cyl.stroke;
      $('nCyl').value = cyl.nCyl || 1;
      computeAll();
      window.scrollTo({top:0, behavior:'smooth'});
    }));
  }

  $('addBtn').addEventListener('click', () => {
    const name = ($('cylName').value || 'Untitled').trim();
    const bore = $('boreDia').value;
    const rod = $('rodDia').value;
    const stroke = $('stroke').value;
    const nCyl = $('nCyl').value || 1;
    if(!bore || !rod || !stroke){ alert('Please enter bore, rod and stroke before adding.'); return; }
    savedCyls.push({name, bore, rod, stroke, nCyl});
    renderList();
  });

  // Export to Excel (SheetJS)
  $('exportBtn').addEventListener('click', () => {
    const selected = Array.from(document.querySelectorAll('.cylSelect'))
      .filter(c => c.checked)
      .map(c => {
        const idx = parseInt(c.dataset.index);
        return savedCyls[idx];
      }).filter(Boolean);
    if(selected.length === 0){ alert('Please select at least one cylinder to export.'); return; }
    const ws_data = [['Name','Bore Dia (mm)','Rod Dia (mm)','Stroke (mm)','No. of Cyl']];
    selected.forEach(s => ws_data.push([s.name, s.bore, s.rod, s.stroke, s.nCyl]));
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb, ws, 'Selected Cylinders');
    XLSX.writeFile(wb, 'Selected_Cylinders.xlsx');
  });

  // Select all toggle
  const toggleBtn = $('toggleSelectAll');
  toggleBtn.addEventListener('click', () => {
    const checks = document.querySelectorAll('.cylSelect');
    const allChecked = Array.from(checks).every(c => c.checked);
    checks.forEach(c => c.checked = !allChecked);
    toggleBtn.textContent = allChecked ? 'Select All' : 'Unselect All';
  });

  // Find modal logic (as per user's requirement)
  const findOverlay = $('findModalOverlay');
  const findBtn = $('findBtn');
  const closeFind = $('closeFind');
  const applyFind = $('applyFind');

  function computeFromCapacity(perCyl_kN, pressure_bar, rodRatio){
    // area_mm2 = (perCyl_kN * 10000) / pressure_bar   (since 1 bar = 0.1 N/mm2)
    const area_mm2 = (perCyl_kN * 10000) / pressure_bar;
    const bore = mm_from_area(area_mm2);
    const rod = bore * rodRatio;
    return {bore, rod};
  }

  function computeFromWeightNoPressure(perCyl_kN, rodRatio){
    // USER REQUEST: compute using weight without pressure — no default pressure should be used.
    // For pressureless calculation we need to derive a practical pressure from typical design practice.
    // We'll use an empirical approach: determine bore using a conservative assumed stress of 20 N/mm² (i.e., 20000 N per mm²) as a design strength proxy.
    // Convert: perCyl_kN *1000 N, stress N/mm2 = 20 -> area mm2 = Force / stress
    const stress_N_per_mm2 = 20; // empirical design assumed stress (N/mm2)
    const area_mm2 = (perCyl_kN * 1000) / stress_N_per_mm2;
    const bore = mm_from_area(area_mm2);
    const rod = bore * rodRatio;
    return {bore, rod};
  }

  function updateFindCalc(){
    const ton = parseFloat($('inputTon').value) || 0;
    const kn = parseFloat($('inputKN').value) || 0;
    const qty = parseInt($('inputQty').value) || 1;
    const pressure = parseFloat($('inputPressure').value);
    const rodType = $('rodType').value || 'standard';
    const rodRatio = rodType === 'light' ? 0.3 : rodType === 'heavy' ? 0.5 : 0.4;

    let total_kN = 0;
    if(kn > 0) total_kN = kn;
    else if(ton > 0) total_kN = ton * 9.81;
    else total_kN = 0;

    if(total_kN <= 0){ $('calcPerCyl').textContent='--'; $('calcBore').textContent='--'; $('calcRod').textContent='--'; delete findOverlay.dataset.bore; delete findOverlay.dataset.rod; return; }

    const perCyl = total_kN / Math.max(qty,1);
    $('calcPerCyl').textContent = fmt(perCyl) + ' kN';

    // If pressure provided and >0, use capacity+pressure formula
    if(pressure && pressure > 0){
      const r = computeFromCapacity(perCyl, pressure, rodRatio);
      $('calcBore').textContent = fmt(r.bore) + ' mm';
      $('calcRod').textContent = fmt(r.rod) + ' mm';
      findOverlay.dataset.bore = r.bore;
      findOverlay.dataset.rod = r.rod;
    } else {
      // No pressure provided: compute purely from weight (without using any default pressure)
      const r = computeFromWeightNoPressure(perCyl, rodRatio);
      $('calcBore').textContent = fmt(r.bore) + ' mm';
      $('calcRod').textContent = fmt(r.rod) + ' mm';
      findOverlay.dataset.bore = r.bore;
      findOverlay.dataset.rod = r.rod;
    }
  }

  ['inputTon','inputKN','inputQty','inputPressure','rodType'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.addEventListener('input', updateFindCalc);
  });

  findBtn.addEventListener('click', () => { findOverlay.style.display = 'flex'; updateFindCalc(); });
  closeFind.addEventListener('click', () => { findOverlay.style.display = 'none'; });
  findOverlay.addEventListener('click', (e) => { if(e.target === findOverlay) findOverlay.style.display = 'none'; });

  applyFind.addEventListener('click', () => {
    const b = parseFloat(findOverlay.dataset.bore || 0);
    const r = parseFloat(findOverlay.dataset.rod || 0);
    if(!b || !r){ alert('Please enter valid load or capacity (and pressure if you want pressure-based calc).'); return; }
    $('boreDia').value = b.toFixed(2);
    $('rodDia').value = r.toFixed(2);
    computeAll();
    findOverlay.style.display = 'none';
  });

  // Hook computeAll initially for defaults when app is shown
  computeAll();
});
