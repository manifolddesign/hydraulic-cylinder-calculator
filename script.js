/* Hydraulic Cylinder Calculator - script.js (v1.3.3 Final Stable)
   © Design Hydraulics 2025 — All Rights Reserved
   ---------------------------------------------------------------
   ✅ Password: Hydra@2025
   ✅ Find Cylinder Size modal: no Clear button, stays open
   ✅ All Cylinders Hold Entered Weight logic fixed
   ✅ Rod safety factor (Euler) visible only in modal
   ✅ Export to Excel with SheetJS template or CSV fallback
   ✅ Mobile + Desktop layout supported
*/

// ------------------ CONFIG ------------------
const APP_VERSION = "v1.3.3";
const LOGIN_PASSWORD = "Hydra@2025";

// ------------------ LOGIN ------------------
const loginContainer = document.getElementById("loginContainer");
const mainApp = document.getElementById("mainApp");
const unlockBtn = document.getElementById("unlockBtn");
const pwdInput = document.getElementById("passwordInput");
const loginError = document.getElementById("loginError");

unlockBtn?.addEventListener("click", () => {
  const val = pwdInput?.value.trim();
  if (val === LOGIN_PASSWORD) {
    loginContainer.style.display = "none";
    mainApp.style.display = "block";
  } else {
    loginError.textContent = "Incorrect password. Please try again.";
  }
});

// ------------------ UTILITIES ------------------
const toNumber = v => (isNaN(Number(v)) ? 0 : Number(v));
const round = (n, dp = 2) => Number(n.toFixed(dp));

// ------------------ TABLE HANDLERS ------------------
const tbody = document.querySelector("#cylinderTable tbody");
let cylIndex = 0;

