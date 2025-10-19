// ------------------------------
// LOGIN SECTION
// ------------------------------
document.getElementById("unlockBtn").addEventListener("click", function() {
  const pwd = document.getElementById("passwordInput").value.trim();
  if (pwd === "Hydra@2025") {
    document.getElementById("loginContainer").style.display = "none";
    document.getElementById("mainApp").style.display = "block";
  } else {
    document.getElementById("loginError").innerText = "Incorrect password. Please try again.";
  }
});

// ------------------------------
// CYLINDER LIST MANAGEMENT
// ------------------------------
const cylinderTable = document.getElementById("cylinderTable").getElementsByTagName("tbody")[0];
let cylinderCount = 0;

document.getElementById("addCylinderBtn").addEventListener("click", addCylinder);

function addCylinder() {
  cylinderCount++;
  const row = cylinderTable.insertRow();
  row.innerHTML = `
    <td><input type="checkbox" class="rowSelect"></td>
    <td><input type="text" value="C${cylinderCount}" class="cylName"></td>
    <td><input type="number" class="bore" placeholder="Enter"></td>
    <td><input type="number" class="rod" placeholder="Enter"></td>
    <td><input type="number" class="stroke" placeholder="Enter"></td>
    <td>
      <select class="timeOpt">
        <option value="ext">Extension</option>
        <option value="ret">Retraction</option>
      </select>
    </td>
    <td><input type="number" class="timeVal" placeholder="Enter"></td>
    <td>
      <select class="pressOpt">
        <option value="pressure">Pressure</option>
        <option value="force">Force</option>
      </select>
    </td>
    <td><input type="number" class="pressVal" placeholder="Enter"></td>
    <td>
      <button class="editBtn">Edit</button>
      <button class="delBtn">Delete</button>
    </td>
  `;

  row.querySelector(".delBtn").addEventListener("click", () => {
    row.remove();
  });

  row.querySelector(".editBtn").addEventListener("click", () => {
    alert("Edit function can be expanded — placeholder retained from v1.2.2");
  });
}

// ------------------------------
// SELECT ALL CHECKBOX
// ------------------------------
const selectAllCheckbox = document.getElementById("selectAllCheckbox");
selectAllCheckbox.addEventListener("change", function() {
  const allRows = document.querySelectorAll(".rowSelect");
  allRows.forEach(chk => chk.checked = this.checked);
});

// ------------------------------
// EXPORT TO EXCEL (base from v1.2.2)
// ------------------------------
document.getElementById("exportBtn").addEventListener("click", () => {
  const rows = document.querySelectorAll("#cylinderTable tbody tr");
  if (rows.length === 0) {
    alert("No cylinders to export.");
    return;
  }

  // Example export — you can expand as per your previous SheetJS logic
  let exportData = [];
  rows.forEach(r => {
    exportData.push({
      Name: r.querySelector(".cylName").value,
      Bore: r.querySelector(".bore").value,
      Rod: r.querySelector(".rod").value,
      Stroke: r.querySelector(".stroke").value,
      TimeOption: r.querySelector(".timeOpt").value,
      TimeValue: r.querySelector(".timeVal").value,
      PressureOption: r.querySelector(".pressOpt").value,
      PressureValue: r.querySelector(".pressVal").value
    });
  });

  console.log("Export data:", exportData);
  alert("Export placeholder — connect to your Excel template (v1.2.2 logic retained).");
});
// ------------------------------
// FIND CYLINDER SIZE  (new v1.3.2 modal logic)
// ------------------------------
const findModal = document.getElementById("findModal");

// open / close modal
document.getElementById("findCylinderBtn").onclick = () => {
  findModal.style.display = "flex";
};
document.getElementById("closeFindBtn").onclick = () => {
  findModal.style.display = "none";
};

// stop closing when clicking outside content
findModal.addEventListener("click", (e) => { e.stopPropagation(); });

