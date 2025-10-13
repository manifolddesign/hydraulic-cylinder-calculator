function calcBoreAndRod() {
  let borePressure = parseFloat(document.getElementById('borePressure').value) || 0;
  let rodPressure = parseFloat(document.getElementById('rodPressure').value) || 0;
  let boreFlow = borePressure * 0.1; // placeholder, replace with actual calc
  let rodFlow = rodPressure * 0.1;   // placeholder

  let regen = document.getElementById('regenToggle').checked;
  let borePower = regen ? (boreFlow - rodFlow) * borePressure * 0.0001667 : boreFlow * borePressure * 0.0001667;
  let rodPower = rodFlow * rodPressure * 0.0001667;

  document.getElementById('boreFlowResult').innerText = boreFlow.toFixed(2);
  document.getElementById('rodFlowResult').innerText = rodFlow.toFixed(2);
  document.getElementById('borePowerResult').innerText = borePower.toFixed(2);
  document.getElementById('rodPowerResult').innerText = rodPower.toFixed(2);
  document.getElementById('totalPower').innerText = (borePower + rodPower).toFixed(2);
}

document.querySelectorAll('input, select').forEach(el => {
  el.addEventListener('input', calcBoreAndRod);
});

function resetForm() {
  document.querySelectorAll('input[type=number]').forEach(i => i.value = '');
  document.getElementById('regenToggle').checked = false;
  calcBoreAndRod();
}

calcBoreAndRod();
