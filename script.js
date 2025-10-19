/* ==========================================================
   Hydraulic Cylinder Calculator - v1.3.3 FINAL STABLE
   © Design Hydraulics 2025 — All Rights Reserved
   ==========================================================
   ✅ Login Password: Hydra@2025
   ✅ Modal: stays open, no clear button, rod safety check
   ✅ All Cylinders Hold Weight logic fixed
   ✅ Exports into "Hydraulic Cylinder Reports.xlsx"
   ✅ Uses sheet: "Hydraulic_Cylinders"
   ✅ Mobile + Desktop supported
   ========================================================== */

const LOGIN_PASSWORD = "Hydra@2025";
const APP_VERSION = "v1.3.3";

// ---------------- LOGIN ----------------
const loginContainer = document.getElementById("loginContainer");
const mainApp = document.getElementById("mainApp");
const unlockBtn = document.getElementById("unlockBtn");
const pwdInput = document.getElementById("passwordInput");
const loginError = document.getElementById("loginError");

unlockBtn?.addEventListener("click", () => {
  const val = (pwdInput?.value || "").trim();
  if (val === LOGIN_PASSWORD) {
    loginContainer.style.display = "none";
    mainApp.style.display = "block";
    loginError.textContent = "";
  } else {
    loginError.textContent = "Incorrect password. Please try again.";
  }
});

// ---------------- UTILITIES ----------------
const toNum = v => (isNaN(Number(v)) ? 0 : Number(v));
const round = (v, d = 2) => Number(v.toFixed(d));

// ---------------- CYLINDER TABLE ----------------
const tbody = document.querySelector("#cylinderTable tbody");
let index = 0;

