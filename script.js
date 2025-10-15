const DEFAULT_PWD = 'Manifold@2025';
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('pwdOverlay');
  document.getElementById('pwdBtn').addEventListener('click', ()=>{
    if(document.getElementById('pwdInput').value===DEFAULT_PWD){
      overlay.style.display='none';
      document.getElementById('app').style.display='block';
    }else{
      document.getElementById('pwdError').textContent='Incorrect password';
    }
  });

  document.getElementById('exportBtn').addEventListener('click', ()=>{
    // Header and Units rows as per template
    const ws_data = [
      ["S.No","Cylinder Name","Bore","Rod","Stroke","Qty","Total Bore Flow","Total Rod Flow","Bore Power","Rod Power","Unit"],
      ["","","mm","mm","mm","","L/min","L/min","kW","kW",""]
    ];

    // Sample row (replace with your actual saved cylinder data loop)
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

    // Styling
    const headerRange = XLSX.utils.decode_range(ws['!ref']);
    // Header (row 0)
    for(let C=headerRange.s.c; C<=headerRange.e.c; ++C){
      const cellAddr = XLSX.utils.encode_cell({r:0,c:C});
      if(ws[cellAddr]){
        ws[cellAddr].s = {
          fill:{fgColor:{rgb:"CFE2F3"}},
          font:{bold:true},
          alignment:{horizontal:"center",vertical:"center"}
        };
      }
    }
    // Unit (row 1)
    for(let C=headerRange.s.c; C<=headerRange.e.c; ++C){
      const unitAddr = XLSX.utils.encode_cell({r:1,c:C});
      if(ws[unitAddr]){
        ws[unitAddr].s = {
          fill:{fgColor:{rgb:"EDEDED"}},
          alignment:{horizontal:"center",vertical:"center"}
        };
      }
    }

    // Freeze header rows
    ws['!freeze'] = {xSplit: 0, ySplit: 2};

    // Column widths for better visibility
    ws['!cols'] = [
      {wch:6},{wch:20},{wch:10},{wch:10},{wch:10},{wch:8},
      {wch:18},{wch:18},{wch:14},{wch:14},{wch:10}
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Cylinders");
    XLSX.writeFile(wb, "Selected_Cylinders.xlsx");
  });

  document.getElementById('resetBtn').addEventListener('click', ()=>{
    document.getElementById('boreDia').value = 320;
    document.getElementById('rodDia').value = 220;
    document.getElementById('stroke').value = 1500;
    document.getElementById('nCyl').value = 1;
  });
});
