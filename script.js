/* ==========================================================
   Hydraulic Cylinder Calculator - v1.3.3 FINAL STABLE
   © Design Hydraulics 2025 — All Rights Reserved
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

// ---------------- TABLE ----------------
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
  document.querySelectorAll(".rowSelect")
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
    totalLoadN = weightUnit === "kg" ? weightVal * 9.81 : weightVal * 1000 * 9.81;

  let perCylLoad = allHold && noCyl > 1 ? totalLoadN / noCyl : totalLoadN;
  if (!perCylLoad && capacityVal > 0) perCylLoad = capacityVal * 1000;

  let boreDia = 0;
  if (pressureVal > 0) {
    const A_mm2 = (perCylLoad * 1e6) / (pressureVal * 1e5);
    boreDia = Math.sqrt((4 * A_mm2) / Math.PI);
  } else {
    const sigma = 20;
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
  const targets = selected.length > 0
    ? Array.from(selected).map(c => c.closest("tr"))
    : [tbody.querySelector("tr")];
  targets.forEach(r => {
    r.querySelector(".bore").value = isoBore;
    r.querySelector(".rod").value = isoRod;
    if (strokeVal) r.querySelector(".stroke").value = strokeVal;
  });
});
