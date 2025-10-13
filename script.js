
const PASSWORD = "Manifold@2025";
function checkPassword(){
  const input = document.getElementById('passwordInput').value;
  if(input === PASSWORD){
    document.getElementById('passwordModal').style.display = 'none';
    document.getElementById('calcApp').style.display = 'block';
  } else {
    document.getElementById('errorMsg').innerText = 'Incorrect password';
  }
}

function round2(num){ return Math.round(num*100)/100; }

function getAreas(){
  const bore = parseFloat(document.getElementById('boreDia').value);
  const rod = parseFloat(document.getElementById('rodDia').value);
  const boreArea = Math.PI * Math.pow(bore/2,2);
  const rodArea = Math.PI * (Math.pow(bore/2,2) - Math.pow(rod/2,2));
  return { boreArea, rodArea };
}

function getVelocity(){
  const stroke = parseFloat(document.getElementById('stroke').value);
  const timeVal = parseFloat(document.getElementById('timeValue').value);
  const unit = document.getElementById('timeUnit').value;
  if(unit === 'sec'){
    return (stroke/1000) / timeVal;
  } else if(unit === 'mm/sec'){
    return timeVal/1000;
  } else if(unit === 'm/sec'){
    return timeVal;
  } else if(unit === 'm/min'){
    return timeVal/60;
  }
}

function updateCalculations(){
  const numCyl = parseFloat(document.getElementById('numCylinders').value);
  const { boreArea, rodArea } = getAreas();
  const v = getVelocity();
  const regen = document.getElementById('regenToggle').checked;

  const boreFlow = round2((boreArea * v * 60)/1000);
  const rodFlow = round2((rodArea * v * 60)/1000);

  document.getElementById('boreFlow').innerText = boreFlow;
  document.getElementById('totalBoreFlow').innerText = round2(boreFlow * numCyl);
  document.getElementById('rodFlow').innerText = rodFlow;
  document.getElementById('totalRodFlow').innerText = round2(rodFlow * numCyl);

  const borePressure = parseFloat(document.getElementById('borePressure').value)||0;
  const rodPressure = parseFloat(document.getElementById('rodPressure').value)||0;

  let borePower = 0;
  if(regen){
    borePower = ((boreFlow - rodFlow) * borePressure * numCyl) / 600;
  } else {
    borePower = (boreFlow * borePressure * numCyl) / 600;
  }
  const rodPower = (rodFlow * rodPressure * numCyl) / 600;

  document.getElementById('borePower').innerText = round2(borePower);
  document.getElementById('rodPower').innerText = round2(rodPower);
}

function updateFromPressure(side){
  const { boreArea, rodArea } = getAreas();
  let pressure = parseFloat(document.getElementById(side+'Pressure').value)||0;
  let area = (side==='bore')? boreArea : rodArea;
  const force = (pressure * area)/100; // bar to kN
  document.getElementById(side+'Force').value = round2(force);
  updateCalculations();
}

function updateFromForce(side){
  const { boreArea, rodArea } = getAreas();
  let force = parseFloat(document.getElementById(side+'Force').value)||0;
  let area = (side==='bore')? boreArea : rodArea;
  const pressure = (force*100)/area;
  document.getElementById(side+'Pressure').value = round2(pressure);
  updateCalculations();
}

['boreDia','rodDia','stroke','timeValue','timeUnit','numCylinders','regenToggle'].forEach(id=>{
  document.getElementById(id).addEventListener('input', updateCalculations);
});

function exportToExcel(){
  const data = [
    ['No. of Cylinders', document.getElementById('numCylinders').value],
    ['Bore Diameter (mm)', document.getElementById('boreDia').value],
    ['Rod Diameter (mm)', document.getElementById('rodDia').value],
    ['Stroke (mm)', document.getElementById('stroke').value],
    ['Time Unit', document.getElementById('timeUnit').value],
    ['Time Value', document.getElementById('timeValue').value],
    ['Bore Pressure (bar)', document.getElementById('borePressure').value],
    ['Bore Force (kN)', document.getElementById('boreForce').value],
    ['Rod Pressure (bar)', document.getElementById('rodPressure').value],
    ['Rod Force (kN)', document.getElementById('rodForce').value],
    ['Bore Flow (L/min)', document.getElementById('boreFlow').innerText],
    ['Total Bore Flow (L/min)', document.getElementById('totalBoreFlow').innerText],
    ['Rod Flow (L/min)', document.getElementById('rodFlow').innerText],
    ['Total Rod Flow (L/min)', document.getElementById('totalRodFlow').innerText],
    ['Bore Power (kW)', document.getElementById('borePower').innerText],
    ['Rod Power (kW)', document.getElementById('rodPower').innerText],
    ['Regeneration', document.getElementById('regenToggle').checked ? 'ON':'OFF']
  ];
  let csv = '';
  data.forEach(row=>{ csv += row.join(',') + '\n'; });
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cylinder_calculation.csv';
  a.click();
  URL.revokeObjectURL(url);
}

updateCalculations();