// reset modal inputs
document.getElementById("resetFindBtn").onclick = () => {
  document.querySelectorAll("#findModal input").forEach(i => i.value = "");
  document.getElementById("allCylHoldChk").checked = false;
  document.getElementById("resultsContainer").innerHTML = "";
};

// ------------------------------
// FIND CYLINDER  ->  CALCULATIONS
// ------------------------------
document.getElementById("applyFindBtn").onclick = () => {
  const weightVal   = parseFloat(document.getElementById("weightInput").value) || 0;
  const weightUnit  = document.getElementById("weightUnit").value;
  const capacity    = parseFloat(document.getElementById("capacityInput").value) || 0;
  const pressure    = parseFloat(document.getElementById("pressureInput").value) || 0;
  const stroke      = parseFloat(document.getElementById("strokeInput").value) || 0;
  const cylCount    = parseInt(document.getElementById("noOfCylInput").value) || 1;
  const allHold     = document.getElementById("allCylHoldChk").checked;

  const resultsDiv  = document.getElementById("resultsContainer");
  resultsDiv.innerHTML = "";

  // weight in Newtons
  let totalWeightN = weightUnit === "kg" ? weightVal * 9.81 : weightVal * 1000 * 9.81;
  // per cylinder load logic
  let perCylLoad = allHold ? totalWeightN : totalWeightN / cylCount;

  // --- bore diameter calculation ---
  let boreDia = 0;
  if (capacity > 0 && pressure > 0) {
    boreDia = Math.sqrt((4 * (capacity * 1000)) / (Math.PI * pressure * 1e5)) * 1000;
  } else if (weightVal > 0 && pressure > 0) {
    boreDia = Math.sqrt((4 * perCylLoad) / (Math.PI * pressure * 1e5)) * 1000;
  } else if (weightVal > 0 && pressure === 0) {
    boreDia = Math.pow(perCylLoad / (0.6 * 1e5), 0.5) * 10;
  }

  // --- rod diameter & ISO nearest ---
  let rodDia = 0.7 * boreDia;
  const isoBoreList = [25,32,40,50,63,80,100,125,160,200,250,320];
  const isoRodList  = [12,16,20,25,28,32,36,40,45,50,56,63,70,80];
  const isoBore = isoBoreList.reduce((a,b)=>Math.abs(b-boreDia)<Math.abs(a-boreDia)?b:a);
  const isoRod  = isoRodList.reduce((a,b)=>Math.abs(b-rodDia)<Math.abs(a-boreDia)?b:a);

  // --- safety factor check ---
  let safetyMsg = "";
  const E = 2.1e5, K = 1;
  if (stroke > 0 && isoRod > 0) {
    const critical = (Math.PI**2 * E * Math.PI*(isoRod/2)**4) / (4 * (K*stroke)**2);
    const SF = critical / (perCylLoad/1000);
    if (SF < 2)      safetyMsg = `<p style='color:red'>Rod may buckle (SF=${SF.toFixed(2)}).</p>`;
    else if (SF < 3) safetyMsg = `<p style='color:orange'>Borderline safe (SF=${SF.toFixed(2)}).</p>`;
    else             safetyMsg = `<p style='color:green'>Rod is safe (SF=${SF.toFixed(2)}).</p>`;
  }

  // display results
  resultsDiv.innerHTML = `
    <p>Calculated Bore Dia: ${boreDia.toFixed(2)} mm  (ISO: ${isoBore} mm)</p>
    <p>Recommended Rod Dia: ${rodDia.toFixed(2)} mm (ISO: ${isoRod} mm)</p>
    ${safetyMsg}
  `;

  // --- APPLY TO SELECTED CYLINDERS ---
  const selectedRows = document.querySelectorAll(".rowSelect:checked");
  selectedRows.forEach(chk => {
    const row = chk.closest("tr");
    row.querySelector(".bore").value = isoBore;
    row.querySelector(".rod").value  = isoRod;
  });
};
