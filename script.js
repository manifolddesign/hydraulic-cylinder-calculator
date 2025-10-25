/* script v1.3.4 - final stable (keeps UI, adds rod safety boxes) */
/* Password: Hydra@2025; Excel template: "Hydraulic Cylinder Reports.xlsx" sheet "Hydraulic_Cylinders" */

const LOGIN_PASSWORD = "Hydra@2025";

document.addEventListener("DOMContentLoaded", () => {
  const $ = id => document.getElementById(id);

  // login
  const loginContainer = $("loginContainer");
  const mainApp = $("mainApp");
  const pwdInput = $("passwordInput");
  const unlockBtn = $("unlockBtn");
  const loginError = $("loginError");
  unlockBtn?.addEventListener("click", () => {
    const v = (pwdInput.value || "").trim();
    if (!v) { loginError.textContent = "Please enter password."; return; }
    if (v === LOGIN_PASSWORD) {
      loginError.textContent = "";
      loginContainer.style.display = "none";
      mainApp.style.display = "block";
      computeAll(); // initial compute
    } else {
      loginError.textContent = "Incorrect password. Please try again.";
      pwdInput.focus();
    }
  });

  // helpers
  const toNum = v => (isNaN(Number(v)) ? 0 : Number(v));
  const fmt = (v, p = 2) => (isNaN(v) ? "--" : Number(v).toFixed(p));
  const area_mm2 = d => Math.PI * Math.pow(d / 2, 2);
  const mm_from_area = a => Math.sqrt((4 * a) / Math.PI);

  function unitTo_mps(val, unit, stroke_mm) {
    if (!val || val === 0) return 0;
    if (unit === "sec") return (stroke_mm / 1000) / val; // m/s
    if (unit === "mmsec") return val / 1000;
    if (unit === "mmin") return val / 60;
    return 0;
  }

  // compute main page outputs (preserve original calcs)
  function computeAll() {
    const n = parseInt($("nCyl").value) || 1;
    const stroke = toNum($("stroke").value) || 0;
    const bore = toNum($("boreDia").value) || 0;
    const rod = toNum($("rodDia").value) || 0;

    const Ab = bore > 0 ? area_mm2(bore) : 0;
    const Ar = rod > 0 ? area_mm2(rod) : 0;
    const Aann = Math.max(Ab - Ar, 0);

    // times -> velocities
    const timeUnitB = $("timeUnitB") ? $("timeUnitB").value : "sec";
    const timeValB = toNum($("timeValB").value) || 0;
    const timeUnitR = $("timeUnitR") ? $("timeUnitR").value : "sec";
    const timeValR = toNum($("timeValR").value) || 0;

    const Vb = unitTo_mps(timeValB, timeUnitB, stroke);
    const Vr = unitTo_mps(timeValR, timeUnitR, stroke);

    const boreFlow_per = (Ab ? Ab : 0) / 1e6 * (Vb * 60) * 1000; // L/min per cyl
    const rodFlow_per = (Aann ? Aann : 0) / 1e6 * (Vr * 60) * 1000; // L/min per cyl

    const boreFlow_tot = boreFlow_per * n;
    const rodFlow_tot = rodFlow_per * n;

    // pressures/forces
    const pfModeB = $("pfModeB") ? $("pfModeB").value : "pressure";
    const pfValB = toNum($("pfValB").value) || 0;
    const pfModeR = $("pfModeR") ? $("pfModeR").value : "pressure";
    const pfValR = toNum($("pfValR").value) || 0;

    let pressureB = 0, forceB = 0, pressureR = 0, forceR = 0;
    if (Ab && pfModeB === "pressure") { pressureB = pfValB; forceB = pressureB * 1e5 * (Ab / 1e6); }
    else if (Ab && pfModeB === "force") { forceB = pfValB * 1000; pressureB = (forceB) / (Ab / 1e6) / 1e5; }
    if (Aann && pfModeR === "pressure") { pressureR = pfValR; forceR = pressureR * 1e5 * (Aann / 1e6); }
    else if (Aann && pfModeR === "force") { forceR = pfValR * 1000; pressureR = (forceR) / (Aann / 1e6) / 1e5; }

    const regen = $("regen") ? $("regen").checked : false;
    const Qb_for_power = regen ? Math.max(boreFlow_per - rodFlow_per, 0) : boreFlow_per;

    const borePower_per = (pressureB && Qb_for_power) ? (pressureB * Qb_for_power) / 600 : 0;
    const rodPower_per = (pressureR && rodFlow_per) ? (pressureR * rodFlow_per) / 600 : 0;

    const borePower_tot = borePower_per * n;
    const rodPower_tot = rodPower_per * n;

    // outputs (write to DOM)
    if ($("areaB")) $("areaB").textContent = Ab ? fmt(Ab) + " mm²" : "--";
    if ($("areaR")) $("areaR").textContent = Ar ? fmt(Ar) + " mm²" : "--";
    if ($("flowB")) $("flowB").textContent = boreFlow_per ? fmt(boreFlow_per) + " L/min" : "--";
    if ($("flowR")) $("flowR").textContent = rodFlow_per ? fmt(rodFlow_per) + " L/min" : "--";
  }

  // wire main inputs
  document.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("input", computeAll);
  });

  // saved cylinders area (simple array store; keep UI)
  const savedCyls = [];
  function renderSavedList() {
    const tbody = document.querySelector("#savedList tbody");
    tbody.innerHTML = "";
    savedCyls.forEach((c, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td><input type="checkbox" class="cylSelect" data-index="${i}" checked></td>
        <td>${c.name}</td>
        <td>${c.bore} × ${c.rod} × ${c.stroke} mm</td>
        <td><button class="editBtn" data-index="${i}">Edit</button> <button class="deleteBtn" data-index="${i}">Delete</button></td>`;
      tbody.appendChild(tr);
    });
    // attach events
    document.querySelectorAll(".deleteBtn").forEach(b => b.addEventListener("click", e => {
      const i = parseInt(e.currentTarget.dataset.index); if (!isNaN(i)) { savedCyls.splice(i, 1); renderSavedList(); }
    }));
    document.querySelectorAll(".editBtn").forEach(b => b.addEventListener("click", e => {
      const i = parseInt(e.currentTarget.dataset.index); if (!isNaN(i)) {
        const c = savedCyls[i];
        $("cylName").value = c.name; $("boreDia").value = c.bore; $("rodDia").value = c.rod; $("stroke").value = c.stroke; $("nCyl").value = c.nCyl || 1;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }));
  }

  // add cylinder button
  $("addBtn")?.addEventListener("click", () => {
    const name = ($("cylName") ? $("cylName").value.trim() : "") || `C${savedCyls.length + 1}`;
    const bore = ($("boreDia") ? $("boreDia").value : "") || "";
    const rod = ($("rodDia") ? $("rodDia").value : "") || "";
    const stroke = ($("stroke") ? $("stroke").value : "") || "";
    const n = ($("nCyl") ? $("nCyl").value : 1) || 1;
    if (!bore || !rod || !stroke) { alert("Please fill bore, rod and stroke to add."); return; }
    savedCyls.push({ name, bore, rod, stroke, nCyl: n });
    renderSavedList();
  });

  $("resetBtn")?.addEventListener("click", () => {
    document.querySelectorAll("input[type=number], input[type=text]").forEach(i => i.value = "");
    document.querySelectorAll("select").forEach(s => s.selectedIndex = 0);
    if ($("nCyl")) $("nCyl").value = 1;
    computeAll();
  });

  // ---------- FIND MODAL LOGIC ----------
  const findModal = $("findModal");
  const inputWeight = $("inputWeight"), weightUnit = $("weightUnit");
  const inputCapacity = $("inputCapacity"), capUnit = $("capUnit");
  const inputPressure = $("inputPressure");
  const inputQty = $("inputQty"), inputEqual = $("inputEqual");
  const rodType = $("rodType");
  const isoBore = $("isoBore"), isoRod = $("isoRod");
  const calcPerCyl = $("calcPerCyl"), calcBore = $("calcBore"), calcRod = $("calcRod");
  const rodSafetyFactor = $("rodSafetyFactor"), rodSafetyStatus = $("rodSafetyStatus");

  // populate ISO lists (some common sizes)
  const ISO_BORES = [25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 320];
  const ISO_RODS = [12, 16, 20, 25, 28, 32, 36, 40, 45, 50, 56, 63, 70, 80];
  ISO_BORES.forEach(b => { const o = document.createElement("option"); o.value = b; o.textContent = b; isoBore.appendChild(o); });
  ISO_RODS.forEach(r => { const o = document.createElement("option"); o.value = r; o.textContent = r; isoRod.appendChild(o); });

  function nearest(list, v) {
    if (!v) return list[0];
    return list.reduce((a, b) => Math.abs(b - v) < Math.abs(a - v) ? b : a);
  }

  function eulerSF(rodDia_mm, stroke_mm, applied_kN) {
    if (!rodDia_mm || !stroke_mm || !applied_kN) return null;
    const I = (Math.PI / 64) * Math.pow(rodDia_mm, 4); // mm^4
    const E = 210000; // N/mm^2
    const K = 1.0;
    const critN = (Math.PI * Math.PI * E * I) / Math.pow(K * stroke_mm, 2); // N
    const appliedN = applied_kN * 1000; // kN to N
    return critN / (appliedN || 1);
  }

  function updateFindCalc() {
    const weight = toNum(inputWeight.value);
    const wUnit = weightUnit.value || "tonne";
    const cap = toNum(inputCapacity.value);
    const capU = capUnit.value || "kN";
    const qty = Math.max(1, parseInt(inputQty.value) || 1);
    const pressure = toNum(inputPressure.value);
    const rt = rodType.value || "standard";

    // Convert total load to kN:
    let total_kN = 0;
    if (cap > 0) {
      total_kN = capU === "kN" ? cap : cap / 1000;
    } else if (weight > 0) {
      if (wUnit === "kg") total_kN = (weight / 1000) * 9.81;
      else total_kN = weight * 9.81; // tonne * 9.81
    } else {
      calcPerCyl.textContent = "--"; calcBore.textContent = "--"; calcRod.textContent = "--";
      rodSafetyFactor.value = ""; rodSafetyStatus.value = "";
      return;
    }

    // Per cylinder rule: for qty>1 -> per = total/qty; qty==1 -> per = total
    const perCyl_kN = qty > 1 ? total_kN / qty : total_kN;
    calcPerCyl.textContent = fmt(perCyl_kN, 3) + " kN";

    // rod ratio
    const rodRatio = rt === "light" ? 0.3 : rt === "heavy" ? 0.5 : 0.4;

    let bore_est = 0;
    if (pressure > 0) {
      // A = F / (p) ; F in N, p in bar -> p*1e5 Pa; A in m^2 then mm^2
      const A_m2 = (perCyl_kN * 1000) / (pressure * 1e5);
      const A_mm2 = A_m2 * 1e6;
      bore_est = mm_from_area(A_mm2);
    } else {
      const sigma = 20; // N/mm2 assumption
      const A_mm2 = (perCyl_kN * 1000) / sigma;
      bore_est = mm_from_area(A_mm2);
    }

    calcBore.textContent = fmt(bore_est, 2) + " mm";
    const isoB = nearest(ISO_BORES, bore_est); isoBore.value = isoB;
    const lightRod = Math.max(10, Math.round((isoB * 0.3) / 5) * 5);
    const stdRod = Math.max(10, Math.round((isoB * 0.4) / 5) * 5);
    const heavyRod = Math.max(10, Math.round((isoB * 0.5) / 5) * 5);
    calcRod.textContent = `Light: ${lightRod} mm • Std: ${stdRod} mm • Heavy: ${heavyRod} mm`;

    // pick rod based on selection
    const chosen = rt === "light" ? lightRod : rt === "heavy" ? heavyRod : stdRod;
    const isoR = nearest(ISO_RODS, chosen);
    isoRod.value = isoR;

    // Safety (Euler) using main stroke input
    const stroke_mm = toNum($("stroke").value) || 0;
    const SF = eulerSF(isoR, stroke_mm, perCyl_kN);
    if (SF === null) {
      rodSafetyFactor.value = "";
      rodSafetyStatus.value = "";
      rodSafetyStatus.style.color = "";
    } else {
      rodSafetyFactor.value = fmt(SF, 3);
      let status = "Safe"; let color = "green";
      if (SF < 2) { status = "Unsafe"; color = "red"; }
      else if (SF < 3) { status = "Caution"; color = "orange"; }
      else { status = "Safe"; color = "green"; }
      rodSafetyStatus.value = status;
      rodSafetyStatus.style.color = color;
    }

    // if capacity provided, disable qty/all controls (user requested)
    if (cap > 0) { inputQty.disabled = true; inputEqual.disabled = true; } else { inputQty.disabled = false; inputEqual.disabled = false; }
  }

  // wire find modal inputs
  ["inputWeight", "weightUnit", "inputCapacity", "capUnit", "inputQty", "inputEqual", "inputPressure", "rodType"].forEach(id => {
    const el = $(id); if (el) el.addEventListener("input", updateFindCalc);
  });

  // open/close modal
  $("findCylinderBtn")?.addEventListener("click", () => {
    findModal.style.display = "flex";
    updateFindCalc();
  });
  $("closeFindBtn")?.addEventListener("click", () => { findModal.style.display = "none"; });

  // reset modal
  $("resetFindBtn")?.addEventListener("click", () => {
    ["inputWeight", "inputCapacity", "inputPressure"].forEach(id => { if ($(id)) $(id).value = ""; });
    if ($("inputQty")) $("inputQty").value = 1;
    if ($("inputEqual")) $("inputEqual").checked = true;
    isoBore.selectedIndex = 0; isoRod.selectedIndex = 0;
    calcPerCyl.textContent = calcBore.textContent = calcRod.textContent = "--";
    rodSafetyFactor.value = ""; rodSafetyStatus.value = ""; rodSafetyStatus.style.color = "";
    inputQty.disabled = false; inputEqual.disabled = false;
  });

  // apply: write iso values to main inputs and close modal (as requested)
  $("applyFindBtn")?.addEventListener("click", () => {
    const chosenB = parseFloat(isoBore.value) || 0;
    const chosenR = parseFloat(isoRod.value) || 0;
    if (chosenB) $("boreDia").value = chosenB;
    if (chosenR) $("rodDia").value = chosenR;
    computeAll();
    // after apply close modal
    findModal.style.display = "none";
  });

  // ---------- EXPORT to Excel (template) ----------
  $("exportBtn")?.addEventListener("click", async () => {
    try {
      if (typeof XLSX === "undefined") { alert("SheetJS not loaded. Install xlsx library."); return; }
      const templateName = "Hydraulic Cylinder Reports.xlsx";
      const r = await fetch(templateName);
      if (!r.ok) { alert(`Template "${templateName}" not found. Exporting CSV fallback.`); return fallbackCsvExport(); }
      const buf = await r.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheetName = "Hydraulic_Cylinders";
      if (!wb.Sheets[sheetName]) { alert(`Sheet "${sheetName}" not found in template. Exporting CSV fallback.`); return fallbackCsvExport(); }
      const ws = wb.Sheets[sheetName];

      const setCell = (r, c, v) => { const ref = XLSX.utils.encode_cell({ r, c }); ws[ref] = { v: (v === null ? "" : v), t: (typeof v === "number" ? "n" : "s") }; };

      // gather exported cylinder rows: selected saved ones and current one if filled
      const checks = Array.from(document.querySelectorAll(".cylSelect")).filter(ch => ch.checked);
      const rows = [];
      checks.forEach(ch => { const i = parseInt(ch.dataset.index); if (!isNaN(i)) rows.push(savedCyls[i]); });
      const cur = { name: $("cylName") ? $("cylName").value.trim() : "", bore: $("boreDia") ? $("boreDia").value : "", rod: $("rodDia") ? $("rodDia").value : "", stroke: $("stroke") ? $("stroke").value : "", nCyl: $("nCyl") ? $("nCyl").value : 1 };
      if ((cur.bore || cur.rod || cur.stroke) && !rows.some(rw => rw.name === cur.name)) rows.push(cur);

      if (rows.length === 0) { alert("No cylinders selected to export."); return; }

      const startCol = 2; // C column
      let totalBoreFlow = 0, totalRodFlow = 0, totalBorePower = 0, totalRodPower = 0;

      rows.forEach((entry, idx) => {
        const col = startCol + idx;
        const bore = toNum(entry.bore), rod = toNum(entry.rod), stroke = toNum(entry.stroke), n = parseInt(entry.nCyl) || 1;
        const Ab = bore ? area_mm2(bore) : 0;
        const Ar = rod ? area_mm2(rod) : 0;
        const Aann = Math.max(Ab - Ar, 0);

        const timeUnitB = $("timeUnitB") ? $("timeUnitB").value : "sec", timeValB = toNum($("timeValB").value) || 0;
        const timeUnitR = $("timeUnitR") ? $("timeUnitR").value : "sec", timeValR = toNum($("timeValR").value) || 0;

        const Vb = unitTo_mps(timeValB, timeUnitB, stroke);
        const Vr = unitTo_mps(timeValR, timeUnitR, stroke);

        const boreFlow_per = (Ab ? Ab : 0) / 1e6 * (Vb * 60) * 1000;
        const rodFlow_per = (Aann ? Aann : 0) / 1e6 * (Vr * 60) * 1000;

        const pfModeB = $("pfModeB") ? $("pfModeB").value : "pressure", pfValB = toNum($("pfValB").value) || 0;
        const pfModeR = $("pfModeR") ? $("pfModeR").value : "pressure", pfValR = toNum($("pfValR").value) || 0;

        let borePressure = 0, rodPressure = 0, boreForce = 0, rodForce = 0;
        if (Ab && pfModeB === "pressure") { borePressure = pfValB; boreForce = borePressure * 1e5 * (Ab / 1e6); }
        else if (Ab && pfModeB === "force") { boreForce = pfValB * 1000; borePressure = (boreForce) / (Ab / 1e6) / 1e5; }
        if (Aann && pfModeR === "pressure") { rodPressure = pfValR; rodForce = rodPressure * 1e5 * (Aann / 1e6); }
        else if (Aann && pfModeR === "force") { rodForce = pfValR * 1000; rodPressure = (rodForce) / (Aann / 1e6) / 1e5; }

        const borePower_per = (borePressure && boreFlow_per) ? (borePressure * boreFlow_per) / 600 : 0;
        const rodPower_per = (rodPressure && rodFlow_per) ? (rodPressure * rodFlow_per) / 600 : 0;

        totalBoreFlow += boreFlow_per;
        totalRodFlow += rodFlow_per;
        totalBorePower += borePower_per;
        totalRodPower += rodPower_per;

        setCell(1, col, entry.name || `C${idx + 1}`);     // row 2
        setCell(2, col, Number(bore || 0));              // row 3
        setCell(3, col, Number(rod || 0));               // row 4
        setCell(4, col, Number(stroke || 0));            // row 5
        setCell(5, col, Number(boreFlow_per || 0));      // row 6
        setCell(6, col, Number(rodFlow_per || 0));       // row 7
        setCell(7, col, Number(boreForce || 0));         // row 8
        setCell(8, col, Number(rodForce || 0));          // row 9
        setCell(9, col, Number(borePressure || 0));      // row10
        setCell(10, col, Number(rodPressure || 0));      // row11
        setCell(15, col, $("regen") && $("regen").checked ? "Yes" : "No"); // row16
      });

      // totals in C14 (row13 index 13), C15 (14) etc.
      setCell(13, 2, Number(totalBoreFlow || 0));
      setCell(14, 2, Number(totalRodFlow || 0));
      setCell(16, 2, Number(totalBorePower || 0));
      setCell(17, 2, Number(totalRodPower || 0));

      XLSX.writeFile(wb, "Hydraulic_Cylinder_Report_v1.3.4.xlsx");
      alert("Export successful: Hydraulic_Cylinder_Report_v1.3.4.xlsx");
    } catch (err) {
      console.error(err);
      alert("Export failed — CSV fallback will be used.");
      fallbackCsvExport();
    }
  });

  function fallbackCsvExport() {
    // Basic CSV fallback of saved + current as before
    const header = ["Name", "NoOfCyl", "Bore", "Rod", "Stroke", "BoreFlow(L/min)", "RodFlow(L/min)"];
    const rows = [header];
    // selected saved
    document.querySelectorAll(".cylSelect").forEach(ch => {
      if (ch.checked) {
        const idx = parseInt(ch.dataset.index);
        const c = savedCyls[idx];
        if (c) {
          rows.push([c.name, c.nCyl, c.bore, c.rod, c.stroke, "", ""]);
        }
      }
    });
    const curName = $("cylName") ? $("cylName").value : "";
    if (($("boreDia") && $("boreDia").value) || ($("rodDia") && $("rodDia").value)) rows.push([curName || "Current", $("nCyl") ? $("nCyl").value : 1, $("boreDia") ? $("boreDia").value : "", $("rodDia") ? $("rodDia").value : "", $("stroke") ? $("stroke").value : ""]);
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "Hydraulic_Cylinder_Report_v1.3.4.csv"; document.body.appendChild(a); a.click(); a.remove();
  }

  // initial compute call
  computeAll();
});
