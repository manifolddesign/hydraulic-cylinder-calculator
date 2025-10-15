const DEFAULT_PWD='Manifold@2025';document.addEventListener('DOMContentLoaded',()=>{
const $=id=>document.getElementById(id);
function area_mm2(d){return Math.PI*Math.pow(d/2,2);}
function fmt(v){return(isNaN(v)?'--':v.toFixed(2));}
function mm_from_area(a){return Math.sqrt((4*a)/Math.PI);}
const savedCyls=[];
function renderList(){
const tbody=document.querySelector('#savedList tbody');tbody.innerHTML='';
savedCyls.forEach((c,idx)=>{
const tr=document.createElement('tr');
tr.innerHTML=`<td><input type="checkbox" class="cylSelect" checked></td>
<td>${c.name}</td><td>${c.bore}×${c.rod}×${c.stroke}</td>
<td><button class='btn editBtn' data-i='${idx}'>Edit</button>
<button class='btn deleteBtn' data-i='${idx}'>Delete</button></td>`;
tbody.appendChild(tr);});}
document.getElementById('findBtn').onclick=()=>{document.getElementById('findModalOverlay').style.display='flex';};
document.getElementById('closeFind').onclick=()=>{document.getElementById('findModalOverlay').style.display='none';};
function calcCylinder(){
let ton=parseFloat($('inputTon').value)||0;
let kn=parseFloat($('inputKN').value)||0;
let qty=parseFloat($('inputQty').value)||1;
let press=parseFloat($('inputPressure').value);
let rodType=$('rodType').value;
let rodRatio=rodType==='light'?0.3:rodType==='heavy'?0.5:0.4;
let perCyl=0;if(kn>0)perCyl=kn/qty;else if(ton>0)perCyl=ton*9.81/qty;else{['calcPerCyl','calcBore','calcRod'].forEach(id=>$(id).textContent='--');return;}
$('calcPerCyl').textContent=fmt(perCyl)+' kN';
if(press&&press>0){let area=(perCyl*10000)/press;let bore=mm_from_area(area);$('calcBore').textContent=fmt(bore)+' mm';$('calcRod').textContent=fmt(bore*rodRatio)+' mm';
$('findModalOverlay').dataset.bore=bore;$('findModalOverlay').dataset.rod=bore*rodRatio;}
else{ // find based only on weight without pressure, assume design 160bar? No, pure relation: cannot compute pressureless, so approximate: empirical 20N/mm2
let assumedPress=20*0.1;let area=(perCyl*10000)/(assumedPress/0.1);let bore=mm_from_area(area);
$('calcBore').textContent=fmt(bore)+' mm';$('calcRod').textContent=fmt(bore*rodRatio)+' mm';
$('findModalOverlay').dataset.bore=bore;$('findModalOverlay').dataset.rod=bore*rodRatio;}
}
['inputTon','inputKN','inputQty','inputPressure','rodType'].forEach(id=>$(id).addEventListener('input',calcCylinder));
document.getElementById('applyFind').onclick=()=>{
let b=parseFloat($('findModalOverlay').dataset.bore||0);
let r=parseFloat($('findModalOverlay').dataset.rod||0);
if(!b||!r){alert('Enter valid load or capacity.');return;}
$('boreDia').value=b.toFixed(2);$('rodDia').value=r.toFixed(2);
document.getElementById('findModalOverlay').style.display='none';};
});