function createRow(defaults = {}) {
  cylIndex++;
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="checkbox" class="rowSelect"></td>
    <td><input class="cName" value="${defaults.name || "C" + cylIndex}"></td>
    <td><input class="bore" type="number" placeholder="Enter"></td>
    <td><input class="rod" type="number" placeholder="Enter"></td>
    <td><input class="stroke" type="number" placeholder="Enter"></td>
    <td>
      <select class="timeOpt">
        <option value="ext">Extension</option>
        <option value="ret">Retraction</option>
      </select>
    </td>
    <td><input class="timeVal" type="number" placeholder="Enter"></td>
    <td>
      <select class="pressOpt">
        <option value="pressure">Pressure</option>
        <option value="force">Force</option>
      </select>
    </td>
    <td><input class="pressVal" type="number" placeholder="Enter"></td>
    <td>
      <button class="editBtn">Edit</button>
      <button class="delBtn">Delete</button>
    </td>
  `;

  tr.querySelector(".delBtn").addEventListener("click", () => tr.remove());
  tr.querySelector(".editBtn").addEventListener("click", () =>
    alert("Edit directly in table.")
  );
  return tr;
}

document.getElementById("addCylinderBtn")?.addEventListener("click", () => {
  tbody.appendChild(createRow());
});

const selectAllCheckbox = document.getElementById("selectAllCheckbox");
selectAllCheckbox?.addEventListener("change", function () {
  document
    .querySelectorAll(".rowSelect")
    .forEach(c => (c.checked = this.checked));
});

document.getElementById("selectAllBtn")?.addEventListener("click", () => {
  document
    .querySelectorAll(".rowSelect")
    .forEach(c => (c.checked = true));
});

// ------------------ FIND MODAL ------------------
const findModal = document.getElementById("findModal");
const findBtn = document.getElementById("findCylinderBtn");
const closeFindBtn = document.getElementById("closeFindBtn");
const resetFindBtn = document.getElementById("resetFindBtn");
const applyFindBtn = document.getElementById("applyFindBtn");
const resultsContainer = document.getElementById("resultsContainer");

const weightInput = document.getElementById("weightInput");
const weightUnit = document.getElementById("weightUnit");
const capacityInput = document.getElementById("capacityInput");
const pressureInput = document.getElementById("pressureInput");
const strokeInput = document.getElementById("strokeInput");
const noOfCylInput = document.getElementById("noOfCylInput");
const allCylHoldChk = document.getElementById("allCylHoldChk");

findBtn?.addEventListener("click", () => {
  findModal.style.display = "flex";
  resultsContainer.innerHTML = "";
});

closeFindBtn?.addEventListener("click", () => (findModal.style.display = "none"));
resetFindBtn?.addEventListener("click", () => {
  findModal.querySelectorAll("input").forEach(i => (i.value = ""));
  allCylHoldChk.checked = false;
  resultsContainer.innerHTML = "";
});

findModal?.addEventListener("click", e => e.stopPropagation());
findModal
  ?.querySelector(".modal-content")
  ?.addEventListener("click", e => e.stopPropagation());

// ------------------ ISO LISTS ------------------
const ISO_BORE = [25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320];
const ISO_ROD = [12, 16, 20, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80];
const nearest = (list, val) =>
  list.reduce((a, b) => (Math.abs(b - val) < Math.abs(a - val) ? b : a));

// ------------------ EULER BUCKLING ------------------
function eulerCriticalLoad(isoRod, stroke, E = 210000, K = 1) {
  const I = (Math.PI / 64) * Math.pow(isoRod, 4);
  return (Math.PI ** 2 * E * I) / Math.pow(K * stroke, 2);
}

// ------------------ FIND CYLINDER APPLY ------------------
applyFindBtn?.addEventListener("click", () => {
  const weightVal = toNumber(weightInput.value);
  const unit = weightUnit.value;
  const capacity = toNumber(capacityInput.value);
  const pressure = toNumber(pressureInput.value);
  const stroke = toNumber(strokeInput.value);
  const noOfCyl = Math.max(1, parseInt(noOfCylInput.value) || 1);
  const allHold = allCylHoldChk.checked;

  let totalWeightN = 0;
  if (weightVal > 0) {
    totalWeightN =
      unit === "kg" ? weightVal * 9.81 : weightVal * 1000 * 9.81;
  }

  let perCylLoadN = 0;
  if (totalWeightN > 0) {
    perCylLoadN = allHold && noOfCyl > 1 ? totalWeightN / noOfCyl : totalWeightN;
  }

  const capacityN = capacity > 0 ? capacity * 1000 : 0;
  let bore_mm = 0;

  if (capacityN > 0 && pressure > 0) {
    const A_mm2 = (capacityN * 1e6) / (pressure * 1e5);
    bore_mm = Math.sqrt((4 * A_mm2) / Math.PI);
  } else if (perCylLoadN > 0 && pressure > 0) {
    const A_mm2 = (perCylLoadN * 1e6) / (pressure * 1e5);
    bore_mm = Math.sqrt((4 * A_mm2) / Math.PI);
  } else if (perCylLoadN > 0 && pressure === 0) {
    const sigma_all = 20; // N/mm2
    const A_mm2 = perCylLoadN / sigma_all;
    bore_mm = Math.sqrt((4 * A_mm2) / Math.PI);
  }

  const rod_mm = bore_mm * 0.7;
  const isoBore = nearest(ISO_BORE, bore_mm);
  const isoRod = nearest(ISO_ROD, rod_mm);

  let safetyHtml = "";
  if (stroke > 0 && isoRod > 0 && perCylLoadN > 0) {
    const critN = eulerCriticalLoad(isoRod, stroke);
    const SF = critN / perCylLoadN;
    if (SF < 2)
      safetyHtml = `<p style="color:red">Rod may buckle (SF=${round(SF, 2)}).</p>`;
    else if (SF < 3)
      safetyHtml = `<p style="color:orange">Borderline safe (SF=${round(SF, 2)}).</p>`;
    else
      safetyHtml = `<p style="color:green">Rod is safe (SF=${round(SF, 2)}).</p>`;
  }

  resultsContainer.innerHTML = `
    <p>Calculated Bore Dia: ${round(bore_mm, 2)} mm (ISO: ${isoBore} mm)</p>
    <p>Recommended Rod Dia: ${round(rod_mm, 2)} mm (ISO: ${isoRod} mm)</p>
    ${safetyHtml}
  `;

  const selected = document.querySelectorAll(".rowSelect:checked");
  const targetRows =
    selected.length > 0
      ? Array.from(selected).map(chk => chk.closest("tr"))
      : [tbody.querySelector("tr")];

  targetRows.forEach(row => {
    row.querySelector(".bore").value = isoBore;
    row.querySelector(".rod").value = isoRod;
    if (stroke) row.querySelector(".stroke").value = stroke;
  });
});

// ------------------ EXPORT TO EXCEL ------------------
document.getElementById("exportBtn")?.addEventListener("click", () => {
  if (typeof XLSX === "undefined") return fallbackCsvExport();

  const tplPath = "Hydraulic Cylinder Reports.xlsx";
  fetch(tplPath)
    .then(res => res.arrayBuffer())
    .then(data => {
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = Array.from(document.querySelectorAll("#cylinderTable tbody tr"));
      if (!rows.length) return alert("No cylinders to export.");

      const setCell = (r, c, v) => {
        const ref = XLSX.utils.encode_cell({ r, c });
        ws[ref] = { v, t: typeof v === "number" ? "n" : "s" };
      };

      const startCol = 2;
      let totalBoreFlow = 0,
        totalRodFlow = 0,
        totalBorePower = 0,
        totalRodPower = 0;

      rows.forEach((r, i) => {
        const col = startCol + i;
        const name = r.querySelector(".cName").value || `C${i + 1}`;
        const bore = toNumber(r.querySelector(".bore").value);
        const rod = toNumber(r.querySelector(".rod").value);
        const stroke = toNumber(r.querySelector(".stroke").value);
        const timeVal = toNumber(r.querySelector(".timeVal").value);
        const pressVal = toNumber(r.querySelector(".pressVal").value);

        const areaBore = Math.PI * (bore / 2) ** 2;
        const volL = (areaBore * stroke) / 1e6;
        const boreFlow = timeVal > 0 ? volL / (timeVal / 60) : 0;
        const rodArea = Math.PI * (rod / 2) ** 2;
        const rodVol = ((areaBore - rodArea) * stroke) / 1e6;
        const rodFlow = timeVal > 0 ? rodVol / (timeVal / 60) : 0;

        const borePower = (pressVal * boreFlow) / 600;
        const rodPower = (pressVal * rodFlow) / 600;

        totalBoreFlow += boreFlow;
        totalRodFlow += rodFlow;
        totalBorePower += borePower;
        totalRodPower += rodPower;

        setCell(1, col, name);
        setCell(2, col, round(bore, 2));
        setCell(3, col, round(rod, 2));
        setCell(4, col, round(stroke, 2));
        setCell(5, col, round(boreFlow, 3));
        setCell(6, col, round(rodFlow, 3));
      });

      setCell(13, 2, round(totalBoreFlow, 3));
      setCell(14, 2, round(totalRodFlow, 3));
      setCell(16, 2, round(totalBorePower, 3));
      setCell(17, 2, round(totalRodPower, 3));

      XLSX.writeFile(wb, "Hydraulic_Calculator_Report_v1.3.3.xlsx");
    })
    .catch(() => fallbackCsvExport());
});

function fallbackCsvExport() {
  const rows = Array.from(document.querySelectorAll("#cylinderTable tbody tr"));
  if (!rows.length) return alert("No cylinders to export.");

  const data = rows.map((r, i) => ({
    Name: r.querySelector(".cName").value || `C${i + 1}`,
    Bore: toNumber(r.querySelector(".bore").value),
    Rod: toNumber(r.querySelector(".rod").value),
    Stroke: toNumber(r.querySelector(".stroke").value),
    Time: toNumber(r.querySelector(".timeVal").value),
    Pressure: toNumber(r.querySelector(".pressVal").value)
  }));

  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row =>
      headers.map(h => `"${row[h] ?? ""}"`).join(",")
    )
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "Hydraulic_Calculator_Report_v1.3.3.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ------------------ FOOTER VERSION ------------------
document
  .querySelectorAll("footer .version")
  .forEach(v => (v.textContent = APP_VERSION));
