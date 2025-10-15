const DEFAULT_PWD = 'Manifold@2025';
document.addEventListener('DOMContentLoaded', ()=>{
  const overlay=document.getElementById('pwdOverlay');
  const app=document.getElementById('app');
  document.getElementById('pwdBtn').addEventListener('click',()=>{
    if(document.getElementById('pwdInput').value===DEFAULT_PWD){
      overlay.style.display='none';app.style.display='block';
    }else alert('Incorrect password');
  });

  const savedCyls=[];
  function renderList(){
    const tbody=document.querySelector('#savedList tbody');
    tbody.innerHTML='';
    savedCyls.forEach((cyl,idx)=>{
      const tr=document.createElement('tr');
      tr.innerHTML=`<td><input type='checkbox' class='cylSelect' data-index='${idx}' checked></td>
                    <td>${cyl.name}</td>
                    <td>${cyl.bore} × ${cyl.rod} × ${cyl.stroke} mm</td>`;
      tbody.appendChild(tr);
    });
  }

  document.getElementById('addBtn').addEventListener('click',()=>{
    const name=document.getElementById('cylName').value.trim()||'Untitled';
    const bore=document.getElementById('boreDia').value;
    const rod=document.getElementById('rodDia').value;
    const stroke=document.getElementById('stroke').value;
    const nCyl=document.getElementById('nCyl').value;
    const powerB=document.getElementById('finalBore').textContent;
    const powerR=document.getElementById('finalRod').textContent;
    const flowB=document.getElementById('flowBtot').textContent;
    const flowR=document.getElementById('flowRtot').textContent;
    if(!bore||!rod||!stroke){alert('Please fill all dimensions first!');return;}
    savedCyls.push({name,bore,rod,stroke,nCyl,powerB,powerR,flowB,flowR});
    renderList();
    alert(`✅ ${name} added successfully!`);
  });

  document.getElementById('exportBtn').addEventListener('click',()=>{
    const selected=Array.from(document.querySelectorAll('.cylSelect'))
      .filter(chk=>chk.checked).map(chk=>savedCyls[chk.dataset.index]);
    if(selected.length===0){alert('Select at least one cylinder!');return;}
    const ws_data=[['Name','Bore(mm)','Rod(mm)','Stroke(mm)','No.','Bore Power','Rod Power','Total Bore Flow','Total Rod Flow']];
    selected.forEach(c=>ws_data.push([c.name,c.bore,c.rod,c.stroke,c.nCyl,c.powerB,c.powerR,c.flowB,c.flowR]));
    const wb=XLSX.utils.book_new();
    const ws=XLSX.utils.aoa_to_sheet(ws_data);
    XLSX.utils.book_append_sheet(wb,ws,'Selected Cylinders');
    XLSX.writeFile(wb,'Selected_Cylinders.xlsx');
  });

  document.getElementById('resetBtn').addEventListener('click',()=>{
    document.querySelectorAll('input[type=number],input[type=text],input[type=password]').forEach(i=>i.value='');
    document.querySelectorAll('select').forEach(s=>s.selectedIndex=0);
    document.getElementById('regen').checked=false;
    document.querySelectorAll('.output').forEach(o=>o.textContent='--');
  });
});