document.getElementById("addCylinderBtn")?.addEventListener("click", () => {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input type="checkbox" class="rowSelect"></td>
    <td><input class="cName" value="C${++index}"></td>
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
    <td><button class="delBtn">Delete</button></td>
  `;
  tr.querySelector(".delBtn").addEventListener("click", () => tr.remove());
  tbody.appendChild(tr);
});

document.getElementById("selectAllCheckbox")?.addEventListener("change", e => {
  document
    .querySelectorAll(".rowSelect")
    .forEach(chk => (chk.checked = e.target.checked));
});

// ---------------- FIND CYLINDER MODAL ----------------
const findModal = document.getElementById("findModal");
const findBtn = document.getElementById("findCylinderBtn");
const closeFindBtn = document.getElementById("closeFindBtn");
const resetFindBtn = document.getElementById("resetFindBtn");
const applyFindBtn = document.getElementById("applyFindBtn");
const resultsContainer = document.getElementById("resultsContainer");

findBtn?.addEventListener("click", () => {
  findModal.style.display = "flex";
  resultsContainer.innerHTML = "";
});
closeFindBtn?.addEventListener("click", () => (findModal.style.display = "none"));
resetFindBtn?.addEventListener("click", () => {
  findModal.querySelectorAll("input").forEach(i => (i.value = ""));
  document.getElementById("allCylHoldChk").checked = false;
  resultsContainer.innerHTML = "";
});
findModal.addEventListener("click", e => e.stopPropagation());

// ---------------- ISO + SAFETY ----------------
const ISO_BORE = [25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320];
const ISO_ROD = [12, 16, 20, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80];
const nearest = (list, val) =>
  list.reduce((a, b) => (Math.abs(b - val) < Math.abs(a - val) ? b : a));

function eulerCriticalLoad(rod, stroke, E = 210000, K = 1) {
  const I = (Math.PI / 64) * Math.pow(rod, 4);
  return (Math.PI ** 2 * E * I) / Math.pow(K * stroke, 2);
}

// ---------------- FIND CYLINDER LOGIC ----------------
applyFindBtn?.addEventListener("click", () => {
  const weightVal = toNum(document.getElementById("weightInput").value);
  const weightUnit = document.getElementById("weightUnit").value;
  const capacityVal = toNum(document.getElementById("capacityInput").value);
  const pressureVal = toNum(document.getElementById("pressureInput").value);
  const strokeVal = toNum(document.getElementById("strokeInput").value);
  const noCyl = Math.max(1, parseInt(document.getElementById("noOfCylInput").value) || 1);
  const allHold = document.getElementById("allCylHoldChk").checked;

  let totalLoadN = 0;
  if (weightVal > 0)
    totalLoadN =
      weightUnit === "kg" ? weightVal * 9.81 : weightVal * 1000 * 9.81;

  let perCylLoad = allHold && noCyl > 1 ? totalLoadN / noCyl : totalLoadN;
  if (!perCylLoad && capacityVal > 0) perCylLoad = capacityVal * 1000;

  let boreDia = 0;
  if (pressureVal > 0) {
    const A_mm2 = (perCylLoad * 1e6) / (pressureVal * 1e5);
    boreDia = Math.sqrt((4 * A_mm2) / Math.PI);
  } else {
    const sigma = 20; // N/mm² assumption
    const A_mm2 = perCylLoad / sigma;
    boreDia = Math.sqrt((4 * A_mm2) / Math.PI);
  }

  const rodDia = boreDia * 0.7;
  const isoBore = nearest(ISO_BORE, boreDia);
  const isoRod = nearest(ISO_ROD, rodDia);

  let safetyHTML = "";
  if (strokeVal && isoRod && perCylLoad) {
    const crit = eulerCriticalLoad(isoRod, strokeVal);
    const SF = crit / perCylLoad;
    if (SF < 2)
      safetyHTML = `<p style="color:red">Rod may buckle (SF=${round(SF,2)})</p>`;
    else if (SF < 3)
      safetyHTML = `<p style="color:orange">Borderline safe (SF=${round(SF,2)})</p>`;
    else
      safetyHTML = `<p style="color:green">Rod is safe (SF=${round(SF,2)})</p>`;
  }

  resultsContainer.innerHTML = `
    <p>Calculated Bore Dia: ${round(boreDia,2)} mm (ISO: ${isoBore} mm)</p>
    <p>Recommended Rod Dia: ${round(rodDia,2)} mm (ISO: ${isoRod} mm)</p>
    ${safetyHTML}
  `;

  const selected = document.querySelectorAll(".rowSelect:checked");
  const targets =
    selected.length > 0
      ? Array.from(selected).map(c => c.closest("tr"))
      : [tbody.querySelector("tr")];
  targets.forEach(r => {
    r.querySelector(".bore").value = isoBore;
    r.querySelector(".rod").value = isoRod;
    if (strokeVal) r.querySelector(".stroke").value = strokeVal;
  });
});

// ---------------- EXPORT TO EXCEL (TEMPLATE) ----------------
document.getElementById("exportBtn")?.addEventListener("click", async () => {
  try {
    if (typeof XLSX === "undefined") return fallbackCsvExport();

    const tpl = await fetch("Hydraulic Cylinder Reports.xlsx");
    const buf = await tpl.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets["Hydraulic_Cylinders"];

    const set = (r, c, v) => {
      const ref = XLSX.utils.encode_cell({ r, c });
      ws[ref] = { v, t: typeof v === "number" ? "n" : "s" };
    };

    const rows = Array.from(document.querySelectorAll("#cylinderTable tbody tr"));
    if (!rows.length) return alert("No cylinders to export.");
    const startCol = 2;
    let totalBoreFlow = 0, totalRodFlow = 0, totalBorePower = 0, totalRodPower = 0;

    rows.forEach((r, i) => {
      const col = startCol + i;
      const name = r.querySelector(".cName").value || `C${i + 1}`;
      const bore = toNum(r.querySelector(".bore").value);
      const rod = toNum(r.querySelector(".rod").value);
      const stroke = toNum(r.querySelector(".stroke").value);
      const timeVal = toNum(r.querySelector(".timeVal").value);
      const pressVal = toNum(r.querySelector(".pressVal").value);

      const areaBore = Math.PI * (bore / 2) ** 2;
      const volL = (areaBore * stroke) / 1e6;
      const boreFlow = timeVal ? volL / (timeVal / 60) : 0;
      const rodArea = Math.PI * (rod / 2) ** 2;
      const rodVol = ((areaBore - rodArea) * stroke) / 1e6;
      const rodFlow = timeVal ? rodVol / (timeVal / 60) : 0;

      const boreForce = pressVal ? pressVal * 1e5 * (areaBore / 1e6) : 0;
      const rodForce = pressVal ? pressVal * 1e5 * ((areaBore - rodArea) / 1e6) : 0;
      const borePower = (pressVal * boreFlow) / 600;
      const rodPower = (pressVal * rodFlow) / 600;

      totalBoreFlow += boreFlow;
      totalRodFlow += rodFlow;
      totalBorePower += borePower;
      totalRodPower += rodPower;

      set(1, col, name);
      set(2, col, round(bore,2));
      set(3, col, round(rod,2));
      set(4, col, round(stroke,2));
      set(5, col, round(boreFlow,3));
      set(6, col, round(rodFlow,3));
      set(7, col, round(boreForce,1));
      set(8, col, round(rodForce,1));
      set(9, col, pressVal);
      set(10, col, pressVal);
      set(15, col, "No"); // Regeneration flag default
    });

    set(13, 2, round(totalBoreFlow,3));
    set(14, 2, round(totalRodFlow,3));
    set(16, 2, round(totalBorePower,3));
    set(17, 2, round(totalRodPower,3));

    XLSX.writeFile(wb, "Hydraulic_Cylinder_Report_v1.3.3.xlsx");
    alert("Excel exported successfully.");
  } catch (e) {
    console.error(e);
    fallbackCsvExport();
  }
});

// ---------------- CSV FALLBACK ----------------
function fallbackCsvExport() {
  const rows = Array.from(document.querySelectorAll("#cylinderTable tbody tr"));
  if (!rows.length) return alert("No cylinders to export.");
  const data = rows.map((r, i) => ({
    Name: r.querySelector(".cName").value || `C${i + 1}`,
    Bore: toNum(r.querySelector(".bore").value),
    Rod: toNum(r.querySelector(".rod").value),
    Stroke: toNum(r.querySelector(".stroke").value),
    Time: toNum(r.querySelector(".timeVal").value),
    Pressure: toNum(r.querySelector(".pressVal").value)
  }));
  const keys = Object.keys(data[0]);
  const csv = [
    keys.join(","),
    ...data.map(r => keys.map(k => r[k]).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "Hydraulic_Cylinder_Report_v1.3.3.csv";
  a.click();
}

// ---------------- FOOTER ----------------
document.querySelectorAll("footer .version").forEach(v => (v.textContent = APP_VERSION));
