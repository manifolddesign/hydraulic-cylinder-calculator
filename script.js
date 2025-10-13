
document.addEventListener('DOMContentLoaded', () => {
  const inputs = document.querySelectorAll('input, select');
  const regenToggle = document.getElementById('regenToggle');
  const exportBtn = document.getElementById('exportBtn');
  const resetBtn = document.getElementById('resetBtn');

  function getVal(id) {
    const el = document.getElementById(id);
    return el && el.value ? parseFloat(el.value) : 0;
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val.toFixed(2);
  }

  function calc() {
    const bore = getVal('boreDia');
    const rod = getVal('rodDia');
    const stroke = getVal('stroke');
    const time = getVal('timeValue');
    const timeUnit = document.getElementById('timeUnit') ? document.getElementById('timeUnit').value : 'sec';
    const cyl = getVal('cylinderCount') || 1;

    // areas
    const boreArea = Math.PI * Math.pow(bore / 2, 2);
    const rodArea = Math.PI * Math.pow(rod / 2, 2);
    const annularArea = boreArea - rodArea;

    // speed conversions
    let speed_mps = 0;
    if (time > 0) {
      switch (timeUnit) {
        case 'sec': speed_mps = stroke / 1000 / time; break;
        case 'm/sec': speed_mps = time; break;
        case 'mm/sec': speed_mps = time / 1000; break;
        case 'm/min': speed_mps = time / 60; break;
      }
    }

    // flows
    const boreFlow = boreArea * speed_mps * 60 / 1000; // lpm
    const rodFlow = annularArea * speed_mps * 60 / 1000; // lpm

    const totalBoreFlow = boreFlow * cyl;
    const totalRodFlow = rodFlow * cyl;

    // pressure-force
    const borePressure = getVal('borePressure');
    const boreForce = getVal('boreForce');
    const rodPressure = getVal('rodPressure');
    const rodForce = getVal('rodForce');

    let boreP = borePressure;
    let boreF = boreForce;
    let rodP = rodPressure;
    let rodF = rodForce;

    if (boreP === 0 && boreF > 0 && boreArea > 0) {
      boreP = boreF * 10000 / boreArea;
    }
    if (boreF === 0 && boreP > 0) {
      boreF = boreP * boreArea * 0.0001;
    }

    if (rodP === 0 && rodF > 0 && annularArea > 0) {
      rodP = rodF * 10000 / annularArea;
    }
    if (rodF === 0 && rodP > 0) {
      rodF = rodP * annularArea * 0.0001;
    }

    // Power
    let borePower = (regenToggle && regenToggle.checked)
      ? (totalBoreFlow - totalRodFlow) * boreP / 600
      : totalBoreFlow * boreP / 600;
    if (borePower < 0) borePower = 0;

    const rodPower = totalRodFlow * rodP / 600;

    // display
    setVal('boreArea', boreArea);
    setVal('rodArea', rodArea);
    setVal('annularArea', annularArea);
    setVal('boreFlow', boreFlow);
    setVal('rodFlow', rodFlow);
    setVal('totalBoreFlow', totalBoreFlow);
    setVal('totalRodFlow', totalRodFlow);
    setVal('borePressure', boreP);
    setVal('boreForce', boreF);
    setVal('rodPressure', rodP);
    setVal('rodForce', rodF);
    setVal('borePower', borePower);
    setVal('rodPower', rodPower);
  }

  inputs.forEach(el => {
    el.addEventListener('input', calc);
  });
  if (regenToggle) regenToggle.addEventListener('change', calc);

  // Reset
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.querySelectorAll('input, select').forEach(el => {
        if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
      });
      document.querySelectorAll('.output').forEach(out => out.textContent = '0.00');
    });
  }

  // Export
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const rows = [];
      document.querySelectorAll('.output').forEach(out => {
        rows.push([out.id, out.textContent]);
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['Parameter', 'Value'], ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'Results');
      XLSX.writeFile(wb, 'Cylinder_Calculation_Result.xlsx');
    });
  }

  calc(); // initial calculation
});
