const DEFAULT_PWD = 'Hydra';
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('pwdOverlay');
  document.getElementById('pwdBtn').addEventListener('click', ()=>{
    if(document.getElementById('pwdInput').value===DEFAULT_PWD){
      overlay.style.display='none';
      document.getElementById('app').style.display='block';
    }else{
      alert('Incorrect password');
    }
  });

  document.getElementById('exportBtn').addEventListener('click', ()=>{
    const ws_data = [
      ["S.No","Cylinder Name","Bore","Rod","Stroke","Qty","Total Bore Flow","Total Rod Flow","Bore Power","Rod Power","Unit"],
      ["","","mm","mm","mm","","L/min","L/min","kW","kW",""]
    ];
    const bore = parseFloat(document.getElementById('boreDia').value)||0;
    const rod = parseFloat(document.getElementById('rodDia').value)||0;
    const stroke = parseFloat(document.getElementById('stroke').value)||0;
    const qty = parseInt(document.getElementById('nCyl').value)||1;
    const boreFlow = (bore*stroke/10000).toFixed(2);
    const rodFlow = (rod*stroke/10000).toFixed(2);
    const borePower = (boreFlow*2).toFixed(2);
    const rodPower = (rodFlow*2).toFixed(2);
    ws_data.push([1,"Cylinder 1",bore,rod,stroke,qty,boreFlow,rodFlow,borePower,rodPower,""]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    ws['!freeze'] = {xSplit: 0, ySplit: 2};
    ws['!cols'] = [
      {wch:6},{wch:20},{wch:10},{wch:10},{wch:10},{wch:8},
      {wch:18},{wch:18},{wch:14},{wch:14},{wch:10}
    ];
    XLSX.utils.book_append_sheet(wb, ws, "Cylinders");
    XLSX.writeFile(wb, "Selected_Cylinders_v1.3.2.xlsx");
  });

  document.getElementById('resetBtn').addEventListener('click', ()=>{
    document.getElementById('boreDia').value = 320;
    document.getElementById('rodDia').value = 220;
    document.getElementById('stroke').value = 1500;
    document.getElementById('nCyl').value = 1;
  });
});
